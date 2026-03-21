const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/* REGISTER */
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password)
            return res.status(400).json({ message: 'All fields required' });

        const exists = await User.findOne({ email });
        if (exists) return res.status(409).json({ message: 'Email already registered' });

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
        });

        res.status(201).json({
            message: 'User registered successfully',
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* CHANGE PASSWORD */
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword)
            return res.status(400).json({ success: false, message: 'currentPassword and newPassword are required' });

        const user = await User.findById(req.user.id).select('+password');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const match = await bcrypt.compare(currentPassword, user.password);
        if (!match) return res.status(401).json({ success: false, message: 'Current password is incorrect' });

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.json({ success: true, message: 'Password changed successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* LOGIN */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const credential = (email || '').trim();

        // Detect phone vs email: phone contains only digits, spaces, +, -, ()
        const isPhone = credential.length > 0 && !credential.includes('@') &&
            /^[\d\s+\-()/]{7,20}$/.test(credential);

        let user;
        if (isPhone) {
            const formatLKNumber = require('../utils/phone');
            const normalisedPhone = '+' + formatLKNumber(credential);
            user = await User.findOne({ phone: normalisedPhone }).select('+password');
        } else {
            user = await User.findOne({ email: credential.toLowerCase() }).select('+password');
        }

        if (!user) return res.status(401).json({ message: 'Invalid credentials' });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: '1d',
        });

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
