import posthog from 'posthog-js';

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

if (typeof window !== 'undefined' && posthogKey) {
  posthog.init(posthogKey, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
    capture_pageview: true,
  });
}

export { posthog };

export function track(event: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined' || !posthogKey) return;
  posthog.capture(event, properties);
}

export function identify(userId: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined' || !posthogKey) return;
  posthog.identify(userId, properties);
}
