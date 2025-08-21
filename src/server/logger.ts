// Web Crypto API for Edge Runtime compatibility
function generateRequestId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  ts: string;
  scope: string;
  msg: string;
  userId?: string;
  reqId?: string;
  meta?: Record<string, any>;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 500;

  private createLogEntry(
    level: LogLevel,
    scope: string,
    msg: string,
    meta?: Record<string, any>
  ): LogEntry {
    const entry: LogEntry = {
      level,
      ts: new Date().toISOString(),
      scope,
      msg,
      meta,
    };

    // Add context from request if available
    if (typeof globalThis !== 'undefined' && (globalThis as any).currentRequest) {
      const ctx = (globalThis as any).currentRequest;
      entry.reqId = ctx.reqId;
      entry.userId = ctx.userId;
    }

    return entry;
  }

  private addLog(entry: LogEntry) {
    this.logs.push(entry);
    
    // Keep only the latest maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output for development
    if (process.env.NODE_ENV === 'development') {
      const timestamp = entry.ts;
      const reqId = entry.reqId ? `[${entry.reqId}]` : '';
      const userId = entry.userId ? `[user:${entry.userId}]` : '';
      const scope = `[${entry.scope}]`;
      const meta = entry.meta ? JSON.stringify(entry.meta) : '';
      
      const logLine = `${timestamp} ${entry.level.toUpperCase()} ${reqId}${userId}${scope} ${entry.msg} ${meta}`;
      
      switch (entry.level) {
        case 'error':
          console.error(logLine);
          break;
        case 'warn':
          console.warn(logLine);
          break;
        case 'info':
          console.info(logLine);
          break;
        case 'debug':
          console.debug(logLine);
          break;
      }
    }
  }

  debug(scope: string, msg: string, meta?: Record<string, any>) {
    const entry = this.createLogEntry('debug', scope, msg, meta);
    this.addLog(entry);
  }

  info(scope: string, msg: string, meta?: Record<string, any>) {
    const entry = this.createLogEntry('info', scope, msg, meta);
    this.addLog(entry);
  }

  warn(scope: string, msg: string, meta?: Record<string, any>) {
    const entry = this.createLogEntry('warn', scope, msg, meta);
    this.addLog(entry);
  }

  error(scope: string, msg: string, meta?: Record<string, any>) {
    const entry = this.createLogEntry('error', scope, msg, meta);
    this.addLog(entry);
  }

  // Get recent logs (for dev viewer)
  getLogs(limit?: number): LogEntry[] {
    return limit ? this.logs.slice(-limit) : this.logs;
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
  }

  // Set request context
  setRequestContext(reqId: string, userId?: string) {
    if (typeof globalThis !== 'undefined') {
      (globalThis as any).currentRequest = { reqId, userId };
    }
  }

  // Clear request context
  clearRequestContext() {
    if (typeof globalThis !== 'undefined') {
      delete (globalThis as any).currentRequest;
    }
  }
}

export const logger = new Logger();

// Legacy exports for compatibility
export const log = {
  info: (msg: string, meta?: Record<string, any>) => logger.info('legacy', msg, meta),
  warn: (msg: string, meta?: Record<string, any>) => logger.warn('legacy', msg, meta),
  error: (msg: string, meta?: Record<string, any>) => logger.error('legacy', msg, meta),
};
