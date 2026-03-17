const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
    text: { type: String, required: true },
    image: { type: String }, // Cloudinary URL
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    voteCount: { type: Number, default: 0 },
    isBest: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

// Update vote count pre-save logic could go here if needed, 
// but we'll probably handle it in the controller for atomic updates.

module.exports = mongoose.model('Answer', answerSchema);
