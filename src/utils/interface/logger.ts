
interface ILogger {
    log: (
        level: 'info' | 'warn' | 'error',
        message: string,
        meta?: object
    ) => void;
}

export default ILogger;