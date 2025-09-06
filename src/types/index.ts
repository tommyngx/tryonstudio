// Ana uygulama tip tanımları

export interface User {
  id: string
  name?: string
  email?: string
  avatar?: string
}

export interface ClothingItem {
  id: string
  name: string
  category: 'gömlek' | 't-shirt' | 'hoodie' | 'ceket' | 'jean' | 'pantolon' | 'şort' | 'chino'
  type: 'upper' | 'lower'
  image: string
  brand?: string
  price?: number
  color?: string
  size?: string[]
  description?: string
  tags?: string[]
}

export interface UserPhoto {
  id: string
  originalImage: string
  processedImage?: string
  uploadedAt: Date
  metadata?: {
    width: number
    height: number
    format: string
    size: number
  }
}

export interface TryOnSession {
  id: string
  userPhoto: UserPhoto
  selectedClothes: {
    upper?: ClothingItem
    lower?: ClothingItem
  }
  processedImages: ProcessedImage[]
  createdAt: Date
  status: 'processing' | 'completed' | 'failed'
}

export interface ProcessedImage {
  id: string
  image: string
  type: 'tryon' | 'face_swap' | 'video_frame'
  processedAt: Date
  aiModel: string
  processingTime: number
  metadata?: {
    confidence: number
    quality: number
    [key: string]: any
  }
}

export interface VideoGeneration {
  id: string
  sessionId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  videoUrl?: string
  thumbnailUrl?: string
  duration?: number
  format: 'mp4' | 'webm'
  resolution: '720p' | '1080p' | '4k'
  createdAt: Date
  completedAt?: Date
}

export interface ProductSearch {
  id: string
  image: string
  results: ProductSearchResult[]
  searchedAt: Date
  provider: 'google_lens' | 'amazon' | 'custom'
}

export interface ProductSearchResult {
  id: string
  name: string
  brand: string
  price: number
  currency: string
  imageUrl: string
  productUrl: string
  storeName: string
  rating?: number
  availability: 'in_stock' | 'out_of_stock' | 'limited'
  similarity: number // 0-1 arası benzerlik skoru
}

// API Response tipleri
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  meta?: {
    timestamp: Date
    requestId: string
    processingTime: number
  }
}

export interface UploadResponse {
  fileId: string
  url: string
  metadata: {
    originalName: string
    size: number
    format: string
    width: number
    height: number
  }
}

// AI API tipleri
export interface AIProcessingRequest {
  userImage: string
  clothingItems: ClothingItem[]
  options?: {
    quality: 'fast' | 'balanced' | 'high'
    style: 'realistic' | 'artistic'
    background?: 'keep' | 'remove' | 'replace'
  }
}

export interface AIProcessingResponse {
  sessionId: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  result?: {
    processedImage: string
    confidence: number
    processingTime: number
  }
  estimatedTime?: number
  queuePosition?: number
}

// Component Props tipleri
export interface PhotoUploadProps {
  onPhotoUploaded: (photo: string) => void
  acceptedFormats?: string[]
  maxSize?: number
  quality?: number
}

export interface ClothingSelectorProps {
  onClothesSelected: (clothes: { upper?: string; lower?: string }) => void
  availableClothes?: ClothingItem[]
  allowCustomUpload?: boolean
}

export interface TryOnCanvasProps {
  userPhoto: string | null
  selectedClothes: { upper?: string; lower?: string }
  onComplete: () => void
}

// Store (Zustand) tipleri
export interface AppState {
  // User state
  user: User | null
  setUser: (user: User | null) => void
  
  // Current session
  currentSession: TryOnSession | null
  setCurrentSession: (session: TryOnSession | null) => void
  
  // UI state
  currentStep: 'upload' | 'select' | 'tryon' | 'result'
  setCurrentStep: (step: 'upload' | 'select' | 'tryon' | 'result') => void
  
  isProcessing: boolean
  setIsProcessing: (processing: boolean) => void
  
  // Processing state
  processingStep: string
  setProcessingStep: (step: string) => void
  
  progress: number
  setProgress: (progress: number) => void
}

// Utility tipleri
export type FileUploadStatus = 'idle' | 'uploading' | 'success' | 'error'

export interface ProcessingStep {
  id: string
  label: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  duration?: number
  error?: string
}

// Form validation tipleri
export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface FormState<T = any> {
  data: T
  errors: ValidationError[]
  isValid: boolean
  isSubmitting: boolean
}
