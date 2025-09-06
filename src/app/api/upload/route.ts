import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File

    if (!file) {
      return NextResponse.json({ 
        success: false, 
        message: 'Dosya bulunamadı' 
      }, { status: 400 })
    }

    // Dosya boyutu kontrolü (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({
        success: false,
        message: 'Dosya boyutu 10MB\'dan büyük olamaz'
      }, { status: 400 })
    }

    // Dosya türü kontrolü
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        success: false,
        message: 'Sadece JPG, PNG ve WEBP dosyaları desteklenir'
      }, { status: 400 })
    }

    // Dosyayı buffer'a çevir
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Dosya adını oluştur (timestamp + orijinal ad)
    const timestamp = Date.now()
    const fileName = `${timestamp}-${file.name}`
    
    // Public/uploads klasörüne kaydet
    const uploadsDir = join(process.cwd(), 'public/uploads')
    const filePath = join(uploadsDir, fileName)
    
    // Klasör yoksa oluştur
    try {
      await writeFile(filePath, buffer)
    } catch (error) {
      // Klasör oluştur ve tekrar dene
      const { mkdir } = await import('fs/promises')
      await mkdir(uploadsDir, { recursive: true })
      await writeFile(filePath, buffer)
    }

    // Dosya URL'ini döndür
    const fileUrl = `/uploads/${fileName}`

    return NextResponse.json({
      success: true,
      message: 'Dosya başarıyla yüklendi',
      url: fileUrl,
      filename: fileName
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({
      success: false,
      message: 'Dosya yüklenirken hata oluştu'
    }, { status: 500 })
  }
}
