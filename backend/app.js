require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const logger = require('./config/logger');

const app = express();

// CORS configuration (must be before helmet)
const corsOptions = {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.options('/{*splat}', cors(corsOptions));

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV 
    });
});

// API routes
app.use('/api/auth', require('./routes/auth'));
console.log('✅ Auth routes registered at /api/auth');
app.use('/api/content', require('./routes/content'));
app.use('/api/series', require('./routes/series'));
app.use('/api/users', require('./routes/users'));
app.use('/api/reviews', require('./routes/reviews')); // Legacy - kept for backward compatibility
app.use('/api/comments', require('./routes/comments')); // New comments system
app.use('/api/ratings', require('./routes/ratings')); // Separate rating system
app.use('/api/categories', require('./routes/categories'));
app.use('/api/bookmarks', require('./routes/bookmarks'));
app.use('/api/likes', require('./routes/likes'));
app.use('/api/reading-preferences', require('./routes/readingPreferences'));
app.use('/api/drafts', require('./routes/drafts'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/purchases', require('./routes/purchases'));
app.use('/api/push', require('./routes/push'));

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found` 
    });
});

// Global error handler
app.use((err, req, res, next) => {
    logger.error('Unhandled error:', err);
    
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

module.exports = app;
