import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/api/',
        '/app/',
        '/_next/',
        '/static/',
        '/*.json$',
        '/*.xml$',
      ],
    },
    sitemap: 'https://goatmaster.com/sitemap.xml',
    host: 'https://goatmaster.com',
  };
}