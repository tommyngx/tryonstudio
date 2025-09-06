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

// Tek kıyafet için virtual try-on prompt'u oluştur
function createSingleTryOnPrompt(clothingType: string = 'kıyafet'): string {
  return `Bu ${clothingType}u modelin üzerinde doğal ve gerçekçi bir şekilde göster. 
  Kıyafetin model üzerindeki görünümünü, kırışıklıkları, gölgeleri ve ışık-gölge etkilerini 
  doğru bir şekilde yansıt. Modelin vücut hatları ve duruşunu koruyarak, 
  kıyafetin ona uygun olduğunu göster. Sonuç profesyonel bir ürün fotoğrafı kalitesinde olsun.`;
}

// Çoklu kıyafet (üst+alt) için özel prompt oluştur
function createMultiGarmentPrompt(upperType: string, lowerType: string): string {
  return `Bu modelin üzerinde hem üst giyim (${upperType}) hem de alt giyim (${lowerType}) 
  birlikte doğal ve uyumlu bir şekilde göster. 
  
  ÖNEMLİ KURALLAR:
  - İki kıyafet de aynı anda modelin üzerinde görünmeli
  - Üst giyim ve alt giyim arasında doğal bir geçiş olmalı
  - Kıyafetlerin renkleri ve stilleri uyumlu görünmeli
  - Her iki kıyafetin de kırışıklıkları, gölgeleri ve ışık etkilerini doğru yansıt
  - Modelin vücut hatları korunmalı ve kıyafetler ona tam uymalı
  - Sonuç komple bir outfit görüntüsü olmalı, profesyonel ürün fotoğrafı kalitesinde
  - Kıyafetler birbirini tamamlamalı ve tek bir koordineli görünüm oluşturmalı
  
  Lütfen tam vücut görüntüsü oluştur, hem üst hem alt kıyafet tamamen görünür olsun.`;
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
      options = {} 
    } = body;

    // Gerekli alanları kontrol et
    if (!modelImage || !clothingImage) {
      return createErrorResponse('Model görüntüsü ve kıyafet görüntüsü gerekli', 400);
    }

    // API key kontrolü
    if (!process.env.GOOGLE_VISION_API_KEY) {
      return createErrorResponse('Google Vision API key bulunamadı', 500);
    }

    // Base64 stringlerden MIME tiplerini belirle
    const modelMimeType = getMimeTypeFromBase64(modelImage);
    const clothingMimeType = getMimeTypeFromBase64(clothingImage);

    // Gemini 2.5 Flash Image Preview modelini başlat
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-image-preview",
      generationConfig: {
        temperature: 0.3, // Çoklu kıyafet için daha düşük temperature
        topP: 0.9,
        maxOutputTokens: 4096,
      },
    });

    // Çoklu kıyafet mi tek kıyafet mi kontrol et
    const isMultiGarment = additionalClothing && additionalClothing.length > 0;
    
    let prompt: string;
    let contents: any[] = [];

    if (isMultiGarment) {
      // Çoklu kıyafet için (üst+alt)
      const additionalItem = additionalClothing[0];
      const upperType = clothingType === 'upper' ? 'üst giyim' : 'alt giyim';
      const lowerType = clothingType === 'upper' ? 'alt giyim' : 'üst giyim';
      
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
      // Tek kıyafet için
      prompt = createSingleTryOnPrompt(clothingType);
      
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
    return createSuccessResponse({
      generatedImage: generatedImageData,
      mimeType: 'image/png', // Nano Banana genellikle PNG döndürür
      clothingType,
      isMultiGarment, // Çoklu kıyafet mi belirtir
      garmentCount: isMultiGarment ? additionalClothing.length + 1 : 1,
      prompt: prompt,
      apiResponse: responseText,
      processingTime: Date.now()
    });

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
