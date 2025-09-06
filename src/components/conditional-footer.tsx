'use client'

import { usePathname } from 'next/navigation'

export function ConditionalFooter() {
  const pathname = usePathname()
  
  // Edit sayfasında footer gizle
  if (pathname.startsWith('/edit')) {
    return null
  }

  return (
    <footer className="border-t">
      <div className="container py-8 md:py-12">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
            <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
              © 2024 TryOnX. Tüm hakları saklıdır.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
