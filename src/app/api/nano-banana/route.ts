import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Google Generative AI client'ini başlat
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_VISION_API_KEY || '');

// Desteklenen dosya formatları ve MIME tipleri
const SUPPORTED_FORMATS = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
  'image/gif': ['gif'],
  'image/bmp': ['bmp']
};

// Base64 string'den dosya formatını belirle
function getMimeTypeFromBase64(base64String: string): string {
  const header = base64String.substring(0, 50);
  
  if (header.startsWith('/9j/')) return 'image/jpeg';
  if (header.startsWith('iVBOR')) return 'image/png';
  if (header.startsWith('UklGR')) return 'image/webp';
  if (header.startsWith('R0lGO')) return 'image/gif';
  if (header.startsWith('Qk')) return 'image/bmp';
  
  // Default olarak JPEG kabul et
  return 'image/jpeg';
}

// Üst giyim için prompt (sadece üst değişsin)
function createUpperOnlyPrompt(): string {
  return `Follow these rules strictly. Use the given MODEL PHOTO as the base and change ONLY THE UPPER GARMENT:

  PRIMARY GOAL:
  - Keep the model IDENTICAL: face/identity, hair, skin tone, body proportions, pose, camera angle and BACKGROUND MUST NOT change.
  - Dress ONLY THE UPPER GARMENT; do not alter lower garment, scene or background.

  VISUAL CONSISTENCY:
  - Keep lighting/shadows, perspective and scale consistent with the model photo.
  - Fabric texture, wrinkles, seams and contact shadows must be realistic.
  - Apply natural masking and edge blending around arms/shoulders (no halo/edge glow).

  CONSTRAINTS:
  - Do NOT change face/hair/skin tone/body shape/BACKGROUND.
  - Preserve EXISTING BRAND LOGOS, PRINTS, EMBROIDERY, LABELS, and GRAPHICS from the clothing image EXACTLY as they are.
  - Keep logo/print position, scale, orientation, perspective warp, and colors faithful to the clothing image; do not blur or remove them.
  - Do NOT hallucinate or add new logos/text/graphics that are not present in the clothing image.
  
  WORDMARK FIDELITY:
  - Reproduce brand wordmarks and typography EXACTLY as in the clothing image (same letters, font look, spacing/kerning).
  - No character substitutions or misspellings (e.g., "BOSS" must read exactly "BOSS", not "BOAX").
  - Ensure legibility and sharp edges on wordmarks; avoid blur, smearing, or distortion.
  - Do NOT change framing or resolution.`;
}

// Alt giyim için prompt (sadece alt değişsin)
function createLowerOnlyPrompt(): string {
  return `Follow these rules strictly. Use the given MODEL PHOTO as the base and change ONLY THE LOWER GARMENT:

  PRIMARY GOAL:
  - Keep the model IDENTICAL: face/identity, hair, skin tone, body proportions, pose, camera angle and BACKGROUND MUST NOT change.
  - Dress ONLY THE LOWER GARMENT; do not alter upper garment, scene or background.

  VISUAL CONSISTENCY:
  - Keep lighting/shadows, perspective and scale consistent with the model photo.
  - Fabric texture, wrinkles, seams and contact shadows must be realistic.
  - Apply natural masking and edge blending around waist/hips/knee areas.

  CONSTRAINTS:
  - Do NOT change face/hair/skin tone/body shape/BACKGROUND.
  - Preserve EXISTING BRAND LOGOS, PRINTS, EMBROIDERY, LABELS, and GRAPHICS from the clothing image EXACTLY as they are.
  - Keep logo/print position, scale, orientation, perspective warp, and colors faithful to the clothing image; do not blur or remove them.
  - Do NOT hallucinate or add new logos/text/graphics that are not present in the clothing image.
  - Do NOT change framing or resolution.`;
}

