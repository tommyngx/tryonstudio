'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Sparkles, 
  Download, 
  Share2, 
  Video, 
  ShoppingCart, 
  RotateCcw,
  Settings,
  Wand2,
  Loader2
} from 'lucide-react'
import { useI18n } from '@/i18n/useI18n'

interface ControlPanelProps {
  onTryOn: () => void
  isProcessing: boolean
  hasPhoto: boolean
  hasClothes: boolean
  processedImage: string | null
  onZoomChange?: (zoom: number) => void
  onVideoShowcase?: () => void
  isVideoGenerating?: boolean
  onOpenAiEditPanel?: () => void
  onDownload?: () => void
  onFixedTryOn?: () => void
  canFixedTryOn?: boolean
}

export function ControlPanel({ 
  onTryOn, 
  isProcessing, 
  hasPhoto, 
  hasClothes, 
  processedImage,
  onZoomChange,
  onVideoShowcase,
  isVideoGenerating,
  onOpenAiEditPanel,
  onDownload,
  onFixedTryOn,
  canFixedTryOn = false
}: ControlPanelProps) {
  const { t } = useI18n()
  const [processingStep, setProcessingStep] = useState('')
  const [qualityMode, setQualityMode] = useState<'fast' | 'balanced' | 'high'>('balanced')

  const canTryOn = hasPhoto && hasClothes && !isProcessing
  const hasResult = !!processedImage

  return (
    <div className="flex items-center justify-between">
      {/* Sol taraf - Ana kontroller */}
      <div className="flex items-center space-x-4">
        {/* Not: AI ile Dene ana butonu sol panele taşındı. Buradaki buton KALDIRILDI. */}

        {/* Kalite Seçimi */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">{t('controlPanel.quality.label')}</span>
          <select
            value={qualityMode}
            onChange={(e) => setQualityMode(e.target.value as any)}
            className="text-sm border border-gray-300 rounded px-2 py-1 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isProcessing}
          >
            <option value="fast">{t('controlPanel.quality.fast')}</option>
            <option value="balanced">{t('controlPanel.quality.balanced')}</option>
            <option value="high">{t('controlPanel.quality.high')}</option>
          </select>
        </div>

        {/* İlerleme Durumu */}
        {isProcessing && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span>{processingStep || t('controlPanel.processing_default')}</span>
          </div>
        )}
      </div>

      {/* Sağ taraf - İkincil eylemler */}
      <div className="flex items-center space-x-2">
        {/* Yeniden İşle */}
        <button
          onClick={onTryOn}
          disabled={!hasResult || isProcessing}
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="text-sm">{t('controlPanel.buttons.retry')}</span>
        </button>

        {/* AI Düzenle */}
        <button
          onClick={onOpenAiEditPanel}
          disabled={!hasResult || isProcessing}
          className="flex items-center space-x-2 px-4 py-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={hasResult ? t('controlPanel.buttons.ai_edit_title') : t('controlPanel.buttons.need_result')}
        >
          <Wand2 className="w-4 h-4" />
          <span className="text-sm">{t('controlPanel.buttons.ai_edit')}</span>
        </button>

        {/* 360° Video */}
        <button
          onClick={onVideoShowcase}
          disabled={!hasResult || isProcessing || isVideoGenerating}
          className={`flex items-center space-x-2 px-4 py-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            isVideoGenerating ? 'bg-purple-100' : ''
          }`}
        >
          {isVideoGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Video className="w-4 h-4" />
          )}
          <span className="text-sm">
            {isVideoGenerating ? t('controlPanel.buttons.video_generating') : t('controlPanel.buttons.video')}
          </span>
        </button>

        {/* Ürün Bul */}
        <button
          disabled={!hasResult || isProcessing}
          className="flex items-center space-x-2 px-4 py-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ShoppingCart className="w-4 h-4" />
          <span className="text-sm">{t('controlPanel.buttons.find_product')}</span>
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-300 mx-2"></div>

        {/* İndir */}
        <button
          onClick={onDownload}
          disabled={!hasResult || isProcessing}
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          <span className="text-sm">{t('common.download')}</span>
        </button>

        {/* Paylaş */}
        <button
          disabled={!hasResult || isProcessing}
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Share2 className="w-4 h-4" />
          <span className="text-sm">{t('common.share')}</span>
        </button>

        {/* Gelişmiş Ayarlar */}
        <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
