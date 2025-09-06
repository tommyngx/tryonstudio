import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Face swap API endpoint - Google Nano Banana modeli kullanır
// Kullanıcının yüzünü manken modelin yüzü ile değiştirir

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_VISION_API_KEY || '')

// Base64 string'den MIME tipini belirle
function getMimeTypeFromBase64(base64String: string): string {
  const header = base64String.substring(0, 50);
  
  if (header.startsWith('/9j/')) return 'image/jpeg';
  if (header.startsWith('iVBOR')) return 'image/png';
  if (header.startsWith('UklGR')) return 'image/webp';
  if (header.startsWith('R0lGO')) return 'image/gif';
  if (header.startsWith('Qk')) return 'image/bmp';
  
  return 'image/jpeg'; // Default
}

// Face swap için özel prompt
function createFaceSwapPrompt(): string {
  return `Follow these rules strictly for FACE SWAP operation:

  PRIMARY GOAL:
  - Take the FACE from the first image (user photo) and seamlessly place it on the second image (target model)
  - Keep the target model's body, pose, clothing, background, and scene EXACTLY the same
  - Only replace the face/head area with natural blending

  FACE SWAP REQUIREMENTS:
  - Preserve the user's facial features, skin tone, and facial structure
  - Match lighting, shadows, and perspective of the target image
  - Ensure natural edge blending around face/neck/hairline
  - Keep the target's hair, clothing, body proportions, and background unchanged

  VISUAL CONSISTENCY:
  - Maintain the target image's lighting conditions and camera angle
  - Apply realistic shadows and highlights to the swapped face
  - Ensure skin tone consistency and natural transitions
  - No visible seams, halos, or artificial edges

  CONSTRAINTS:
  - Do NOT change the target's body, clothing, pose, or background
  - Do NOT alter the target's hair unless it overlaps with face area
  - Do NOT add accessories, makeup, or modify facial expressions drastically
  - Do NOT change image resolution, framing, or composition`;
}

export async function POST(request: NextRequest) {
  try {
    // Request body'yi parse et
    const body = await request.json()
    const { userImage, targetImage, swapStrength = 1.0 } = body

    // Gerekli parametreleri kontrol et
    if (!userImage || !targetImage) {
      return NextResponse.json({
        success: false,
        error: 'Kullanıcı fotoğrafı ve hedef model fotoğrafı gereklidir'
      }, { status: 400 })
    }

    // API key kontrolü
    if (!process.env.GOOGLE_VISION_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Google Vision API key bulunamadı'
      }, { status: 500 })
    }

    // Debug logları - güvenli şekilde uzunluk bilgisi
    console.log('[Face Swap] API çağrısı başlatılıyor', {
      userImageLength: userImage?.length || 0,
      targetImageLength: targetImage?.length || 0,
      swapStrength,
      timestamp: new Date().toISOString()
    })

    // MIME tiplerini belirle
    const userMimeType = getMimeTypeFromBase64(userImage)
    const targetMimeType = getMimeTypeFromBase64(targetImage)

    // Gemini 2.5 Flash Image Preview modelini başlat
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-image-preview",
      generationConfig: {
        temperature: 0.2, // Face swap için düşük temperature
        topP: 0.8,
        maxOutputTokens: 4096,
      },
    })

    const prompt = createFaceSwapPrompt()

    // İçerikleri hazırla
    const contents = [
      { text: prompt },
      {
        inlineData: {
          mimeType: userMimeType,
          data: userImage
        }
      },
      {
        inlineData: {
          mimeType: targetMimeType,
          data: targetImage
        }
      },
      { 
        text: `Face swap işlemi: İlk fotoğraftaki yüzü ikinci fotoğraftaki modelin üzerine doğal şekilde yerleştir. Swap gücü: ${swapStrength}` 
      }
    ]

    // Google Nano Banana API çağrısını yap
    console.log('[Face Swap] Google Nano Banana API çağrısı başlatılıyor...')
    
    const result = await model.generateContent(contents)
    const response = await result.response

    // Yanıtı işle
    if (!response) {
      return NextResponse.json({
        success: false,
        error: 'Google Nano Banana API\'den yanıt alınamadı'
      }, { status: 500 })
    }

    // Oluşturulan görseli çıkar
    const candidates = response.candidates
    
    if (!candidates || candidates.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'API yanıtında görsel bulunamadı'
      }, { status: 500 })
    }

    const parts = candidates[0]?.content?.parts
    
    if (!parts) {
      return NextResponse.json({
        success: false,
        error: 'API yanıtında içerik bulunamadı'
      }, { status: 500 })
    }

    // Görsel verisini bul
    let generatedImageData: string | null = null
    let responseText: string | null = null

    for (const part of parts) {
      if (part.text) {
        responseText = part.text
      }
      if (part.inlineData?.data) {
        generatedImageData = part.inlineData.data
      }
    }

    if (!generatedImageData) {
      return NextResponse.json({
        success: false,
        error: `Face swap işlemi başarısız. API yanıtı: ${responseText || 'Bilinmeyen hata'}`
      }, { status: 500 })
    }

    console.log('[Face Swap] İşlem başarılı', {
      responseLength: generatedImageData?.length || 0,
      hasText: !!responseText
    })

    // Başarılı yanıt
    return NextResponse.json({
      success: true,
      swappedImage: generatedImageData,
      meta: {
        swapStrength,
        model: 'gemini-2.5-flash-image-preview',
        timestamp: new Date().toISOString(),
        processingTime: Date.now(),
        apiResponse: responseText
      }
    })

  } catch (error: any) {
    console.error('[Face Swap] API hatası:', error)
    
    // Hata türüne göre özel mesajlar
    let errorMessage = 'Face swap işlemi başarısız oldu'
    
    if (error.message?.includes('API_KEY')) {
      errorMessage = 'Google Vision API key geçersiz'
    } else if (error.message?.includes('QUOTA_EXCEEDED')) {
      errorMessage = 'API kullanım kotası aşıldı'
    } else if (error.message?.includes('INVALID_ARGUMENT')) {
      errorMessage = 'Geçersiz görsel formatı veya boyutu'
    } else if (error.message?.includes('face')) {
      errorMessage = 'Fotoğrafta yüz algılanamadı'
    }

    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

// GET endpoint - API durumu kontrolü
export async function GET() {
  return NextResponse.json({
    service: 'Face Swap API',
    model: 'gemini-2.5-flash-image-preview',
    status: 'active',
    version: '1.0.0',
    provider: 'Google Nano Banana',
    timestamp: new Date().toISOString()
  })
}
