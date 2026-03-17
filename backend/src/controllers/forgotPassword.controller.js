const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/user');

/* ── helpers ────────────────────────────────────────────────── */

function generateOTP() {
    return Math.floor(10000 + Math.random() * 90000).toString();
}

function maskEmail(email) {
    const [local, domain] = email.split('@');
    if (local.length <= 2) return local[0] + '****@' + domain;
    return local[0] + '****' + local.slice(-Math.min(4, local.length - 1)) + '@' + domain;
}

function maskPhone(phone) {
    const digits = phone.replace(/\D/g, '');
    return '******' + digits.slice(-4);
}

async function sendOtpEmail(to, otp) {
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    await transporter.sendMail({
        from: `"Lakwedha" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to,
        subject: 'Password Reset OTP – Lakwedha',
        html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#f9fafb;border-radius:12px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#094A32,#0D5C3E);padding:32px;text-align:center;">
            <h1 style="color:#fff;font-size:22px;margin:0;">Lakwedha</h1>
            <p style="color:#a7f3d0;font-size:13px;margin:6px 0 0;">Ayurvedic E-Channeling Platform</p>
          </div>
          <div style="padding:32px;">
            <h2 style="color:#0D5C3E;margin-top:0;">Password Reset Request</h2>
            <p style="color:#374151;">Use the OTP below to reset your password. It is valid for <strong>30 minutes</strong>.</p>
            <div style="font-size:36px;font-weight:bold;color:#0D5C3E;background:#ecfdf5;border:2px dashed #6ee7b7;border-radius:10px;padding:20px;text-align:center;letter-spacing:14px;margin:24px 0;">
              ${otp}
            </div>
            <p style="color:#6b7280;font-size:13px;">If you did not request this, please ignore this email. Your account remains safe.</p>
          </div>
          <div style="background:#f3f4f6;padding:16px;text-align:center;">
            <p style="color:#9ca3af;font-size:12px;margin:0;">© ${new Date().getFullYear()} Lakwedha. All rights reserved.</p>
          </div>
        </div>`,
    });
}

/* ── POST /api/forgot-password/send-otp ─────────────────────── */
exports.sendOtp = async (req, res) => {
    try {
        const { method, value } = req.body;

        if (!method || !value) {
            return res.status(400).json({ message: 'Method and value are required.' });
        }
        if (!['email', 'phone'].includes(method)) {
            return res.status(400).json({ message: 'Method must be "email" or "phone".' });
        }

        // Find user
        const query = method === 'email' ? { email: value.toLowerCase().trim() } : { phone: value.trim() };
        const user = await User.findOne(query);

        if (!user) {
            return res.status(404).json({ message: `No account found with this ${method}.` });
        }

        // Generate + hash OTP
        const otp = generateOTP();
        const hashedOtp = await bcrypt.hash(otp, 10);

        user.otp_code = hashedOtp;
        user.otp_expiry = new Date(Date.now() + 30 * 60 * 1000); // 30 min
        user.otp_attempts = 0;
        await user.save();

        if (method === 'email') {
            await sendOtpEmail(user.email, otp);
            return res.json({
                success: true,
                method: 'email',
                maskedValue: maskEmail(user.email),
                message: 'OTP sent to your email address.',
            });
        } else {
            // SMS integration placeholder (Twilio / local SMS)
            // TODO: replace console.log with actual SMS send
            console.log(`[SMS OTP] To: ${user.phone}  OTP: ${otp}`);
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

/* ── POST /api/forgot-password/verify-otp ───────────────────── */
exports.verifyOtp = async (req, res) => {
    try {
        const { method, value, otp } = req.body;

        if (!method || !value || !otp) {
            return res.status(400).json({ message: 'Method, value, and OTP are required.' });
        }

        const query = method === 'email' ? { email: value.toLowerCase().trim() } : { phone: value.trim() };
        const user = await User.findOne(query).select('+otp_code');

        if (!user || !user.otp_code) {
            return res.status(400).json({ message: 'OTP not found. Please request a new one.' });
        }

        // Check expiry
        if (!user.otp_expiry || user.otp_expiry < new Date()) {
            user.otp_code = undefined;
            user.otp_expiry = undefined;
            user.otp_attempts = 0;
            await user.save();
            return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
        }

        // Max attempt guard
        if (user.otp_attempts >= 5) {
            return res.status(429).json({ message: 'Too many failed attempts. Please request a new OTP.' });
        }

        // Compare OTP
        const isValid = await bcrypt.compare(String(otp), user.otp_code);
        if (!isValid) {
            user.otp_attempts += 1;
            await user.save();
            const remaining = 5 - user.otp_attempts;
            return res.status(400).json({
                message: `Invalid OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
                remainingAttempts: remaining,
            });
        }

        // Issue short-lived reset token (15 min)
        const resetToken = jwt.sign(
            { id: user._id, type: 'password_reset' },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

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

/* ── POST /api/forgot-password/reset-password ───────────────── */
exports.resetPassword = async (req, res) => {
    try {
        const { resetToken, new_password } = req.body;

        if (!resetToken || !new_password) {
            return res.status(400).json({ message: 'Reset token and new password are required.' });
        }

        // Validate password strength
        const pwRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
        if (!pwRegex.test(new_password)) {
            return res.status(400).json({
                message: 'Password must be at least 8 characters and include an uppercase letter, a number, and a special character.',
            });
        }

        // Verify reset token
        let decoded;
        try {
            decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
        } catch {
            return res.status(401).json({ message: 'Reset link has expired. Please start again.' });
        }

        if (decoded.type !== 'password_reset') {
            return res.status(401).json({ message: 'Invalid reset token.' });
        }

        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Update password + clear OTP
        user.password = await bcrypt.hash(new_password, 10);
        user.otp_code = undefined;
        user.otp_expiry = undefined;
        user.otp_attempts = 0;
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
