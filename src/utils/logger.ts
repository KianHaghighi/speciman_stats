type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: unknown;
  error?: Error;
}

class Logger {
  private logLevel: LogLevel;

  constructor() {
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  private formatLog(entry: LogEntry): string {
    const { timestamp, level, message, data, error } = entry;
    let logString = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    
    if (data) {
      logString += ` | Data: ${JSON.stringify(data)}`;
    }
    
    if (error) {
      logString += ` | Error: ${error.message}`;
      if (error.stack) {
        logString += ` | Stack: ${error.stack}`;
      }
    }
    
    return logString;
  }

  private log(level: LogLevel, message: string, data?: unknown, error?: Error) {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      error,
    };

    const formattedLog = this.formatLog(entry);

    switch (level) {
      case 'debug':
        console.debug(formattedLog);
        break;
      case 'info':
        console.info(formattedLog);
        break;
      case 'warn':
        console.warn(formattedLog);
        break;
      case 'error':
        console.error(formattedLog);
        break;
    }

    // In production, you might want to send logs to a service like Sentry, LogRocket, etc.
    if (process.env.NODE_ENV === 'production' && level === 'error') {
      // Example: Send to external logging service
      // this.sendToLoggingService(entry);
    }
  }

  debug(message: string, data?: unknown) {
    this.log('debug', message, data);
  }

  info(message: string, data?: unknown) {
    this.log('info', message, data);
  }

  warn(message: string, data?: unknown) {
    this.log('warn', message, data);
  }

  error(message: string, error?: Error, data?: unknown) {
    this.log('error', message, data, error);
  }

  // Method to log authentication events
  authEvent(event: string, userId?: string, data?: Record<string, unknown>) {
    this.info(`AUTH: ${event}`, { userId, ...(data || {}) });
  }

  // Method to log database operations
  dbEvent(operation: string, table: string, data?: unknown) {
    this.debug(`DB: ${operation} on ${table}`, data);
  }

  // Method to log API requests
  apiRequest(method: string, path: string, statusCode: number, duration: number) {
    this.info(`API: ${method} ${path}`, { statusCode, duration });
  }
}

export const logger = new Logger(); 