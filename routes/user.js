const express = require('express');
const router = express.Router();
const User = require('../model/User');
const Role = require('../model/role');
const bcrypt = require('bcrypt');
const { authenticate, authorizeRoles } = require('../middleware/auth');

router.get('/', authenticate, authorizeRoles('MANAGER'), async (req, res) => {
    try {
        const users = await User.find().populate('role', 'name').sort({ created_at: -1 });
        res.status(200).json(users);
    }
    catch (error) {res.status(500).json({ message : 'user not found' })};
})

router.post('/', authenticate, authorizeRoles('MANAGER'), async (req, res) => {
    try {
        const { name, email, password, role_id, role } = req.body;
        if (!name || !email || !password || (!role_id && !role)) {
            return res.status(400).json({ message: 'name, email, password, and role are required' });
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
        res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role });
    }
    catch (error)
    {
        res.status(500).json({ message : 'user not add' });
    }
});

module.exports = router;
