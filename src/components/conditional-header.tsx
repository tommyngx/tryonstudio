'use client'

import { usePathname } from 'next/navigation'

export function ConditionalHeader() {
  const pathname = usePathname()
  
  // Edit sayfasında header gizle
  if (pathname.startsWith('/edit')) {
    return null
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            T
          </div>
          <span className="font-bold text-xl">TryOnX</span>
        </div>
        <nav className="hidden md:flex items-center space-x-6">
          <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">
            Özellikler
          </a>
          <a href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">
            Nasıl Çalışır
          </a>
          <a href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">
            Fiyatlandırma
          </a>
        </nav>
      </div>
    </header>
  )
}
