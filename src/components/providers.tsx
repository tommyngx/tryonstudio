'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  // React Query client'ı oluşturuyoruz - API istekleri için state management
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Cache süresi 5 dakika (AI işlemleri yavaş olabileceği için)
        staleTime: 5 * 60 * 1000,
        // Retry logic - AI API'leri bazen gecikebilir
        retry: (failureCount, error) => {
          if (failureCount < 2) return true
          return false
        }
      }
    }
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
