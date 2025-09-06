'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

// Dikey Thumbnail Galerisi
// - Orijinal görsel (mavi çerçeve)
// - Edit history görselleri (mor çerçeve)
// - Seçili olan kalın ring + ✓ göstergesi
// - Sadece history varsa görünür

export interface EditHistoryItem {
  id: string
  imageUrl: string // data URL
  meta: {
    prompt: string
    strength: number
    durationMs: number
    model: string
    actionType: 'preset' | 'custom'
    createdAt: string
  }
}

interface ThumbnailGalleryProps {
  originalImage: string | null
  history: EditHistoryItem[]
  selectedIndex: number // -1 = original, >=0 = history index
  onSelect: (index: number) => void
}

export function ThumbnailGallery({ originalImage, history, selectedIndex, onSelect }: ThumbnailGalleryProps) {
  if (!originalImage && history.length === 0) return null

  return (
    <aside className="w-24 bg-gray-50 border-l border-gray-200 h-full flex flex-col">
      {/* Başlık */}
      <div className="px-3 py-2 text-[11px] font-medium text-gray-600">Geçmiş</div>

      {/* Liste */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
        {/* Orijinal */}
        {originalImage && (
          <button
            onClick={() => onSelect(-1)}
            className={`relative w-full rounded-lg overflow-hidden border ${
              selectedIndex === -1 ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-blue-300'
            }`}
            title="Orijinal"
          >
            <div className="relative w-full aspect-[3/4] bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={originalImage} alt="Orijinal" className="absolute inset-0 w-full h-full object-cover" />
            </div>
            <span className="absolute top-1 left-1 bg-blue-600 text-white text-[10px] px-1 rounded">Orijinal</span>
            {selectedIndex === -1 && (
              <span className="absolute bottom-1 right-1 bg-blue-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">✓</span>
            )}
          </button>
        )}

        {/* History */}
        {history.map((item, idx) => (
          <button
            key={item.id}
            onClick={() => onSelect(idx)}
            className={`relative w-full rounded-lg overflow-hidden border ${
              selectedIndex === idx ? 'border-purple-500 ring-2 ring-purple-200' : 'border-gray-200 hover:border-purple-300'
            }`}
            title={`#${idx + 1}`}
          >
            <div className="relative w-full aspect-[3/4] bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.imageUrl} alt={`Düzenleme #${idx + 1}`} className="absolute inset-0 w-full h-full object-cover" />
            </div>
            <span className="absolute top-1 left-1 bg-purple-600 text-white text-[10px] px-1 rounded">#{idx + 1}</span>
            {selectedIndex === idx && (
              <span className="absolute bottom-1 right-1 bg-purple-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">✓</span>
            )}
          </button>
        ))}
      </div>
    </aside>
  )
}
