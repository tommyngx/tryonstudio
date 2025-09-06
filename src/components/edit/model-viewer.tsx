'use client'

import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Sparkles, Eye, Users, Video, Loader2, RefreshCw, User } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'
import { uploadImage, performVirtualTryOn, getFullImageUrl } from '@/lib/api'
import { useAppStore } from '@/stores/app-store'

interface ModelViewerProps {
  userPhoto: string | null
  processedImage: string | null
  selectedClothes: { single?: any; combo?: any }
  isProcessing: boolean
  zoomLevel: number
  // Zoom seviyesi dışarıdan butonlarla değiştiği için, wheel/pinch zoom'u senkron tutmak adına
  // opsiyonel bir onZoomChange callback'i destekliyoruz.
  onZoomChange?: (nextZoom: number) => void
  // Dışarıdan reset tetiklemek için bir sinyal. Değeri değiştiğinde pan/zoom sıfırlanır.
  resetSignal?: number
  onPhotoUpload: (photo: string) => void
  onVideoShowcase?: () => void
  isVideoGenerating?: boolean
}

export function ModelViewer({ 
  userPhoto, 
  processedImage, 
  selectedClothes, 
  isProcessing, 
  zoomLevel, 
  onZoomChange,
  resetSignal,
  onPhotoUpload,
  onVideoShowcase,
  isVideoGenerating = false
}: ModelViewerProps) {
  const [viewMode, setViewMode] = useState<'before' | 'after' | 'split'>('after')
  const [dragPosition, setDragPosition] = useState(50) // Split view için

  // ---------------------------------------------------------------------------
  // Etkileşimli Zoom & Pan Durumları
  // - panX/panY: görüntünün sürükleme ile taşınması
  // - isPanning: aktif sürükleme olup olmadığı
  // - lastPointer: pan başlangıç noktası
  // - Konst değerler: min/max zoom ve step
  // ---------------------------------------------------------------------------
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [isPanning, setIsPanning] = useState(false)
  const lastPointer = useRef<{ x: number; y: number } | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const MIN_ZOOM = 25
  const MAX_ZOOM = 400
  const ZOOM_STEP = 10

  // Ölçek değerini hesapla (yüzde → scale katsayısı)
  const scale = useMemo(() => Math.max(0.01, zoomLevel / 100), [zoomLevel])

  // Panning’i resetlemek ve zoom’u varsayılan hale getirmek için yardımcı fonksiyon
  const resetView = useCallback(() => {
    // Bu blok: pan ve zoom resetler
    setPanX(0)
    setPanY(0)
    if (onZoomChange) onZoomChange(100)
  }, [onZoomChange])

  // Wheel ile pan/zoom (trackpad pinch genellikle ctrlKey ile gelir)
  const handleWheel = useCallback((e: React.WheelEvent) => {
    // Bu blok: wheel olayını özelleştirerek pan/zoom etkileşimini uygular
    if (isProcessing) return
    // Shift ile yatay kaydırmaya öncelik verilebilir; biz pan yapacağız
    const isPinchZoom = e.ctrlKey || e.metaKey
    if (isPinchZoom && onZoomChange) {
      e.preventDefault()
      const delta = -e.deltaY // trackpad pinch: aşağı negatif → zoom in
      const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomLevel + Math.sign(delta) * ZOOM_STEP))
      onZoomChange(next)
      return
    }

    // Aksi halde pan: deltaX/deltaY değerlerini uygula
    // Magic number kullanmamak için direkt delta değerini kullanıyoruz, hassasiyet iyi.
    e.preventDefault()
    setPanX(prev => prev - e.deltaX)
    setPanY(prev => prev - e.deltaY)
  }, [isProcessing, onZoomChange, zoomLevel])

  // Mouse sürükleme ile pan
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    // Bu blok: mouse down ile pan başlangıcı
    if (isProcessing) return
    setIsPanning(true)
    lastPointer.current = { x: e.clientX, y: e.clientY }
  }, [isProcessing])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    // Bu blok: mouse move ile pan güncelleme
    if (!isPanning || !lastPointer.current) return
    const dx = e.clientX - lastPointer.current.x
    const dy = e.clientY - lastPointer.current.y
    setPanX(prev => prev + dx)
    setPanY(prev => prev + dy)
    lastPointer.current = { x: e.clientX, y: e.clientY }
  }, [isPanning])

  const endPan = useCallback(() => {
    // Bu blok: pan işlemini sonlandırır
    setIsPanning(false)
    lastPointer.current = null
  }, [])

  // Touch desteği (tek parmak pan, iki parmak pinch → wheel event emüle edilmez; min destek pan)
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    // Bu blok: dokunma ile pan başlangıcı (tek parmak)
    if (isProcessing) return
    if (e.touches.length === 1) {
      const t = e.touches[0]
      lastPointer.current = { x: t.clientX, y: t.clientY }
      setIsPanning(true)
    }
  }, [isProcessing])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    // Bu blok: dokunma ile pan güncelleme
    if (!isPanning || !lastPointer.current) return
    const t = e.touches[0]
    const dx = t.clientX - lastPointer.current.x
    const dy = t.clientY - lastPointer.current.y
    setPanX(prev => prev + dx)
    setPanY(prev => prev + dy)
    lastPointer.current = { x: t.clientX, y: t.clientY }
  }, [isPanning])

  const onTouchEnd = useCallback(() => {
    // Bu blok: dokunma pan bitişi
    setIsPanning(false)
    lastPointer.current = null
  }, [])

  // Klavye desteği (ok tuşları pan, +/- zoom; R reset)
  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Bu blok: klavye kısayolları ile pan/zoom kontrolü sağlar
    if (isProcessing) return
    const move = 20
    if (e.key === 'ArrowLeft') { e.preventDefault(); setPanX(p => p + move) }
    else if (e.key === 'ArrowRight') { e.preventDefault(); setPanX(p => p - move) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setPanY(p => p + move) }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setPanY(p => p - move) }
    else if ((e.key === '+' || e.key === '=') && onZoomChange) { e.preventDefault(); onZoomChange(Math.min(MAX_ZOOM, zoomLevel + ZOOM_STEP)) }
    else if ((e.key === '-' || e.key === '_') && onZoomChange) { e.preventDefault(); onZoomChange(Math.max(MIN_ZOOM, zoomLevel - ZOOM_STEP)) }
    else if (e.key.toLowerCase() === 'r') { e.preventDefault(); resetView() }
  }, [isProcessing, onZoomChange, zoomLevel, resetView])

  // resetSignal değişince pan/zoom resetle
  // Bu sayede parent (EditPage) header butonu ile sıfırlama yapabilir
  // Not: zoom reseti parent setZoomLevel ile sağlanır; burada pan resetlenir ve ek güvenlik için zoom reset callback’i çağrılır.
  useEffect(() => {
    if (resetSignal === undefined) return
    // Pan'ı sıfırla
    setPanX(0)
    setPanY(0)
    // Zoom'u 100'e çekmesi için parent'a haber ver
    if (onZoomChange) onZoomChange(100)
  }, [resetSignal, onZoomChange])

  // Fotoğraf yükleme
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      onPhotoUpload(result)
    }
    reader.readAsDataURL(file)
  }, [onPhotoUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
    disabled: isProcessing
  })

  return (
    // Bu blok: ana kapsayıcı. overflow-hidden ile dış scroll’u devre dışı bırakıyoruz.
    <div className="flex-1 bg-gray-100 relative overflow-hidden">
      {/* View Mode Toggle */}
      {userPhoto && (
        <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-1">
          <div className="flex">
            <button
              onClick={() => setViewMode('before')}
              className={`px-3 py-2 text-sm rounded-md transition-colors ${
                viewMode === 'before' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Önce
            </button>
            <button
              onClick={() => setViewMode('after')}
              className={`px-3 py-2 text-sm rounded-md transition-colors ${
                viewMode === 'after' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Sonra
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-2 text-sm rounded-md transition-colors ${
                viewMode === 'split' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Böl
            </button>
          </div>
        </div>
      )}

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg px-3 py-2">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
            <span className="text-sm text-gray-600">AI işliyor...</span>
          </div>
        </div>
      )}

      <div className="h-full flex items-center justify-center p-8">
        {!userPhoto ? (
          // Fotoğraf yükleme alanı
          <div
            {...getRootProps()}
            className={`max-w-md w-full border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
              isDragActive 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-blue-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {isDragActive ? 'Fotoğrafı buraya bırak' : 'Fotoğrafını yükle'}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Yüz veya tam boy fotoğrafını sürükle veya tıklayarak seç.<br />
                  AI en iyi sonuç için optimize edecek.
                </p>
              </div>
              <div className="text-xs text-gray-500">
                JPG, PNG, WEBP • Maksimum 10MB
              </div>
            </div>
          </div>
        ) : (
          // Model görüntüleyici
          <div
            className="relative h-full w-full max-w-2xl"
            // Etkileşim alanı: wheel, pan ve klavye odaklanma
            ref={containerRef}
            onWheel={handleWheel}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={endPan}
            onMouseLeave={endPan}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onKeyDown={onKeyDown}
            onDoubleClick={resetView}
            tabIndex={0}
            style={{ touchAction: 'none', cursor: isPanning ? 'grabbing' : 'grab' }}
            aria-label="Model görüntüleyici alanı (zoom ve pan destekli)"
          >
            <AnimatePresence mode="wait">
              {viewMode === 'before' && (
                <motion.div
                  key="before"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full w-full relative"
                >
                  <div className="absolute inset-0 bg-transparent rounded-2xl overflow-hidden">
                    {/* Bu blok: transform katmanı. translate + scale birlikte uygulanır. */}
                    <div
                      className="h-full relative will-change-transform"
                      style={{ transform: `translate(${panX}px, ${panY}px) scale(${scale})` }}
                    >
                      <Image
                        src={userPhoto}
                        alt="Orijinal fotoğraf"
                        fill
                        className="object-contain select-none"
                        draggable={false}
                      />
                      <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                        Orijinal
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {viewMode === 'after' && (
                <motion.div
                  key="after"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full w-full relative"
                >
                  <div className="absolute inset-0 bg-transparent rounded-2xl overflow-hidden">
                    {/* Bu blok: transform katmanı. translate + scale birlikte uygulanır. */}
                    <div
                      className="h-full relative will-change-transform"
                      style={{ transform: `translate(${panX}px, ${panY}px) scale(${scale})` }}
                    >
                      {isProcessing ? (
                        <div className="h-full flex items-center justify-center bg-gray-100">
                          <div className="text-center">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            >
                              <Sparkles className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                            </motion.div>
                            <p className="text-lg font-medium text-gray-900 mb-1">AI İşliyor</p>
                            <p className="text-sm text-gray-600">Kıyafetler modele uygulanıyor...</p>
                          </div>
                        </div>
                      ) : processedImage ? (
                        <>
                          <Image
                            src={processedImage}
                            alt="AI işlenmiş fotoğraf"
                            fill
                            className="object-contain select-none"
                            draggable={false}
                          />
                        </>
                      ) : (
                        <div className="h-full flex items-center justify-center bg-gray-100">
                          <div className="text-center text-gray-500">
                            <User className="w-12 h-12 mx-auto mb-2" />
                            <p>Kıyafet seçip "Dene" butonuna basın</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Seçilen Kıyafet Gösterge */}
                  {(selectedClothes.single || selectedClothes.combo) && (
                    <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3">
                      <h4 className="text-xs font-medium text-gray-900 mb-2">Seçili</h4>
                      <div className="space-y-1">
                        {selectedClothes.single && (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-blue-200 rounded"></div>
                            <span className="text-xs">Tek Parça: {selectedClothes.single.name}</span>
                          </div>
                        )}
                        {selectedClothes.combo && (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-green-200 rounded"></div>
                            <span className="text-xs">Üst & Alt: {selectedClothes.combo.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {viewMode === 'split' && (
                <motion.div
                  key="split"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full w-full relative"
                >
                  <div className="absolute inset-0 bg-transparent rounded-2xl overflow-hidden flex">
                    {/* Sol taraf - Orijinal */}
                    <div className="w-1/2 relative border-r border-gray-200">
                      {/* Bu blok: sol görüntü için transform katmanı */}
                      <div
                        className="absolute inset-0 will-change-transform"
                        style={{ transform: `translate(${panX}px, ${panY}px) scale(${scale})` }}
                      >
                        <Image
                          src={userPhoto}
                          alt="Orijinal"
                          fill
                          className="object-contain select-none"
                          draggable={false}
                        />
                      </div>
                      <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                        Önce
                      </div>
                    </div>
                    
                    {/* Sağ taraf - İşlenmiş */}
                    <div className="w-1/2 relative">
                      {processedImage ? (
                        <>
                          {/* Bu blok: sağ görüntü için transform katmanı */}
                          <div
                            className="absolute inset-0 will-change-transform"
                            style={{ transform: `translate(${panX}px, ${panY}px) scale(${scale})` }}
                          >
                            <Image
                              src={processedImage}
                              alt="İşlenmiş"
                              fill
                              className="object-contain select-none"
                              draggable={false}
                            />
                          </div>
                          <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                            Sonra
                          </div>
                        </>
                      ) : (
                        <div className="h-full flex items-center justify-center bg-gray-100">
                          <div className="text-center text-gray-500">
                            <Sparkles className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-sm">AI Sonucu</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
