require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const logger = require('./config/logger');

const app = express();

// Trust the reverse proxy (Render/Vercel/nginx) so req.ip and the rate limiter
// see the real client IP from X-Forwarded-For instead of the proxy's address.
app.set('trust proxy', 1);

// CORS configuration (must be before helmet)
const corsOptions = {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Client-Session-Id']
};
app.use(cors(corsOptions));
app.options('/{*splat}', cors(corsOptions));

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Gzip responses. Content bodies (long-form Bengali text) compress extremely
// well, cutting egress bandwidth — the main variable cost at scale — by ~70%+.
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting. Protects the API (and the downstream Supabase bill) from a
// single abusive client. Disabled in test to keep the suite deterministic.
if (process.env.NODE_ENV !== 'test') {
    // Generous global cap for normal browsing.
    const globalLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 1000,
        standardHeaders: true,
        legacyHeaders: false,
        message: { success: false, error: 'Too many requests, please try again later.' }
    });
    app.use('/api', globalLimiter);

    // Stricter cap on auth endpoints to slow credential-stuffing / brute force.
    const authLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 30,
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: true, // only failed attempts count toward the cap
        message: { success: false, error: 'Too many attempts, please try again later.' }
    });
    app.use('/api/auth/login', authLimiter);
    app.use('/api/auth/register', authLimiter);
}

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
app.use('/api/quizzes', require('./routes/quizzes'));

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
