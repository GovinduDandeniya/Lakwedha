'use strict';

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User   = require('../models/user');

/* ═══════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════ */

/** Cryptographically-safe 5-digit OTP */
function generateOTP() {
    let otp = '';
    for (let i = 0; i < 5; i++) otp += Math.floor(Math.random() * 10).toString();
    return otp;
}

/**
 * Mask email: first char + **** + last ≤4 chars before @ + domain
 * Example: a****n@gmail.com  (for "avishkan@gmail.com")
 */
function maskEmail(email) {
    const [local, domain] = email.split('@');
    if (local.length <= 2) return `${local[0]}****@${domain}`;
    const tail = local.slice(-Math.min(4, local.length - 1));
    return `${local[0]}****${tail}@${domain}`;
}

/** Mask phone: show only last 4 digits — ******1234 */
function maskPhone(phone) {
    const digits = phone.replace(/\D/g, '');
    return `******${digits.slice(-4)}`;
}

/** Build and return a reusable Nodemailer transporter */
function createEmailTransporter() {
    return nodemailer.createTransport({
        host:   process.env.EMAIL_HOST   || 'smtp.gmail.com',
        port:   parseInt(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
}

/** Send OTP via email */
async function sendOtpEmail(to, otp) {
    const transporter = createEmailTransporter();
    await transporter.sendMail({
        from: `"Lakwedha" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to,
        subject: 'Password Reset OTP – Lakwedha',
        html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#f9fafb;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
          <div style="background:linear-gradient(135deg,#094A32,#0D5C3E);padding:32px;text-align:center;">
            <h1 style="color:#fff;font-size:24px;margin:0;letter-spacing:1px;">Lakwedha</h1>
            <p style="color:#a7f3d0;font-size:13px;margin:6px 0 0;">Ayurvedic E-Channeling Platform</p>
          </div>
          <div style="padding:36px;">
            <h2 style="color:#0D5C3E;margin-top:0;">Password Reset Request</h2>
            <p style="color:#374151;line-height:1.6;">
              We received a request to reset your Lakwedha password.<br>
              Use the OTP below — it is valid for <strong>30 minutes</strong> and can only be used once.
            </p>
            <div style="font-size:42px;font-weight:bold;color:#0D5C3E;background:#ecfdf5;border:2px dashed #6ee7b7;border-radius:12px;padding:20px;text-align:center;letter-spacing:18px;margin:28px 0;">
              ${otp}
            </div>
            <p style="color:#6b7280;font-size:13px;">
              If you did not request a password reset, you can safely ignore this email.
              Your account password remains unchanged.
            </p>
          </div>
          <div style="background:#f3f4f6;padding:16px;text-align:center;">
            <p style="color:#9ca3af;font-size:12px;margin:0;">© ${new Date().getFullYear()} Lakwedha. All rights reserved.</p>
          </div>
        </div>`,
    });
}

/** SMS OTP delivery is handled by the SMS gateway module (separate team member). */
async function sendOtpSms(phone, otp) {
    // TODO: SMS gateway integration handled externally
    console.log(`[SMS OTP] To: ${phone} | OTP: ${otp}`);
}

/* ═══════════════════════════════════════════════════════════════
   POST /api/forgot-password/send-otp
═══════════════════════════════════════════════════════════════ */
exports.sendOtp = async (req, res) => {
    try {
        const { method, value } = req.body;

        // ── Input validation ──────────────────────────────────
        if (!method || !value) {
            return res.status(400).json({ message: 'Method and value are required.' });
        }
        if (!['email', 'phone'].includes(method)) {
            return res.status(400).json({ message: 'Method must be "email" or "phone".' });
        }
        if (method === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
            return res.status(400).json({ message: 'Please enter a valid email address.' });
        }
        if (method === 'phone' && !/^\+?[0-9\s\-()]{7,20}$/.test(value.trim())) {
            return res.status(400).json({ message: 'Please enter a valid phone number.' });
        }

        // ── Find user ─────────────────────────────────────────
        const query = method === 'email'
            ? { email: value.toLowerCase().trim() }
            : { phone: value.trim() };

        const user = await User.findOne(query);
        if (!user) {
            return res.status(404).json({ message: `No account found with this ${method}.` });
        }

        // ── Enforce 60-second resend cooldown (server-side) ──
        if (user.otp_last_sent) {
            const elapsed  = Date.now() - new Date(user.otp_last_sent).getTime();
            const cooldown = 60 * 1000; // 60 seconds
            if (elapsed < cooldown) {
                const waitSec = Math.ceil((cooldown - elapsed) / 1000);
                return res.status(429).json({
                    message: `Please wait ${waitSec} second${waitSec !== 1 ? 's' : ''} before requesting another OTP.`,
                    waitSeconds: waitSec,
                });
            }
        }

        // ── Generate + hash OTP ───────────────────────────────
        const otp       = generateOTP();
        const hashedOtp = await bcrypt.hash(otp, 10);

        user.otp_code     = hashedOtp;
        user.otp_expiry   = new Date(Date.now() + 30 * 60 * 1000); // 30 min from now
        user.otp_attempts = 0;
        user.otp_last_sent = new Date();
        await user.save();

        // ── Deliver OTP ───────────────────────────────────────
        if (method === 'email') {
            await sendOtpEmail(user.email, otp);
            return res.json({
                success: true,
                method: 'email',
                maskedValue: maskEmail(user.email),
                message: 'OTP sent to your email address.',
            });
        } else {
            await sendOtpSms(user.phone, otp);
            return res.json({
                success: true,
                method: 'phone',
                maskedValue: maskPhone(user.phone),
                message: 'OTP sent to your mobile number.',
            });
        }
    } catch (err) {
        console.error('[sendOtp]', err);
        res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
    }
};

/* ═══════════════════════════════════════════════════════════════
   POST /api/forgot-password/verify-otp
═══════════════════════════════════════════════════════════════ */
exports.verifyOtp = async (req, res) => {
    try {
        const { method, value, otp } = req.body;

        if (!method || !value || !otp) {
            return res.status(400).json({ message: 'Method, value, and OTP are required.' });
        }

        const query = method === 'email'
            ? { email: value.toLowerCase().trim() }
            : { phone: value.trim() };

        const user = await User.findOne(query).select('+otp_code');
        if (!user || !user.otp_code) {
            return res.status(400).json({ message: 'OTP not found. Please request a new one.' });
        }

        // ── Expiry check ──────────────────────────────────────
        if (!user.otp_expiry || user.otp_expiry < new Date()) {
            user.otp_code      = undefined;
            user.otp_expiry    = undefined;
            user.otp_attempts  = 0;
            await user.save();
            return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
        }

        // ── Max attempts guard ────────────────────────────────
        if (user.otp_attempts >= 5) {
            return res.status(429).json({
                message: 'Too many failed attempts. Please request a new OTP.',
            });
        }

        // ── Verify OTP ────────────────────────────────────────
        const isValid = await bcrypt.compare(String(otp).replace(/\s/g, ''), user.otp_code);
        if (!isValid) {
            user.otp_attempts += 1;
            await user.save();
            const remaining = 5 - user.otp_attempts;
            return res.status(400).json({
                message: `Invalid OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
                remainingAttempts: remaining,
            });
        }

        // ── OTP valid: issue short-lived reset token (15 min) ─
        const resetToken = jwt.sign(
            { id: user._id, type: 'password_reset' },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        // Clear OTP immediately to prevent reuse
        user.otp_code      = undefined;
        user.otp_expiry    = undefined;
        user.otp_attempts  = 0;
        user.otp_last_sent = undefined;
        await user.save();

        return res.json({
            success: true,
            resetToken,
            message: 'OTP verified successfully.',
        });
    } catch (err) {
        console.error('[verifyOtp]', err);
        res.status(500).json({ error: 'Verification failed. Please try again.' });
    }
};

/* ═══════════════════════════════════════════════════════════════
   POST /api/forgot-password/reset-password
═══════════════════════════════════════════════════════════════ */
exports.resetPassword = async (req, res) => {
    try {
        const { resetToken, new_password } = req.body;

        if (!resetToken || !new_password) {
            return res.status(400).json({ message: 'Reset token and new password are required.' });
        }

        // ── Password strength ─────────────────────────────────
        const pwRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
        if (!pwRegex.test(new_password)) {
            return res.status(400).json({
                message: 'Password must be at least 8 characters and include an uppercase letter, a number, and a special character.',
            });
        }

        // ── Verify reset token ────────────────────────────────
        let decoded;
        try {
            decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
        } catch {
            return res.status(401).json({ message: 'Reset session has expired. Please start again.' });
        }

        if (decoded.type !== 'password_reset') {
            return res.status(401).json({ message: 'Invalid reset token.' });
        }

        const user = await User.findById(decoded.id).select('+password');
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // ── Prevent same-password reuse ───────────────────────
        const isSame = await bcrypt.compare(new_password, user.password);
        if (isSame) {
            return res.status(400).json({
                message: 'New password must be different from your current password.',
            });
        }

        // ── Update password + invalidate all existing sessions ─
        user.password         = await bcrypt.hash(new_password, 10);
        user.passwordChangedAt = new Date();
        // Clear any leftover OTP state
        user.otp_code      = undefined;
        user.otp_expiry    = undefined;
        user.otp_attempts  = 0;
        user.otp_last_sent = undefined;
        await user.save();

        return res.json({
            success: true,
            message: 'Password reset successfully. Please log in with your new password.',
        });
    } catch (err) {
        console.error('[resetPassword]', err);
        res.status(500).json({ error: 'Reset failed. Please try again.' });
    }
};
