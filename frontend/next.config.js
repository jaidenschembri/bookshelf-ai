/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'covers.openlibrary.org', 
      'lh3.googleusercontent.com',
      'localhost:8000',
      'bookshelf-ai-production.up.railway.app',
      // Supabase Storage domains - replace with your actual Supabase URL
      'your-project.supabase.co',
      'supabase.co'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig 