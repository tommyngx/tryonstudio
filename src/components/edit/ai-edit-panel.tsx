'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Wand2, Sun, Moon, Droplets, Diamond, SlidersHorizontal, Loader2, Sparkles, Palette, Camera, Film, Eraser, Clock, Zap, Smartphone } from 'lucide-react'

// Sağ AI Düzenleme Paneli - Paylaşılan tasarıma göre birebir kodlandı
// - Gradient header icon, compact layout
// - Hızlı aksiyonlar 2x2 grid
// - Preset listesi emoji + metin
// - Gri arka planlı textarea
// - Slider yüzde + Hafif/Güçlü etiketleri
// - Sticky bottom action bar

export type EditActionType = 'preset' | 'custom'

export interface AiEditPanelProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (payload: { prompt: string; strength: number; actionType: EditActionType }) => Promise<any>
  hasImage: boolean
}

const PRESET_PROMPTS: { label: string; prompt: string; emoji: string }[] = [
  { label: 'Daha parlak ve canlı renkler yap', prompt: 'increase color saturation and vibrance, keep natural skin tones', emoji: '🎨' },
  { label: 'Profesyonel stüdyo ışığı ekle', prompt: 'studio lighting, soft shadows, balanced highlights, professional photography look', emoji: '💡' },
  { label: 'Daha keskin ve net detaylar', prompt: 'increase sharpness, edge clarity, fine details', emoji: '✂️' },
  { label: 'Sinematik görünüm ve film tonları', prompt: 'cinematic color grading, teal and orange, film look', emoji: '🎬' },
  { label: 'Minimal ve temiz görünüm yap', prompt: 'minimal look, soft colors, reduced contrast, clean and modern', emoji: '🧼' },
  { label: 'Vintage retro filtre uygula', prompt: 'vintage film look, warm tones, slight grain, retro vibe', emoji: '📼' },
  { label: 'Arka planı hafifçe bulanıklaştır', prompt: 'enhance textures and micro-contrast for more details', emoji: '🔍' },
  { label: 'Kıyafetin rengini neon yap', prompt: 'bright and vivid, high clarity, social-media ready portrait', emoji: '📱' },
]

