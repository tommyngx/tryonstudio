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

    const { sourceImage, targetImage } = await request.json()

    if (!sourceImage || !targetImage) {
      return NextResponse.json({
        success: false,
        message: 'Kaynak ve hedef görüntü gerekli'
      }, { status: 400 })
    }

    // Replicate face swap modelini çalıştır
    const output = await replicate.run(
      "yan-ops/face_swap:d5900f9ebed33e7ae6ba1d22931d3d6ac1b84cbc24c9af6736b71de1a09029ed",
      {
        input: {
          source_image: sourceImage,
          target_image: targetImage
        }
      }
    )

    return NextResponse.json({
      success: true,
      message: 'Face swap başarıyla tamamlandı',
      result: output
    })

  } catch (error) {
    console.error('Face swap error:', error)
    return NextResponse.json({
      success: false,
      message: 'Face swap işlemi sırasında hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 })
  }
}
