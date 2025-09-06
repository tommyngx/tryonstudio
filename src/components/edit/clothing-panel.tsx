'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Plus, Upload, Info, X, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { allMenClothing, getMenClothingByType, ClothingSet } from '@/data/men-clothing'

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
  onTryOn?: (clothingImageData: string, clothingType: string, additionalClothing?: any[]) => void
}

export function ClothingPanel({ selectedClothes, onClothesSelect, selectedModel, onModelSelect, onTryOn }: ClothingPanelProps) {
  const [activeTab, setActiveTab] = useState<'single' | 'combo'>('single')
  const [uploadedClothes, setUploadedClothes] = useState<UploadedClothing[]>([])
  const [upperClothing, setUpperClothing] = useState<UploadedClothing | null>(null) // Üst giyim
  const [lowerClothing, setLowerClothing] = useState<UploadedClothing | null>(null) // Alt giyim
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedUploadedItem, setSelectedUploadedItem] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Aktif tab'a göre kıyafetleri getir
  const clothingItems = getMenClothingByType(activeTab)
  
  // Dosya yükleme işlemi (tek parça için)
  const handleFileUpload = async (files: FileList) => {
    if (!files || files.length === 0) return
    
    setIsUploading(true)
    
    try {
      const file = files[0]
      
      // Dosya formatı kontrolü
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp']
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
        imageUrl,
        imageData: base64Data.split(',')[1], // "data:image/..." kısmını kaldır
        uploadDate: new Date()
      }
      
      setUploadedClothes(prev => [uploadedItem, ...prev])
      
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
      
      const upperItem: UploadedClothing = {
        id: `upper_${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ""),
        type: 'upper',
        imageUrl,
        imageData: base64Data.split(',')[1],
        uploadDate: new Date()
      }
      
      setUpperClothing(upperItem)
      
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
        imageUrl,
        imageData: base64Data.split(',')[1],
        uploadDate: new Date()
      }
      
      setLowerClothing(lowerItem)
      
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
  
  // Virtual Try-On işlemi
  const handleVirtualTryOn = async (clothingImageData: string, clothingType: string) => {
    if (!selectedModel) {
      alert('Lütfen önce bir model seçin')
      return
    }
    
    setIsProcessing(true)
    
    try {
      // Model görselini yükle ve base64'e çevir
      const response = await fetch(selectedModel)
      const blob = await response.blob()
      const modelFile = new File([blob], 'model.jpg', { type: 'image/jpeg' })
      const modelImageData = await convertFileToBase64(modelFile)
      const modelBase64 = modelImageData.split(',')[1]
      
      // Nano Banana API çağrısı
      const apiResponse = await fetch('/api/nano-banana', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelImage: modelBase64,
          clothingImage: clothingImageData,
          clothingType: clothingType,
          options: {}
        }),
      })
      
      const result = await apiResponse.json()
      
      if (result.success && result.data.generatedImage) {
        // Sonucu parent component'e gönder
        if (onTryOn) {
          onTryOn(result.data.generatedImage, clothingType)
        }
      } else {
        alert(`Virtual try-on başarısız: ${result.error || 'Bilinmeyen hata'}`)
      }
      
    } catch (error) {
      console.error('Virtual try-on hatası:', error)
      alert('Virtual try-on işlemi başarısız oldu')
    } finally {
      setIsProcessing(false)
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

      await onTryOn(upperClothing.imageData, upperClothing.type, additionalClothing)
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
          // Tek Parça Upload Area
          <div className="mb-6">
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-colors cursor-pointer relative"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {isUploading ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="w-8 h-8 text-blue-500 mb-3 animate-spin" />
                  <p className="text-base font-medium text-blue-600 mb-1">Yükleniyor...</p>
                  <p className="text-sm text-gray-500">Lütfen bekleyin</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Plus className="w-8 h-8 text-teal-500 mb-3" />
                  <p className="text-base font-medium text-teal-600 mb-1">Tek Parça Kıyafet Ekle</p>
                  <p className="text-sm text-gray-500">Veya buraya sürükleyip bırakın</p>
                  <p className="text-xs text-gray-400 mt-2">JPEG, PNG, WebP, GIF, BMP (Max 10MB)</p>
              </div>
            )}
          </div>
        </div>
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

            {/* Üst+Alt Deneme Butonu */}
            {upperClothing && lowerClothing && (
              <button
                onClick={handleUpperLowerTryOn}
                disabled={isProcessing || !selectedModel}
                className={`w-full py-3 px-4 text-sm font-medium rounded-lg transition-colors ${
                  isProcessing || !selectedModel
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-green-500 text-white hover:from-blue-600 hover:to-green-600 shadow-md'
                }`}
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Üst+Alt Birlikte Deneniyor...
                  </div>
                ) : (
                  '🤖 AI ile Üst+Alt Dene'
                )}
              </button>
            )}
          </div>
        )}

        {/* Yüklenen Kıyafetler */}
        {uploadedClothes.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Yüklenen Kıyafetler</h3>
              <span className="text-xs text-gray-500">{uploadedClothes.length} öğe</span>
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
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
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
                    <p className="text-xs text-gray-500">{item.type === 'single' ? 'Tek parça' : 'Üst & Alt'}</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleVirtualTryOn(item.imageData, item.type)
                      }}
                      disabled={isProcessing || !selectedModel}
                      className={`w-full mt-2 py-1 px-2 text-xs rounded-md transition-colors ${
                        isProcessing || !selectedModel
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-teal-500 text-white hover:bg-teal-600'
                      }`}
                    >
                      {isProcessing ? (
                        <div className="flex items-center justify-center">
                          <Loader2 className="w-3 h-3 animate-spin mr-1" />
                          İşleniyor...
                        </div>
                      ) : (
                        '🤖 AI ile Dene'
                      )}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Erkek Modeller Bölümü */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Erkek Modeller</h3>
          <div className="grid grid-cols-3 gap-3">
            <motion.div
              className={`relative bg-white border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                selectedModel === '/images/men/8a46ed29-5dd4-45c6-924c-555332e0f9e0.jpg'
                  ? 'border-teal-500 ring-2 ring-teal-200'
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
                <div className="absolute top-2 right-2 w-6 h-6 bg-teal-500 text-white rounded-full flex items-center justify-center">
                  ✓
                </div>
              )}
              
              <div className="p-2">
                <p className="text-xs font-medium text-gray-900">Model 1</p>
                <p className="text-xs text-gray-500">Erkek</p>
              </div>
            </motion.div>
            
            {/* Model ekleme placeholder'ları */}
            <motion.div
              className="aspect-[3/4] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-blue-400 hover:bg-blue-50/50 transition-colors cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-6 h-6 text-gray-400 mb-1" />
              <p className="text-xs text-gray-500">Model Ekle</p>
            </motion.div>
            
            <motion.div
              className="aspect-[3/4] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-blue-400 hover:bg-blue-50/50 transition-colors cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-6 h-6 text-gray-400 mb-1" />
              <p className="text-xs text-gray-500">Model Ekle</p>
            </motion.div>
          </div>
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
            
            {/* Alt ekle butonu */}
            <motion.div
              className="flex flex-col justify-center items-center border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-xs text-gray-600 text-center font-medium">Alt ekle</p>
            </motion.div>
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
            
            {/* Kombinasyon ekle butonu */}
            <motion.div
              className="flex flex-col justify-center items-center border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-xs text-gray-600 text-center font-medium">Kombinasyon Ekle</p>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}
