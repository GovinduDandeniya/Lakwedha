const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const RegistrationOtp = require('../models/registrationOtp');
const { sendSMS } = require('../services/smsService');

/* ── helpers ─────────────────────────────────────────── */
function generateOtp() {
    return String(Math.floor(10000 + Math.random() * 90000));
}

function maskPhone(phone) {
    if (phone.length <= 4) return '****';
    return '*'.repeat(phone.length - 4) + phone.slice(-4);
}

async function trySendSms(to, body) {
    const result = await sendSMS(to, body);
    if (!result.success) {
        console.warn(`[SMS OTP] Delivery failed for ${to}: ${result.error}`);
    }
}

/* ── POST /api/auth/send-otp ─────────────────────────── */
// Body: { phone, country_code }
async function sendOtp(req, res) {
    const { phone, country_code } = req.body;

    if (!phone || !country_code) {
        return res.status(400).json({ message: 'Phone number and country code are required.' });
    }
    if (!/^\d{5,15}$/.test(phone)) {
        return res.status(400).json({ message: 'Invalid phone number format.' });
    }

    // Strip leading zero so +94 + 0713316679 doesn't become +940713316679
    const localPhone = phone.replace(/^0+/, '');
    const fullPhone = `${country_code}${localPhone}`;

    try {
        // Prevent duplicate registrations
        const existing = await User.findOne({ phone: fullPhone });
        if (existing) {
            return res.status(409).json({ message: 'This phone number is already registered.' });
        }

        const otp = generateOtp();
        const hashedOtp = await bcrypt.hash(otp, 10);
        const expiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

        await RegistrationOtp.findOneAndUpdate(
            { phone: fullPhone },
            { phone: fullPhone, otp_code: hashedOtp, otp_expiry: expiry, attempts: 0, is_verified: false },
            { upsert: true, new: true }
        );

        await trySendSms(fullPhone, `Your Lakwedha registration OTP is: ${otp}. Valid for 30 minutes. Do not share this code.`);

        return res.status(200).json({
            success: true,
            maskedPhone: maskPhone(phone),
            message: 'OTP sent successfully.',
        });
    } catch (err) {
        console.error('sendOtp error:', err);
        return res.status(500).json({ message: 'Server error. Please try again.' });
    }
}

/* ── POST /api/auth/verify-otp ───────────────────────── */
// Body: { phone, country_code, otp }
async function verifyOtp(req, res) {
    const { phone, country_code, otp } = req.body;

    if (!phone || !country_code || !otp) {
        return res.status(400).json({ message: 'Phone, country code, and OTP are required.' });
    }

    const localPhone = phone.replace(/^0+/, '');
    const fullPhone = `${country_code}${localPhone}`;

    try {
        const record = await RegistrationOtp.findOne({ phone: fullPhone }).select('+otp_code');

        if (!record) {
            return res.status(400).json({ message: 'OTP not found. Please request a new one.' });
        }
        if (record.otp_expiry < new Date()) {
            return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
        }
        if (record.attempts >= 5) {
            return res.status(429).json({ message: 'Maximum OTP attempts exceeded. Please request a new one.' });
        }

        const isValid = await bcrypt.compare(String(otp), record.otp_code);
        if (!isValid) {
            record.attempts += 1;
            await record.save();
            const remaining = 5 - record.attempts;
            return res.status(400).json({
                message: `Incorrect OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
            });
        }

        // Mark phone as verified
        record.is_verified = true;
        await record.save();

        // Issue short-lived verification token (15 min)
        const verifyToken = jwt.sign(
            { phone: fullPhone, purpose: 'registration' },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        return res.status(200).json({
            success: true,
            verifyToken,
            message: 'Phone number verified successfully.',
        });
    } catch (err) {
        console.error('verifyOtp error:', err);
        return res.status(500).json({ message: 'Server error. Please try again.' });
    }
}

/* ── POST /api/auth/register ─────────────────────────── */
// Body: { verifyToken, title, first_name, last_name, nationality,
//         phone, country_code, email, birthday, nic_type, nic_number, password }
async function register(req, res) {
    const {
        verifyToken,
        title, first_name, last_name,
        nationality, phone, country_code,
        email, birthday,
        nic_type, nic_number,
        password,
    } = req.body;

    // Required field check
    const missing = [
        'verifyToken', 'title', 'first_name', 'last_name', 'nationality',
        'phone', 'country_code', 'email', 'birthday', 'nic_type', 'nic_number', 'password',
    ].filter((f) => !req.body[f]);
    if (missing.length) {
        return res.status(400).json({ message: `Missing required fields: ${missing.join(', ')}.` });
    }

    // Email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: 'Invalid email address.' });
    }

    // Password strength
    const pwRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    if (!pwRegex.test(password)) {
        return res.status(400).json({
            message: 'Password must be at least 8 characters with an uppercase letter, a number, and a special character.',
        });
    }

    try {
        // Verify the phone token
        let decoded;
        try {
            decoded = jwt.verify(verifyToken, process.env.JWT_SECRET);
        } catch {
            return res.status(401).json({ message: 'Phone verification expired. Please verify your OTP again.' });
        }
        if (decoded.purpose !== 'registration') {
            return res.status(401).json({ message: 'Invalid verification token.' });
        }

        const fullPhone = `${country_code}${phone.replace(/^0+/, '')}`;
        if (decoded.phone !== fullPhone) {
            return res.status(401).json({ message: 'Phone number mismatch. Please re-verify.' });
        }

        // Confirm OTP record is still marked verified
        const otpRecord = await RegistrationOtp.findOne({ phone: fullPhone });
        if (!otpRecord || !otpRecord.is_verified) {
            return res.status(401).json({ message: 'Phone not verified. Please verify your OTP.' });
        }

        // Duplicate checks
        const [existingPhone, existingEmail] = await Promise.all([
            User.findOne({ phone: fullPhone }),
            User.findOne({ email: email.toLowerCase() }),
        ]);
        if (existingPhone) {
            return res.status(409).json({ message: 'This phone number is already registered.' });
        }
        if (existingEmail) {
            return res.status(409).json({ message: 'This email address is already registered.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name: `${first_name.trim()} ${last_name.trim()}`,
            title,
            first_name: first_name.trim(),
            last_name: last_name.trim(),
            nationality,
            phone: fullPhone,
            country_code,
            email: email.toLowerCase().trim(),
            birthday: new Date(birthday),
            nic_type,
            nic_number: nic_number.trim(),
            password: hashedPassword,
            phone_verified: true,
            is_verified: true,
        });

        // Clean up OTP record
        await RegistrationOtp.deleteOne({ phone: fullPhone });

        return res.status(201).json({
            success: true,
            message: 'Registration successful! Welcome to Lakwedha.',
            user: { id: user._id, name: user.name, email: user.email, phone: user.phone },
        });
    } catch (err) {
        console.error('register error:', err);
        return res.status(500).json({ message: 'Server error. Please try again.' });
    }
}

module.exports = { sendOtp, verifyOtp, register };
