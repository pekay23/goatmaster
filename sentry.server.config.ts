import * as Sentry from "@sentry/nextjs";

const sentry = {
  dsn: process.env.SENTRY_DSN || "",
  tracesSampleRate: 1.0,
};

export default sentry;

export function initServer(options = {}) {
  if (!sentry.dsn) return;
  Sentry.init({
    ...sentry,
    ...options,
  });
}
