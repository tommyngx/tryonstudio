"use client"

import { useState } from 'react'
import { X, Upload, Loader2, AlertTriangle } from 'lucide-react'
import { useI18n } from '@/i18n/useI18n'

// FaceSwapModal: Selfie yükleme, kalite uyarıları ve önizleme içeren modal bileşeni
// Amaç: Kullanıcının selfie’sini mevcut seçili base model üzerine face swap için göndermek
// Not: Şu an backend entegrasyonu opsiyonel/gelecek aşama. Başarılı yanıt dönerse onApplied ile parent'a imageUrl iletilir.

export interface FaceSwapResult {
  personalizedModelId?: string
  imageUrl?: string
  qualityScores?: Record<string, number>
  warnings?: string[]
}

export function FaceSwapModal({
  isOpen,
  onClose,
  baseModelUrl,
  onApplied,
}: {
  isOpen: boolean
  onClose: () => void
  baseModelUrl?: string
  onApplied: (result: FaceSwapResult) => void
}) {
  const { t } = useI18n()
  const [selfie, setSelfie] = useState<File | null>(null)
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])

  if (!isOpen) return null

  // Dosya seçimi ve temel validasyon
  const onFileChange = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    const allowed = [
      'image/jpeg','image/jpg','image/png','image/webp','image/gif','image/bmp','image/heic','image/heif'
    ]
    if (!allowed.includes(file.type)) {
      setError(t('clothing.errors.formats_with_heic'))
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError(t('clothing.errors.file_too_large'))
      return
    }
    setError(null)
    setSelfie(file)
    const url = URL.createObjectURL(file)
    setSelfiePreview(url)
  }

  // Face swap tetikleme (gelecekte gerçek API çağrısı)
  const handleApply = async () => {
    if (!selfie) {
      setError(t('faceSwap.error.general'))
      return
    }
    setIsProcessing(true)
    setError(null)
    setWarnings([])
    try {
      // Gelecek: Gerçek API entegrasyonu
      // POST /api/face-swap { selfie, baseModelUrl }
      const formData = new FormData()
      formData.append('selfie', selfie)
      if (baseModelUrl) formData.append('baseModelUrl', baseModelUrl)

      const res = await fetch('/api/face-swap', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        // Backend hazır olmayabilir; kullanıcıya anlaşılır mesaj
        const txt = await res.text().catch(() => '')
        throw new Error(txt || 'Face swap API not available')
      }
      const data = (await res.json()) as FaceSwapResult
      onApplied(data)
      onClose()
    } catch (e: any) {
      console.error('[FaceSwapModal] Face swap error:', e)
      setError(t('faceSwap.error.api', { error: e?.message || 'Unknown error' }))
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      {/* Modal iç kutu */}
      <div className="w-full max-w-lg rounded-lg bg-white shadow-lg overflow-hidden">
        {/* Başlık */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="text-sm font-semibold">{t('faceSwap.modal.title')}</h3>
          <button onClick={onClose} aria-label="Close" className="p-1 rounded hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* İçerik */}
        <div className="p-4 space-y-4">
          {/* Selfie yükleme alanı */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-700">{t('faceSwap.modal.uploadLabel')}</label>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 hover:bg-blue-50/40 transition-colors cursor-pointer"
              onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = 'image/*'
                input.onchange = (e) => onFileChange((e.target as HTMLInputElement).files)
                input.click()
              }}
            >
              {selfiePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selfiePreview} alt="selfie" className="mx-auto max-h-48 object-contain rounded" />
              ) : (
                <div className="flex items-center justify-center gap-3 text-gray-600">
                  <Upload className="w-5 h-5 text-blue-500" />
                  <span className="text-sm">{t('faceSwap.modal.uploadHint')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Kalite uyarıları (placeholder) */}
          {warnings.length > 0 && (
            <div className="flex items-start gap-2 p-2 rounded bg-yellow-50 text-yellow-800 text-xs">
              <AlertTriangle className="w-4 h-4 mt-0.5" />
              <ul className="list-disc pl-4">
                {warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Önizleme alanı (başlık) */}
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-2">{t('faceSwap.modal.previewTitle')}</h4>
            <div className="aspect-[3/4] w-full bg-gray-50 border rounded flex items-center justify-center text-gray-400 text-xs">
              {/* Not: Gerçek önizleme backend sonucu ile gösterilecek */}
              {isProcessing ? (
                <div className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> {t('faceSwap.modal.processing')}</div>
              ) : (
                <span>—</span>
              )}
            </div>
          </div>

          {/* Hata alanı */}
          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded p-2">{error}</div>
          )}
        </div>

        {/* Alt aksiyonlar */}
        <div className="px-4 py-3 border-t flex items-center justify-end gap-2">
          <button onClick={onClose} className="text-xs px-3 py-2 rounded border border-gray-300 hover:bg-gray-50">
            {t('common.back')}
          </button>
          <button
            onClick={handleApply}
            disabled={!selfie || isProcessing}
            className="text-xs px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title={!selfie ? t('aiEditPanel.alerts.need_image') : undefined}
          >
            {isProcessing ? (
              <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> {t('controlPanel.processing_default')}</span>
            ) : (
              t('faceSwap.actions.apply')
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
