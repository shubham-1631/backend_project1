const express = require('express');
const router = express.Router();
const Ticket = require('../model/ticket');
const Ticketcomment = require('../model/ticketcomment');
const Ticketstatuslog = require('../model/ticketstatuslog');
const User = require('../model/User');
const { authenticate, authorizeRoles } = require('../middleware/auth');

const STATUS_FLOW = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];

const canAccessTicket = (ticket, user) => {
    if (user.role === 'MANAGER') return true;
    if (user.role === 'SUPPORT') return ticket.assigned_to && ticket.assigned_to.toString() === user.id;
    return ticket.created_by && ticket.created_by.toString() === user.id;
};

const isNextStatus = (oldStatus, newStatus) => {
    const oldIndex = STATUS_FLOW.indexOf(oldStatus);
    const newIndex = STATUS_FLOW.indexOf(newStatus);
    return oldIndex !== -1 && newIndex === oldIndex + 1;
};

router.get('/', authenticate, async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'SUPPORT') {
            query = { assigned_to: req.user.id };
        }
        if (req.user.role === 'USER') {
            query = { created_by: req.user.id };
        }

        const tickets = await Ticket.find(query)
            .populate('created_by', 'name')
            .populate('assigned_to', 'name')
            .sort({ createdAt: -1 });
        res.status(200).json(tickets);
    }
    catch (error) {res.status(500).json({ error: error.message })}
});

router.post('/', authenticate, authorizeRoles('USER', 'MANAGER'), async (req, res) => {
    try{
        const { title, description, status, priority, assigned_to } = req.body;
        if (!title || title.length < 5) {
            return res.status(400).json({ message: 'Title must be at least 5 characters' });
        }
        if (!description || description.length < 10) {
            return res.status(400).json({ message: 'Description must be at least 10 characters' });
        }
        if (status && !STATUS_FLOW.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        if (priority && !PRIORITIES.includes(priority)) {
            return res.status(400).json({ message: 'Invalid priority' });
        }

        let assignedUserId = assigned_to || null;
        if (assignedUserId) {
            const assignedUser = await User.findById(assignedUserId).populate('role', 'name');
            if (!assignedUser) {
                return res.status(400).json({ message: 'Assigned user not found' });
            }
            if (assignedUser.role.name === 'USER') {
                return res.status(400).json({ message: 'Tickets cannot be assigned to USER role' });
            }
        }

        const ticket = await Ticket.create({
            title,
            description,
            status,
            priority,
            created_by: req.user.id,
            assigned_to: assignedUserId,
        });
        res.status(201).json(ticket);
    }
    catch (error) {res.status(500).json({ error: error.message })};
})

router.post('/:id/comments', authenticate, async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }
        if (!canAccessTicket(ticket, req.user)) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        if (!req.body.comment) {
            return res.status(400).json({ message: 'Comment is required' });
        }
        const comment = await Ticketcomment.create({
            ticket: req.params.id,
            user: req.user.id,
            comment: req.body.comment,
        });
        res.status(201).json(comment);
    }
    catch (error)
    {
        res.status(500).json({ error: error.message });
    }
})

router.get('/:id/comments', authenticate, async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }
        if (!canAccessTicket(ticket, req.user)) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const comments = await Ticketcomment.find({ ticket: req.params.id })
            .populate('user', 'name')
            .sort({ created_at: -1 });

        return res.json(comments);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

router.patch('/:id/assign', authenticate, authorizeRoles('MANAGER', 'SUPPORT'), async (req, res) => {
    try {
        const { assigned_to } = req.body;
        if (!assigned_to) {
            return res.status(400).json({ message: 'assigned_to is required' });
        }

        const assignedUser = await User.findById(assigned_to).populate('role', 'name');
        if (!assignedUser) {
            return res.status(400).json({ message: 'Assigned user not found' });
        }
        if (assignedUser.role.name === 'USER') {
            return res.status(400).json({ message: 'Tickets cannot be assigned to USER role' });
        }

        const ticket = await Ticket.findByIdAndUpdate(
            req.params.id,
            { assigned_to },
            { new: true }
        );
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        return res.json(ticket);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

router.patch('/:id/status', authenticate, authorizeRoles('MANAGER', 'SUPPORT'), async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        if (req.user.role === 'SUPPORT' && (!ticket.assigned_to || ticket.assigned_to.toString() !== req.user.id)) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const { status } = req.body;
        if (!status || !STATUS_FLOW.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        if (!isNextStatus(ticket.status, status)) {
            return res.status(400).json({ message: 'Invalid status transition' });
        }

        const updatedTicket = await Ticket.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        const statusLog = await Ticketstatuslog.create({
            ticket: req.params.id,
            old_status: ticket.status,
            new_status: updatedTicket.status,
            changed_by: req.user.id,
        });
        res.json({ ticket: updatedTicket, statusLog });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
})

router.delete('/:id', authenticate, authorizeRoles('MANAGER'), async (req, res) => {
    try {
        const ticket = await Ticket.findByIdAndDelete(req.params.id);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }
        return res.json({ message: 'Ticket deleted' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

module.exports = router;