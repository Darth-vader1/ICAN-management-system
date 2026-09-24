import * as Sentry from '@sentry/react';
import { env } from './env';

export const initSentry = (): void => {
  if (!env.sentryDsn) return;

  Sentry.init({
    dsn: env.sentryDsn,
    environment: env.app.env,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: env.isProduction ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
};

export const captureException = (error: unknown, context?: Record<string, unknown>): void => {
  if (env.sentryDsn) {
    Sentry.captureException(error, context);
  } else {
    console.error('Captured Exception (Sentry disabled):', error, context);
  }
};
