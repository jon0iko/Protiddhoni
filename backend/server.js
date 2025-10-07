const app = require('./app');
const db = require('./config/database');
const logger = require('./config/logger');

const PORT = process.env.PORT || 5000;

// Test database connection before starting server
db.testConnection()
    .then(isConnected => {
        if (!isConnected) {
            logger.error('Failed to connect to database. Exiting...');
            process.exit(1);
        }

        // Start server
        app.listen(PORT, () => {
            logger.info(`🚀 Server running on port ${PORT}`);
            logger.info(`📝 Environment: ${process.env.NODE_ENV}`);
            logger.info(`🔗 API URL: http://localhost:${PORT}`);
        });
    })
    .catch(error => {
        logger.error('Failed to start server:', error);
        process.exit(1);
    });

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('SIGINT signal received: closing HTTP server');
    process.exit(0);
});
