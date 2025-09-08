import { NextRequest, NextResponse } from 'next/server'

// Replicate InSwapper (InsightFace) proxy endpoint
// Security: requires REPLICATE_API_TOKEN in env
// Input JSON: { userImage: base64, targetImage: base64 }
// Output JSON: { success: true, imageUrl: string, imageBase64?: string }

const REPLICATE_API_URL = 'https://api.replicate.com/v1/predictions'
// Default model version for InSwapper (can be overridden via env)
const DEFAULT_MODEL_VERSION = process.env.REPLICATE_MODEL_VERSION || 'INSWAPPER_VERSION_NOT_SET'

async function startPrediction(input: any, token: string) {
  const resp = await fetch(REPLICATE_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      version: DEFAULT_MODEL_VERSION,
      input
    })
  })
  if (!resp.ok) {
    const text = await resp.text().catch(() => '')
    throw new Error(`Replicate start error: ${resp.status} ${text}`)
  }
  return resp.json() as Promise<any>
}

async function getPrediction(id: string, token: string) {
  const resp = await fetch(`${REPLICATE_API_URL}/${id}`, {
    headers: {
      'Authorization': `Token ${token}`
    }
  })
  if (!resp.ok) {
    const text = await resp.text().catch(() => '')
    throw new Error(`Replicate get error: ${resp.status} ${text}`)
  }
  return resp.json() as Promise<any>
}

async function fetchAsBase64(url: string) {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`Fetch output failed: ${r.status}`)
  const buf = await r.arrayBuffer()
  const b64 = Buffer.from(buf).toString('base64')
  return `data:image/png;base64,${b64}`
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json({ success: false, error: 'Missing REPLICATE_API_TOKEN' }, { status: 500 })
    }
    const token = process.env.REPLICATE_API_TOKEN

    const body = await req.json()
    const userImage: string | undefined = body?.userImage
    const targetImage: string | undefined = body?.targetImage
    // Allow override via body (for debugging different versions/models)
    const bodyModel: string | undefined = body?.model // e.g., "cjwbw/inswapper"
    const bodyVersion: string | undefined = body?.version // e.g., "cjwbw/inswapper:hash"
    const modelVersion = bodyVersion || process.env.REPLICATE_MODEL_VERSION || DEFAULT_MODEL_VERSION

    if (!userImage || !targetImage) {
      return NextResponse.json({ success: false, error: 'userImage and targetImage (base64) are required' }, { status: 400 })
    }

    // Basic validation for model version: Replicate version IDs typically look like "owner/model:hash"
    if (!modelVersion || modelVersion === 'INSWAPPER_VERSION_NOT_SET' || !modelVersion.includes(':')) {
      return NextResponse.json({
        success: false,
        error: 'Invalid or missing REPLICATE_MODEL_VERSION. Please set REPLICATE_MODEL_VERSION to a concrete model version ID like "cjwbw/inswapper:xxxxxxxx" from Replicate.\nExample: REPLICATE_MODEL_VERSION=cjwbw/inswapper:1a2b3c...'
      }, { status: 500 })
    }

    // Build data URLs if not already
    const sourceDataUrl = userImage.startsWith('data:') ? userImage : `data:image/png;base64,${userImage}`
    const targetDataUrl = targetImage.startsWith('data:') ? targetImage : `data:image/png;base64,${targetImage}`

    // Model input shape, adjust keys per model version if needed
    // Some InSwapper variants expect source/target, others source_image/target_image
    // Send both to maximize compatibility; model will use the expected keys.
    const input: any = {
      source_image: sourceDataUrl, // common key
      target_image: targetDataUrl, // common key
      source: sourceDataUrl,       // alt key
      target: targetDataUrl,       // alt key
      upscale: false,
      face_enhance: false
    }

    let started: any
    try {
      // If body.version provided, prefer it over env
      const resp = await fetch(REPLICATE_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ version: modelVersion, input })
      })
      if (!resp.ok) {
        const text = await resp.text().catch(() => '')
        return NextResponse.json({ success: false, error: `Replicate start error: ${resp.status} ${text}` }, { status: resp.status })
      }
      started = await resp.json()
    } catch (e: any) {
      return NextResponse.json({ success: false, error: e?.message || 'Failed to start prediction' }, { status: 500 })
    }
    const id = started?.id
    if (!id) throw new Error('No prediction id returned')

    // Poll until completed or timeout
    const t0 = Date.now()
    let status = started?.status
    let outputUrl: string | null = null
    while (status && ['starting','processing','queued','running'].includes(status)) {
      if (Date.now() - t0 > 120000) throw new Error('Replicate timeout')
      await new Promise(r => setTimeout(r, 2500))
      const pred = await getPrediction(id, token!)
      status = pred?.status
      if (status === 'succeeded') {
        // Some models return array of URLs, others single
        const out = pred?.output
        if (Array.isArray(out) && out.length > 0) {
          outputUrl = out[out.length - 1]
        } else if (typeof out === 'string') {
          outputUrl = out
        }
        break
      }
      if (status === 'failed' || status === 'canceled') {
        const err = pred?.error || 'prediction failed'
        return NextResponse.json({ success: false, error: `Replicate ${status}: ${err}` }, { status: 502 })
      }
    }

    if (!outputUrl) {
      return NextResponse.json({ success: false, error: 'No output URL (prediction did not return output)' }, { status: 500 })
    }

    // Convert to base64 for consistent frontend
    const dataUrl = await fetchAsBase64(outputUrl)

    return NextResponse.json({ success: true, imageUrl: dataUrl })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Unknown error' }, { status: 500 })
  }
}

export async function GET() {
  // Simple health + config check (no secrets)
  const hasToken = !!process.env.REPLICATE_API_TOKEN
  const modelVersion = process.env.REPLICATE_MODEL_VERSION || DEFAULT_MODEL_VERSION
  return NextResponse.json({
    service: 'InsightFace InSwapper via Replicate',
    hasToken,
    modelVersionDefined: modelVersion !== 'INSWAPPER_VERSION_NOT_SET',
    modelVersion
  })
}
