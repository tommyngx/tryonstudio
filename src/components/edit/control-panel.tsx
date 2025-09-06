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
  onOpenAiEditPanel
}: ControlPanelProps) {
  const [processingStep, setProcessingStep] = useState('')
  const [qualityMode, setQualityMode] = useState<'fast' | 'balanced' | 'high'>('balanced')

  const canTryOn = hasPhoto && hasClothes && !isProcessing
  const hasResult = !!processedImage

  return (
    <div className="flex items-center justify-between">
      {/* Sol taraf - Ana kontroller */}
      <div className="flex items-center space-x-4">
        {/* Ana Try-On Butonu - Deaktif, ClothingPanel'daki butonları kullan */}
        <motion.button
          disabled={true}
          className="flex items-center space-x-3 px-6 py-3 rounded-lg font-semibold text-base bg-gray-300 text-gray-500 cursor-not-allowed"
          title="Kıyafet seçin ve sol paneldeki 'AI ile Dene' butonunu kullanın"
        >
          <Sparkles className="w-5 h-5" />
          <span>AI ile Dene</span>
        </motion.button>

        {/* Kalite Seçimi */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Kalite:</span>
          <select
            value={qualityMode}
            onChange={(e) => setQualityMode(e.target.value as any)}
            className="text-sm border border-gray-300 rounded px-2 py-1 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isProcessing}
          >
            <option value="fast">Hızlı</option>
            <option value="balanced">Dengeli</option>
            <option value="high">Yüksek</option>
          </select>
        </div>

        {/* İlerleme Durumu */}
        {isProcessing && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span>{processingStep || 'AI modeli çalışıyor...'}</span>
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
          <span className="text-sm">Yeniden</span>
        </button>

        {/* AI Düzenle */}
        <button
          onClick={onOpenAiEditPanel}
          disabled={!hasResult || isProcessing}
          className="flex items-center space-x-2 px-4 py-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={hasResult ? 'AI Düzenleme panelini aç' : 'Önce bir sonuç üretin'}
        >
          <Wand2 className="w-4 h-4" />
          <span className="text-sm">AI Düzenle</span>
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
            {isVideoGenerating ? 'Video Oluşturuluyor...' : '360° Video'}
          </span>
        </button>

        {/* Ürün Bul */}
        <button
          disabled={!hasResult || isProcessing}
          className="flex items-center space-x-2 px-4 py-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ShoppingCart className="w-4 h-4" />
          <span className="text-sm">Ürün Bul</span>
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-300 mx-2"></div>

        {/* İndir */}
        <button
          disabled={!hasResult || isProcessing}
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          <span className="text-sm">İndir</span>
        </button>

        {/* Paylaş */}
        <button
          disabled={!hasResult || isProcessing}
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Share2 className="w-4 h-4" />
          <span className="text-sm">Paylaş</span>
        </button>

        {/* Gelişmiş Ayarlar */}
        <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
