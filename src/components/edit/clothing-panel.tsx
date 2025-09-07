'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Upload, Info, X, Loader2, Sparkles, Camera, User } from 'lucide-react'
import Image from 'next/image'
import { allMenClothing, getMenClothingByType, ClothingSet } from '@/data/men-clothing'

// Yüklenen kıyafet için interface
interface UploadedClothing {
  id: string
  name: string
  type: 'single' | 'upper' | 'lower'
  clothingCategory: 'upper' | 'lower' | 'dress' // Kullanıcının seçtiği kategori
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
  // Face swap için kullanıcı fotoğrafı callback'i
  onUserPhotoUpload?: (userPhotoBase64: string) => void
}

export function ClothingPanel({ selectedClothes, onClothesSelect, selectedModel, onModelSelect, onTryOn, registerTryOnTrigger, onUserPhotoUpload }: ClothingPanelProps) {
  const [activeTab, setActiveTab] = useState<'single' | 'combo'>('single')
  // Cinsiyet sekmesi: erkek, kadın veya kendiniz
  const [genderTab, setGenderTab] = useState<'men' | 'women' | 'self'>('men') // Cinsiyet sekmesi
  const [uploadedClothes, setUploadedClothes] = useState<UploadedClothing[]>([])
  const [upperClothing, setUpperClothing] = useState<UploadedClothing | null>(null) // Üst giyim
  const [lowerClothing, setLowerClothing] = useState<UploadedClothing | null>(null) // Alt giyim
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedUploadedItem, setSelectedUploadedItem] = useState<string | null>(null)
  const [userPhoto, setUserPhoto] = useState<string | null>(null) // Kullanıcı fotoğrafı
  const [isFaceSwapEnabled, setIsFaceSwapEnabled] = useState(false) // Face swap modu
  const [showCategorySelector, setShowCategorySelector] = useState<string | null>(null) // Kategori seçici göster
  const fileInputRef = useRef<HTMLInputElement>(null)
  const userPhotoInputRef = useRef<HTMLInputElement>(null)
  // Hedef bölge ve kesim seçenekleri
  const [targetRegion, setTargetRegion] = useState<'upper' | 'lower' | 'dress'>('upper')
  const [fitMode, setFitMode] = useState<'normal' | 'slim' | 'oversize'>('normal')

  // Seçenekler bloğu: her zaman YÜKLEME BÖLÜMÜNDEN SONRA render edilecek
  const OptionsBlock = () => (
    <div className="mt-6 mb-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-3 relative z-0">
      <div>
        <label className="block text-xs text-gray-600 mb-1">Hedef Bölge</label>
        <select
          value={targetRegion}
          onChange={(e) => setTargetRegion(e.target.value as any)}
          className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white"
        >
          <option value="upper">Üst</option>
          <option value="lower">Alt</option>
          <option value="dress">Elbise/Takım</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">Kesim</label>
        <select
          value={fitMode}
          onChange={(e) => setFitMode(e.target.value as any)}
          className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white"
        >
          <option value="normal">Normal</option>
          <option value="slim">Slim</option>
          <option value="oversize">Oversize</option>
        </select>
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
    }
  }, [genderTab, onModelSelect])
  
  // Kullanıcı fotoğrafı yükleme işlemi
  const handleUserPhotoUpload = async (files: FileList) => {
    if (!files || files.length === 0) return
    
    setIsUploading(true)
    
    try {
      const file = files[0]
      
      // Dosya formatı kontrolü
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        alert('Desteklenen formatlar: JPEG, PNG, WebP')
        return
      }
      
      // Dosya boyutu kontrolü (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Dosya boyutu 5MB\'dan küçük olmalıdır')
        return
      }
      
      // Base64'e çevir
      const base64Data = await convertFileToBase64(file)
      const imageUrl = URL.createObjectURL(file)
      
      setUserPhoto(imageUrl)
      
      // "Kendiniz" modunda yüklenen fotoğrafı DOĞRUDAN MODEL olarak data URL (base64) formatında seç
      if (genderTab === 'self' && onModelSelect) {
        onModelSelect(base64Data) // data URL
      }

      // Parent component'e base64 data'yı ilet (faceswap akışında kullanılabilir, fakat self modunda zorunlu değil)
      if (onUserPhotoUpload) {
        const base64Only = base64Data.split(',')[1] // "data:image/..." kısmını kaldır
        onUserPhotoUpload(base64Only)
      }
      
    } catch (error) {
      console.error('Kullanıcı fotoğrafı yükleme hatası:', error)
      alert('Fotoğraf yüklenirken hata oluştu')
    } finally {
      setIsUploading(false)
    }
  }

  // Dosya yükleme işlemi (tek parça için)
  const handleFileUpload = async (files: FileList) => {
    if (!files || files.length === 0) return
    
    setIsUploading(true)
    
    try {
      const file = files[0]
      
      // Dosya formatı kontrolü (HEIC/HEIF desteği eklendi)
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/heic', 'image/heif']
      if (!allowedTypes.includes(file.type)) {
        alert('Desteklenen formatlar: JPEG, PNG, WebP, GIF, BMP')
        return
      }
      
      // Dosya boyutu kontrolü (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Dosya boyutu 10MB\'dan küçük olmalıdır')
        return
      }
      
      // Base64'e çevir
      const base64Data = await convertFileToBase64(file)
      const imageUrl = URL.createObjectURL(file)
      
      const uploadedItem: UploadedClothing = {
        id: `uploaded_${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ""), // Uzantıyı kaldır
        type: 'single',
        clothingCategory: 'upper', // Varsayılan olarak üst giyim, kullanıcı değiştirebilir
        imageUrl,
        imageData: base64Data.split(',')[1], // "data:image/..." kısmını kaldır
        uploadDate: new Date()
      }
      
      setUploadedClothes(prev => [uploadedItem, ...prev])
      // Son yüklenen öğeyi otomatik seç
      setSelectedUploadedItem(uploadedItem.id)
      
    } catch (error) {
      console.error('Dosya yükleme hatası:', error)
      alert('Dosya yüklenirken hata oluştu')
    } finally {
      setIsUploading(false)
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
        clothingCategory: 'upper',
        imageUrl,
        imageData: base64Data.split(',')[1],
        uploadDate: new Date()
      }
      
      setUpperClothing(upperItem)
      // Üst giyim seçildiğinde tek parça seçimi kaldır
      setSelectedUploadedItem(null)
      
    } catch (error) {
      console.error('Üst giyim yükleme hatası:', error)
      alert('Üst giyim yüklenirken hata oluştu')
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
      
      // Dosya kontrolü
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp']
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
        clothingCategory: 'lower',
        imageUrl,
        imageData: base64Data.split(',')[1],
        uploadDate: new Date()
      }
      
      setLowerClothing(lowerItem)
      // Alt giyim seçildiğinde tek parça seçimi kaldır
      setSelectedUploadedItem(null)
      
    } catch (error) {
      console.error('Alt giyim yükleme hatası:', error)
      alert('Alt giyim yüklenirken hata oluştu')
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
    setUploadedClothes(prev => prev.filter(item => item.id !== id))
    if (selectedUploadedItem === id) {
      setSelectedUploadedItem(null)
    }
  }

  // Kıyafet kategorisi değiştirme
  const handleCategoryChange = (itemId: string, newCategory: 'upper' | 'lower' | 'dress') => {
    setUploadedClothes(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, clothingCategory: newCategory }
        : item
    ))
    setShowCategorySelector(null)
  }
  
  // Virtual Try-On işlemi
  const handleVirtualTryOn = async (clothingImageData: string, clothingType: string) => {
    if (!selectedModel) {
      alert('Lütfen önce bir model seçin')
      return
    }
    
    // Seçili kıyafetin kategorisini kullan
    const selectedItem = uploadedClothes.find(item => item.id === selectedUploadedItem)
    const specificType = selectedItem ? selectedItem.clothingCategory : clothingType
    
    // Kullanıcının seçtiği hedef bölgeyi önceliklendirelim
    const region = targetRegion || specificType
    // Region=upper ise UI göstermeden zorla değiştir davranışını otomatik etkinleştir
    const options = { region, fit: fitMode, forceReplaceUpper: region === 'upper' }
    
    // Not: API çağrısı UI bileşeni içinde yapılmamalıdır. 
    // Bu bileşen yalnızca kullanıcının yüklediği kıyafet görselini parent'a iletir.
    // Böylece tek bir merkezde (Edit sayfası) inference çağrısı yapılır ve çift çağrı/yanlış veri rolü sorunları engellenir.
    try {
      if (onTryOn) {
        await onTryOn(clothingImageData, region, undefined, options)
      }
    } catch (error) {
      console.error('Virtual try-on tetikleme hatası:', error)
      alert('Virtual try-on işlemi başlatılamadı')
    }
  }

  // Üst+Alt deneme fonksiyonu
  const handleUpperLowerTryOn = async () => {
    if (!selectedModel) {
      alert('Lütfen önce bir model seçin')
      return
    }

    if (!upperClothing || !lowerClothing) {
      alert('Üst ve alt giyim yükleyin')
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
      alert('Üst+Alt deneme işleminde hata oluştu')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Kıyafet seç</h2>
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
            Tek parça
          </button>
          <button
            onClick={() => setActiveTab('combo')}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'combo' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Üst & Alt
          </button>
        </div>
      </div>

      {/* Face Swap Toggle (Kendiniz modunda gizli) */}
      {genderTab !== 'self' && (
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-medium text-gray-900">Face Swap Modu</span>
          </div>
          <button
            onClick={() => setIsFaceSwapEnabled(!isFaceSwapEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isFaceSwapEnabled ? 'bg-purple-500' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isFaceSwapEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        {isFaceSwapEnabled && (
          <p className="text-xs text-gray-500 mt-1">
            Kendi fotoğrafınızı yükleyerek manken modelin yüzü ile değiştirin
          </p>
        )}
      </div>
      )}

      {/* User Photo Upload Area - Face Swap Mode (Kendiniz modunda gizli) */}
      {genderTab !== 'self' && isFaceSwapEnabled && (
        <div className="p-4 border-b border-gray-100">
          <input
            ref={userPhotoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files && handleUserPhotoUpload(e.target.files)}
          />
          
          {!userPhoto ? (
            <div 
              className="border-2 border-dashed border-purple-300 rounded-lg p-6 text-center hover:border-purple-400 hover:bg-purple-50/50 transition-colors cursor-pointer"
              onClick={() => userPhotoInputRef.current?.click()}
            >
              <div className="flex flex-col items-center">
                <Camera className="w-8 h-8 text-purple-500 mb-2" />
                <p className="text-sm font-medium text-purple-600">Fotoğrafınızı Yükleyin</p>
                <p className="text-xs text-gray-500 mt-1">Yüzünüz net görünen bir fotoğraf seçin</p>
                <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP (Max 5MB)</p>
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="aspect-square w-24 mx-auto rounded-lg overflow-hidden border-2 border-purple-200">
                <img src={userPhoto} alt="Kullanıcı fotoğrafı" className="w-full h-full object-cover" />
              </div>
              <div className="text-center mt-2">
                <p className="text-sm font-medium text-green-600">Fotoğraf yüklendi</p>
                <button
                  onClick={() => {
                    setUserPhoto(null)
                    if (onUserPhotoUpload) onUserPhotoUpload('')
                  }}
                  className="text-xs text-red-500 hover:text-red-700 mt-1"
                >
                  Kaldır
                </button>
              </div>
            </div>
          )}
        </div>
      )}

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

        {/* Upload Areas - Tab'a göre değişir */}
        {activeTab === 'single' ? (
          // Tek Parça Upload Area (Eğer kullanıcı en az bir görsel yüklediyse gizle)
          uploadedClothes.length === 0 ? (
            <div className="mb-6">
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 md:p-8 hover:border-blue-400 hover:bg-blue-50/50 transition-colors cursor-pointer relative"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {isUploading ? (
                  <div className="flex items-center justify-center gap-3">
                    <Loader2 className="w-6 h-6 md:w-8 md:h-8 text-blue-500 animate-spin" />
                    <div className="text-left">
                      <p className="text-base font-medium text-blue-600 leading-tight">Yükleniyor...</p>
                      <p className="text-sm text-gray-500">Lütfen bekleyin</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3 md:gap-4">
                    <Plus className="w-6 h-6 md:w-8 md:h-8 text-teal-500" />
                    <div className="text-left">
                      <p className="text-base font-medium text-teal-600 leading-tight">Tek Parça Kıyafet Ekle</p>
                      <p className="text-sm text-gray-500">Veya buraya sürükleyip bırakın</p>
                      <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP, GIF, BMP (Max 10MB)</p>
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
              <h3 className="text-sm font-medium text-gray-900">Üst Giyim</h3>
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
                    <p className="text-xs text-gray-500">Üst giyim hazır</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Plus className="w-6 h-6 text-blue-500 mb-2" />
                    <p className="text-sm font-medium text-blue-600">Üst Giyim Ekle</p>
                    <p className="text-xs text-gray-500">Tişört, gömlek, ceket vb.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Alt Giyim Upload Area */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-900">Alt Giyim</h3>
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
                    <p className="text-xs text-gray-500">Alt giyim hazır</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Plus className="w-6 h-6 text-green-500 mb-2" />
                    <p className="text-sm font-medium text-green-600">Alt Giyim Ekle</p>
                    <p className="text-xs text-gray-500">Pantolon, şort, etek vb.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Üst+Alt Deneme Butonu kaldırıldı: sol alttaki ana buton kullanılacak */}
          </div>
        )}

        {/* Yüklenen Kıyafetler */}
        {uploadedClothes.length > 0 && (
          <div className="mb-6 relative z-10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Yüklenen Kıyafetler</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{uploadedClothes.length} öğe</span>
                {/* Küçük ekle butonu: gizli input'u tetikler */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2 py-1 text-[11px] rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                  title="Yeni kıyafet ekle"
                >
                  + Ekle
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
                      <p className="text-xs text-gray-500">{item.type === 'single' ? 'Tek parça' : 'Üst & Alt'}</p>
                      {/* Kategori seçici butonu */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowCategorySelector(showCategorySelector === item.id ? null : item.id)
                        }}
                        className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                        title="Kıyafet kategorisini değiştir"
                      >
                        {item.clothingCategory === 'upper' ? 'Üst' : item.clothingCategory === 'lower' ? 'Alt' : 'Elbise'}
                      </button>
                    </div>
                    
                    {/* Kategori seçici dropdown */}
                    {showCategorySelector === item.id && (
                      <div className="absolute z-10 mt-1 right-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[120px]">
                        <div className="space-y-1">
                          <button
                            onClick={() => handleCategoryChange(item.id, 'upper')}
                            className={`w-full text-left text-xs px-2 py-1 rounded hover:bg-gray-100 ${
                              item.clothingCategory === 'upper' ? 'bg-blue-100 text-blue-700' : 'text-gray-700'
                            }`}
                          >
                            👔 Üst Giyim
                          </button>
                          <button
                            onClick={() => handleCategoryChange(item.id, 'lower')}
                            className={`w-full text-left text-xs px-2 py-1 rounded hover:bg-gray-100 ${
                              item.clothingCategory === 'lower' ? 'bg-blue-100 text-blue-700' : 'text-gray-700'
                            }`}
                          >
                            👖 Alt Giyim
                          </button>
                          <button
                            onClick={() => handleCategoryChange(item.id, 'dress')}
                            className={`w-full text-left text-xs px-2 py-1 rounded hover:bg-gray-100 ${
                              item.clothingCategory === 'dress' ? 'bg-blue-100 text-blue-700' : 'text-gray-700'
                            }`}
                          >
                            👗 Elbise
                          </button>
                        </div>
                      </div>
                    )}
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
            <h3 className="text-sm font-semibold text-gray-900">Manken Modeller</h3>
            {/* Cinsiyet seçimi için şık dropdown - Toggle yerine */}
            {/* Bu select, genderTab state'ini günceller; useEffect ile model otomatik ayarlanır */}
            <div className="relative">
              <select
                aria-label="Cinsiyet seçimi"
                value={genderTab}
                onChange={(e) => setGenderTab(e.target.value as 'men' | 'women' | 'self')}
                className="appearance-none bg-white border border-gray-300 text-gray-700 text-xs font-medium rounded-md pl-3 pr-8 py-2 shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-purple-300 focus:border-purple-400 transition-colors"
              >
                <option value="men">👨 Erkek</option>
                <option value="women">👩 Kadın</option>
                <option value="self">🧑 Modeliniz</option>
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
                    alt="Erkek Model"
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
                  <p className="text-xs font-medium text-gray-900">Model 1</p>
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
                    alt="Kadın Model"
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
                  <p className="text-xs font-medium text-gray-900">Model 1</p>
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
              <p className="text-xs text-gray-500">Model Ekle</p>
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
              <p className="text-xs text-gray-500">Model Ekle</p>
            </motion.div>
          </div>
          ) : (
            // Modeliniz Bölümü: Face Swap yönlendirmesi ve hızlı yükleme
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-3">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-purple-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-purple-900">Modeliniz</h4>
                  <p className="text-xs text-purple-800 mt-0.5">Kendi fotoğrafınızı yükleyin; fotoğrafınız doğrudan model olarak kullanılacaktır. Yükledikten sonra alttaki "AI ile Dene" butonu ile devam edin.</p>
                  {/* Self modu için gizli input (Face Swap UI gizli olduğunda da kullanılabilir) */}
                  <input
                    ref={userPhotoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files && handleUserPhotoUpload(e.target.files)}
                  />
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => userPhotoInputRef.current?.click()}
                      className="px-2.5 py-1.5 text-xs rounded-md bg-purple-600 text-white hover:bg-purple-700"
                    >
                      Fotoğrafınızı Yükleyin
                    </button>
                  </div>
                  {userPhoto && (
                    <div className="mt-3 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-md overflow-hidden border-2 border-purple-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={userPhoto} alt="Kullanıcı fotoğrafı" className="w-full h-full object-cover" />
                      </div>
                      <div className="text-xs text-purple-900">
                        Fotoğraf yüklendi. Denemeye hazırsınız.
                      </div>
                    </div>
                  )}
                  <div className="mt-3 text-[11px] text-purple-800">
                    Seçili model: <span className="font-medium">{selectedModel ? 'Var' : 'Yok (Lütfen bir model seçin)'}</span>
                  </div>
                </div>
              </div>
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
            {selectedModel ? 'Model seçildi' : 'Model bekleniyor'}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200">
            {uploadedClothes.find(u => u.id === selectedUploadedItem)
              ? 'Seçili: Tek parça'
              : (upperClothing && lowerClothing)
                ? 'Seçili: Üst + Alt'
                : 'Kıyafet bekleniyor'}
          </span>
        </div>
        <motion.button
          onClick={async () => {
            // Face swap modu aktifse ve kullanıcı fotoğrafı varsa önce face swap yap
            if (isFaceSwapEnabled && userPhoto && selectedModel) {
              // Face swap işlemi burada yapılacak - parent component'e bildirilecek
              console.log('Face swap işlemi başlatılacak')
              // TODO: Face swap callback'i eklenecek
            }
            
            const selectedItem = uploadedClothes.find(u => u.id === selectedUploadedItem)
            if (selectedItem && selectedModel) {
              await handleVirtualTryOn(selectedItem.imageData, selectedItem.type)
              return
            }
            if (upperClothing && lowerClothing && selectedModel) {
              await handleUpperLowerTryOn()
              return
            }
          }}
          disabled={
            isProcessing ||
            !selectedModel ||
            (
              !uploadedClothes.find(u => u.id === selectedUploadedItem) && !(upperClothing && lowerClothing)
            ) ||
            // Face Swap bağımlı disable sadece self dışı modlarda geçerli
            (genderTab !== 'self' && isFaceSwapEnabled && !userPhoto)
          }
          className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-colors ${
            isProcessing || !selectedModel || (!uploadedClothes.find(u => u.id === selectedUploadedItem) && !(upperClothing && lowerClothing))
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:from-teal-600 hover:to-emerald-600 shadow'
          }`}
          title={
            !selectedModel
              ? 'Önce bir model seçin'
              : (genderTab !== 'self' && isFaceSwapEnabled && !userPhoto)
                ? 'Face swap için fotoğrafınızı yükleyin'
                : uploadedClothes.find(u => u.id === selectedUploadedItem) || (upperClothing && lowerClothing)
                  ? 'Seçili kıyafeti dene'
                  : 'Önce bir kıyafet yükleyin/seçin'
          }
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-sm">AI ile Dene</span>
        </motion.button>
      </div>
    </div>
  )
}
