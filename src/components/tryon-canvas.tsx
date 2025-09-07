'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Download, Share2, RotateCcw, Sparkles, Video, ShoppingCart } from 'lucide-react'
import Image from 'next/image'
import { useI18n } from '@/i18n/useI18n'

interface TryOnCanvasProps {
  userPhoto: string | null
  selectedClothes: { upper?: string; lower?: string }
  onComplete: () => void
}

export function TryOnCanvas({ userPhoto, selectedClothes, onComplete }: TryOnCanvasProps) {
  const { t } = useI18n()
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [processingStep, setProcessingStep] = useState<string>('')
  const [progress, setProgress] = useState(0)

  // AI işleme simülasyonu - gerçek uygulamada API çağrısı olacak
  useEffect(() => {
    if (userPhoto && (selectedClothes.upper || selectedClothes.lower)) {
      processVirtualTryOn()
    }
  }, [userPhoto, selectedClothes])

  const processVirtualTryOn = async () => {
    setIsProcessing(true)
    setProgress(0)

    // Simülasyon adımları - gerçek API çağrıları burada olacak
    const steps = [
      { label: t('tryonCanvas.processing_steps.step1'), duration: 2000 },
      { label: t('tryonCanvas.processing_steps.step2'), duration: 1500 },
      { label: t('tryonCanvas.processing_steps.step3'), duration: 2500 },
      { label: t('tryonCanvas.processing_steps.step4'), duration: 2000 },
      { label: t('tryonCanvas.processing_steps.step5'), duration: 1000 },
    ]

    for (let i = 0; i < steps.length; i++) {
      setProcessingStep(steps[i].label)
      
      // Progress simulation
      const stepProgress = ((i + 1) / steps.length) * 100
      await new Promise(resolve => {
        const duration = steps[i].duration
        const startProgress = (i / steps.length) * 100
        let currentProgress = startProgress
        
        const interval = setInterval(() => {
          currentProgress += 2
          if (currentProgress >= stepProgress) {
            setProgress(stepProgress)
            clearInterval(interval)
            resolve(void 0)
          } else {
            setProgress(currentProgress)
          }
        }, duration / 50)
      })
    }

    // Sonucu göster (simülasyon)
    setProcessedImage(userPhoto) // Gerçekte AI işlenmiş görsel olacak
    setIsProcessing(false)
    setProgress(100)
  }

  // 360° Video oluşturma
  const handleGenerateVideo = async () => {
    setProcessingStep(t('tryonCanvas.buttons.video_generate'))
    setIsProcessing(true)
    
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    setIsProcessing(false)
    // Video modal açılacak
  }

  // Ürün arama (Google Lens simülasyonu)
  const handleProductSearch = () => {
    // Google Lens API entegrasyonu burada olacak
    console.log('Product search initiated')
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">{t('tryonCanvas.title')}</h2>
        <p className="text-muted-foreground text-lg">{t('tryonCanvas.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Original Photo */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-center">{t('tryonCanvas.original_photo')}</h3>
          <div className="tryon-canvas aspect-[3/4] bg-gray-100 relative overflow-hidden">
            {userPhoto && (
              <Image
                src={userPhoto}
                alt={t('tryonCanvas.alts.original_photo')}
                fill
                className="object-cover"
              />
            )}
          </div>
        </div>

        {/* Processed Result */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-center">{t('tryonCanvas.ai_result')}</h3>
          <div className="tryon-canvas aspect-[3/4] bg-gray-100 relative overflow-hidden">
            {isProcessing ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="mb-4"
                >
                  <Sparkles className="w-12 h-12 text-primary" />
                </motion.div>
                
                <div className="text-center space-y-4 w-full max-w-xs px-6">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  
                  <p className="text-sm font-medium">{processingStep}</p>
                  <p className="text-xs text-muted-foreground">{t('tryonCanvas.processing_note')}</p>
                </div>
              </div>
            ) : processedImage ? (
              <>
                <Image
                  src={processedImage}
                  alt={t('tryonCanvas.alts.processed_photo')}
                  fill
                  className="object-cover"
                />
                {/* Overlay Controls */}
                <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors group">
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="bg-white/90 hover:bg-white text-gray-600 rounded-full p-2 shadow-md transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
                  <p>{t('tryonCanvas.status_starting')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {processedImage && !isProcessing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 flex flex-wrap justify-center gap-4"
        >
          <motion.button
            onClick={handleGenerateVideo}
            className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Video className="w-5 h-5" />
            <span>{t('tryonCanvas.buttons.video_generate')}</span>
          </motion.button>

          <motion.button
            onClick={handleProductSearch}
            className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ShoppingCart className="w-5 h-5" />
            <span>{t('tryonCanvas.buttons.find_products')}</span>
          </motion.button>

          <motion.button
            onClick={() => processVirtualTryOn()}
            className="flex items-center space-x-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground px-6 py-3 rounded-lg font-semibold transition-all shadow-lg"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <RotateCcw className="w-5 h-5" />
            <span>{t('tryonCanvas.buttons.reprocess')}</span>
          </motion.button>

          <motion.button
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Share2 className="w-5 h-5" />
            <span>{t('tryonCanvas.buttons.share')}</span>
          </motion.button>
        </motion.div>
      )}

      {/* Sonraki Adım */}
      {processedImage && !isProcessing && (
        <div className="text-center mt-8">
          <motion.button
            onClick={onComplete}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-lg font-semibold text-lg transition-colors shadow-lg"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {t('tryonCanvas.buttons.next')}
          </motion.button>
        </div>
      )}

      {/* İşlem Detayları */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold mb-4">{t('tryonCanvas.details.title')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-medium mb-1">{t('tryonCanvas.details.selected_clothes')}</p>
            <ul className="text-muted-foreground space-y-1">
              {selectedClothes.upper && <li>{t('tryonCanvas.details.upper_selected')}</li>}
              {selectedClothes.lower && <li>{t('tryonCanvas.details.lower_selected')}</li>}
            </ul>
          </div>
          <div>
            <p className="font-medium mb-1">{t('tryonCanvas.details.ai_model')}</p>
            <p className="text-muted-foreground">{t('tryonCanvas.details.model_name')}</p>
          </div>
          <div>
            <p className="font-medium mb-1">{t('tryonCanvas.details.duration')}</p>
            <p className="text-muted-foreground">{t('tryonCanvas.details.duration_value')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
