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

    const { inputImage, prompt, duration = 3 } = await request.json()

    if (!inputImage) {
      return NextResponse.json({
        success: false,
        message: 'Giriş görüntüsü gerekli'
      }, { status: 400 })
    }

    // 360° video generation için Stable Video Diffusion kullan
    const output = await replicate.run(
      "stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb1a4c447e7cf83e5b4933c30c460df3631f95dd33",
      {
        input: {
          cond_aug: 0.02,
          decoding_t: 7,
          input_image: inputImage,
          video_length: duration === 3 ? "14_frames_with_svd" : "25_frames_with_svd_xt",
          sizing_strategy: "maintain_aspect_ratio",
          motion_bucket_id: 127,
          fps: 6
        }
      }
    )

    return NextResponse.json({
      success: true,
      message: '360° video başarıyla oluşturuldu',
      result: output,
      duration: duration
    })

  } catch (error) {
    console.error('Video generation error:', error)
    return NextResponse.json({
      success: false,
      message: 'Video oluşturma işlemi sırasında hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 })
  }
}
