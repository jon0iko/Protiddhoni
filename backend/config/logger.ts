type LogLevel = 'info' | 'error' | 'warn' | 'debug';

/**
 * Design Pattern: Singleton
 */
class Logger {
    private static instance: Logger | undefined;
    private isDevelopment!: boolean;

    constructor() {
        if (Logger.instance) {
            return Logger.instance;
        }

        this.isDevelopment = process.env.NODE_ENV === 'development';
        Logger.instance = this;
    }

    log(level: LogLevel, message: any, ...args: any[]): void {
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

        console.log(prefix, message, ...args);
    }

    info(message: any, ...args: any[]): void {
        this.log('info', message, ...args);
    }

    error(message: any, ...args: any[]): void {
        this.log('error', message, ...args);
    }

    warn(message: any, ...args: any[]): void {
        this.log('warn', message, ...args);
    }

    debug(message: any, ...args: any[]): void {
        if (this.isDevelopment) {
            this.log('debug', message, ...args);
        }
    }
}

const instance = new Logger();
Object.freeze(instance);

export default instance;
