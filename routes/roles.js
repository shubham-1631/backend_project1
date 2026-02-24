const express = require('express');
const Role = require('../model/role');

const router = express.Router();


router.get('/', async (req, res) => {
    try {
        const role = await Role.find().sort({ name: 1 });
        res.status(200).json(role);
    }
    catch (error) {res.status(500).json({ error: error.message })};
});


router.post('/', async (req, res) => {
    try {
        const role = await Role.create({name : req.body.name})
        res.status(201).json(role);} 
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;