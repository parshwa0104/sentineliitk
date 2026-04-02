const mongoose = require('mongoose');

const behaviorEventSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['sell_attempt', 'sell_confirmed', 'sell_cancelled', 'buy', 'fomo_buy', 'panic_sell'], required: true },
  symbol: { type: String, required: true, trim: true, uppercase: true, minlength: 1, maxlength: 12 },
  price: { type: Number },
  quantity: { type: Number },
  eviAtTime: { type: Number },
  interventionShown: { type: Boolean, default: false },
  interventionResult: { type: String, enum: ['proceeded', 'cancelled', 'none'], default: 'none' },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('BehaviorEvent', behaviorEventSchema);
