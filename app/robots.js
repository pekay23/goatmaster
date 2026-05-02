export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/_next/'] }],
    sitemap: 'https://goatmaster-tau.vercel.app/sitemap.xml',
  };
}
