/**
 * Design Pattern: Singleton
 */
class Logger {
    constructor() {
        if (Logger.instance) {
            return Logger.instance;
        }

        this.isDevelopment = process.env.NODE_ENV === 'development';
        Logger.instance = this;
    }

    log(level, message, ...args) {
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
        
        console.log(prefix, message, ...args);
    }

    info(message, ...args) {
        this.log('info', message, ...args);
    }

    error(message, ...args) {
        this.log('error', message, ...args);
    }

    warn(message, ...args) {
        this.log('warn', message, ...args);
    }

    debug(message, ...args) {
        if (this.isDevelopment) {
            this.log('debug', message, ...args);
        }
    }
}

const instance = new Logger();
Object.freeze(instance);

module.exports = instance;
