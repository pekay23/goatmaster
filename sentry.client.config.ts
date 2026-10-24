import * as Sentry from "@sentry/nextjs";

const sentry = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "",
  enabled: process.env.NEXT_PUBLIC_SENTRY_DSN ? true : process.env.NODE_ENV === "production",
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
};

export default sentry;

export function initClient(options = {}) {
  if (!sentry.dsn) return;
  Sentry.init({
    ...sentry,
    ...options,
  });
}
