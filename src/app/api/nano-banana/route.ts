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

// İkinci geçiş: Kimlik doğruluğu/benzerliği güçlendirme (refinement)
function createFaceRefinementPrompt(): string {
  return `REFINEMENT PASS: Improve IDENTITY FIDELITY while keeping the scene unchanged.

GOAL:
- Using the USER head as the reference, ADJUST ONLY THE HEAD REGION in the CURRENT IMAGE to better match the USER's identity.
- Keep clothing, body, pose, camera angle and BACKGROUND PIXEL-PER-PIXEL unchanged.

RULES:
- Landmark Tightening: keep inter-ocular distance, nose bridge shape, philtrum length, lip curvature, cheekbone prominence within ±2% of USER.
- Preserve hairline shape and beard density; fix any mismatch at jawline or temples.
- Match skin tone/lighting/grain/DoF to the CURRENT IMAGE; do not oversharpen.
- NO changes outside the head region; strictly avoid background or garment edits.

OUTPUT:
- Photorealistic, seamless, no halos, no double edges, native resolution.`
}

// Üst giyim için prompt (sadece üst değişsin)
function createUpperOnlyPrompt(): string {
  return `Follow these rules strictly. Use the given MODEL PHOTO as the base and change ONLY THE UPPER GARMENT:

  PRIMARY GOAL:
  - Keep the model IDENTICAL: face/identity, hair, skin tone, body proportions, pose, camera angle and BACKGROUND MUST NOT change. 
  - Dress ONLY THE UPPER GARMENT using the provided CLOTHING IMAGE as the exact garment to apply; do not alter lower garment, scene or background.
  - Ensure the TOP garment is clearly and visibly changed on the model to MATCH the provided CLOTHING IMAGE (color, print/wordmarks, neckline, sleeves, silhouette, and fit must be recognizable at first glance).

  VISUAL CONSISTENCY:
  - Keep lighting/shadows, perspective and scale consistent with the model photo.
  - Fabric texture, wrinkles, seams and contact shadows must be realistic. Match neckline shape, sleeve type/length, silhouette and fit of the provided garment.
  - Apply natural masking and edge blending around arms/shoulders (no halo/edge glow).

  CONSTRAINTS:
  - Do NOT change face/hair/skin tone/body shape/BACKGROUND.
  - STRICT BACKGROUND PRESERVATION: Keep the BACKGROUND PIXEL-PER-PIXEL IDENTICAL to the model photo. Do NOT replace, blur, stylize, repaint, or alter background textures, colors, or lighting.
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

// Face swap prompt ve akışı kaldırıldı
// Face swap için prompt
function createFaceSwapPrompt(): string {
  return `TASK: Replace ONLY the HEAD (face + hair) in the TARGET MODEL photo with the USER head.

KEEP THE SCENE:
- BACKGROUND, CLOTHING, BODY SHAPE/POSE and CAMERA FRAMING must remain PIXEL-PER-PIXEL IDENTICAL.

WHAT TO CHANGE:
- Transfer the USER identity (face + hairstyle) onto the target head with correct alignment and scale.
- Harmonize to TARGET lighting and color: match skin tone and white balance to the target neck/ears; keep contrast natural.

CLEAN COMPOSITE:
- No halos, no seams, no ghost/double edges at hairline or jawline.
- Preserve strand-level hair detail and natural beard/neck transition.

CONSTRAINTS:
- Do NOT edit background or garments. Do NOT add/remove accessories.
- Keep resolution and composition unchanged.

OPTIONAL (if needed):
- Subtly correct face orientation towards a frontal look without distorting identity.`;
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
  - STRICT BACKGROUND PRESERVATION: Keep the BACKGROUND PIXEL-PER-PIXEL IDENTICAL to the model photo. Do NOT replace, blur, stylize, repaint, or alter background textures, colors, or lighting.
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

    // Face swap akışı (selfie + target model)
    if (operationType === 'faceswap') {
      if (!userImage || !targetImage) {
        return createErrorResponse('Face swap requires userImage and targetImage (base64)', 400);
      }

      // API key kontrolü
      if (!process.env.GOOGLE_VISION_API_KEY) {
        return createErrorResponse('Google Vision API key bulunamadı', 500);
      }

      const userMimeType = getMimeTypeFromBase64(userImage);
      const targetMimeType = getMimeTypeFromBase64(targetImage);

      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash-image-preview",
        generationConfig: {
          temperature: 0.05, // more deterministic for facial fidelity
          topP: 0.8,
          maxOutputTokens: 4096,
        },
      });

      const prompt = createFaceSwapPrompt();
      const contents: any[] = [
        { text: prompt },
        // TARGET MODEL first (base scene)
        { inlineData: { mimeType: targetMimeType, data: targetImage }},
        // USER FACE second
        { inlineData: { mimeType: userMimeType, data: userImage }},
        { text: 'Execute the QUALITY PIPELINE steps precisely. Keep background, clothing, and body untouched at pixel level. Output must be photorealistic with no visible seams.' }
      ];

      console.log('[NanoBanana] FaceSwap request', {
        modelLen: targetImage?.length || 0,
        userLen: userImage?.length || 0,
      });

      const result = await model.generateContent(contents);
      const response = await result.response;
      if (!response) {
        return createErrorResponse('Google Nano Banana API\'den yanıt alınamadı', 500);
      }
      const parts = response.candidates?.[0]?.content?.parts;
      if (!parts) return createErrorResponse('API yanıtında içerik bulunamadı', 500);

      let generatedImageData: string | null = null;
      for (const part of parts) {
        if (part.inlineData?.data) {
          generatedImageData = part.inlineData.data;
        }
      }
      if (!generatedImageData) {
        return createErrorResponse('Görsel oluşturulamadı (faceswap).', 500);
      }

      // Optional refinement pass to improve identity fidelity
      const doRefine = options?.refineIdentity !== false
      const refinePasses = Math.max(0, Math.min(3, Number(options?.refineIdentityPasses ?? 1)))
      if (doRefine && refinePasses > 0) {
        const refinePrompt = createFaceRefinementPrompt();
        for (let i = 0; i < refinePasses; i++) {
          const refineContents: any[] = [
            { text: refinePrompt },
            // CURRENT generated image as target/base
            { inlineData: { mimeType: 'image/png', data: generatedImageData }},
            // USER head reference
            { inlineData: { mimeType: userMimeType, data: userImage }},
            { text: `Adjust only the HEAD region to match USER identity more closely (pass ${i+1}/${refinePasses}). Keep background and clothing identical.` }
          ];

          try {
            const refineResult = await model.generateContent(refineContents);
            const refineResp = await refineResult.response;
            const refineParts = refineResp?.candidates?.[0]?.content?.parts;
            let refinedImage: string | null = null;
            if (refineParts) {
              for (const p of refineParts) {
                if (p.inlineData?.data) { refinedImage = p.inlineData.data; break; }
              }
            }
            if (refinedImage) {
              generatedImageData = refinedImage;
            } else {
              break
            }
          } catch (e) {
            console.warn('[NanoBanana] Refinement pass failed, using previous image.', { pass: i+1 }, e)
            break
          }
        }
      }

      return createSuccessResponse({
        generatedImage: generatedImageData,
        mimeType: 'image/png',
        operationType,
        processingTime: Date.now(),
        refined: doRefine,
        refinePasses
      });
    }

    // Normal try-on işlemi
    if (!modelImage || !clothingImage) {
      return createErrorResponse('Model görüntüsü ve kıyafet görüntüsü gerekli', 400);
    }

    // API key kontrolü
    if (!process.env.GOOGLE_VISION_API_KEY) {
      return createErrorResponse('Google Vision API key bulunamadı', 500);
    }

    let normalizedType = 'upper';
    let modelMimeType, clothingMimeType;

    // Normal try-on için clothingType normalizasyonu
    normalizedType = (clothingType || '').toLowerCase();
    if (normalizedType === 'single' || normalizedType === 'kıyafet') {
      // Tek parça kıyafetler için akıllı tespit: varsayılan olarak dress kabul et
      // Eğer çoklu kıyafet varsa (üst+alt), ana kıyafet upper olarak işlenir
      normalizedType = 'dress';
    } else if (['elbise', 'dress', 'tek parça elbise'].includes(normalizedType)) {
      normalizedType = 'dress';
    } else if (!['upper', 'lower', 'dress'].includes(normalizedType)) {
      normalizedType = 'dress'; // Belirsiz durumlar için dress varsayılanı
    }

    // Kullanıcı options.region ile hedef bölge seçtiyse bunu önceliklendirelim
    if (options?.region && ['upper', 'lower', 'dress'].includes(String(options.region))) {
      normalizedType = options.region as 'upper' | 'lower' | 'dress';
    }

    // Base64 stringlerden MIME tiplerini belirle
    modelMimeType = getMimeTypeFromBase64(modelImage);
    clothingMimeType = getMimeTypeFromBase64(clothingImage);

    // Gemini 2.5 Flash Image Preview modelini başlat
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-image-preview",
      generationConfig: {
        temperature: 0.2, // Detay/typography korunumu için daha stabil sonuçlar
        topP: 0.9,
        maxOutputTokens: 4096,
      },
    });

    // Debug logları
    try {
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
    } catch {}
    
    let prompt: string;
    let contents: any[] = [];
    // Ek yönergeler: fit/forceReplaceUpper
    let extraDirectives = '';
    if (options?.fit && ['normal','slim','oversize'].includes(String(options.fit))) {
      const fitLabel = String(options.fit);
      extraDirectives += `\nFIT: Apply a ${fitLabel} fit silhouette (respect realistic garment drape and proportions).`;
    }
    if (options?.forceReplaceUpper && normalizedType === 'upper') {
      extraDirectives += `\nFORCE: Always replace the UPPER garment even if the model wears a one-piece dress; remove/override the existing top portion to place the CLOTHING IMAGE as the new top.`;
    }

    {
      // Normal try-on işlemi
      const isMultiGarment = additionalClothing && additionalClothing.length > 0;
      
      if (isMultiGarment) {
      // Çoklu kıyafet için (üst+alt)
      const additionalItem = additionalClothing[0];
      // Ana kıyafet her zaman upper, ek kıyafet lower olarak işle
      const upperType = 'upper garment';
      const lowerType = 'lower garment';
      // Ana kıyafeti upper olarak ayarla
      normalizedType = 'upper';
      
      prompt = createMultiGarmentPrompt(upperType, lowerType);
      
      // İçerikleri hazırla - model + ana kıyafet + ek kıyafet
      contents = [
        { text: prompt + (extraDirectives ? `\n${extraDirectives}` : '') },
        { text: 'MODEL PHOTO (base scene): Do NOT change background, body or non-target garments.' },
        {
          inlineData: {
            mimeType: modelMimeType,
            data: modelImage
          }
        },
        { text: 'UPPER GARMENT (apply as TOP on the model exactly as shown in this image):' },
        {
          inlineData: {
            mimeType: clothingMimeType,
            data: clothingImage
          }
        },
        { text: 'LOWER GARMENT (apply as BOTTOM on the model exactly as shown in this image):' },
        {
          inlineData: {
            mimeType: getMimeTypeFromBase64(additionalItem.imageData),
            data: additionalItem.imageData
          }
        },
        { 
          text: `Apply both garments together: ${upperType} + ${lowerType}. Keep lighting/perspective consistent. Preserve logos/prints exactly.` 
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
      
      // Normalize a clear English label for type-specific hint
      const typeLabel = normalizedType === 'upper' ? 'upper garment' : normalizedType === 'lower' ? 'lower garment' : 'one-piece dress'

      contents = [
        { text: prompt + (extraDirectives ? `\n${extraDirectives}` : '') },
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
          text: `Garment type: ${typeLabel}. Use the CLOTHING IMAGE as the exact ${typeLabel} to place on the model. Keep pose, background and non-target garments unchanged. Preserve logos/prints exactly; do not add new graphics.` 
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
      console.error('[NanoBanana] Google API response boş');
      return createErrorResponse('Google Nano Banana API\'den yanıt alınamadı', 500);
    }

    console.log('[NanoBanana] API Response alındı:', {
      hasCandidates: !!response.candidates,
      candidatesLength: response.candidates?.length || 0,
      responseKeys: Object.keys(response)
    });

    // Oluşturulan görseli çıkar
    const candidates = response.candidates;
    
    if (!candidates || candidates.length === 0) {
      console.error('[NanoBanana] API yanıtında candidate bulunamadı');
      return createErrorResponse('API yanıtında görsel bulunamadı', 500);
    }

    const parts = candidates[0]?.content?.parts;
    
    if (!parts) {
      console.error('[NanoBanana] API yanıtında parts bulunamadı');
      return createErrorResponse('API yanıtında içerik bulunamadı', 500);
    }

    console.log('[NanoBanana] Parts analizi:', {
      partsLength: parts.length,
      partTypes: parts.map(p => ({
        hasText: !!p.text,
        hasInlineData: !!p.inlineData,
        textLength: p.text?.length || 0,
        dataLength: p.inlineData?.data?.length || 0
      }))
    });

    // Görsel verisini bul
    let generatedImageData: string | null = null;
    let responseText: string | null = null;

    for (const part of parts) {
      if (part.text) {
        responseText = part.text;
        console.log('[NanoBanana] Text response:', part.text.substring(0, 200) + '...');
      }
      if (part.inlineData?.data) {
        generatedImageData = part.inlineData.data;
        console.log('[NanoBanana] Image data bulundu:', {
          mimeType: part.inlineData.mimeType,
          dataLength: part.inlineData.data.length,
          dataStart: part.inlineData.data.substring(0, 50) + '...'
        });
      }
    }

    if (!generatedImageData) {
      console.error('[NanoBanana] Görsel data bulunamadı:', {
        responseText: responseText?.substring(0, 500),
        partsCount: parts.length
      });
      return createErrorResponse(
        `Görsel oluşturulamadı. API yanıtı: ${responseText || 'Bilinmeyen hata'}`, 
        500
      );
    }

    console.log('[NanoBanana] Başarılı görsel oluşturuldu:', {
      imageDataLength: generatedImageData.length,
      hasResponseText: !!responseText,
      operationType
    });

    // Başarılı yanıt döndür
    const responseData: any = {
      generatedImage: generatedImageData,
      mimeType: 'image/png',
      operationType,
      prompt: prompt,
      apiResponse: responseText,
      processingTime: Date.now()
    };

    const isMultiGarment = additionalClothing && additionalClothing.length > 0;
    responseData.clothingType = normalizedType;
    responseData.isMultiGarment = isMultiGarment;
    responseData.garmentCount = isMultiGarment ? additionalClothing.length + 1 : 1;

    return createSuccessResponse(responseData);

  } catch (error: any) {
    console.error('Google Nano Banana API Error:', error);
    
    // Specific API hatalarını yakala
    if (error.message?.includes('API_KEY')) {
      return createErrorResponse('Google Vision API key geçersiz', 401);
    }
    
    if (error.message?.includes('QUOTA_EXCEEDED') || error.status === 429) {
      return createErrorResponse('Google Vision API günlük kullanım kotası aşıldı. Lütfen yarın tekrar deneyin veya API planınızı yükseltin.', 429);
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
