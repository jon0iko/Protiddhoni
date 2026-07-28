import 'dotenv/config';
import type { Request, Response, NextFunction } from 'express';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
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

// ---------------------------------------------------------------------------
// API documentation — Swagger UI over the static OpenAPI document in docs/.
//
// Mounted at /api-docs, which the `/api` rate limiter does NOT match (Express
// only treats a mount path as a prefix at a `/` boundary), so browsing the docs
// cannot exhaust a visitor's API quota.
//
// The spec is read from disk rather than imported, so `tsc` never has to resolve
// YAML and the document can be edited without a rebuild. Two candidate paths are
// tried because __dirname differs between running the sources with tsx (backend/)
// and running the compiled output (backend/dist/) — in production the checked-out
// source tree sits alongside dist/, so the parent path resolves.
// If the file is missing the API still boots; docs are not worth a crash.
// ---------------------------------------------------------------------------
const OPENAPI_CANDIDATES = [
    path.join(__dirname, 'docs', 'openapi.yaml'),
    path.join(__dirname, '..', 'docs', 'openapi.yaml')
];
try {
    const specPath = OPENAPI_CANDIDATES.find(fs.existsSync);
    if (!specPath) throw new Error(`openapi.yaml not found in: ${OPENAPI_CANDIDATES.join(', ')}`);
    const openapiDocument = YAML.parse(fs.readFileSync(specPath, 'utf8'));
    app.use(
        '/api-docs',
        // The global helmet() above sets a Content-Security-Policy with
        // `script-src 'self'`, which blocks the inline bootstrap script Swagger UI
        // injects -- the page then renders blank while still returning 200.
        //
        // Note that `contentSecurityPolicy: false` would NOT fix this: it means
        // "do not set the header", and the global one has already been written.
        // Supplying an explicit policy here overwrites it for this path only, so
        // the docs still ship a CSP rather than none, and every other route keeps
        // the stricter global policy untouched.
        helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'", "'unsafe-inline'"],
                    styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
                    imgSrc: ["'self'", 'data:', 'https:'],
                    fontSrc: ["'self'", 'https:', 'data:'],
                    objectSrc: ["'none'"],
                    frameAncestors: ["'self'"]
                }
            }
        }),
        swaggerUi.serve,
        swaggerUi.setup(openapiDocument, {
            customSiteTitle: 'Protiddhoni API',
            swaggerOptions: { persistAuthorization: true, docExpansion: 'none', filter: true }
        })
    );

    // Raw document, for importing into Postman or any other client.
    app.get('/api-docs.json', (req: Request, res: Response) => res.json(openapiDocument));

    logger.info(`API docs available at /api-docs (${Object.keys(openapiDocument.paths ?? {}).length} paths)`);
} catch (err) {
    logger.error('Could not load OpenAPI document; /api-docs disabled.', err);
}

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
