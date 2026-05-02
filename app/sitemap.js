export default function sitemap() {
  const base = 'https://goatmaster-tau.vercel.app';
  const now = new Date();
  return [
    { url: base,                       lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${base}/legal/privacy`,    lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/legal/terms`,      lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ];
}
