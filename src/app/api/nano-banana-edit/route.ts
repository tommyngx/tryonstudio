import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Simple image editing via Gemini Image model: takes base image + prompt and returns edited image

function getMimeTypeFromBase64(base64String: string): string {
  const header = base64String.substring(0, 50)
  if (header.startsWith('/9j/')) return 'image/jpeg'
  if (header.startsWith('iVBOR')) return 'image/png'
  if (header.startsWith('UklGR')) return 'image/webp'
  if (header.startsWith('R0lGO')) return 'image/gif'
  if (header.startsWith('Qk')) return 'image/bmp'
  return 'image/jpeg'
}

export async function POST(req: Request) {
  try {
    const started = Date.now()
    const body = await req.json()
    const { baseImage, prompt = '', strength = 0.6 } = body || {}

    if (!baseImage || typeof baseImage !== 'string') {
      return NextResponse.json({ success: false, error: 'baseImage (base64) is required' }, { status: 400 })
    }

    if (!process.env.GOOGLE_VISION_API_KEY) {
      return NextResponse.json({ success: false, error: 'GOOGLE_VISION_API_KEY missing' }, { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_VISION_API_KEY || '')
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-image-preview',
      generationConfig: {
        temperature: Math.max(0, Math.min(1, 0.15 + (strength - 0.5) * 0.3)),
        topP: 0.9,
        maxOutputTokens: 4096,
      },
    })

    const baseMime = getMimeTypeFromBase64(baseImage)

    // Build editing instruction with safety and preservation constraints
    const instruction = `Edit the given MODEL PHOTO according to the user prompt while preserving identity, pose, camera angle and background.

Constraints:
- DO NOT change face/identity, hair, skin tone, body shape or the BACKGROUND.
- Apply only the requested changes. Keep framing and resolution.
- Ensure realistic lighting, shadows, perspective and fabric behavior.

User prompt: ${prompt}`

    // Safe debug log
    try {
      console.log('[NB-EDIT] Incoming edit', {
        baseLen: baseImage?.length || 0,
        promptLen: prompt?.length || 0,
        strength,
      })
    } catch {}

    const result = await model.generateContent([
      { text: instruction },
      {
        inlineData: {
          mimeType: baseMime,
          data: baseImage,
        },
      },
    ])

    const response = await result.response
    if (!response) {
      return NextResponse.json({ success: false, error: 'No response from Gemini' }, { status: 500 })
    }

    const candidates: any[] = (response as any).candidates
    if (!candidates || candidates.length === 0) {
      return NextResponse.json({ success: false, error: 'No candidates in response' }, { status: 500 })
    }

    const parts = candidates[0]?.content?.parts
    let generatedImageData: string | null = null
    let apiResponseText: string | null = null
    if (parts && Array.isArray(parts)) {
      for (const p of parts) {
        if (p.text) apiResponseText = p.text
        if (p.inlineData?.data) generatedImageData = p.inlineData.data
      }
    }

    const durationMs = Date.now() - started

    if (!generatedImageData) {
      return NextResponse.json({ success: false, error: apiResponseText || 'Failed to generate edited image' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        generatedImage: generatedImageData,
        meta: {
          prompt,
          strength,
          durationMs,
          model: 'gemini-2.5-flash-image-preview'
        }
      }
    })
  } catch (err: any) {
    console.error('[NB-EDIT] Error', err)
    return NextResponse.json({ success: false, error: err?.message || 'Unknown error' }, { status: 500 })
  }
}
