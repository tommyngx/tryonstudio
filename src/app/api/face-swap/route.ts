import { NextRequest, NextResponse } from 'next/server'

// Face Swap özelliği kaldırıldı. Bu uç 410 Gone döner.
export async function POST(_request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: 'Face Swap özelliği kaldırıldı',
    status: 410
  }, { status: 410 })
}

export async function GET() {
  return NextResponse.json({
    service: 'Face Swap API',
    status: 'gone',
    message: 'Face Swap özelliği kaldırıldı',
    timestamp: new Date().toISOString()
  }, { status: 410 })
}
