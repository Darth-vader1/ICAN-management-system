import { env } from './env';
import { captureException } from './sentry';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
  context?: Record<string, unknown>;
}

class Logger {
  private isDev = env.isDevelopment;

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  }

  public debug(message: string, ...args: unknown[]): void {
    if (this.isDev) {
      console.debug(this.formatMessage('debug', message), ...args);
    }
  }

  public info(message: string, ...args: unknown[]): void {
    if (this.isDev) {
      console.info(this.formatMessage('info', message), ...args);
    }
  }

  public warn(message: string, ...args: unknown[]): void {
    if (this.isDev) {
      console.warn(this.formatMessage('warn', message), ...args);
    }
  }

  public error(message: string, error?: unknown, options?: LoggerOptions): void {
    if (this.isDev) {
      console.error(this.formatMessage('error', message), error || '', options?.context || '');
    }

    if (error) {
      captureException(error, {
        extra: {
          message,
          ...options?.context,
        },
      });
    }
  }
}

export const logger = new Logger();
export default logger;
