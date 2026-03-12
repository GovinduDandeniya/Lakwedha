const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/* REGISTER */
exports.register = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password)
            return res.status(400).json({ message: 'All fields required' });

        const exists = await User.findOne({ email });
        if (exists) return res.status(409).json({ message: 'Email already registered' });

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role || 'user',
        });



        res.status(201).json({
            message: 'User registered successfully',
        });
    } catch (err) {
        next(err);
    }
};

/* LOGIN */
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

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
        next(err);
    }
};
