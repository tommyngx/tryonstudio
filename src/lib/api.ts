// API client functions for AI services

export interface UploadResponse {
  success: boolean
  message: string
  url?: string
  filename?: string
}

export interface AIResponse {
  success: boolean
  message: string
  result?: string | string[]
  error?: string
}

/**
 * Dosya yükleme API'si
 */
export async function uploadImage(file: File): Promise<UploadResponse> {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })

    const data = await response.json()
    return data
  } catch (error) {
    return {
      success: false,
      message: 'Yükleme sırasında hata oluştu',
    }
  }
}

// Face swap helper kaldırıldı

/**
 * Virtual try-on API'si
 */
export async function performVirtualTryOn(
  personImage: string, 
  clothingImage: string, 
  category: 'upper' | 'lower' | 'dress'
): Promise<AIResponse> {
  try {
    const response = await fetch('/api/ai/virtual-tryon', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personImage,
        clothingImage,
        category
      })
    })

    const data = await response.json()
    return data
  } catch (error) {
    return {
      success: false,
      message: 'Virtual try-on işlemi sırasında hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }
  }
}

/**
 * Video generation API'si
 */
export async function generateVideo(
  inputImage: string, 
  prompt: string = '360 degree rotation view', 
  duration: number = 3
): Promise<AIResponse> {
  try {
    const response = await fetch('/api/ai/video-generation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputImage,
        prompt,
        duration
      })
    })

    const data = await response.json()
    return data
  } catch (error) {
    return {
      success: false,
      message: 'Video oluşturma işlemi sırasında hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }
  }
}

/**
 * Base64 string'den File objesi oluşturur
 */
export function base64ToFile(base64: string, filename: string): File {
  const byteString = atob(base64.split(',')[1])
  const mimeString = base64.split(',')[0].split(':')[1].split(';')[0]
  
  const ab = new ArrayBuffer(byteString.length)
  const ia = new Uint8Array(ab)
  
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i)
  }
  
  return new File([ab], filename, { type: mimeString })
}

/**
 * URL'den tam path oluşturur
 */
export function getFullImageUrl(url: string): string {
  if (url.startsWith('http')) {
    return url
  }
  
  // Relative URL'i tam URL'e çevir
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  return `${baseUrl}${url}`
}
