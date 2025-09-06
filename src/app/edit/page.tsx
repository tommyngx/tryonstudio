'use client'

import { useState, useRef, useEffect } from 'react'
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
import { VideoPlayer } from '@/components/edit/video-player'
import { useRouter } from 'next/navigation'
import { ThumbnailGallery, EditHistoryItem } from '@/components/edit/thumbnail-gallery'
import { AiEditPanel } from '@/components/edit/ai-edit-panel'
import { AiResponseMeta } from '@/components/edit/ai-response-card'

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
  const [isVideoGenerating, setIsVideoGenerating] = useState(false)
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null)
  const [showVideoPlayer, setShowVideoPlayer] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(100)

  // AI Düzenleme Paneli ve History yönetimi
  const [editHistory, setEditHistory] = useState<EditHistoryItem[]>([])
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(-1) // -1: orijinal (try-on sonucu)
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false)
  const [aiLastResponse, setAiLastResponse] = useState<AiResponseMeta | null>(null)

  // Seçime göre görüntülenecek işlenmiş görseli güncelle
  useEffect(() => {
    const selected = selectedImageIndex === -1
      ? (tryOnResult ?? null)
      : (editHistory[selectedImageIndex]?.imageUrl ?? null)
    setProcessedImage(selected)
  }, [selectedImageIndex, editHistory, tryOnResult])

  // Panel açık/kapalı durumunu localStorage'da sakla ve klavye kısayollarını yönet
  useEffect(() => {
    // İlk yüklemede kaydedilmiş durumu uygula
    try {
      const saved = localStorage.getItem('ai_panel_open')
      if (saved !== null) {
        setIsAiPanelOpen(saved === '1')
      }
    } catch {}
  }, [])

  useEffect(() => {
    // Durumu kalıcı hale getir
    try {
      localStorage.setItem('ai_panel_open', isAiPanelOpen ? '1' : '0')
    } catch {}
  }, [isAiPanelOpen])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Esc ile kapat
      if (e.key === 'Escape' && isAiPanelOpen) {
        e.preventDefault()
        setIsAiPanelOpen(false)
        return
      }
      // Ctrl/Cmd + E ile aç/kapa
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault()
        setIsAiPanelOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isAiPanelOpen])

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
        // Try-on sonrası paneli otomatik aç ve orijinali seçili yap
        setIsAiPanelOpen(true)
        setSelectedImageIndex(-1)
        
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

  // 360° Video Generation fonksiyonu
  const handleVideoShowcase = async () => {
    if (!tryOnResult) {
      alert('Önce virtual try-on işlemi yapın')
      return
    }

    setIsVideoGenerating(true)

    try {
      // Try-on sonucundan base64 data'yı çıkar
      const base64Data = tryOnResult.split(',')[1]

      const requestBody = {
        tryOnResultImage: base64Data,
        clothingDescription: 'stylish outfit',
        videoDuration: '8 seconds',
        videoStyle: 'professional fashion showcase'
      }

      console.log('Veo 3 Video Generation API çağrısı başlatılıyor...')

      const response = await fetch('/api/veo3-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      const result = await response.json()

      console.log('API Response:', result)
      console.log('Generated Video Data Length:', result.data?.generatedVideo?.length)
      console.log('API Response Message:', result.data?.apiResponse)

      if (result.success && result.data.generatedVideo) {
        // Base64 stringin gerçek video olup olmadığını kontrol et
        const videoBase64 = result.data.generatedVideo
        
        // Placeholder string kontrolü
        if (videoBase64 === 'VklERU9fUExBQ0VIT0xERVJfRkFTSElPTl9TSE9XQ0FTRQ==') {
          console.warn('⚠️ Simulated video response alındı - Gerçek video değil!')
          
          // Demo amaçlı sample video kullan
          console.log('🎬 Demo video ile test edilecek...')
          setGeneratedVideo('/demo-video.mp4') // Public klasöründen demo video
          setShowVideoPlayer(true)
          
          alert('🎬 Video Generation Demo!\n\n⚠️ Bu simulated response (gerçek API için valid key gerekli)\n📹 Demo video player ile test ediliyor\n\nAPI: ' + (result.data.apiResponse || 'Unknown'))
          return
        }
        
        // Gerçek video data ise data URL oluştur
        const videoDataUrl = `data:video/mp4;base64,${videoBase64}`
        setGeneratedVideo(videoDataUrl)
        setShowVideoPlayer(true)
        
        console.log('✅ 360° video başarıyla oluşturuldu!')
        console.log('Video Data URL length:', videoDataUrl.length)
      } else {
        console.error('Video API hatası:', result.error)
        alert(`Video oluşturma başarısız: ${result.error || 'Bilinmeyen hata'}`)
      }

    } catch (error) {
      console.error('Video generation error:', error)
      alert('Video oluşturma işlemi başarısız oldu')
    } finally {
      setIsVideoGenerating(false)
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

        {/* Orta Bölge: Model Görüntüleyici + Thumbnail Galeri + AI Panel */}
        <div className={`flex-1 flex overflow-hidden relative`}>
          {/* Sol: Görüntüleyici + Alt Kontroller */}
          <div className="flex-1 flex flex-col">
            <ModelViewer
              userPhoto={tryOnResult || selectedModel}
              processedImage={processedImage}
              selectedClothes={selectedClothes}
              isProcessing={isProcessing}
              zoomLevel={zoomLevel}
              onPhotoUpload={(photo) => setUserPhoto(photo)}
              onVideoShowcase={handleVideoShowcase}
              isVideoGenerating={isVideoGenerating}
            />

            {/* Alt Kontrol Paneli */}
            <div className="bg-white border-t border-gray-200 p-4">
              <ControlPanel
                onTryOn={handleTryOn}
                isProcessing={isProcessing}
                hasPhoto={!!selectedModel}
                hasClothes={!!(selectedClothes.single || selectedClothes.combo)}
                processedImage={processedImage}
                onZoomChange={setZoomLevel}
                onVideoShowcase={handleVideoShowcase}
                isVideoGenerating={isVideoGenerating}
                onOpenAiEditPanel={() => setIsAiPanelOpen(true)}
              />
            </div>
          </div>

          {/* Orta: Dikey Thumbnail Galerisi */}
          <ThumbnailGallery
            originalImage={tryOnResult}
            history={editHistory}
            selectedIndex={selectedImageIndex}
            onSelect={setSelectedImageIndex}
          />

          {/* Sağ kenar açma togglesı - Panel kapalıyken görünür (sihirli parıltı efekti) */}
          {!isAiPanelOpen && (
            <motion.button
              onClick={() => setIsAiPanelOpen(true)}
              className="absolute top-1/2 -translate-y-1/2 right-0 z-30 bg-white border border-gray-200 rounded-l-lg py-3 px-2 shadow hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-300"
              title="AI Düzenle panelini aç"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
            >
              {/* Parıltı aura - yumuşak nefes efekti */}
              <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-l-lg"
                animate={{ boxShadow: [
                  '0 0 0px rgba(168,85,247,0.0)',
                  '0 0 14px rgba(168,85,247,0.35)',
                  '0 0 0px rgba(168,85,247,0.0)'
                ]}}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* Şerit highlight - sağ kenardan içeri doğru kayar */}
              <motion.span
                aria-hidden
                className="pointer-events-none absolute -inset-0.5 rounded-l-lg bg-gradient-to-r from-purple-400/0 via-purple-400/25 to-purple-400/0"
                initial={{ x: 16, opacity: 0 }}
                animate={{ x: [-8, 8, -8], opacity: [0, 1, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* İkon - hafif titreşim ve parıldama */}
              <motion.span
                aria-hidden
                className="relative block"
                animate={{ rotate: [0, 8, 0, -6, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Sparkles className="w-4 h-4 text-purple-600" />
                {/* mini sparkle noktaları */}
                <motion.span
                  className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-fuchsia-400/80"
                  animate={{ opacity: [0, 1, 0], scale: [0.6, 1, 0.6], y: [-1, -3, -1] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                />
                <motion.span
                  className="absolute -bottom-1 -left-1 w-1 h-1 rounded-full bg-amber-300/80"
                  animate={{ opacity: [0, 1, 0], scale: [0.6, 1, 0.6], y: [1, 3, 1] }}
                  transition={{ duration: 2.1, repeat: Infinity, delay: 0.4 }}
                />
              </motion.span>
              <span className="sr-only">AI Düzenle</span>
            </motion.button>
          )}

          {/* Spacer: Panel alanını rezerve ederek alt kontrollerin kapanmasını engeller */}
          <div
            aria-hidden
            className={`flex-none transition-[width] duration-300 ease-out ${isAiPanelOpen ? 'w-[320px] md:w-[380px]' : 'w-0'}`}
          />

          {/* Sağ: AI Düzenleme Paneli */}
          <AiEditPanel
            isOpen={isAiPanelOpen}
            onClose={() => setIsAiPanelOpen(false)}
            hasImage={!!tryOnResult || editHistory.length > 0}
            onSubmit={async ({ prompt, strength, actionType }) => {
              try {
                // Kullanılacak taban görsel: seçili history veya orijinal try-on
                const base = selectedImageIndex === -1
                  ? tryOnResult
                  : editHistory[selectedImageIndex]?.imageUrl

                if (!base) return null
                const base64 = base.includes(',') ? base.split(',')[1] : base

                const resp = await fetch('/api/nano-banana-edit', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ baseImage: base64, prompt, strength })
                })

                const data = await resp.json()
                if (!data.success || !data.data?.generatedImage) return null

                const newDataUrl = `data:image/png;base64,${data.data.generatedImage}`
                const meta: AiResponseMeta = {
                  prompt,
                  strength,
                  durationMs: data.data.meta?.durationMs ?? 0,
                  model: data.data.meta?.model ?? 'edit-stub-v1'
                }

                const item: EditHistoryItem = {
                  id: `edit_${Date.now()}`,
                  imageUrl: newDataUrl,
                  meta: { ...meta, actionType, createdAt: new Date().toISOString() }
                }

                setEditHistory(prev => [...prev, item])
                setAiLastResponse(meta)
                setSelectedImageIndex(editHistory.length) // yeni eklenen index
                return meta
              } catch (e) {
                console.error('AI edit error', e)
                return null
              }
            }}
          />
        </div>
      </div>

      {/* Video Player Modal */}
      <VideoPlayer
        videoUrl={generatedVideo}
        isVisible={showVideoPlayer}
        onClose={() => setShowVideoPlayer(false)}
        title="🎬 AI Generated 360° Fashion Showcase"
      />
    </div>
  )
}
