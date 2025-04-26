export declare enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}
export declare class Logger {
    private static level;
    static setLevel(level: LogLevel): void;
    private static formatMessage;
    static debug(message: string, context?: any): void;
    static info(message: string, context?: any): void;
    static warn(message: string, context?: any): void;
    static error(message: string, error?: Error | any): void;
}
