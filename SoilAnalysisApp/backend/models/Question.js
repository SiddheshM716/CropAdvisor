const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    image: { type: String }, // Cloudinary URL
    cropType: { type: String, trim: true },
    soilType: { type: String, trim: true },
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true } // [longitude, latitude]
    },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    answerCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

questionSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Question', questionSchema);
