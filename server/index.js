require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const userRoutes = require('./routes/user');
const behaviorRoutes = require('./routes/behavior');
const aiRoutes = require('./routes/ai');
const stockRoutes = require('./routes/stocks');

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
const allowedOrigins = CLIENT_ORIGIN.split(',').map(origin => origin.trim()).filter(Boolean);

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
  frameguard: { action: 'deny' },           // Prevent clickjacking
  noSniff: true,                             // X-Content-Type-Options
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hidePoweredBy: true,                       // Remove X-Powered-By
}));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('CORS origin not allowed'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '100kb' }));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
}));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'alive',
    service: 'Sentinel API',
    timestamp: new Date().toISOString(),
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// Routes
app.use('/api/user', userRoutes);
app.use('/api/behavior', behaviorRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/stocks', stockRoutes);

app.use((req, res) => {
  return res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  if (err && err.message === 'CORS origin not allowed') {
    return res.status(403).json({ error: 'Origin not allowed' });
  }
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }
  console.error('Unhandled API error:', err.message);
  return res.status(500).json({ error: 'Internal server error' });
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sentinel';

mongoose.set('strictQuery', true);

mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 8000,
  maxPoolSize: 20,
  minPoolSize: 2,
  maxIdleTimeMS: 60000,
})
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => {
      console.log(`🚀 Sentinel API running on http://localhost:${PORT}`);
      console.log(`   Health: http://localhost:${PORT}/api/health`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
