import 'dotenv/config';
import type { Request, Response, NextFunction } from 'express';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import logger from './config/logger';

// Route modules
import authRoutes from './routes/auth';
import contentRoutes from './routes/content';
import seriesRoutes from './routes/series';
import usersRoutes from './routes/users';
import reviewsRoutes from './routes/reviews';
import commentsRoutes from './routes/comments';
import ratingsRoutes from './routes/ratings';
import categoriesRoutes from './routes/categories';
import bookmarksRoutes from './routes/bookmarks';
import likesRoutes from './routes/likes';
import readingPreferencesRoutes from './routes/readingPreferences';
import draftsRoutes from './routes/drafts';
import notificationsRoutes from './routes/notifications';
import paymentsRoutes from './routes/payments';
import purchasesRoutes from './routes/purchases';
import pushRoutes from './routes/push';
import quizzesRoutes from './routes/quizzes';
import reportsRoutes from './routes/reports';

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
app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/series', seriesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/reviews', reviewsRoutes); // Legacy - kept for backward compatibility
app.use('/api/comments', commentsRoutes); // New comments system
app.use('/api/ratings', ratingsRoutes); // Separate rating system
app.use('/api/categories', categoriesRoutes);
app.use('/api/bookmarks', bookmarksRoutes);
app.use('/api/likes', likesRoutes);
app.use('/api/reading-preferences', readingPreferencesRoutes);
app.use('/api/drafts', draftsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/purchases', purchasesRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/quizzes', quizzesRoutes);
app.use('/api/reports', reportsRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
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

export default app;
