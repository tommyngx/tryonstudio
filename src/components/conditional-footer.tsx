'use client'

import { usePathname } from 'next/navigation'
import { useI18n } from '@/i18n/useI18n'

export function ConditionalFooter() {
  const pathname = usePathname()
  const { t } = useI18n()
  
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
              {t('footer.copyright', { year: String(new Date().getFullYear()) })}
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
