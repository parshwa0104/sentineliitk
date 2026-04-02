const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 1, maxlength: 80 },
  createdAt: { type: Date, default: Date.now },
  investorProfile: {
    riskTolerance: { type: String, enum: ['conservative', 'moderate', 'aggressive'], default: 'moderate' },
    experience: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    goalTimeline: { type: String, enum: ['short', 'medium', 'long'], default: 'medium' },
    reactionToLoss: { type: String, enum: ['panic', 'worried', 'calm', 'opportunistic'], default: 'worried' },
    tradingFrequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'rarely'], default: 'weekly' },
  },
  eviBaseline: { type: Number, default: 40 },
});

module.exports = mongoose.model('User', userSchema);
