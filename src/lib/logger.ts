export interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  details?: any;
  timestamp: number;
  service?: string;
  userId?: string;
  sessionId?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
}

export class Logger {
  private static instance: Logger;
  private serviceName: string;
  private logBuffer: LogEntry[] = [];
  private maxBufferSize = 1000;
  private enableConsole = process.env.NODE_ENV !== 'production' || process.env.ENABLE_DEBUG_LOGGING === 'true';

  constructor(serviceName = 'app') {
    this.serviceName = serviceName;
  }

  static getInstance(serviceName = 'app'): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(serviceName);
    }
    return Logger.instance;
  }

  private formatLogEntry(entry: LogEntry): string {
    try {
      return JSON.stringify({
        ...entry,
        service: this.serviceName,
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '0.1.0'
      });
    } catch (error) {
      return `{"level":"error","message":"Failed to serialize log entry","timestamp":${Date.now()},"service":"${this.serviceName}"}`;
    }
  }

  private addToBuffer(entry: LogEntry): void {
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }
  }

  private log(level: LogEntry['level'], message: string, details?: any, context?: Partial<LogEntry>): void {
    const entry: LogEntry = {
      level,
      message,
      details,
      timestamp: Date.now(),
      service: this.serviceName,
      ...context
    };

    this.addToBuffer(entry);

    if (this.enableConsole) {
      const formattedMessage = this.formatLogEntry(entry);
      
      switch (level) {
        case 'error':
          console.error(formattedMessage);
          break;
        case 'warn':
          console.warn(formattedMessage);
          break;
        case 'debug':
          if (process.env.NODE_ENV === 'development') {
            console.debug(formattedMessage);
          }
          break;
        default:
          console.log(formattedMessage);
      }
    }

    // In production, you could send to external logging service
    if (process.env.NODE_ENV === 'production' && process.env.LOG_SERVICE_URL) {
      this.sendToExternalService(entry);
    }
  }

  info(message: string, details?: any, context?: Partial<LogEntry>): void {
    this.log('info', message, details, context);
  }

  warn(message: string, details?: any, context?: Partial<LogEntry>): void {
    this.log('warn', message, details, context);
  }

  error(message: string, error?: Error | unknown, details?: any, context?: Partial<LogEntry>): void {
    const errorDetails = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: (error as any).code
    } : undefined;

    this.log('error', message, details, {
      ...context,
      error: errorDetails
    });
  }

  debug(message: string, details?: any, context?: Partial<LogEntry>): void {
    this.log('debug', message, details, context);
  }

  getRecentLogs(count = 100): LogEntry[] {
    return this.logBuffer.slice(-count);
  }

  clearBuffer(): void {
    this.logBuffer = [];
  }

  private async sendToExternalService(entry: LogEntry): Promise<void> {
    // Implement external logging service integration
    // This is a placeholder for services like Sentry, LogRocket, etc.
    try {
      // Example: await fetch(process.env.LOG_SERVICE_URL, { method: 'POST', body: JSON.stringify(entry) });
    } catch (error) {
      // Silently fail to avoid logging loops
    }
  }
}

// Legacy functions for backward compatibility
export function logInfo(message: string, details?: any) {
  try {
    console.log(JSON.stringify({ level: 'info', message, details, ts: Date.now() }));
  } catch {}
}

export function logError(message: string, details?: any) {
  try {
    console.error(JSON.stringify({ level: 'error', message, details, ts: Date.now() }));
  } catch {}
}

// Export singleton logger instance
export const logger = Logger.getInstance();

// Performance monitoring utilities
export class PerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map();

  static startTimer(name: string): () => number {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.recordMetric(name, duration);
      return duration;
    };
  }

  static recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);

    // Keep only last 1000 measurements
    const values = this.metrics.get(name)!;
    if (values.length > 1000) {
      values.shift();
    }
  }

  static getMetrics(name?: string): Map<string, number[]> | number[] {
    if (name) {
      return this.metrics.get(name) || [];
    }
    return new Map(this.metrics);
  }

  static getAverageMetric(name: string): number {
    const values = this.metrics.get(name) || [];
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  static clearMetrics(name?: string): void {
    if (name) {
      this.metrics.delete(name);
    } else {
      this.metrics.clear();
    }
  }
}