'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { useI18n } from '@/i18n/useI18n'

interface PhotoUploadProps {
  onPhotoUploaded: (photo: string) => void
}

export function PhotoUpload({ onPhotoUploaded }: PhotoUploadProps) {
  const { t } = useI18n()
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fotoğraf yükleme ve işleme fonksiyonu
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setIsProcessing(true)
    setError(null)

    try {
      // Dosya boyut kontrolü (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error(t('photoUpload.errors.file_too_large_5mb'))
      }

      // Dosyayı base64'e çevir
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        setUploadedImage(result)
        setIsProcessing(false)
      }
      reader.onerror = () => {
        throw new Error(t('photoUpload.errors.file_read'))
      }
      reader.readAsDataURL(file)

    } catch (err) {
      setError(err instanceof Error ? err.message : t('photoUpload.errors.unknown'))
      setIsProcessing(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
    disabled: isProcessing
  })

  // Yüklenen fotoğrafı onayla ve sonraki adıma geç
  const handleConfirmPhoto = () => {
    if (uploadedImage) {
      onPhotoUploaded(uploadedImage)
    }
  }

  // Fotoğrafı sil ve yeniden yükle
  const handleRemovePhoto = () => {
    setUploadedImage(null)
    setError(null)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">{t('photoUpload.title')}</h2>
        <p className="text-muted-foreground text-lg">{t('photoUpload.description')}</p>
      </div>

      <AnimatePresence mode="wait">
        {!uploadedImage ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <div
              {...getRootProps()}
              className={`drop-zone cursor-pointer transition-all duration-300 ${
                isDragActive ? 'active' : ''
              } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center space-y-4">
                <div className="flex items-center justify-center w-16 h-16 bg-primary/10 text-primary rounded-full">
                  <Upload className="w-8 h-8" />
                </div>
                
                {isProcessing ? (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="font-medium">{t('photoUpload.processing')}</p>
                  </div>
                ) : (
                  <>
                    <div className="text-center">
                      <p className="text-lg font-medium mb-2">
                        {isDragActive ? t('photoUpload.drop_here') : t('photoUpload.click_to_upload')}
                      </p>
                      <p className="text-sm text-muted-foreground">{t('photoUpload.or_drag')}</p>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">{t('photoUpload.limit')}</div>
                  </>
                )}
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-destructive/10 text-destructive rounded-lg flex items-center space-x-2"
              >
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Fotoğraf Önizlemesi */}
            <div className="relative bg-white rounded-xl shadow-lg overflow-hidden max-w-md mx-auto">
              <Image
                src={uploadedImage}
                alt={t('photoUpload.preview_alt')}
                width={400}
                height={600}
                className="w-full h-auto object-cover"
              />
              <button
                onClick={handleRemovePhoto}
                className="absolute top-3 right-3 bg-white/90 hover:bg-white text-gray-600 rounded-full p-2 shadow-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Başarı Mesajı */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center space-x-2 text-green-600"
            >
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">{t('photoUpload.success')}</span>
            </motion.div>

            {/* Foto Türü Ipuçları */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">{t('photoUpload.tips_title')}</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>{t('photoUpload.tip1')}</li>
                <li>{t('photoUpload.tip2')}</li>
                <li>{t('photoUpload.tip3')}</li>
                <li>{t('photoUpload.tip4')}</li>
              </ul>
            </div>

            {/* Devam Etme Butonu */}
            <div className="text-center">
              <motion.button
                onClick={handleConfirmPhoto}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-lg font-semibold text-lg transition-colors shadow-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {t('photoUpload.continue')}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
