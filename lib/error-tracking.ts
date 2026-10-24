import * as Sentry from '@sentry/nextjs';

export function captureException(error: unknown, context?: Record<string, unknown>) {
  if (typeof window === 'undefined') {
    Sentry.captureException(error, { contexts: { app: context } });
    return;
  }
  Sentry.captureException(error, { contexts: { app: context } });
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, unknown>) {
  Sentry.captureMessage(message, { level, contexts: { app: context } });
}

export function setUser(user: { id: string; email?: string; username?: string }) {
  Sentry.setUser(user);
}

export function setTag(key: string, value: string) {
  Sentry.setTag(key, value);
}

export function setContext(name: string, context: Record<string, unknown>) {
  Sentry.setContext(name, context);
}
