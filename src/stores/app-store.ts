import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { AppState, User, TryOnSession } from '@/types'

// Ana uygulama state store'u
export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // User state
        user: null,
        setUser: (user: User | null) => set({ user }),
        
        // Current session
        currentSession: null,
        setCurrentSession: (session: TryOnSession | null) => set({ currentSession: session }),
        
        // UI state - sürekli değiştiği için persist etmiyoruz
        currentStep: 'upload',
        setCurrentStep: (step: 'upload' | 'select' | 'tryon' | 'result') => set({ currentStep: step }),
        
        isProcessing: false,
        setIsProcessing: (processing: boolean) => set({ isProcessing: processing }),
        
        // Processing state
        processingStep: '',
        setProcessingStep: (step: string) => set({ processingStep: step }),
        
        progress: 0,
        setProgress: (progress: number) => set({ progress }),
      }),
      {
        name: 'tryonx-storage',
        // Sadece kalıcı verileri persist et
        partialize: (state) => ({
          user: state.user,
          currentSession: state.currentSession,
        }),
      }
    ),
    {
      name: 'tryonx-store',
    }
  )
)
