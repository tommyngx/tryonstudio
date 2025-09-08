'use client'
import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Wand2, Sun, Moon, Droplets, Diamond, SlidersHorizontal, Loader2, Sparkles, Palette, Camera, Film, Eraser, Clock, Zap, Smartphone, Upload } from 'lucide-react'
import { useI18n } from '@/i18n/useI18n'

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
  // Face Swap özel modu (opsiyonel): Açıkken üstte selfie yükleme ve uygula alanı görünür
  faceSwapMode?: boolean
  baseModelUrl?: string
  onFaceSwapApplied?: (result: { imageUrl?: string; personalizedModelId?: string }) => void
}

const PRESET_PROMPTS: { labelKey: string; prompt: string; emoji: string }[] = [
  { labelKey: 'aiEditPanel.presets.preset1', prompt: 'increase color saturation and vibrance, keep natural skin tones', emoji: '🎨' },
  { labelKey: 'aiEditPanel.presets.preset2', prompt: 'studio lighting, soft shadows, balanced highlights, professional photography look', emoji: '💡' },
  { labelKey: 'aiEditPanel.presets.preset3', prompt: 'increase sharpness, edge clarity, fine details', emoji: '✂️' },
  { labelKey: 'aiEditPanel.presets.preset4', prompt: 'cinematic color grading, teal and orange, film look', emoji: '🎬' },
  { labelKey: 'aiEditPanel.presets.preset5', prompt: 'minimal look, soft colors, reduced contrast, clean and modern', emoji: '🧼' },
  { labelKey: 'aiEditPanel.presets.preset6', prompt: 'vintage film look, warm tones, slight grain, retro vibe', emoji: '📼' },
  { labelKey: 'aiEditPanel.presets.preset7', prompt: 'enhance textures and micro-contrast for more details', emoji: '🔍' },
  { labelKey: 'aiEditPanel.presets.preset8', prompt: 'bright and vivid, high clarity, social-media ready portrait', emoji: '📱' },
]

