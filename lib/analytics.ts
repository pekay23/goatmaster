import posthog from 'posthog-js';

const posthogClient = posthog.init(
  process.env.NEXT_PUBLIC_POSTHOG_KEY || '',
  {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
    capture_pageview: typeof window !== 'undefined',
  },
);

export { posthogClient as posthog };

export function track(event: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  posthog.capture(event, properties);
}

export function identify(userId: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  posthog.identify(userId, properties);
}
