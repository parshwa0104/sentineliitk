const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const BehaviorEvent = require('../models/BehaviorEvent');
const User = require('../models/User');
const { computeEVI } = require('../services/eviEngine');

const allowedEventTypes = ['sell_attempt', 'sell_confirmed', 'sell_cancelled', 'buy', 'fomo_buy', 'panic_sell'];

function sanitizeSymbol(symbol) {
  if (typeof symbol !== 'string') {
    return '';
  }
  return symbol.trim().toUpperCase().slice(0, 12);
}

// POST /api/behavior/log — Log a trade event
router.post('/log', async (req, res) => {
  try {
    const payload = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(payload.userId)) {
      return res.status(400).json({ error: 'Invalid userId' });
    }

    if (!allowedEventTypes.includes(payload.type)) {
      return res.status(400).json({ error: 'Invalid event type' });
    }

    const symbol = sanitizeSymbol(payload.symbol);
    if (!symbol) {
      return res.status(400).json({ error: 'symbol is required' });
    }

    const userExists = await User.exists({ _id: payload.userId });
    if (!userExists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const event = new BehaviorEvent({
      userId: payload.userId,
      type: payload.type,
      symbol,
      price: payload.price != null ? Number(payload.price) : undefined,
      quantity: payload.quantity != null ? Number(payload.quantity) : undefined,
      eviAtTime: payload.eviAtTime != null ? Number(payload.eviAtTime) : undefined,
      interventionShown: Boolean(payload.interventionShown),
      interventionResult: ['proceeded', 'cancelled', 'none'].includes(payload.interventionResult)
        ? payload.interventionResult
        : 'none',
    });
    await event.save();
    return res.json({ success: true, event });
  } catch (err) {
    console.error('Behavior log error:', err);
    return res.status(500).json({ error: 'Failed to log behavior event' });
  }
});

// GET /api/behavior/events/:userId — Get events for a user
router.get('/events/:userId', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    const events = await BehaviorEvent.find({ userId: req.params.userId })
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();
    return res.json(events);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// GET /api/behavior/evi/:userId — Get computed EVI for a user
router.get('/evi/:userId', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    const events = await BehaviorEvent.find({ userId: req.params.userId })
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();

    const user = await User.findById(req.params.userId).lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const evi = computeEVI(events, user.investorProfile || {});
    return res.json({ evi, eventCount: events.length });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to compute EVI' });
  }
});

module.exports = router;
