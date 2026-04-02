const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');

const validProfiles = {
  riskTolerance: ['conservative', 'moderate', 'aggressive'],
  experience: ['beginner', 'intermediate', 'advanced'],
  goalTimeline: ['short', 'medium', 'long'],
  reactionToLoss: ['panic', 'worried', 'calm', 'opportunistic'],
  tradingFrequency: ['daily', 'weekly', 'monthly', 'rarely'],
};

function isValidInvestorProfile(profile = {}) {
  return Object.entries(validProfiles).every(([key, values]) => {
    const value = profile[key];
    return typeof value === 'string' && values.includes(value);
  });
}

// POST /api/user/onboard — Save onboarding profile
router.post('/onboard', async (req, res) => {
  try {
    const { name, investorProfile } = req.body || {};
    const safeName = (name || '').trim();

    if (!safeName || safeName.length > 80) {
      return res.status(400).json({ error: 'name is required (1-80 characters)' });
    }

    if (!isValidInvestorProfile(investorProfile)) {
      return res.status(400).json({ error: 'invalid investorProfile payload' });
    }

    const user = new User({ name: safeName, investorProfile });
    await user.save();
    return res.json({ success: true, userId: user._id, user });
  } catch (err) {
    console.error('Onboard error:', err);
    return res.status(500).json({ error: 'Failed to create user profile' });
  }
});

// GET /api/user/:id — Get user profile
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    const user = await User.findById(req.params.id).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
});

module.exports = router;