export function AiEditPanel({ isOpen, onClose, onSubmit, hasImage }: AiEditPanelProps) {
  const [prompt, setPrompt] = useState('')
  const [strength, setStrength] = useState(0.7)
  const [loading, setLoading] = useState(false)

  const charCount = prompt.length
  const canSubmit = hasImage && !loading && (prompt.trim().length > 0)

  const handlePreset = async (presetPrompt: string) => {
    if (!hasImage || loading) return
    setLoading(true)
    try {
      const resp = await onSubmit({ prompt: presetPrompt, strength: 0.7, actionType: 'preset' })
    } finally {
      setLoading(false)
    }
  }

  const handleCustom = async () => {
    if (!canSubmit) return
    setLoading(true)
    try {
      const resp = await onSubmit({ prompt: prompt.trim(), strength, actionType: 'custom' })
      if (resp) {
        setPrompt('')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          key="ai-edit-panel"
          initial={{ x: 420, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 420, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          className="absolute right-0 top-0 z-40 w-[320px] md:w-[380px] bg-white border-l border-gray-200 h-full flex flex-col shadow-lg"
        >
          {/* Header - Gradient Background */}
          <div className="px-4 py-3 bg-gradient-to-r from-purple-100 to-pink-100 border-b border-purple-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center shadow-md">
                <Wand2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">AI Düzenle</h3>
                <p className="text-xs text-gray-600">Görseli promptlarla düzenleyin ve geliştirin</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/50 text-gray-700 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {/* Hızlı Aksiyonlar */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <h4 className="text-sm font-semibold text-gray-900">Hızlı Aksiyonlar</h4>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    disabled={!hasImage || loading}
                    onClick={() => handlePreset('brighten the image slightly, keep natural look, balance highlights')}
                    className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 hover:border-amber-300 hover:shadow-sm disabled:opacity-50 transition-all duration-200"
                  >
                    <Sun className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-medium text-amber-800">Aydınlat</span>
                  </button>
                  <button
                    disabled={!hasImage || loading}
                    onClick={() => handlePreset('darken the image slightly, increase contrast for depth')}
                    className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg bg-gradient-to-br from-slate-50 to-gray-50 border border-slate-200 hover:border-slate-300 hover:shadow-sm disabled:opacity-50 transition-all duration-200"
                  >
                    <Moon className="w-4 h-4 text-slate-600" />
                    <span className="text-xs font-medium text-slate-800">Koyulaştır</span>
                  </button>
                  <button
                    disabled={!hasImage || loading}
                    onClick={() => handlePreset('enhance color richness and saturation tastefully')}
                    className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200 hover:border-cyan-300 hover:shadow-sm disabled:opacity-50 transition-all duration-200"
                  >
                    <Palette className="w-4 h-4 text-cyan-600" />
                    <span className="text-xs font-medium text-cyan-800">Renklendir</span>
                  </button>
                  <button
                    disabled={!hasImage || loading}
                    onClick={() => handlePreset('increase global and local sharpness and clarity')}
                    className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 hover:border-violet-300 hover:shadow-sm disabled:opacity-50 transition-all duration-200"
                  >
                    <Zap className="w-4 h-4 text-violet-600" />
                    <span className="text-xs font-medium text-violet-800">Keskinleştir</span>
                  </button>
                </div>
              </div>

              {/* Önerilen Promptlar */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <Film className="w-4 h-4 text-purple-500" />
                  <h4 className="text-sm font-semibold text-gray-900">Önerilen Promptlar</h4>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {PRESET_PROMPTS.slice(0, 6).map((p) => (
                    <button
                      key={p.label}
                      disabled={!hasImage || loading}
                      onClick={() => handlePreset(p.prompt)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 hover:shadow-sm disabled:opacity-50 text-left transition-all duration-200 group"
                    >
                      <span className="text-sm group-hover:scale-110 transition-transform">{p.emoji}</span>
                      <span className="text-xs text-gray-700 leading-relaxed flex-1">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Fixed Input Area - Compact */}
            <div className="border-t border-gray-200 bg-white">
              <div className="p-4 space-y-3">
                {/* Textarea */}
                <div className="relative">
                  <textarea
                    value={prompt}
                    onChange={(e) => {
                      if (e.target.value.length <= 500) setPrompt(e.target.value)
                    }}
                    placeholder="Görselinizde ne değişmesini istiyorsunuz?"
                    rows={2}
                    disabled={!hasImage || loading}
                    className={`w-full text-sm rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all ${
                      !hasImage || loading 
                        ? 'bg-gray-100 border border-gray-200 text-gray-500' 
                        : 'bg-gray-50 border border-gray-300 text-gray-800 hover:border-gray-400'
                    }`}
                  />
                  <div className={`absolute bottom-2 right-3 text-xs font-medium ${charCount > 480 ? 'text-red-500' : 'text-gray-400'}`}>
                    {charCount}/500
                  </div>
                </div>

                {/* Slider - Compact */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-700">Düzenleme Gücü</label>
                    <div className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded-md">
                      {Math.round(strength * 100)}%
                    </div>
                  </div>
                  
                  <div className="relative px-1">
                    <div className="w-full h-1 bg-gray-200 rounded-full relative overflow-hidden">
                      <div 
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${strength * 100}%` }}
                      />
                    </div>
                    
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-purple-500 rounded-full shadow-md cursor-pointer transition-all duration-200 hover:scale-125 hover:shadow-lg"
                      style={{ 
                        left: `calc(${strength * 100}% - 8px)`,
                        boxShadow: '0 2px 6px rgba(139, 92, 246, 0.25)'
                      }}
                    />
                    
                    <input
                      type="range"
                      min={0.1}
                      max={1}
                      step={0.1}
                      value={strength}
                      onChange={(e) => setStrength(parseFloat(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Hafif</span>
                    <span>Güçlü</span>
                  </div>
                </div>
              </div>

              {/* Action Button - Sticky */}
              <div className="px-4 pb-4">
                <motion.button
                  onClick={handleCustom}
                  disabled={!canSubmit}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all duration-200 ${
                    canSubmit
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>İşleniyor...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Wand2 className="w-4 h-4" />
                      <span>AI ile Düzenle</span>
                    </div>
                  )}
                </motion.button>
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
