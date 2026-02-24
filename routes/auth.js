const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../model/User');
const Role = require('../model/role');

const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role_id, role } = req.body;
        if (!name || !email || !password || (!role_id && !role)) {
            return res.status(400).json({ message: 'name, email, password, and role are required' });
        }

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(409).json({ message: 'Email already in use' });
        }

        let resolvedRoleId = role_id;
        if (!resolvedRoleId && role) {
            const roleDoc = await Role.findOne({ name: role });
            if (!roleDoc) {
                return res.status(400).json({ message: 'Invalid role' });
            }
            resolvedRoleId = roleDoc._id;
        }
        if (resolvedRoleId) {
            const roleDoc = await Role.findById(resolvedRoleId);
            if (!roleDoc) {
                return res.status(400).json({ message: 'Invalid role' });
            }
        }

        const hashedPass = await bcrypt.hash(password, 10);
        const user = await User.create({
            name,
            email,
            password: hashedPass,
            role: resolvedRoleId,
        });

        return res.status(201).json({ id: user._id, name: user.name, email: user.email });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ email }).populate('role', 'name');
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ message: 'JWT_SECRET is not configured' });
        }

        if (!user.role || !user.role.name) {
            return res.status(500).json({ message: 'User role is not set' });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role.name, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
        );

        return res.json({ token });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

module.exports = router;
