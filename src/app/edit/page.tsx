'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, 
  Download, 
  Share2, 
  RotateCcw, 
  Settings, 
  ZoomIn, 
  ZoomOut,
  Sparkles,
  ArrowLeft,
  Camera,
  Video
} from 'lucide-react'
import { ClothingPanel } from '@/components/edit/clothing-panel'
import { ModelViewer } from '@/components/edit/model-viewer'
import { ControlPanel } from '@/components/edit/control-panel'
import { useRouter } from 'next/navigation'

export default function EditPage() {
  const router = useRouter()
  const [selectedClothes, setSelectedClothes] = useState<{
    single?: any
    combo?: any
  }>({})
  const [selectedModel, setSelectedModel] = useState<string>('/images/men/8a46ed29-5dd4-45c6-924c-555332e0f9e0.jpg')
  const [userPhoto, setUserPhoto] = useState<string | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [tryOnResult, setTryOnResult] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(100)

  // Nano Banana Virtual Try-On callback'i
  const handleTryOnResult = async (clothingImageData: string, clothingType: string, additionalClothing?: any[]) => {
    setIsProcessing(true)
    
    try {
      // Model görselini base64'e çevir
      const modelImageResponse = await fetch(selectedModel)
      const modelBlob = await modelImageResponse.blob()
      const modelBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1]
          resolve(base64)
        }
        reader.readAsDataURL(modelBlob)
      })

      // API çağrısını hazırla
      const requestBody = {
        modelImage: modelBase64,
        clothingImage: clothingImageData,
        clothingType,
        additionalClothing: additionalClothing || []
      }

      console.log('Nano Banana API çağrısı:', { 
        isMultiGarment: !!(additionalClothing && additionalClothing.length > 0),
        clothingType,
        additionalCount: additionalClothing?.length || 0
      })

      // Nano Banana API'ye çağrı yap
      const response = await fetch('/api/nano-banana', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      const result = await response.json()

      if (result.success && result.data.generatedImage) {
        // Base64 görselini data URL formatına çevir
        const imageDataUrl = `data:image/png;base64,${result.data.generatedImage}`
        setTryOnResult(imageDataUrl)
        setProcessedImage(imageDataUrl)
        
        console.log('Virtual try-on başarılı:', {
          isMultiGarment: result.data.isMultiGarment,
          garmentCount: result.data.garmentCount
        })
      } else {
        console.error('API hatası:', result.error)
        alert(`Virtual try-on başarısız: ${result.error || 'Bilinmeyen hata'}`)
      }

    } catch (error) {
      console.error('Virtual try-on error:', error)
      alert('Virtual try-on işlemi başarısız oldu')
    } finally {
      setIsProcessing(false)
    }
  }

  // İşleme durumu
  const handleTryOn = async () => {
    if (!selectedModel || (!selectedClothes.single && !selectedClothes.combo)) {
      return
    }

    setIsProcessing(true)
    
    // AI işleme simülasyonu
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    setProcessedImage(selectedModel) // Gerçekte AI işlenmiş görsel olacak
    setIsProcessing(false)
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Geri</span>
          </button>
          
          <div className="h-6 w-px bg-gray-300" />
          
          <h1 className="text-xl font-semibold text-gray-900">
            TryOnX Studio
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          {/* Zoom Controls */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setZoomLevel(Math.max(50, zoomLevel - 25))}
              className="p-2 hover:bg-white rounded-md transition-colors"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 text-sm font-medium min-w-[60px] text-center">
              {zoomLevel}%
            </span>
            <button
              onClick={() => setZoomLevel(Math.min(200, zoomLevel + 25))}
              className="p-2 hover:bg-white rounded-md transition-colors"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Action Buttons */}
          <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            <span>İndir</span>
          </button>

          <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <Share2 className="w-4 h-4" />
            <span>Paylaş</span>
          </button>

          <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sol Panel - Kıyafet Seçimi */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <ClothingPanel
            selectedClothes={selectedClothes}
            onClothesSelect={(type, item) => {
              setSelectedClothes(prev => ({
                ...prev,
                [type]: item
              }))
            }}
            selectedModel={selectedModel}
            onModelSelect={setSelectedModel}
            onTryOn={handleTryOnResult}
          />
        </div>

        {/* Ana İçerik - Model Görüntüleyici */}
        <div className="flex-1 flex flex-col">
          <ModelViewer
            userPhoto={tryOnResult || selectedModel}
            processedImage={processedImage}
            selectedClothes={selectedClothes}
            isProcessing={isProcessing}
            zoomLevel={zoomLevel}
            onPhotoUpload={setUserPhoto}
          />

          {/* Alt Kontrol Paneli */}
          <div className="bg-white border-t border-gray-200 p-4">
            <ControlPanel
              onTryOn={handleTryOn}
              isProcessing={isProcessing}
              hasPhoto={!!selectedModel}
              hasClothes={!!(selectedClothes.single || selectedClothes.combo)}
              processedImage={processedImage}
            />
          </div>
        </div>

        {/* Sağ Panel - Seçenekler (İsteğe bağlı) */}
        <div className="w-64 bg-white border-l border-gray-200 p-4">
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Seçilen Kıyafetler</h3>
              <div className="space-y-2">
                {selectedClothes.single && (
                  <div className="flex items-center space-x-2 p-2 bg-blue-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-200 rounded"></div>
                    <span className="text-sm">Tek Parça: {selectedClothes.single.name}</span>
                  </div>
                )}
                {selectedClothes.combo && (
                  <div className="flex items-center space-x-2 p-2 bg-green-50 rounded-lg">
                    <div className="w-8 h-8 bg-green-200 rounded"></div>
                    <span className="text-sm">Üst & Alt: {selectedClothes.combo.name}</span>
                  </div>
                )}
                {!selectedClothes.single && !selectedClothes.combo && (
                  <p className="text-sm text-gray-500">Henüz kıyafet seçilmedi</p>
                )}
                {tryOnResult && (
                  <div className="flex items-center space-x-2 p-2 bg-teal-50 rounded-lg">
                    <div className="w-8 h-8 bg-teal-200 rounded"></div>
                    <span className="text-sm">AI Sonuç Hazır</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Hızlı İşlemler</h3>
              <div className="space-y-2">
                <button className="w-full flex items-center space-x-2 px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                  <Camera className="w-4 h-4" />
                  <span>Fotoğraf Değiştir</span>
                </button>
                <button className="w-full flex items-center space-x-2 px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                  <Video className="w-4 h-4" />
                  <span>360° Video</span>
                </button>
                <button className="w-full flex items-center space-x-2 px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                  <RotateCcw className="w-4 h-4" />
                  <span>Sıfırla</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
