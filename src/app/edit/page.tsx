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
import { useI18n } from '@/i18n/useI18n'

export default function EditPage() {
  const router = useRouter()
  const { t } = useI18n()
  const [selectedClothes, setSelectedClothes] = useState<{
    single?: any
    combo?: any
  }>({})
  const [selectedModel, setSelectedModel] = useState<string>('/images/men/8a46ed29-5dd4-45c6-924c-555332e0f9e0.jpg')
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [tryOnResult, setTryOnResult] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isVideoGenerating, setIsVideoGenerating] = useState(false)
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null)
  const [showVideoPlayer, setShowVideoPlayer] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(100)
  const [viewerResetKey, setViewerResetKey] = useState(0)
  const [isEditing, setIsEditing] = useState(false) // AI Edit async indicator
  const [tryOnTrigger, setTryOnTrigger] = useState<(() => Promise<void> | void) | null>(null)
  // Aynı model ile yapılan ardışık try-on sonuçlarını geçmişe eklemek için kullanılan anahtar
  const [lastModelKeyForTryOn, setLastModelKeyForTryOn] = useState<string | null>(null)

  // İndir: Seçili görseli (history seçiliyse onu, değilse try-on sonucu veya orijinal) indir
  const handleDownload = async () => {
    const selected = selectedImageIndex === -1 
      ? (tryOnResult || selectedModel) 
      : editHistory[selectedImageIndex]?.imageUrl
    if (!selected) {
      alert(t('alerts.no_image_to_download'))
      return
    }

    // Dosya adı
    const ts = new Date().toISOString().replace(/[:.]/g, '-')
    const name = selectedImageIndex === -1 ? `tryon-original-${ts}.png` : `tryon-edit-${selectedImageIndex + 1}-${ts}.png`

    try {
      let href = selected
      let revoke: (() => void) | null = null

      // Eğer data URL değilse blob'a çevir
      if (!selected.startsWith('data:')) {
        const resp = await fetch(selected)
        const blob = await resp.blob()
        const url = URL.createObjectURL(blob)
        href = url
        revoke = () => URL.revokeObjectURL(url)
      }

      const a = document.createElement('a')
      a.href = href
      a.download = name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      if (revoke) revoke()
    } catch (e) {
      console.error('Download error', e)
      alert(t('alerts.download_failed'))
    }
  }

  // AI Düzenleme Paneli ve History yönetimi
  const [editHistory, setEditHistory] = useState<EditHistoryItem[]>([])
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(-1) // -1: orijinal (try-on sonucu)
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false)
  const [aiLastResponse, setAiLastResponse] = useState<AiResponseMeta | null>(null)

  // Seçime göre görüntülenecek işlenmiş görseli güncelle
  useEffect(() => {
    // ÖNEMLİ: Orijinal (index=-1) seçildiğinde daima orijinal model gösterilmeli.
    // Try-on sonucu artık sağdaki geçmişte ayrı bir öğe olarak yer alıyor.
    const selected = selectedImageIndex === -1 
      ? selectedModel
      : (editHistory[selectedImageIndex]?.imageUrl ?? null)
    setProcessedImage(selected)
    // Debug selection changes
    try {
      console.log('[Gallery] Selection changed', {
        selectedImageIndex,
        historyCount: editHistory.length,
        hasTryOnResult: !!tryOnResult,
        pickedIs: selectedImageIndex === -1 ? 'original_model' : `generated_${selectedImageIndex + 1}`,
        processedSet: !!selected
      })
    } catch {}
  }, [selectedImageIndex, editHistory, tryOnResult, selectedModel])

  // Model değiştiğinde geçmişi ve sonuçları temizle
  useEffect(() => {
    // Yeni modele geçildiğinde, önceki try-on sonucu ve edit geçmişi anlamsız hale gelir
    setTryOnResult(null)
    setProcessedImage(null)
    setEditHistory([])
    setSelectedImageIndex(-1)
    setAiLastResponse(null)
    setLastModelKeyForTryOn(null)
    // İsteğe bağlı: AI paneli kapat
    setIsAiPanelOpen(false)
    try {
      console.log('[Model] Changed. Cleared tryOnResult and edit history.')
    } catch {}
  }, [selectedModel])

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

  // Face swap akışları kaldırıldı

  // Normal try-on işlemi (orijinal model ile)
  const handleTryOnResult = async (
    clothingImageData: string,
    clothingType: string,
    additionalClothing?: any[],
    options?: { region?: 'upper' | 'lower' | 'dress'; fit?: 'normal' | 'slim' | 'oversize'; forceReplaceUpper?: boolean }
  ) => {
    console.log('[EditPage] Try-on işlemi başlatılıyor:', {
      hasClothingData: !!clothingImageData,
      clothingType,
      hasModel: !!selectedModel,
      dataLength: clothingImageData?.length || 0
    })
    
    setIsProcessing(true)
    
    try {
      const targetModel = selectedModel
      
      // Model görselini base64'e çevir
      let modelBase64: string
      
      if (selectedModel.startsWith('data:')) {
        // Self modunda kullanıcı fotoğrafı data URL (base64) olarak geliyor
        modelBase64 = selectedModel.split(',')[1]
      } else {
        // Orijinal model dosyasını fetch et (public path, remote url vs.)
        const modelImageResponse = await fetch(selectedModel)
        const modelBlob = await modelImageResponse.blob()
        modelBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1]
            resolve(base64)
          }
          reader.readAsDataURL(modelBlob)
        })
      }

      // clothingType normalizasyonu
      const normalizedType = clothingType === 'single' ? 'kıyafet' : clothingType

      // Debug loglar (içerik sızdırmadan uzunluk/metrik)
      try {
        console.log('[TryOn] Request prepared', {
          clothingTypeRaw: clothingType,
          clothingType: normalizedType,
          modelBase64Length: modelBase64?.length || 0,
          clothingBase64Length: clothingImageData?.length || 0,
          isMultiGarment: !!(additionalClothing && additionalClothing.length > 0),
          additionalCount: additionalClothing?.length || 0
        })
      } catch {}

      // API çağrısını hazırla
      const requestBody = {
        modelImage: modelBase64,
        clothingImage: clothingImageData,
        clothingType: normalizedType,
        additionalClothing: additionalClothing || [],
        options: options || {}
      }

      console.log('[EditPage] Nano Banana API çağrısı:', { 
        isMultiGarment: !!(additionalClothing && additionalClothing.length > 0),
        clothingType,
        additionalCount: additionalClothing?.length || 0,
        requestBodyKeys: Object.keys(requestBody)
      })

      // Nano Banana API'ye çağrı yap
      const response = await fetch('/api/nano-banana', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      console.log('[EditPage] API Response Status:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[EditPage] API Error Response:', errorText)
        throw new Error(t('tryon.api_call_failed', { status: String(response.status), text: errorText }))
      }

      const result = await response.json()
      console.log('[EditPage] API Response Data:', {
        success: result.success,
        hasData: !!result.data,
        hasGeneratedImage: !!result.data?.generatedImage,
        error: result.error
      })

      if (result.success && result.data.generatedImage) {
        const imageDataUrl = `data:image/png;base64,${result.data.generatedImage}`
        const currentModelKey = selectedModel

        // Try-on sonucunu hem göster hem de geçmişe ekle ve otomatik seç
        setTryOnResult(imageDataUrl)
        setProcessedImage(imageDataUrl)
        setLastModelKeyForTryOn(currentModelKey)

        // Geçmiş maddesi oluştur (AI Edit ile aynı tip yapıyı kullanır)
        const historyItem: EditHistoryItem = {
          id: `tryon_${Date.now()}`,
          imageUrl: imageDataUrl,
          meta: {
            prompt: 'virtual try-on',
            strength: 1,
            durationMs: result.data?.processingTime ? 0 : 0,
            model: result.data?.model || 'gemini-2.5-flash-image-preview',
            actionType: 'preset',
            createdAt: new Date().toISOString()
          }
        }

        setEditHistory(prev => {
          const next = [...prev, historyItem]
          // Yeni eklenen öğeyi seçili yap
          setSelectedImageIndex(next.length - 1)
          return next
        })

        // AI panelini otomatik aç - kullanıcı Try with AI sonrası düzenlemeye devam edebilsin
        setIsAiPanelOpen(true)

        console.log('Virtual try-on başarılı:', {
          isMultiGarment: result.data.isMultiGarment,
          garmentCount: result.data.garmentCount,
          appendedToHistory: true
        })
      } else {
        console.error('API hatası:', result.error)
        // Quota hatası için özel mesaj
        if (result.error?.includes('kotası aşıldı') || result.error?.includes('quota')) {
          alert(t('alerts.api_quota_exceeded', { error: result.error }))
        } else {
          alert(t('alerts.tryon_failed', { error: result.error || 'Bilinmeyen hata' }))
        }
      }

    } catch (error) {
      console.error('Virtual try-on error:', error)
      alert(t('alerts.tryon_failed_generic'))
    } finally {
      setIsProcessing(false)
    }
  }

  // 360° Video Generation fonksiyonu
  const handleVideoShowcase = async () => {
    // Seçili görsel varsa onu kullan, yoksa history'den en son try-on sonucunu al
    const currentImage = selectedImageIndex === -1 
      ? (selectedModel)
      : editHistory[selectedImageIndex]?.imageUrl
    
    if (!currentImage || (!currentImage.startsWith('data:') && editHistory.length === 0)) {
      alert(t('alerts.video_require_tryon'))
      return
    }

    setIsVideoGenerating(true)

    try {
      // Görsel base64 data'sını çıkar
      const base64Data = currentImage.startsWith('data:') 
        ? currentImage.split(',')[1]
        : await fetch(currentImage).then(r => r.blob()).then(blob => 
            new Promise<string>((resolve) => {
              const reader = new FileReader()
              reader.onload = () => resolve((reader.result as string).split(',')[1])
              reader.readAsDataURL(blob)
            })
          )

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
          
          alert(t('video.demo_alert', { api: result.data.apiResponse || 'Unknown' }))
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
        alert(t('alerts.video_failed_with_reason', { error: result.error || 'Bilinmeyen hata' }))
      }

    } catch (error) {
      console.error('Video generation error:', error)
      alert(t('alerts.video_failed'))
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
            <span>{t('common.back')}</span>
          </button>
          
          <div className="h-6 w-px bg-gray-300" />
          
          <h1 className="text-xl font-semibold text-gray-900">
            {t('common.studio_title')}
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
            <button
              onClick={() => { setZoomLevel(100); setViewerResetKey(k => k + 1) }}
              className="p-2 hover:bg-white rounded-md transition-colors"
              title={t('common.reset')}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Action Buttons */}
          <button onClick={handleDownload} className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            <span>{t('common.download')}</span>
          </button>

          <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <Share2 className="w-4 h-4" />
            <span>{t('common.share')}</span>
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
                [type]: item,
              }))
            }}
            selectedModel={selectedModel}
            onModelSelect={setSelectedModel}
            onTryOn={async (
              clothingImageData: string,
              clothingType: string,
              additionalClothing?: any[],
              options?: { region?: 'upper' | 'lower' | 'dress'; fit?: 'normal' | 'slim' | 'oversize'; forceReplaceUpper?: boolean }
            ) => {
              await handleTryOnResult(clothingImageData, clothingType, additionalClothing, options)
            }}
            registerTryOnTrigger={(fn) => setTryOnTrigger(fn)}
          />
        </div>

        {/* Orta Bölge: Model Görüntüleyici + AI Panel */}
        <div className={`flex-1 flex overflow-hidden relative`}>
          {/* Global editing overlay for AI Edit operations */}
          {isEditing && (
            <div className="pointer-events-auto absolute inset-0 z-40 flex items-center justify-center">
              <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px]" />
              <div className="relative z-10 px-5 py-3 rounded-xl bg-white shadow-lg border border-gray-200 text-sm text-gray-800 flex items-center gap-3">
                <svg className="animate-spin h-4 w-4 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
                <span className="font-medium">AI editing in progress…</span>
              </div>
            </div>
          )}
          
          {/* Model Görüntüleyici + Alt Kontroller */}
          <div className="flex-1 flex flex-col">
            <ModelViewer
              userPhoto={selectedModel}
              processedImage={processedImage}
              selectedClothes={selectedClothes}
              isProcessing={isProcessing}
              zoomLevel={zoomLevel}
              onZoomChange={setZoomLevel}
              resetSignal={viewerResetKey}
              onPhotoUpload={(photo) => {/* self fotoğraf upload akışı burada yönetilebilir */}}
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
                onDownload={handleDownload}
                onFixedTryOn={() => { try { if (tryOnTrigger) { const r = tryOnTrigger(); if (r instanceof Promise) r.catch(console.error) } } catch (e) { console.error('fixed try-on error', e) } }}
                canFixedTryOn={!!tryOnTrigger}
              />
            </div>
          </div>

          {/* Sağ kenar açma togglesı - Panel kapalıyken görünür (sihirli parıltı efekti) */}
          {!isAiPanelOpen && (
            <motion.button
              onClick={() => setIsAiPanelOpen(true)}
              className="absolute top-1/2 -translate-y-1/2 right-0 z-30 bg-white border border-gray-200 rounded-l-lg py-3 px-2 shadow hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-300"
              title={t('common.ai_edit_open')}
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
              <span className="sr-only">{t('common.ai_edit')}</span>
            </motion.button>
          )}

          {/* Spacer: Panel alanını rezerve ederek alt kontrollerin kapanmasını engeller */}
          <div
            aria-hidden
            className={`flex-none transition-[width] duration-300 ease-out ${isAiPanelOpen ? 'w-[320px] md:w-[380px]' : 'w-0'}`}
          />

          {/* AI Düzenleme Paneli */}
          <AiEditPanel
            isOpen={isAiPanelOpen}
            onClose={() => setIsAiPanelOpen(false)}
            hasImage={!!tryOnResult || editHistory.length > 0}
            onSubmit={async ({ prompt, strength, actionType }) => {
              try {
                setIsEditing(true)
                // Base image policy: Edit over CURRENT SELECTION if any; otherwise original try-on
                const base = selectedImageIndex === -1
                  ? tryOnResult
                  : editHistory[selectedImageIndex]?.imageUrl

                if (!base) return null
                const base64 = base.includes(',') ? base.split(',')[1] : base

                // Debug which base is used
                try {
                  console.log('[AI Edit] Submitting edit', {
                    selectedImageIndex,
                    usedBase: selectedImageIndex === -1 ? 'original_tryon' : 'history_item',
                    base64Length: base64?.length || 0,
                    promptLength: prompt?.length || 0,
                    strength
                  })
                } catch {}

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

                // History'ye ekle ve en son eklenen index'i güvenli şekilde seç
                setEditHistory(prev => {
                  const next = [...prev, item]
                  // Yeni eklenen AI edit sonucunu seç
                  setSelectedImageIndex(next.length - 1)
                  return next
                })
                setAiLastResponse(meta)
                return meta
              } catch (e) {
                console.error('AI edit error', e)
                return null
              } finally {
                setIsEditing(false)
              }
            }}
          />
        </div>

        {/* Sağ: Dikey Thumbnail Galerisi - AI Panel'in sağında */}
        <ThumbnailGallery
          originalImage={selectedModel} // Her zaman orijinal modeli göster
          history={editHistory}
          selectedIndex={selectedImageIndex}
          onSelect={(idx) => {
            try { console.log('[Gallery] onSelect', { idx }) } catch {}
            setSelectedImageIndex(idx)
          }}
          onDelete={(idx) => {
            // Seçili öğeyi siliyorsak, seçim indexini ayarla
            setEditHistory(prev => {
              const next = prev.filter((_, i) => i !== idx)
              // Seçim güncellemesi: silinen index'ten önce/sonra durumları
              setSelectedImageIndex(current => {
                if (current === -1) return -1
                if (current === idx) return -1 // orijinale dön
                if (current > idx) return current - 1
                return current
              })
              return next
            })
          }}
        />
      </div>

      {/* Video Player Modal */}
      <VideoPlayer
        videoUrl={generatedVideo}
        isVisible={showVideoPlayer}
        onClose={() => setShowVideoPlayer(false)}
        title={t('video.video_title')}
      />
    </div>
  )
}
