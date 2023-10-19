import ILogger from './interface/logger';

// TODO implement winston here
export default function createLogger(): ILogger {
    return {
        log: (level: 'info' | 'warn' | 'error', message: string, meta?: object) => {
            console.log(level, message, meta);
        }
    };
}
