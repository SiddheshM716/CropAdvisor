const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const { username, email, password, phoneNumber, lat, lon } = req.body;
        const user = new User({
            username,
            email,
            password,
            phoneNumber,
            location: (lat && lon) ? { type: 'Point', coordinates: [parseFloat(lon), parseFloat(lat)] } : undefined
        });
        await user.save();
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
        res.status(201).send({ user, token });
    } catch (e) {
        console.error('Registration error:', e);
        res.status(400).send({ error: 'Registration failed. Check if email/username exists.' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).send({ error: 'Invalid login credentials' });
        }
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
        res.send({ user, token });
    } catch (e) {
        console.error('Login error:', e);
        res.status(500).send({ error: 'Login error' });
    }
});

module.exports = router;
