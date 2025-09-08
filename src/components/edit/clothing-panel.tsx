'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Upload, Info, X, Loader2, Sparkles } from 'lucide-react'
import Image from 'next/image'
import { allMenClothing, getMenClothingByType, ClothingSet } from '@/data/men-clothing'
import { useI18n } from '@/i18n/useI18n'

// Yüklenen kıyafet için interface
interface UploadedClothing {
  id: string
  name: string
  type: 'single' | 'upper' | 'lower'
  imageUrl: string
  imageData: string // base64 data
  uploadDate: Date
}

interface ClothingPanelProps {
  selectedClothes: { single?: ClothingSet; combo?: ClothingSet }
  onClothesSelect: (type: 'single' | 'combo', item: ClothingSet) => void
  selectedModel?: string
  onModelSelect?: (modelPath: string) => void
  onTryOn?: (clothingImageData: string, clothingType: string, additionalClothing?: any[], options?: { region?: 'upper' | 'lower' | 'dress'; fit?: 'normal' | 'slim' | 'oversize'; forceReplaceUpper?: boolean }) => void
  // Parent, panel içindeki "AI ile Dene" tetikleyicisini kayıt edebilir
  registerTryOnTrigger?: (fn: (() => Promise<void> | void) | null) => void
}

export function ClothingPanel({ selectedClothes, onClothesSelect, selectedModel, onModelSelect, onTryOn, registerTryOnTrigger }: ClothingPanelProps) {
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState<'single' | 'combo'>('single')
  // Cinsiyet sekmesi: erkek, kadın veya kendiniz
  const [genderTab, setGenderTab] = useState<'men' | 'women' | 'self'>('men') // Cinsiyet sekmesi
  const [uploadedClothes, setUploadedClothes] = useState<UploadedClothing[]>([])
  const [upperClothing, setUpperClothing] = useState<UploadedClothing | null>(null) // Üst giyim
  const [lowerClothing, setLowerClothing] = useState<UploadedClothing | null>(null) // Alt giyim
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedUploadedItem, setSelectedUploadedItem] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // Your Model (self) için kullanıcı fotoğrafı yükleme referansı ve state
  const selfModelInputRef = useRef<HTMLInputElement>(null)
  const [selfModelDataUrl, setSelfModelDataUrl] = useState<string | null>(null)
  // Hedef bölge ve kesim seçenekleri
  const [targetRegion, setTargetRegion] = useState<'upper' | 'lower' | 'dress'>('upper')
  const [fitMode, setFitMode] = useState<'normal' | 'slim' | 'oversize'>('normal')

  // Sekmeler arası bağımsızlık: combo sekmesine geçince single seçimini temizle
  useEffect(() => {
    // Bu etki, single ve combo akışlarının birbirini etkilememesi için
    // combo sekmesine geçildiğinde tek parça seçimini sıfırlar.
    if (activeTab === 'combo' && selectedUploadedItem) {
      setSelectedUploadedItem(null)
    }
  }, [activeTab, selectedUploadedItem])

  // Seçenekler bloğu: her zaman YÜKLEME BÖLÜMÜNDEN SONRA render edilecek
  const OptionsBlock = () => (
    <div className="mt-6 mb-4 pt-4 border-t border-gray-200 space-y-4 relative z-0">
      {/* Hedef Bölge (yalnızca tek parça akışında gösterilir) */}
      {activeTab === 'single' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">{t('clothing.options.target_region')}</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'upper', label: t('clothing.options.regions.upper'), icon: '👔' },
              { value: 'lower', label: t('clothing.options.regions.lower'), icon: '👖' },
              { value: 'dress', label: t('clothing.options.regions.dress'), icon: '👗' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setTargetRegion(option.value as any)}
                className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                  targetRegion === option.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                <span className="text-lg mb-1">{option.icon}</span>
                <span className="text-xs font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Kesim Stili */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">{t('clothing.options.fit_style')}</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'normal', label: t('clothing.options.fits.normal_label'), desc: t('clothing.options.fits.normal_desc') },
            { value: 'slim', label: t('clothing.options.fits.slim_label'), desc: t('clothing.options.fits.slim_desc') },
            { value: 'oversize', label: t('clothing.options.fits.oversize_label'), desc: t('clothing.options.fits.oversize_desc') }
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setFitMode(option.value as any)}
              className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                fitMode === option.value
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              <span className="text-xs font-medium">{option.label}</span>
              <span className="text-[10px] text-gray-500 mt-0.5">{option.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
  
  // Aktif tab'a göre kıyafetleri getir
  const clothingItems = getMenClothingByType(activeTab)
  
  // Cinsiyet değiştiğinde otomatik model seçimi
  useEffect(() => {
    // 'self' seçildiğinde mevcut model korunur; Face Swap otomatik AÇILMAZ
    if (genderTab === 'men' && onModelSelect) {
      onModelSelect('/images/men/8a46ed29-5dd4-45c6-924c-555332e0f9e0.jpg')
    } else if (genderTab === 'women' && onModelSelect) {
      onModelSelect('/images/women/a29ec4e4-0344-4dcb-9c57-ec6d367567ad.jpg')
    } else if (genderTab === 'self') {
      // Self sekmesine geçildiğinde varsa localStorage'daki kullanıcı modelini yükle
      try {
        const saved = localStorage.getItem('self_model_data_url')
        if (saved) {
          setSelfModelDataUrl(saved)
          onModelSelect && onModelSelect(saved)
        }
      } catch {}
    }
  }, [genderTab, onModelSelect])
  
  // Face Swap modu kaldırıldı: kullanıcı yüzü yükleme akışı ve toggle kaldırıldı

  // Dosya yükleme işlemi (tek parça için)
  const handleFileUpload = async (files: FileList) => {
    if (!files || files.length === 0) return
    
    setIsUploading(true)
    
    try {
      const file = files[0]
      
      // Dosya formatı kontrolü (HEIC/HEIF desteği eklendi)
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/heic', 'image/heif']
      if (!allowedTypes.includes(file.type)) {
        alert(t('clothing.errors.formats'))
        return
      }
      
      // Dosya boyutu kontrolü (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert(t('clothing.errors.file_too_large'))
        return
      }
      
      // Base64'e çevir
      const base64Data = await convertFileToBase64(file)
      const imageUrl = URL.createObjectURL(file)
      
      const uploadedItem: UploadedClothing = {
        id: `uploaded_${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ""), // Uzantıyı kaldır
        type: 'single',
        imageUrl,
        imageData: base64Data.split(',')[1], // "data:image/..." kısmını kaldır
        uploadDate: new Date()
      }
      
      setUploadedClothes(prev => [uploadedItem, ...prev])
      // Son yüklenen öğeyi otomatik seç
      setSelectedUploadedItem(uploadedItem.id)
      
    } catch (error) {
      console.error('Dosya yükleme hatası:', error)
      alert(t('clothing.errors.upload_failed'))
    } finally {
      setIsUploading(false)
      // ÖNEMLİ: Aynı dosyayı yeniden seçebilmek için gizli file input'un değerini sıfırla
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Üst giyim yükleme
  const handleUpperClothingUpload = async (files: FileList) => {
    if (!files || files.length === 0) return
    
    setIsUploading(true)
    
    try {
      const file = files[0]
      
      // Dosya kontrolü (HEIC/HEIF desteği eklendi)
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/heic', 'image/heif']
      if (!allowedTypes.includes(file.type)) {
        alert('Desteklenen formatlar: JPEG, PNG, WebP, GIF, BMP')
        return
      }
      
      if (file.size > 10 * 1024 * 1024) {
        alert('Dosya boyutu 10MB\'dan küçük olmalıdır')
        return
      }
      
      const base64Data = await convertFileToBase64(file)
      const imageUrl = URL.createObjectURL(file)
      
      const upperItem: UploadedClothing = {
        id: `upper_${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ""),
        type: 'upper',
        imageUrl,
        imageData: base64Data.split(',')[1],
        uploadDate: new Date()
      }
      
      // Önceki üst giyim blob URL'ini serbest bırak
      if (upperClothing?.imageUrl) {
        try { URL.revokeObjectURL(upperClothing.imageUrl) } catch {}
      }
      setUpperClothing(upperItem)
      // Üst giyim seçildiğinde tek parça seçimi kaldır
      setSelectedUploadedItem(null)
      
    } catch (error) {
      console.error('Üst giyim yükleme hatası:', error)
      alert(t('clothing.errors.upper_upload_failed'))
    } finally {
      setIsUploading(false)
    }
  }

  // Alt giyim yükleme
  const handleLowerClothingUpload = async (files: FileList) => {
    if (!files || files.length === 0) return
    
    setIsUploading(true)
    
    try {
      const file = files[0]
      
      // Dosya kontrolü (HEIC/HEIF desteği eklendi - üst ve single ile tutarlı)
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/heic', 'image/heif']
      if (!allowedTypes.includes(file.type)) {
        alert('Desteklenen formatlar: JPEG, PNG, WebP, GIF, BMP')
        return
      }
      
      if (file.size > 10 * 1024 * 1024) {
        alert('Dosya boyutu 10MB\'dan küçük olmalıdır')
        return
      }
      
      const base64Data = await convertFileToBase64(file)
      const imageUrl = URL.createObjectURL(file)
      
      const lowerItem: UploadedClothing = {
        id: `lower_${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ""),
        type: 'lower',
        imageUrl,
        imageData: base64Data.split(',')[1],
        uploadDate: new Date()
      }
      
      // Önceki alt giyim blob URL'ini serbest bırak
      if (lowerClothing?.imageUrl) {
        try { URL.revokeObjectURL(lowerClothing.imageUrl) } catch {}
      }
      setLowerClothing(lowerItem)
      // Alt giyim seçildiğinde tek parça seçimi kaldır
      setSelectedUploadedItem(null)
      
    } catch (error) {
      console.error('Alt giyim yükleme hatası:', error)
      alert(t('clothing.errors.lower_upload_failed'))
    } finally {
      setIsUploading(false)
    }
  }
  
  // Base64 dönüştürme fonksiyonu
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // Kullanıcı model fotoğrafı yükleme (self)
  const handleSelfModelUpload = async (files: FileList) => {
    if (!files || files.length === 0) return
    const file = files[0]
    try {
      // Desteklenen formatlar ve boyut kontrolü (10MB)
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/heic', 'image/heif']
      if (!allowedTypes.includes(file.type)) {
        alert(t('clothing.errors.formats_with_heic'))
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        alert(t('clothing.errors.file_too_large'))
        return
      }

      const dataUrl = await convertFileToBase64(file) // data:*;base64,...
      setSelfModelDataUrl(dataUrl)
      try { localStorage.setItem('self_model_data_url', dataUrl) } catch {}
      // Parent'a bildir
      onModelSelect && onModelSelect(dataUrl)
      console.log('[ClothingPanel] Self model uploaded and selected. Length:', dataUrl.length)
    } catch (e) {
      console.error('[ClothingPanel] Self model upload error:', e)
      alert(t('clothing.errors.upload_failed'))
    } finally {
      if (selfModelInputRef.current) selfModelInputRef.current.value = ''
    }
  }
  
  // Drag & Drop işlemleri
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const files = e.dataTransfer.files
    if (files) handleFileUpload(files)
  }
  
  // Kıyafet silme işlemi
  const handleRemoveUploadedItem = (id: string) => {
    // Silinen öğenin blob URL'ini serbest bırak
    setUploadedClothes(prev => {
      const toRemove = prev.find(item => item.id === id)
      if (toRemove?.imageUrl) {
        try { URL.revokeObjectURL(toRemove.imageUrl) } catch {}
      }
      return prev.filter(item => item.id !== id)
    })
    if (selectedUploadedItem === id) {
      setSelectedUploadedItem(null)
    }
    // Kullanıcı aynı dosyayı yeniden seçtiğinde onChange'in tetiklenmesi için input'u sıfırla
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  
  // Virtual Try-On işlemi
  const handleVirtualTryOn = async (clothingImageData: string, clothingType: string) => {
    if (!selectedModel) {
      alert(t('clothing.errors.need_model'))
      return
    }
    
    // Debug: Try-on başlatma logları
    console.log('[ClothingPanel] Try-on başlatılıyor:', {
      hasModel: !!selectedModel,
      hasClothingData: !!clothingImageData,
      clothingType,
      clothingDataLength: clothingImageData?.length || 0
    })
    
    // Hedef bölge ayarını kullan
    const selectedItem = uploadedClothes.find(item => item.id === selectedUploadedItem)
    
    // Kullanıcının seçtiği hedef bölgeyi kullan
    const region = targetRegion
    // Region=upper ise UI göstermeden zorla değiştir davranışını otomatik etkinleştir
    const options = { region, fit: fitMode, forceReplaceUpper: region === 'upper' }
    
    // Not: API çağrısı UI bileşeni içinde yapılmamalıdır. 
    // Bu bileşen yalnızca kullanıcının yüklediği kıyafet görselini parent'a iletir.
    // Böylece tek bir merkezde (Edit sayfası) inference çağrısı yapılır ve çift çağrı/yanlış veri rolü sorunları engellenir.
    try {
      if (onTryOn) {
        console.log('[ClothingPanel] onTryOn callback çağrılıyor...')
        await onTryOn(clothingImageData, region, undefined, options)
        console.log('[ClothingPanel] Try-on işlemi tamamlandı')
      } else {
        console.error('[ClothingPanel] onTryOn callback bulunamadı!')
        alert(t('clothing.errors.tryon_not_configured'))
      }
    } catch (error) {
      console.error('[ClothingPanel] Virtual try-on tetikleme hatası:', error)
      alert(t('clothing.errors.tryon_failed', { error: error instanceof Error ? error.message : 'Bilinmeyen hata' }))
    }
  }

  // Üst+Alt deneme fonksiyonu
  const handleUpperLowerTryOn = async () => {
    if (!selectedModel) {
      alert('Lütfen önce bir model seçin')
      return
    }

    if (!upperClothing || !lowerClothing) {
      // Bu mesaj UI içinde statü etiketleriyle verildiği için ayrıca alert göstermiyoruz
      return
    }

    if (!onTryOn) return

    setIsProcessing(true)
    
    try {
      // Ana kıyafet olarak üst giyimi gönder, alt giyimi additional olarak ekle
      const additionalClothing = [{
        type: lowerClothing.type,
        imageData: lowerClothing.imageData
      }]

      const options = { region: 'upper' as const, fit: fitMode, forceReplaceUpper: false }
      await onTryOn(upperClothing.imageData, 'upper', additionalClothing, options)
    } catch (error) {
      console.error('Upper+Lower try-on error:', error)
      alert(t('clothing.errors.upper_lower_failed'))
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{t('clothing.header_title')}</h2>
          <Info className="w-5 h-5 text-gray-400" />
        </div>
        
        {/* Tab Navigation */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('single')}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'single' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t('clothing.tabs.single')}
          </button>
          <button
            onClick={() => setActiveTab('combo')}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'combo' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t('clothing.tabs.combo')}
          </button>
        </div>
      </div>

      {/* Face Swap modu ve kullanıcı yüzü yükleme alanı kaldırıldı */}

      {/* Content Area */}
      <div className="flex-1 p-4 overflow-y-auto">
        {/* Gizli file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple={false}
          className="hidden"
          onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
        />
        {/* Gizli self model input */}
        <input
          ref={selfModelInputRef}
          type="file"
          accept="image/*"
          multiple={false}
          className="hidden"
          onChange={(e) => e.target.files && handleSelfModelUpload(e.target.files)}
        />

        {/* Upload Areas - Tab'a göre değişir */}
        {activeTab === 'single' ? (
          // Tek Parça Upload Area (Eğer kullanıcı en az bir görsel yüklediyse gizle)
          uploadedClothes.length === 0 ? (
            <div className="mb-6">
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 md:p-8 hover:border-blue-400 hover:bg-blue-50/50 transition-colors cursor-pointer relative"
                onClick={() => {
                  if (fileInputRef.current) fileInputRef.current.value = ''
                  fileInputRef.current?.click()
                }}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {isUploading ? (
                  <div className="flex items-center justify-center gap-3">
                    <Loader2 className="w-6 h-6 md:w-8 md:h-8 text-blue-500 animate-spin" />
                    <div className="text-left">
                      <p className="text-base font-medium text-blue-600 leading-tight">{t('clothing.upload.loading')}</p>
                      <p className="text-sm text-gray-500">{t('clothing.upload.please_wait')}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3 md:gap-4">
                    <Plus className="w-6 h-6 md:w-8 md:h-8 text-teal-500" />
                    <div className="text-left">
                      <p className="text-base font-medium text-teal-600 leading-tight">{t('clothing.upload.single_title')}</p>
                      <p className="text-sm text-gray-500">{t('clothing.upload.single_hint')}</p>
                      <p className="text-xs text-gray-400 mt-1">{t('clothing.upload.formats')}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null
        ) : (
          // Üst & Alt Upload Areas
          <div className="mb-6 space-y-4">
            {/* Üst Giyim Upload Area */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-900">{t('clothing.upload.upper_title')}</h3>
              <div 
                className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-colors cursor-pointer relative"
                onClick={() => {
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.accept = 'image/*'
                  input.onchange = (e) => {
                    const files = (e.target as HTMLInputElement).files
                    if (files) handleUpperClothingUpload(files)
                  }
                  input.click()
                }}
              >
                {upperClothing ? (
                  <div className="flex flex-col items-center">
                    <img src={upperClothing.imageUrl} alt={upperClothing.name} className="w-16 h-16 object-cover rounded-lg mb-2" />
                    <p className="text-sm font-medium text-green-600">{upperClothing.name}</p>
                    <p className="text-xs text-gray-500">{t('clothing.upload.upper_ready')}</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Plus className="w-6 h-6 text-blue-500 mb-2" />
                    <p className="text-sm font-medium text-blue-600">{t('clothing.upload.upper_add')}</p>
                    <p className="text-xs text-gray-500">{t('clothing.upload.upper_examples')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Alt Giyim Upload Area */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-900">{t('clothing.upload.lower_title')}</h3>
              <div 
                className="border-2 border-dashed border-green-300 rounded-lg p-6 text-center hover:border-green-400 hover:bg-green-50/50 transition-colors cursor-pointer relative"
                onClick={() => {
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.accept = 'image/*'
                  input.onchange = (e) => {
                    const files = (e.target as HTMLInputElement).files
                    if (files) handleLowerClothingUpload(files)
                  }
                  input.click()
                }}
              >
                {lowerClothing ? (
                  <div className="flex flex-col items-center">
                    <img src={lowerClothing.imageUrl} alt={lowerClothing.name} className="w-16 h-16 object-cover rounded-lg mb-2" />
                    <p className="text-sm font-medium text-green-600">{lowerClothing.name}</p>
                    <p className="text-xs text-gray-500">{t('clothing.upload.lower_ready')}</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Plus className="w-6 h-6 text-green-500 mb-2" />
                    <p className="text-sm font-medium text-green-600">{t('clothing.upload.lower_add')}</p>
                    <p className="text-xs text-gray-500">{t('clothing.upload.lower_examples')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Üst+Alt Deneme Butonu kaldırıldı: sol alttaki ana buton kullanılacak */}
          </div>
        )}

        {/* Yüklenen Kıyafetler */}
        {activeTab === 'single' && uploadedClothes.length > 0 && (
          <div className="mb-6 relative z-10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">{t('clothing.upload.uploaded_title')}</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{t('clothing.upload.uploaded_count', { count: String(uploadedClothes.length) })}</span>
                {/* Küçük ekle butonu: gizli input'u tetikler */}
                <button
                  onClick={() => {
                    if (fileInputRef.current) fileInputRef.current.value = ''
                    fileInputRef.current?.click()
                  }}
                  className="px-2 py-1 text-[11px] rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                  title={t('clothing.upload.new_item')}
                >
                  {t('clothing.upload.add_short')}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {uploadedClothes.map((item) => (
                <motion.div
                  key={item.id}
                  className={`relative bg-white border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                    selectedUploadedItem === item.id
                      ? 'border-green-500 ring-2 ring-green-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedUploadedItem(item.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Kıyafet görseli */}
                  <div className="aspect-[3/4] bg-gray-50 relative">
                    {/* upload edilmiş blob/object URL'ler için native img kullan */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.imageUrl} alt={item.name} className="absolute inset-0 w-full h-full object-cover" />
                  </div>
                  
                  {/* Silme butonu */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveUploadedItem(item.id)
                    }}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Seçim göstergesi */}
                  {selectedUploadedItem === item.id && (
                    <div className="absolute top-2 left-2 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center">
                      ✓
                    </div>
                  )}

                  {/* Kıyafet bilgisi */}
                  <div className="p-2">
                    <h3 className="text-xs font-medium text-gray-900 truncate">{item.name}</h3>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-500">{item.type === 'single' ? t('clothing.items.type_single') : t('clothing.items.type_combo')}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Try-on Ayarları (her zaman görünür) */}
        <OptionsBlock />

        {/* Model Seçimi Bölümü */}
        <div className="mb-6 mt-2">
          {/* Cinsiyet Sekmeleri */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">{t('clothing.model.section_title')}</h3>
            {/* Cinsiyet seçimi için şık dropdown - Toggle yerine */}
            {/* Bu select, genderTab state'ini günceller; useEffect ile model otomatik ayarlanır */}
            <div className="relative">
              <select
                aria-label={t('clothing.model.gender_aria')}
                value={genderTab}
                onChange={(e) => setGenderTab(e.target.value as 'men' | 'women' | 'self')}
                className="appearance-none bg-white border border-gray-300 text-gray-700 text-xs font-medium rounded-md pl-3 pr-8 py-2 shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-purple-300 focus:border-purple-400 transition-colors"
              >
                <option value="men">{t('clothing.model.men')}</option>
                <option value="women">{t('clothing.model.women')}</option>
                <option value="self">{t('clothing.model.self')}</option>
              </select>
              {/* Dropdown ok ikonu */}
              <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-400">
                ▾
              </span>
            </div>
          </div>

          {/* Model Grid veya Modeliniz Bölümü */}
          {genderTab !== 'self' ? (
            <div className="grid grid-cols-3 gap-3">
            {genderTab === 'men' ? (
              // Erkek Modeller
              <motion.div
                className={`relative bg-white border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                  selectedModel === '/images/men/8a46ed29-5dd4-45c6-924c-555332e0f9e0.jpg'
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-blue-400'
                }`}
                onClick={() => onModelSelect && onModelSelect('/images/men/8a46ed29-5dd4-45c6-924c-555332e0f9e0.jpg')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="aspect-[3/4] bg-gray-50 relative">
                  <Image
                    src="/images/men/8a46ed29-5dd4-45c6-924c-555332e0f9e0.jpg"
                    alt={t('clothing.model.male_alt')}
                    fill
                    className="object-cover"
                  />
                </div>
                
                {/* Seçim göstergesi */}
                {selectedModel === '/images/men/8a46ed29-5dd4-45c6-924c-555332e0f9e0.jpg' && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center">
                    ✓
                  </div>
                )}
                
                <div className="p-2">
                  <p className="text-xs font-medium text-gray-900">{t('clothing.model.model_name')}</p>
                </div>
              </motion.div>
            ) : (
              // Kadın Modeller
              <motion.div
                className={`relative bg-white border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                  selectedModel === '/images/women/a29ec4e4-0344-4dcb-9c57-ec6d367567ad.jpg'
                    ? 'border-pink-500 ring-2 ring-pink-200'
                    : 'border-gray-200 hover:border-pink-400'
                }`}
                onClick={() => onModelSelect && onModelSelect('/images/women/a29ec4e4-0344-4dcb-9c57-ec6d367567ad.jpg')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="aspect-[3/4] bg-gray-50 relative">
                  <Image
                    src="/images/women/a29ec4e4-0344-4dcb-9c57-ec6d367567ad.jpg"
                    alt={t('clothing.model.female_alt')}
                    fill
                    className="object-cover"
                  />
                </div>
                
                {/* Seçim göstergesi */}
                {selectedModel === '/images/women/a29ec4e4-0344-4dcb-9c57-ec6d367567ad.jpg' && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-pink-500 text-white rounded-full flex items-center justify-center">
                    ✓
                  </div>
                )}
                
                <div className="p-2">
                  <p className="text-xs font-medium text-gray-900">{t('clothing.model.model_name')}</p>
                </div>
              </motion.div>
            )}
            
            {/* Model ekleme placeholder'ları */}
            <motion.div
              className={`aspect-[3/4] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:bg-opacity-50 transition-colors cursor-pointer ${
                genderTab === 'men' 
                  ? 'hover:border-blue-400 hover:bg-blue-50' 
                  : 'hover:border-pink-400 hover:bg-pink-50'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-6 h-6 text-gray-400 mb-1" />
              <p className="text-xs text-gray-500">{t('clothing.model.add_model')}</p>
            </motion.div>
            
            <motion.div
              className={`aspect-[3/4] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:bg-opacity-50 transition-colors cursor-pointer ${
                genderTab === 'men' 
                  ? 'hover:border-blue-400 hover:bg-blue-50' 
                  : 'hover:border-pink-400 hover:bg-pink-50'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-6 h-6 text-gray-400 mb-1" />
              <p className="text-xs text-gray-500">{t('clothing.model.add_model')}</p>
            </motion.div>
          </div>
          ) : (
            // Self modu: Kendi modelini yükleme UI
            <div className="space-y-3">
              {/* Başlık ve ipucu */}
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-gray-900">{t('clothing.model.self_upload_title')}</h4>
                {selfModelDataUrl ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-50 text-green-700 border border-green-200">
                    {t('clothing.model.self_selected_badge')}
                  </span>
                ) : null}
              </div>

              {/* Yükleme Alanı veya Önizleme */}
              {!selfModelDataUrl ? (
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 hover:bg-purple-50/40 transition-colors cursor-pointer"
                  onClick={() => selfModelInputRef.current?.click()}
                >
                  <Plus className="w-6 h-6 text-purple-500 mb-2 mx-auto" />
                  <p className="text-sm font-medium text-purple-700">{t('clothing.model.self_upload_button')}</p>
                  <p className="text-xs text-gray-500 mt-1">{t('clothing.model.self_hint')}</p>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selfModelDataUrl} alt={t('clothing.model.self_preview_alt')} className="w-14 h-18 object-cover rounded-md border" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 font-medium truncate">{t('clothing.model.self_selected_badge')}</p>
                    <p className="text-[11px] text-gray-500 truncate">{t('clothing.model.self_hint')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => selfModelInputRef.current?.click()}
                      className="px-2 py-1 text-[11px] rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      {t('clothing.model.self_change_button')}
                    </button>
                    <button
                      onClick={() => {
                        try { localStorage.removeItem('self_model_data_url') } catch {}
                        setSelfModelDataUrl(null)
                        onModelSelect && onModelSelect('')
                      }}
                      className="px-2 py-1 text-[11px] rounded-md border border-red-300 text-red-600 hover:bg-red-50"
                    >
                      {t('clothing.model.self_remove_button')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {activeTab === 'single' ? (
          /* Tek parça kıyafetler - Grid layout */
          <div className="grid grid-cols-2 gap-4">
            {clothingItems.map((item) => (
              <motion.div
                key={item.id}
                className={`relative bg-white border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                  selectedClothes.single?.id === item.id
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => onClothesSelect('single', item)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Kıyafet görseli */}
                <div className="aspect-[3/4] bg-gray-50 relative">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      // Görsel yüklenemezse placeholder göster
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                  <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                    <div className="text-center p-2">
                      <div className="text-xs text-gray-600 font-medium">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.category}</div>
                    </div>
                  </div>
                </div>
                
                {/* Seçim göstergesi */}
                {selectedClothes.single?.id === item.id && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center">
                    ✓
                  </div>
                )}

                {/* Kıyafet bilgisi */}
                <div className="p-2">
                  <h3 className="text-xs font-medium text-gray-900 truncate">{item.name}</h3>
                  <p className="text-xs text-gray-500">{item.category}</p>
                  {item.price && (
                    <p className="text-xs text-green-600 font-medium">{item.price}₺</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          /* Üst & Alt kombinasyonları */
          <div className="grid grid-cols-2 gap-4">
            {clothingItems.map((item) => (
              <motion.div
                key={item.id}
                className={`relative bg-white border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                  selectedClothes.combo?.id === item.id
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => onClothesSelect('combo', item)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Kombinasyon görseli */}
                <div className="aspect-[3/4] bg-gray-50 relative">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                  <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                    <div className="text-center p-2">
                      <div className="text-xs text-gray-600 font-medium">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.category}</div>
                    </div>
                  </div>
                </div>
                
                {/* Seçim göstergesi */}
                {selectedClothes.combo?.id === item.id && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center">
                    ✓
                  </div>
                )}

                {/* Kombinasyon bilgisi */}
                <div className="p-2">
                  <h3 className="text-xs font-medium text-gray-900 truncate">{item.name}</h3>
                  <p className="text-xs text-gray-500">{item.category}</p>
                  {item.price && (
                    <p className="text-xs text-green-600 font-medium">{item.price}₺</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Fixed bottom-left Try-On area inside the left panel */}
      <div className="mt-auto border-t border-gray-200 p-3 sticky bottom-0 bg-white">
        {/* Mini status line */}
        <div className="flex items-center justify-between mb-2 text-[11px] text-gray-600">
          <span className="px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200">
            {selectedModel ? t('clothing.status.model_selected') : t('clothing.status.model_waiting')}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200">
            {uploadedClothes.find(u => u.id === selectedUploadedItem)
              ? t('clothing.status.selected_single')
              : (upperClothing && lowerClothing)
                ? t('clothing.status.selected_combo')
                : t('clothing.status.clothing_waiting')}
          </span>
        </div>
        <motion.button
          onClick={async () => {
            // Aktif sekmeye göre doğru akışı tetikle
            if (activeTab === 'single') {
              const selectedItem = uploadedClothes.find(u => u.id === selectedUploadedItem)
              if (selectedItem && selectedModel) {
                await handleVirtualTryOn(selectedItem.imageData, selectedItem.type)
              }
              return
            }
            // combo sekmesi
            if (activeTab === 'combo') {
              if (upperClothing && lowerClothing && selectedModel) {
                await handleUpperLowerTryOn()
              }
              return
            }
          }}
          disabled={
            isProcessing ||
            !selectedModel ||
            (activeTab === 'single'
              ? !uploadedClothes.find(u => u.id === selectedUploadedItem)
              : !(upperClothing && lowerClothing))
          }
          className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-colors ${
            isProcessing || !selectedModel || (activeTab === 'single'
              ? !uploadedClothes.find(u => u.id === selectedUploadedItem)
              : !(upperClothing && lowerClothing))
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:from-teal-600 hover:to-emerald-600 shadow'
          }`}
          title={
            !selectedModel
              ? t('clothing.button.title_need_model')
                : (activeTab === 'single'
                    ? (uploadedClothes.find(u => u.id === selectedUploadedItem)
                        ? t('clothing.button.title_try_selected')
                        : t('clothing.button.title_need_clothing'))
                    : ((upperClothing && lowerClothing)
                        ? t('clothing.button.title_try_selected')
                        : t('clothing.button.title_need_clothing')))
          }
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-sm">{t('clothing.button.try')}</span>
        </motion.button>
      </div>

    </div>
  )
}
