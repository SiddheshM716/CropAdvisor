const express = require('express');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const router = express.Router();

// ── QUESTIONS ────────────────────────────────────────────────────────────

// Create Question
router.post('/questions', auth, upload.single('image'), async (req, res) => {
    try {
        const { title, description, cropType, soilType, lat, lon } = req.body;
        const question = new Question({
            title,
            description,
            cropType,
            soilType,
            image: req.file ? req.file.path : null,
            location: { coordinates: [parseFloat(lon), parseFloat(lat)] },
            owner: req.user._id
        });
        await question.save();
        res.status(201).send(question);
    } catch (e) {
        res.status(400).send({ error: e.message });
    }
});

// Get Questions (with pagination & geo-filtering)
router.get('/questions', async (req, res) => {
    try {
        const { lat, lon, distance = 50, page = 1, limit = 10, cropType } = req.query;
        let query = {};

        if (lat && lon) {
            query.location = {
                $near: {
                    $geometry: { type: 'Point', coordinates: [parseFloat(lon), parseFloat(lat)] },
                    $maxDistance: parseInt(distance) * 1000 // distance in km
                }
            };
        }

        if (cropType) query.cropType = cropType;

        let mQuery = Question.find(query).populate('owner', 'username avatar');

        // Note: You cannot use sort() with $near. 
        // $near results are automatically sorted by distance.
        if (!lat || !lon) {
            mQuery = mQuery.sort({ createdAt: -1 });
        }

        const questions = await mQuery
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        res.send(questions);
    } catch (e) {
        console.error('GET /questions error:', e);
        res.status(500).send({ error: e.message });
    }
});

// Get Single Question Details
router.get('/questions/:id', async (req, res) => {
    try {
        const question = await Question.findById(req.params.id).populate('owner', 'username avatar');
        if (!question) return res.status(404).send({ error: 'Question not found' });

        const answers = await Answer.find({ question: req.params.id })
            .populate('owner', 'username avatar')
            .sort({ isBest: -1, voteCount: -1, createdAt: -1 });

        res.send({ question, answers });
    } catch (e) {
        console.error('GET /questions/:id error:', e);
        res.status(500).send({ error: e.message });
    }
});

// ── ANSWERS ──────────────────────────────────────────────────────────────

// Submit Answer
router.post('/questions/:id/answers', auth, upload.single('image'), async (req, res) => {
    try {
        const answer = new Answer({
            text: req.body.text,
            image: req.file ? req.file.path : null,
            owner: req.user._id,
            question: req.params.id
        });
        await answer.save();

        // Increment answer count on question
        await Question.findByIdAndUpdate(req.params.id, { $inc: { answerCount: 1 } });

        res.status(201).send(answer);
    } catch (e) {
        res.status(400).send({ error: e.message });
    }
});

// Vote Answer
router.post('/answers/:id/vote', auth, async (req, res) => {
    try {
        const answer = await Answer.findById(req.params.id);
        if (!answer) return res.status(404).send({ error: 'Answer not found' });

        const hasVoted = answer.votes.includes(req.user._id);
        if (hasVoted) {
            // Unvote
            answer.votes = answer.votes.filter(id => id.toString() !== req.user._id.toString());
        } else {
            // Vote
            answer.votes.push(req.user._id);
        }
        answer.voteCount = answer.votes.length;
        await answer.save();
        res.send(answer);
    } catch (e) {
        res.status(400).send({ error: e.message });
    }
});

// Select Best Answer (Owner only)
router.patch('/answers/:id/best', auth, async (req, res) => {
    try {
        const answer = await Answer.findById(req.params.id).populate('question');
        if (!answer) return res.status(404).send({ error: 'Answer not found' });

        if (answer.question.owner.toString() !== req.user._id.toString()) {
            return res.status(403).send({ error: 'Only question owner can select best answer' });
        }

        // Reset previous best answer if any
        await Answer.updateMany({ question: answer.question._id }, { isBest: false });

        answer.isBest = true;
        await answer.save();
        res.send(answer);
    } catch (e) {
        res.status(400).send({ error: e.message });
    }
});

module.exports = router;
