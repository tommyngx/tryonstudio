/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: [
      'localhost',
      'storage.googleapis.com',
      'res.cloudinary.com',
      'replicate.delivery',
      'pbxt.replicate.delivery'
    ],
    formats: ['image/webp', 'image/avif'],
  },
  // API dosyalarının boyut limitini artır (AI generated images için)
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: '10mb',
  },
  // Build optimizasyonları
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Runtime konfigürasyonu
  serverRuntimeConfig: {
    // Sadece server tarafında erişilebilir
  },
  publicRuntimeConfig: {
    // Hem server hem client tarafında erişilebilir
    appName: 'TryOnX',
  },
}

module.exports = nextConfig
