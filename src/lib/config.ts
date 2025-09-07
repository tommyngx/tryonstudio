// Uygulama konfigürasyon ayarları

export const config = {
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'TryOnX',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    version: '1.0.0',
  },
  
  // AI Servis konfigürasyonları
  ai: {
    replicate: {
      apiToken: process.env.REPLICATE_API_TOKEN,
      models: {
        virtualTryOn: 'cjwbw/clothe-anime:a1de95a0b8aae94b8c8b84e4e2c8d6a3e9f6b8c1d2e3f4a5b6c7d8e9f0a1b2c3',
        backgroundRemoval: 'cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b12e827c3c5'
      }
    },
    
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-4-vision-preview',
    },
    
    stability: {
      apiKey: process.env.STABILITY_API_KEY,
      engineId: 'stable-diffusion-xl-1024-v1-0',
    }
  },
  
  // Google Cloud Services
  google: {
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    storageBucket: process.env.GOOGLE_CLOUD_STORAGE_BUCKET,
    visionApiKey: process.env.GOOGLE_VISION_API_KEY,
  },
  
  // Cloudinary konfigürasyonu
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  
  // Dosya upload limitleri
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
    allowedFormats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    maxDimensions: {
      width: 2048,
      height: 2048,
    }
  },
  
  // API rate limiting
  rateLimit: {
    max: parseInt(process.env.API_RATE_LIMIT || '100'),
    windowMs: 15 * 60 * 1000, // 15 dakika
  },
  
  // Feature flags
  features: {
    virtualTryOn: true,
    videoGeneration: true,
    productSearch: true,
    customClothingUpload: true,
  }
} as const

// Konfigürasyon validation
export function validateConfig() {
  const errors: string[] = []
  
  if (!config.app.name) {
    errors.push('App name is required')
  }
  
  if (!config.app.url) {
    errors.push('App URL is required')
  }
  
  // Development ortamında API key kontrolü yapmıyoruz
  if (process.env.NODE_ENV === 'production') {
    if (!config.ai.replicate.apiToken) {
      errors.push('Replicate API token is required in production')
    }
    
    if (!config.google.projectId) {
      errors.push('Google Cloud Project ID is required in production')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}
