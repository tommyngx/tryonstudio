/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Next 14: use remotePatterns instead of deprecated images.domains
    remotePatterns: [
      // Local dev assets
      { protocol: 'http', hostname: 'localhost', pathname: '**' },
      // Google Cloud Storage
      { protocol: 'https', hostname: 'storage.googleapis.com', pathname: '**' },
      // Cloudinary
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '**' },
      // Replicate delivery
      { protocol: 'https', hostname: 'replicate.delivery', pathname: '**' },
      { protocol: 'https', hostname: 'pbxt.replicate.delivery', pathname: '**' },
    ],
    formats: ['image/webp', 'image/avif'],
  },
  // Build optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
}

module.exports = nextConfig
