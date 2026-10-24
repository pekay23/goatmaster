import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://goatmaster.com';
  
  const staticRoutes = [
    '',
    '/about',
    '/blog',
    '/pricing',
    '/features',
    '/contact',
    '/login',
    '/signup',
    '/legal/privacy',
    '/legal/terms',
    '/legal/cookies',
    '/legal/dpa',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  const blogRoutes = [
    '/blog/getting-started',
    '/blog/offline-first-architecture',
    '/blog/ai-goat-recognition',
    '/blog/breeding-best-practices',
    '/blog/feed-optimization',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...blogRoutes];
}