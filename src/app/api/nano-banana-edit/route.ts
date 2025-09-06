import { NextResponse } from 'next/server'

// Basit bir stub: gelen baseImage (base64), prompt ve strength bilgilerini alır
// Demo amaçlı aynı görseli geri döndürür ve süre/model bilgisi simüle eder

export async function POST(req: Request) {
  try {
    const started = Date.now()
    const body = await req.json()
    const { baseImage, prompt = '', strength = 0.6 } = body || {}

    if (!baseImage || typeof baseImage !== 'string') {
      return NextResponse.json({ success: false, error: 'baseImage (base64) gereklidir' }, { status: 400 })
    }

    // Burada gerçek AI servis entegrasyonu yapılabilir
    // Şimdilik sadece gecikme simülasyonu yapalım
    await new Promise((r) => setTimeout(r, 700 + Math.random() * 600))

    const durationMs = Date.now() - started

    return NextResponse.json({
      success: true,
      data: {
        generatedImage: baseImage, // demo: aynı görsel
        meta: {
          prompt,
          strength,
          durationMs,
          model: 'edit-stub-v1'
        }
      }
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Bilinmeyen hata' }, { status: 500 })
  }
}