// Tek parça elbise (dress) için prompt (tam gövde elbise değişimi / yekpare)
function createDressPrompt(): string {
  return `Follow these rules strictly. Use the given MODEL PHOTO as the base and dress a ONE-PIECE DRESS:

  PRIMARY GOAL:
  - Keep the model IDENTICAL: face/identity, hair, skin tone, body proportions, pose, camera angle and BACKGROUND MUST NOT change.
  - The one-piece dress should naturally fit the body, remaining consistent from top to bottom.

  VISUAL CONSISTENCY:
  - Keep lighting/shadows, perspective and scale consistent with the model photo.
  - Fabric behavior and wrinkles must be realistic; produce natural transitions and contact shadows at shoulders/waist/hips/hemline.

  CONSTRAINTS:
  - Do NOT change face/hair/skin tone/body shape/BACKGROUND.
  - Preserve EXISTING BRAND LOGOS, PRINTS, EMBROIDERY, LABELS, and GRAPHICS from the clothing image EXACTLY as they are.
  - Keep logo/print position, scale, orientation, perspective warp, and colors faithful to the clothing image; do not blur or remove them.
  - Do NOT hallucinate or add new logos/text/graphics that are not present in the clothing image.
  - Do NOT change framing or resolution.`;
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

// Çoklu kıyafet (üst+alt) için özel prompt oluştur
function createMultiGarmentPrompt(upperType: string, lowerType: string): string {
  return `Follow these rules strictly. Use the given MODEL PHOTO as the base and dress both ${upperType} and ${lowerType}:

  PRIMARY GOAL:
  - Keep the model IDENTICAL: face/identity, hair, skin tone, body proportions, pose, camera angle and BACKGROUND MUST NOT change.
  - Dress the garments only; do not alter the scene, background, or add accessories.

  VISUAL CONSISTENCY:
  - ${upperType} and ${lowerType} must look coordinated and consistent together.
  - Natural transitions at waist/hips/shoulders, realistic fabric behavior and contact shadows.
  - Perspective, scale, lighting consistent with the model photo.

  CONSTRAINTS:
  - Do NOT change face/hair/skin tone/body shape/BACKGROUND.
  - Preserve EXISTING BRAND LOGOS, PRINTS, EMBROIDERY, LABELS, and GRAPHICS from the clothing images EXACTLY as they are for each garment.
  - Keep logo/print position, scale, orientation, perspective warp, and colors faithful to each clothing image; do not blur or remove them.
  - Do NOT hallucinate or add new logos/text/graphics that are not present in the clothing images.
  
  WORDMARK FIDELITY:
  - Reproduce brand wordmarks and typography EXACTLY as in the clothing images (same letters, font look, spacing/kerning).
  - No character substitutions or misspellings (e.g., "BOSS" must read exactly "BOSS", not "BOAX").
  - Ensure legibility and sharp edges on wordmarks; avoid blur, smearing, or distortion.
  - Do NOT change framing or resolution.

  GOAL:
  - A professional product-shoot quality full outfit; both ${upperType} and ${lowerType} should appear clearly and naturally on the model.`;
}

// Hata yanıtı oluştur
function createErrorResponse(message: string, status: number = 500) {
  return NextResponse.json(
    { 
      success: false, 
      error: message,
      timestamp: new Date().toISOString()
    }, 
    { status }
  );
}

// Başarılı yanıt oluştur
function createSuccessResponse(data: any) {
  return NextResponse.json({
    success: true,
    data,
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  try {
    // İstek gövdesini parse et
    const body = await request.json();
    const { 
      modelImage, 
      clothingImage, 
      clothingType = 'kıyafet', 
      additionalClothing = [], // Çoklu kıyafet için ek kıyafetler
      options = {},
      // Face swap parametreleri
      userImage, // Face swap için kullanıcı fotoğrafı
      targetImage, // Face swap için hedef model
      operationType = 'tryon' // 'tryon' veya 'faceswap'
    } = body;

    // İşlem tipine göre gerekli alanları kontrol et
    if (operationType === 'faceswap') {
      if (!userImage || !targetImage) {
        return createErrorResponse('Face swap için kullanıcı fotoğrafı ve hedef model gerekli', 400);
      }
    } else {
      // Normal try-on işlemi
      if (!modelImage || !clothingImage) {
        return createErrorResponse('Model görüntüsü ve kıyafet görüntüsü gerekli', 400);
      }
    }

    // API key kontrolü
    if (!process.env.GOOGLE_VISION_API_KEY) {
      return createErrorResponse('Google Vision API key bulunamadı', 500);
    }

    let normalizedType = 'upper'; // Face swap için varsayılan
    let modelMimeType, clothingMimeType, userMimeType, targetMimeType;

    if (operationType === 'faceswap') {
      // Face swap için MIME tipleri
      userMimeType = getMimeTypeFromBase64(userImage);
      targetMimeType = getMimeTypeFromBase64(targetImage);
    } else {
      // Normal try-on için clothingType normalizasyonu
      normalizedType = (clothingType || '').toLowerCase();
      if (normalizedType === 'single' || normalizedType === 'kıyafet') {
        normalizedType = 'upper';
      } else if (['elbise', 'dress', 'tek parça elbise'].includes(normalizedType)) {
        normalizedType = 'dress';
      } else if (!['upper', 'lower', 'dress'].includes(normalizedType)) {
        normalizedType = 'upper';
      }

      // Base64 stringlerden MIME tiplerini belirle
      modelMimeType = getMimeTypeFromBase64(modelImage);
      clothingMimeType = getMimeTypeFromBase64(clothingImage);
    }

    // Gemini 2.5 Flash Image Preview modelini başlat
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-image-preview",
      generationConfig: {
        temperature: 0.2, // Detay/typography korunumu için daha stabil sonuçlar
        topP: 0.9,
        maxOutputTokens: 4096,
      },
    });

    // İşlem tipine göre debug logları
    try {
      if (operationType === 'faceswap') {
        console.log('[NanoBanana] Face swap request', {
          operationType,
          userImageLen: userImage?.length || 0,
          targetImageLen: targetImage?.length || 0
        });
      } else {
        const isMultiGarment = additionalClothing && additionalClothing.length > 0;
        console.log('[NanoBanana] Try-on request', {
          operationType,
          clothingTypeRaw: clothingType,
          clothingType: normalizedType,
          modelLen: modelImage?.length || 0,
          clothingLen: clothingImage?.length || 0,
          isMultiGarment,
          additionalCount: additionalClothing?.length || 0
        });
      }
    } catch {}
    
    let prompt: string;
    let contents: any[] = [];

    if (operationType === 'faceswap') {
      // Face swap işlemi
      prompt = createFaceSwapPrompt();
      
      contents = [
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
          text: `Face swap işlemi: İlk fotoğraftaki yüzü ikinci fotoğraftaki modelin üzerine doğal şekilde yerleştir.` 
        }
      ];
    } else {
      // Normal try-on işlemi
      const isMultiGarment = additionalClothing && additionalClothing.length > 0;
      
      if (isMultiGarment) {
      // Çoklu kıyafet için (üst+alt)
      const additionalItem = additionalClothing[0];
      const upperType = normalizedType === 'upper' ? 'upper garment' : 'lower garment';
      const lowerType = normalizedType === 'upper' ? 'lower garment' : 'upper garment';
      
      prompt = createMultiGarmentPrompt(upperType, lowerType);
      
      // İçerikleri hazırla - model + ana kıyafet + ek kıyafet
      contents = [
        { text: prompt },
        {
          inlineData: {
            mimeType: modelMimeType,
            data: modelImage
          }
        },
        {
          inlineData: {
            mimeType: clothingMimeType,
            data: clothingImage
          }
        },
        {
          inlineData: {
            mimeType: getMimeTypeFromBase64(additionalItem.imageData),
            data: additionalItem.imageData
          }
        },
        { 
          text: `Çoklu kıyafet kombinasyonu: ${upperType} + ${lowerType}. Her iki kıyafeti birlikte uyumlu şekilde göster.` 
        }
      ];
    } else {
      // Tek kıyafet için tür bazlı prompt
      if (normalizedType === 'upper') {
        prompt = createUpperOnlyPrompt();
      } else if (normalizedType === 'lower') {
        prompt = createLowerOnlyPrompt();
      } else {
        // 'dress'
        prompt = createDressPrompt();
      }
      
      contents = [
        { text: prompt },
        {
          inlineData: {
            mimeType: modelMimeType,
            data: modelImage
          }
        },
        {
          inlineData: {
            mimeType: clothingMimeType,
            data: clothingImage
          }
        },
        { 
          text: `Kıyafet tipi: ${clothingType}. Lütfen bu kıyafeti modelin üzerinde doğal ve gerçekçi bir şekilde göster.` 
        }
      ];
      }
    }

    // Google Nano Banana API çağrısını yap
    console.log('Google Nano Banana API çağrısı başlatılıyor...');
    
    const result = await model.generateContent(contents);
    const response = await result.response;

    // Yanıtı işle
    if (!response) {
      return createErrorResponse('Google Nano Banana API\'den yanıt alınamadı', 500);
    }

    // Oluşturulan görseli çıkar
    const candidates = response.candidates;
    
    if (!candidates || candidates.length === 0) {
      return createErrorResponse('API yanıtında görsel bulunamadı', 500);
    }

    const parts = candidates[0]?.content?.parts;
    
    if (!parts) {
      return createErrorResponse('API yanıtında içerik bulunamadı', 500);
    }

    // Görsel verisini bul
    let generatedImageData: string | null = null;
    let responseText: string | null = null;

    for (const part of parts) {
      if (part.text) {
        responseText = part.text;
      }
      if (part.inlineData?.data) {
        generatedImageData = part.inlineData.data;
      }
    }

    if (!generatedImageData) {
      return createErrorResponse(
        `Görsel oluşturulamadı. API yanıtı: ${responseText || 'Bilinmeyen hata'}`, 
        500
      );
    }

    // Başarılı yanıt döndür
    const responseData: any = {
      generatedImage: generatedImageData,
      mimeType: 'image/png',
      operationType,
      prompt: prompt,
      apiResponse: responseText,
      processingTime: Date.now()
    };

    if (operationType === 'faceswap') {
      responseData.swappedImage = generatedImageData; // Face swap için alias
      responseData.meta = {
        model: 'gemini-2.5-flash-image-preview',
        timestamp: new Date().toISOString()
      };
    } else {
      const isMultiGarment = additionalClothing && additionalClothing.length > 0;
      responseData.clothingType = normalizedType;
      responseData.isMultiGarment = isMultiGarment;
      responseData.garmentCount = isMultiGarment ? additionalClothing.length + 1 : 1;
    }

    return createSuccessResponse(responseData);

  } catch (error: any) {
    console.error('Google Nano Banana API Error:', error);
    
    // Specific API hatalarını yakala
    if (error.message?.includes('API_KEY')) {
      return createErrorResponse('Google Vision API key geçersiz', 401);
    }
    
    if (error.message?.includes('QUOTA_EXCEEDED')) {
      return createErrorResponse('API kullanım kotası aşıldı', 429);
    }
    
    if (error.message?.includes('INVALID_ARGUMENT')) {
      return createErrorResponse('Geçersiz görsel formatı veya boyutu', 400);
    }

    // Genel hata
    return createErrorResponse(
      `Virtual try-on işlemi başarısız: ${error.message || 'Bilinmeyen hata'}`,
      500
    );
  }
}

// GET endpoint'i - API durumu kontrolü
export async function GET() {
  return NextResponse.json({
    service: 'Google Nano Banana Virtual Try-On API',
    status: 'active',
    supportedFormats: Object.keys(SUPPORTED_FORMATS),
    model: 'gemini-2.5-flash-image-preview',
    timestamp: new Date().toISOString()
  });
}
