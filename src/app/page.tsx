'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, Sparkles, Video, ShoppingBag, ArrowRight, Camera, Shirt, Zap } from 'lucide-react'
import { PhotoUpload } from '@/components/photo-upload'
import { ClothingSelector } from '@/components/clothing-selector'
import { TryOnCanvas } from '@/components/tryon-canvas'
import { useI18n } from '@/i18n/useI18n'

export default function HomePage() {
  const { t } = useI18n()
  const [currentStep, setCurrentStep] = useState<'upload' | 'select' | 'tryon' | 'result'>('upload')
  const [userPhoto, setUserPhoto] = useState<string | null>(null)
  const [selectedClothes, setSelectedClothes] = useState<{upper?: string, lower?: string}>({})

  const steps = [
    { id: 'upload', label: t('home.steps.upload'), icon: Camera },
    { id: 'select', label: t('home.steps.select'), icon: Shirt },
    { id: 'tryon', label: t('home.steps.tryon'), icon: Sparkles },
    { id: 'result', label: t('home.steps.result'), icon: Video }
  ]

  const features = [
    { icon: Upload, title: t('home.features.upload.title'), description: t('home.features.upload.desc') },
    { icon: Sparkles, title: t('home.features.face_swap.title'), description: t('home.features.face_swap.desc') },
    { icon: Shirt, title: t('home.features.vtryon.title'), description: t('home.features.vtryon.desc') },
    { icon: Video, title: t('home.features.video.title'), description: t('home.features.video.desc') },
    { icon: ShoppingBag, title: t('home.features.find.title'), description: t('home.features.find.desc') },
    { icon: Zap, title: t('home.features.fast.title'), description: t('home.features.fast.desc') },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-brand-100 opacity-70" />
        <div className="container relative z-10">
          <motion.div 
            className="text-center max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              {t('home.hero.title_prefix')}
              <span className="bg-gradient-to-r from-brand-600 to-brand-500 bg-clip-text text-transparent">
                {" "}{t('home.hero.title_highlight')}
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
              {t('home.hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <motion.button
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-lg font-semibold text-lg transition-colors shadow-lg"
                onClick={() => window.location.href = '/edit'}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {t('home.hero.cta_studio')}
                <ArrowRight className="ml-2 h-5 w-5 inline" />
              </motion.button>
              
              <motion.button
                className="bg-white hover:bg-gray-50 text-primary border-2 border-primary px-8 py-4 rounded-lg font-semibold text-lg transition-colors shadow-lg"
                onClick={() => setCurrentStep('upload')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {t('home.hero.cta_guided')}
                <Sparkles className="ml-2 h-5 w-5 inline" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Progress Steps */}
      <section className="py-12 border-b bg-white/50">
        <div className="container">
          <div className="flex justify-center">
            <div className="flex items-center space-x-8">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-colors ${
                    currentStep === step.id 
                      ? 'bg-primary border-primary text-primary-foreground' 
                      : 'bg-white border-border text-muted-foreground'
                  }`}>
                    <step.icon className="w-5 h-5" />
                  </div>
                  <span className="ml-3 font-medium text-sm hidden md:inline">
                    {step.label}
                  </span>
                  {index < steps.length - 1 && (
                    <div className="w-8 h-px bg-border ml-6" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Application Interface */}
      <section className="py-12 flex-1">
        <div className="container max-w-6xl">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {currentStep === 'upload' && (
              <PhotoUpload 
                onPhotoUploaded={(photo) => {
                  setUserPhoto(photo)
                  setCurrentStep('select')
                }}
              />
            )}
            
            {currentStep === 'select' && (
              <ClothingSelector 
                onClothesSelected={(clothes) => {
                  setSelectedClothes(clothes)
                  setCurrentStep('tryon')
                }}
              />
            )}
            
            {currentStep === 'tryon' && (
              <TryOnCanvas 
                userPhoto={userPhoto}
                selectedClothes={selectedClothes}
                onComplete={() => setCurrentStep('result')}
              />
            )}
            
            {currentStep === 'result' && (
              <div className="text-center py-20">
                <h2 className="text-3xl font-bold mb-4">{t('home.result.title')}</h2>
                <p className="text-muted-foreground mb-8">{t('home.result.subtitle')}</p>
                {/* Sonuç bileşeni burada olacak */}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight mb-4">{t('home.features_title')}</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{t('home.features_subtitle')}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-shadow"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="flex items-center justify-center w-12 h-12 bg-brand-100 text-brand-600 rounded-lg mb-4">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight mb-4">{t('home.how_title')}</h2>
            <p className="text-xl text-muted-foreground">{t('home.how_subtitle')}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={step.id} className="text-center">
                <div className="flex items-center justify-center w-16 h-16 bg-primary text-primary-foreground rounded-full mx-auto mb-4 text-xl font-bold">
                  {index + 1}
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.label}</h3>
                <p className="text-muted-foreground text-sm">
                  {step.id === 'upload' && t('home.how_steps.upload')}
                  {step.id === 'select' && t('home.how_steps.select')}
                  {step.id === 'tryon' && t('home.how_steps.tryon')}
                  {step.id === 'result' && t('home.how_steps.result')}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