export function AiEditPanel({ isOpen, onClose, onSubmit, hasImage, faceSwapMode, baseModelUrl, onFaceSwapApplied }: AiEditPanelProps) {
  const { t } = useI18n()
  const [prompt, setPrompt] = useState('')
  const [strength, setStrength] = useState(0.7)
  const [loading, setLoading] = useState(false)
  // Face Swap local state
  const [selfieFile, setSelfieFile] = useState<File | null>(null)
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null)
  const [fsLoading, setFsLoading] = useState(false)
  const [fsError, setFsError] = useState<string | null>(null)

  const charCount = prompt.length
  const canSubmit = hasImage && !loading && (prompt.trim().length > 0)

  // Debug panel state changes to verify why submit might be disabled
  useEffect(() => {
    try {
      console.log('[AiEditPanel] state', {
        isOpen,
        hasImage,
        loading,
        charCount,
        canSubmit,
        faceSwapMode
      })
    } catch {}
  }, [isOpen, hasImage, loading, charCount, canSubmit, faceSwapMode])

  const handlePreset = async (presetPrompt: string) => {
    if (!hasImage || loading) return
    setLoading(true)
    try {
      const resp = await onSubmit({ prompt: presetPrompt, strength: 0.7, actionType: 'preset' })
    } finally {
      setLoading(false)
    }
  }

  const onFsFileChange = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    const allowed = ['image/jpeg','image/jpg','image/png','image/webp','image/gif','image/bmp','image/heic','image/heif']
    if (!allowed.includes(file.type)) {
      setFsError(t('clothing.errors.formats_with_heic'))
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setFsError(t('clothing.errors.file_too_large'))
      return
    }
    setFsError(null)
    setSelfieFile(file)
    try {
      if (selfiePreview) URL.revokeObjectURL(selfiePreview)
    } catch {}
    setSelfiePreview(URL.createObjectURL(file))
  }

  const handleFaceSwapApply = async () => {
    if (!selfieFile) {
      setFsError(t('faceSwap.error.general'))
      return
    }
    setFsLoading(true)
    setFsError(null)
    try {
      // 1) Load selfie and target into canvases and harmonize selfie colors to target scene
      const loadImageFromFile = (file: File) => new Promise<HTMLImageElement>((resolve, reject) => {
        const url = URL.createObjectURL(file)
        const img = new Image()
        img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
        img.onerror = reject
        img.src = url
      })
      const loadImageFromUrl = (url: string) => new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = url
      })

      const selfieImg = await loadImageFromFile(selfieFile)
      let targetImg: HTMLImageElement | null = null
      if (baseModelUrl) {
        if (baseModelUrl.startsWith('data:')) {
          targetImg = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image()
            img.onload = () => resolve(img)
            img.onerror = reject
            img.src = baseModelUrl
          })
        } else {
          targetImg = await loadImageFromUrl(baseModelUrl)
        }
      }

      const computeStats = (img: HTMLImageElement) => {
        const w = Math.min(img.naturalWidth || img.width, 1024)
        const scale = w / (img.naturalWidth || img.width)
        const h = Math.round((img.naturalHeight || img.height) * scale)
        const c = document.createElement('canvas')
        c.width = w; c.height = h
        const ctx = c.getContext('2d')!
        ctx.drawImage(img, 0, 0, w, h)
        const { data } = ctx.getImageData(0, 0, w, h)
        let r=0,g=0,b=0, count=0
        for (let i=0;i<data.length;i+=4){ r+=data[i]; g+=data[i+1]; b+=data[i+2]; count++ }
        return { r: r/count, g: g/count, b: b/count }
      }

      const applyHarmonize = (img: HTMLImageElement, target: {r:number,g:number,b:number}) => {
        const w = img.naturalWidth || img.width
        const h = img.naturalHeight || img.height
        const c = document.createElement('canvas')
        c.width = w; c.height = h
        const ctx = c.getContext('2d')!
        ctx.drawImage(img, 0, 0)
        const im = ctx.getImageData(0, 0, w, h)
        const d = im.data
        // compute source means
        let sr=0, sg=0, sb=0, cnt=0
        for (let i=0;i<d.length;i+=4){ sr+=d[i]; sg+=d[i+1]; sb+=d[i+2]; cnt++ }
        sr/=cnt; sg/=cnt; sb/=cnt
        const eps = 1e-6
        const kr = target.r / Math.max(sr, eps)
        const kg = target.g / Math.max(sg, eps)
        const kb = target.b / Math.max(sb, eps)
        for (let i=0;i<d.length;i+=4){
          d[i] = Math.max(0, Math.min(255, d[i] * kr))
          d[i+1] = Math.max(0, Math.min(255, d[i+1] * kg))
          d[i+2] = Math.max(0, Math.min(255, d[i+2] * kb))
        }
        ctx.putImageData(im, 0, 0)
        // slight gamma to avoid over-contrast
        const gamma = 0.95
        const im2 = ctx.getImageData(0, 0, w, h)
        const d2 = im2.data
        for (let i=0;i<d2.length;i+=4){
          d2[i] = 255 * Math.pow(d2[i]/255, gamma)
          d2[i+1] = 255 * Math.pow(d2[i+1]/255, gamma)
          d2[i+2] = 255 * Math.pow(d2[i+2]/255, gamma)
        }
        ctx.putImageData(im2, 0, 0)
        return c.toDataURL('image/png')
      }

      let harmonizedSelfieDataUrl: string
      if (targetImg) {
        const tgtStats = computeStats(targetImg)
        harmonizedSelfieDataUrl = applyHarmonize(selfieImg, tgtStats)
      } else {
        // fallback: no target available
        const c = document.createElement('canvas')
        c.width = selfieImg.naturalWidth || selfieImg.width
        c.height = selfieImg.naturalHeight || selfieImg.height
        const ctx = c.getContext('2d')!
        ctx.drawImage(selfieImg, 0, 0)
        harmonizedSelfieDataUrl = c.toDataURL('image/png')
      }
      const selfieBase64 = harmonizedSelfieDataUrl.split(',')[1]

      // 2) Base model URL -> base64
      let targetBase64: string | null = null
      if (baseModelUrl) {
        if (baseModelUrl.startsWith('data:')) {
          targetBase64 = baseModelUrl.split(',')[1]
        } else {
          const resp = await fetch(baseModelUrl)
          const blob = await resp.blob()
          targetBase64 = await new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onload = () => resolve((reader.result as string).split(',')[1])
            reader.readAsDataURL(blob)
          })
        }
      }
      if (!targetBase64) throw new Error('Target model image not available')

      // 3) Try InsightFace (Replicate) first
      let finalImageUrl: string | null = null
      try {
        const r1 = await fetch('/api/face-swap-insight', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userImage: selfieBase64, targetImage: targetBase64 })
        })
        const j1 = await r1.json()
        if (r1.ok && j1?.success && j1?.imageUrl) {
          finalImageUrl = j1.imageUrl
        } else {
          throw new Error(j1?.error || 'InsightFace swap failed')
        }
      } catch (e) {
        // 4) Fallback to Nano Banana faceswap
        const res = await fetch('/api/nano-banana', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            operationType: 'faceswap',
            userImage: selfieBase64,
            targetImage: targetBase64,
            options: { refineIdentity: true, refineIdentityPasses: 2 }
          })
        })
        const data = await res.json()
        if (!res.ok || !data?.success || !data?.data?.generatedImage) {
          throw new Error(data?.error || 'Face swap failed')
        }
        finalImageUrl = `data:image/png;base64,${data.data.generatedImage}`
      }

      if (finalImageUrl && onFaceSwapApplied) onFaceSwapApplied({ imageUrl: finalImageUrl })
    } catch (e: any) {
      setFsError(t('faceSwap.error.api', { error: e?.message || 'Unknown error' }))
    } finally {
      setFsLoading(false)
    }
  }

  // Enter to submit (Shift+Enter = new line)
  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      // attempt submit regardless; handleCustom shows helpful alerts if disabled
      void handleCustom()
    }
  }

  const handleCustom = async () => {
    // Always log click attempt to diagnose disabled states
    try {
      console.log('[AiEditPanel] Submit click attempt', {
        hasImage,
        loading,
        promptLength: prompt.trim().length,
        canSubmit
      })
    } catch {}

    if (!canSubmit) {
      if (!hasImage) {
        alert(t('aiEditPanel.alerts.need_image'))
      } else if (loading) {
        alert(t('aiEditPanel.alerts.loading'))
      } else if (prompt.trim().length === 0) {
        alert(t('aiEditPanel.alerts.need_prompt'))
      }
      return
    }
    setLoading(true)
    try {
      console.log('[AiEditPanel] Submit clicked', { promptLength: prompt.trim().length, strength })
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
                <h3 className="text-base font-semibold text-gray-900">{t('aiEditPanel.header.title')}</h3>
                <p className="text-xs text-gray-600">{t('aiEditPanel.header.subtitle')}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/50 text-gray-700 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Face Swap Mode Section */}
            {faceSwapMode && (
              <div className="border-b border-gray-200 bg-white">
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Camera className="w-4 h-4 text-purple-600" />
                    <h4 className="text-sm font-semibold text-gray-900">{t('faceSwap.modal.title')}</h4>
                  </div>
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 hover:bg-blue-50/40 transition-colors cursor-pointer"
                    onClick={() => {
                      const input = document.createElement('input')
                      input.type = 'file'
                      input.accept = 'image/*'
                      input.onchange = (e) => onFsFileChange((e.target as HTMLInputElement).files)
                      input.click()
                    }}
                  >
                    {selfiePreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={selfiePreview} alt="selfie" className="mx-auto max-h-40 object-contain rounded" />
                    ) : (
                      <div className="flex items-center justify-center gap-3 text-gray-600">
                        <Upload className="w-4 h-4 text-blue-500" />
                        <span className="text-xs">{t('faceSwap.modal.uploadHint')}</span>
                      </div>
                    )}
                  </div>
                  {fsError && (
                    <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded p-2">{fsError}</div>
                  )}
                  <div className="flex items-center justify-end">
                    <button
                      onClick={handleFaceSwapApply}
                      disabled={!selfieFile || fsLoading}
                      className="text-xs px-3 py-2 rounded bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {fsLoading ? (
                        <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> {t('faceSwap.modal.processing')}</span>
                      ) : (
                        t('faceSwap.actions.apply')
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {/* Hızlı Aksiyonlar */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <h4 className="text-sm font-semibold text-gray-900">{t('aiEditPanel.quick_actions')}</h4>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    disabled={!hasImage || loading}
                    onClick={() => handlePreset('brighten the image slightly, keep natural look, balance highlights')}
                    className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 hover:border-amber-300 hover:shadow-sm disabled:opacity-50 transition-all duration-200"
                  >
                    <Sun className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-medium text-amber-800">{t('aiEditPanel.quick_labels.brighten')}</span>
                  </button>
                  <button
                    disabled={!hasImage || loading}
                    onClick={() => handlePreset('darken the image slightly, increase contrast for depth')}
                    className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg bg-gradient-to-br from-slate-50 to-gray-50 border border-slate-200 hover:border-slate-300 hover:shadow-sm disabled:opacity-50 transition-all duration-200"
                  >
                    <Moon className="w-4 h-4 text-slate-600" />
                    <span className="text-xs font-medium text-slate-800">{t('aiEditPanel.quick_labels.darken')}</span>
                  </button>
                  <button
                    disabled={!hasImage || loading}
                    onClick={() => handlePreset('enhance color richness and saturation tastefully')}
                    className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200 hover:border-cyan-300 hover:shadow-sm disabled:opacity-50 transition-all duration-200"
                  >
                    <Palette className="w-4 h-4 text-cyan-600" />
                    <span className="text-xs font-medium text-cyan-800">{t('aiEditPanel.quick_labels.colorize')}</span>
                  </button>
                  <button
                    disabled={!hasImage || loading}
                    onClick={() => handlePreset('increase global and local sharpness and clarity')}
                    className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 hover:border-violet-300 hover:shadow-sm disabled:opacity-50 transition-all duration-200"
                  >
                    <Zap className="w-4 h-4 text-violet-600" />
                    <span className="text-xs font-medium text-violet-800">{t('aiEditPanel.quick_labels.sharpen')}</span>
                  </button>
                </div>
              </div>

              {/* Önerilen Promptlar */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <Film className="w-4 h-4 text-purple-500" />
                  <h4 className="text-sm font-semibold text-gray-900">{t('aiEditPanel.recommended')}</h4>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {PRESET_PROMPTS.slice(0, 6).map((p) => (
                    <button
                      key={p.labelKey}
                      disabled={!hasImage || loading}
                      onClick={() => handlePreset(p.prompt)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 hover:shadow-sm disabled:opacity-50 text-left transition-all duration-200 group"
                    >
                      <span className="text-sm group-hover:scale-110 transition-transform">{p.emoji}</span>
                      <span className="text-xs text-gray-700 leading-relaxed flex-1">{t(p.labelKey)}</span>
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
                    onKeyDown={handleKeyDown}
                    placeholder={t('aiEditPanel.textarea_placeholder')}
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
                    <label className="text-xs font-semibold text-gray-700">{t('aiEditPanel.strength_label')}</label>
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
                    <span>{t('aiEditPanel.strength_min')}</span>
                    <span>{t('aiEditPanel.strength_max')}</span>
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
                      <span>{t('aiEditPanel.submit_loading')}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Wand2 className="w-4 h-4" />
                      <span>{t('aiEditPanel.submit')}</span>
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
