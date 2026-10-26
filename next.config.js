import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || (process.env.NODE_ENV === 'production' ? '.next-build' : '.next'),
  turbopack: {
    root: __dirname,
  },
  allowedDevOrigins: ['192.168.8.202'],
  async headers() {
    return [
      { source: '/:path*', headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
      ] },
      { source: '/api/:path*', headers: [{ key: 'Cache-Control', value: 'private, no-store' }] },
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        ],
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/offline',
        destination: '/offline.html',
      },
    ]
  },
}

export default nextConfig
