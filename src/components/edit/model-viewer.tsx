'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, ZoomIn, ZoomOut, RotateCcw, RefreshCw, Eye, EyeOff, Sparkles, User } from 'lucide-react'
import Image from 'next/image'
import { uploadImage, performVirtualTryOn, getFullImageUrl } from '@/lib/api'
import { useAppStore } from '@/stores/app-store'

interface ModelViewerProps {
  userPhoto: string | null
  processedImage: string | null
  selectedClothes: { single?: any; combo?: any }
  isProcessing: boolean
  zoomLevel: number
  onPhotoUpload: (photo: string) => void
}

export function ModelViewer({ 
  userPhoto, 
  processedImage, 
  selectedClothes, 
  isProcessing, 
  zoomLevel, 
  onPhotoUpload 
}: ModelViewerProps) {
  const [viewMode, setViewMode] = useState<'before' | 'after' | 'split'>('after')
  const [dragPosition, setDragPosition] = useState(50) // Split view için

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
          <div className="relative h-full w-full max-w-2xl">
            <AnimatePresence mode="wait">
              {viewMode === 'before' && (
                <motion.div
                  key="before"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full w-full relative"
                >
                  <div className="absolute inset-4 bg-transparent rounded-2xl overflow-hidden">
                    <div className="h-full relative">
                      <Image
                        src={userPhoto}
                        alt="Orijinal fotoğraf"
                        fill
                        className="object-contain"
                        style={{ transform: `scale(${zoomLevel / 100})` }}
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
                  <div className="absolute inset-4 bg-transparent rounded-2xl overflow-hidden">
                    <div className="h-full relative">
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
                            className="object-contain"
                            style={{ transform: `scale(${zoomLevel / 100})` }}
                          />
                          <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                            AI Sonucu
                          </div>
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
                  <div className="absolute inset-4 bg-transparent rounded-2xl overflow-hidden flex">
                    {/* Sol taraf - Orijinal */}
                    <div className="w-1/2 relative border-r border-gray-200">
                      <Image
                        src={userPhoto}
                        alt="Orijinal"
                        fill
                        className="object-contain"
                        style={{ transform: `scale(${zoomLevel / 100})` }}
                      />
                      <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                        Önce
                      </div>
                    </div>
                    
                    {/* Sağ taraf - İşlenmiş */}
                    <div className="w-1/2 relative">
                      {processedImage ? (
                        <>
                          <Image
                            src={processedImage}
                            alt="İşlenmiş"
                            fill
                            className="object-contain"
                            style={{ transform: `scale(${zoomLevel / 100})` }}
                          />
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
