export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
})(LogLevel || (LogLevel = {}));
export class Logger {
    static level = LogLevel.INFO;
    static setLevel(level) {
        this.level = level;
    }
    static formatMessage(level, message, context) {
        const timestamp = new Date().toISOString();
        const contextStr = context ? `\n${JSON.stringify(context, null, 2)}` : '';
        return `[${timestamp}] ${level}: ${message}${contextStr}`;
    }
    static debug(message, context) {
        if (this.level <= LogLevel.DEBUG) {
            console.debug(this.formatMessage('DEBUG', message, context));
        }
    }
    static info(message, context) {
        if (this.level <= LogLevel.INFO) {
            console.info(this.formatMessage('INFO', message, context));
        }
    }
    static warn(message, context) {
        if (this.level <= LogLevel.WARN) {
            console.warn(this.formatMessage('WARN', message, context));
        }
    }
    static error(message, error) {
        if (this.level <= LogLevel.ERROR) {
            console.error(this.formatMessage('ERROR', message, {
                error: error instanceof Error ? {
                    message: error.message,
                    stack: error.stack
                } : error
            }));
        }
    }
}
