import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})

export async function POST(request: NextRequest) {
  try {
    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json({
        success: false,
        message: 'Replicate API token bulunamadı'
      }, { status: 500 })
    }

    const { personImage, clothingImage, category } = await request.json()

    if (!personImage || !clothingImage) {
      return NextResponse.json({
        success: false,
        message: 'Kişi fotoğrafı ve kıyafet fotoğrafı gerekli'
      }, { status: 400 })
    }

    // Virtual try-on modeli için farklı kategorilere göre model seç
    let modelVersion = ""
    
    if (category === 'upper' || category === 'tops') {
      // Üst giyim için IDM-VTON modeli
      modelVersion = "cuuupid/idm-vton:c871bb9b046607b680449ecbae55fd8c6d945e0a1948644bf2361b3d021d3ff4"
    } else if (category === 'lower' || category === 'bottoms') {
      // Alt giyim için uygun model
      modelVersion = "cuuupid/idm-vton:c871bb9b046607b680449ecbae55fd8c6d945e0a1948644bf2361b3d021d3ff4"
    } else {
      // Genel kıyafet deneme modeli
      modelVersion = "cuuupid/idm-vton:c871bb9b046607b680449ecbae55fd8c6d945e0a1948644bf2361b3d021d3ff4"
    }

    // Replicate virtual try-on modelini çalıştır
    const output = await replicate.run(
      modelVersion as `${string}/${string}` | `${string}/${string}:${string}`,
      {
        input: {
          human_img: personImage,
          garm_img: clothingImage,
          garment_des: `A ${category} clothing item for virtual try-on`
        }
      }
    )

    return NextResponse.json({
      success: true,
      message: 'Virtual try-on başarıyla tamamlandı',
      result: output,
      category: category
    })

  } catch (error) {
    console.error('Virtual try-on error:', error)
    return NextResponse.json({
      success: false,
      message: 'Virtual try-on işlemi sırasında hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 })
  }
}
