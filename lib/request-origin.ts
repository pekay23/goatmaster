// Next.js can normalize a LAN request URL to localhost in development.
// Host still identifies the authority the browser actually requested.
export function allowsMutationOrigin(headers: Headers, requestUrl: Pick<URL,'protocol'|'origin'>): boolean {
  if (headers.get('sec-fetch-site') === 'cross-site') return false;
  const origin = headers.get('origin');
  if (!origin) return true;
  try {
    const host = headers.get('host');
    const target = host ? new URL(requestUrl.protocol + '//' + host) : requestUrl;
    const source = new URL(origin);
    return ['http:', 'https:'].includes(source.protocol) && source.origin === origin && source.origin === target.origin;
  } catch {
    return false;
  }
}
