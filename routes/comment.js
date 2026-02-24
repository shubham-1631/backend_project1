const express = require('express');
const Ticketcomment = require('../model/ticketcomment');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.patch('/:id', authenticate, async (req, res) => {
    try {
        const comment = await Ticketcomment.findById(req.params.id);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        const isAuthor = comment.user.toString() === req.user.id;
        if (req.user.role !== 'MANAGER' && !isAuthor) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        if (!req.body.comment) {
            return res.status(400).json({ message: 'Comment is required' });
        }

        comment.comment = req.body.comment;
        await comment.save();

        return res.json(comment);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

router.delete('/:id', authenticate, async (req, res) => {
    try {
        const comment = await Ticketcomment.findById(req.params.id);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        const isAuthor = comment.user.toString() === req.user.id;
        if (req.user.role !== 'MANAGER' && !isAuthor) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        await comment.deleteOne();
        return res.json({ message: 'Comment deleted' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

module.exports = router;
