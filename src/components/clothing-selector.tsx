'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, Check, Shirt, ArrowRight, Package } from 'lucide-react'
import Image from 'next/image'

interface ClothingSelectorProps {
  onClothesSelected: (clothes: { upper?: string; lower?: string }) => void
}

// Örnek kıyafet verileri - gerçek uygulamada API'den gelecek
const sampleClothes = {
  upper: [
    { id: 'shirt1', name: 'Mavi Gömlek', image: '/api/placeholder/200/300', category: 'gömlek' },
    { id: 'tshirt1', name: 'Beyaz T-Shirt', image: '/api/placeholder/200/300', category: 't-shirt' },
    { id: 'hoodie1', name: 'Gri Hoodie', image: '/api/placeholder/200/300', category: 'hoodie' },
    { id: 'jacket1', name: 'Siyah Ceket', image: '/api/placeholder/200/300', category: 'ceket' },
  ],
  lower: [
    { id: 'jeans1', name: 'Mavi Jean', image: '/api/placeholder/200/300', category: 'jean' },
    { id: 'pants1', name: 'Siyah Pantolon', image: '/api/placeholder/200/300', category: 'pantolon' },
    { id: 'shorts1', name: 'Krem Şort', image: '/api/placeholder/200/300', category: 'şort' },
    { id: 'chinos1', name: 'Bej Chino', image: '/api/placeholder/200/300', category: 'chino' },
  ]
}

export function ClothingSelector({ onClothesSelected }: ClothingSelectorProps) {
  const [selectedUpper, setSelectedUpper] = useState<string | null>(null)
  const [selectedLower, setSelectedLower] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'upper' | 'lower'>('upper')

  // Kıyafet seçimi tamamlandığında
  const handleContinue = () => {
    const clothes: { upper?: string; lower?: string } = {}
    if (selectedUpper) clothes.upper = selectedUpper
    if (selectedLower) clothes.lower = selectedLower
    
    onClothesSelected(clothes)
  }

  // Kıyafet öğesi seçme
  const handleItemSelect = (itemId: string, type: 'upper' | 'lower') => {
    if (type === 'upper') {
      setSelectedUpper(itemId)
    } else {
      setSelectedLower(itemId)
    }
  }

  // Özel kıyafet yükleme (placeholder)
  const handleCustomUpload = (type: 'upper' | 'lower') => {
    // Gerçek implementasyonda file upload olacak
    console.log(`Custom ${type} upload`)
  }

  const isReadyToContinue = selectedUpper || selectedLower

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Kıyafetlerinizi Seçin</h2>
        <p className="text-muted-foreground text-lg">
          Üst ve alt kıyafetlerden beğendiklerinizi seçin. Kendi kıyafetinizi de yükleyebilirsiniz.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('upper')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-md font-medium transition-colors ${
              activeTab === 'upper' 
                ? 'bg-white text-primary shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Shirt className="w-5 h-5" />
            <span>Üst Giyim</span>
            {selectedUpper && <Check className="w-4 h-4 text-green-600" />}
          </button>
          <button
            onClick={() => setActiveTab('lower')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-md font-medium transition-colors ${
              activeTab === 'lower' 
                ? 'bg-white text-primary shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Package className="w-5 h-5" />
            <span>Alt Giyim</span>
            {selectedLower && <Check className="w-4 h-4 text-green-600" />}
          </button>
        </div>
      </div>

      {/* Clothing Grid */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {/* Custom Upload Card */}
          <div
            onClick={() => handleCustomUpload(activeTab)}
            className="group cursor-pointer bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary hover:bg-primary/5 transition-colors"
          >
            <div className="flex flex-col items-center space-y-3">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="font-medium text-sm">Kendi Kıyafetinizi</p>
                <p className="font-medium text-sm">Yükleyin</p>
              </div>
            </div>
          </div>

          {/* Sample Clothes */}
          {sampleClothes[activeTab].map((item) => (
            <motion.div
              key={item.id}
              className={`group cursor-pointer bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden border-2 ${
                (activeTab === 'upper' ? selectedUpper : selectedLower) === item.id
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-transparent hover:border-gray-200'
              }`}
              onClick={() => handleItemSelect(item.id, activeTab)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Placeholder Image */}
              <div className="aspect-[3/4] bg-gray-100 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-2 flex items-center justify-center">
                      {activeTab === 'upper' ? <Shirt className="w-8 h-8 text-gray-400" /> : <Package className="w-8 h-8 text-gray-400" />}
                    </div>
                    <p className="text-xs text-gray-500">{item.name}</p>
                  </div>
                </div>
                
                {/* Selection Indicator */}
                {(activeTab === 'upper' ? selectedUpper : selectedLower) === item.id && (
                  <div className="absolute top-3 right-3 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Item Info */}
              <div className="p-3">
                <h3 className="font-medium text-sm mb-1">{item.name}</h3>
                <p className="text-xs text-muted-foreground capitalize">{item.category}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Selection Summary */}
      <div className="bg-white rounded-lg border p-6 mb-8">
        <h3 className="font-semibold mb-4">Seçimleriniz:</h3>
        <div className="flex items-center justify-between">
          <div className="flex space-x-8">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Üst Giyim</p>
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                {selectedUpper ? (
                  <Check className="w-6 h-6 text-green-600" />
                ) : (
                  <Shirt className="w-6 h-6 text-gray-400" />
                )}
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Alt Giyim</p>
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                {selectedLower ? (
                  <Check className="w-6 h-6 text-green-600" />
                ) : (
                  <Package className="w-8 h-8 text-gray-400 group-hover:text-gray-600 transition-colors" />
                )}
              </div>
            </div>
          </div>
          
          <motion.button
            onClick={handleContinue}
            disabled={!isReadyToContinue}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all ${
              isReadyToContinue
                ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            whileHover={isReadyToContinue ? { scale: 1.02 } : {}}
            whileTap={isReadyToContinue ? { scale: 0.98 } : {}}
          >
            <span>Denemeye Başla</span>
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">💡 İpuçları:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• En az bir kıyafet seçmelisiniz</li>
          <li>• Kendi kıyafetinizi yükleyebilirsiniz</li>
          <li>• Daha iyi sonuç için net, düz kıyafet fotoğrafları kullanın</li>
        </ul>
      </div>
    </div>
  )
}
