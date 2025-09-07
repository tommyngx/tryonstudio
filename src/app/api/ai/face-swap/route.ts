import { NextRequest, NextResponse } from 'next/server'

// Face Swap özelliği kaldırıldı. Bu uç 410 Gone döner.
export async function POST(_request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: 'Face Swap özelliği kaldırıldı',
    status: 410
  }, { status: 410 })
}
