import ILogger from './interface/logger';

// Potentially, we could use Winston or something similar
// But currently stdout is enough
export default function createLogger(): ILogger {
    return {
        log: (level: 'info' | 'warn' | 'error', message: string, meta?: object) => {
            console.log(level, message, meta, new Date());
        }
    };
}
