require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { UPLOAD_DIR } = require('./config/storage');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const videoRoutes = require('./routes/videos');
const commentRoutes = require('./routes/comments');
const adminRoutes = require('./routes/admin');

const app = express();

// Trust Railway / proxy headers so req.protocol reflects https
app.set('trust proxy', 1);

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded videos from the persistent volume
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d', fallthrough: false }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: 'Too many requests, please try again later.',
});
app.use('/api/', limiter);

// Health check
app.get('/', (req, res) => {
  res.json({
    name: 'Loopz API',
    status: 'running',
    version: '1.0.0',
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/admin', adminRoutes);

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✓ Loopz server running on port ${PORT}`);
});
