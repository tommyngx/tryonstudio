'use client'

import { usePathname } from 'next/navigation'
import { useI18n } from '@/i18n/useI18n'

export function ConditionalHeader() {
  const pathname = usePathname()
  const { lang, setLang } = useI18n()
  const { t } = useI18n()
  
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
          <span className="font-bold text-xl">{t('header.brand')}</span>
        </div>
        <div className="hidden md:flex items-center space-x-4">
          <nav className="flex items-center space-x-6">
            <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">
              {t('header.nav.features')}
            </a>
            <a href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">
              {t('header.nav.how')}
            </a>
            <a href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">
              {t('header.nav.pricing')}
            </a>
          </nav>
          {/* Language Toggle */}
          <div className="flex items-center gap-1 rounded-md border px-1 py-0.5">
            <button
              onClick={() => setLang('tr')}
              className={`px-2 py-1 text-xs font-medium rounded ${lang === 'tr' ? 'bg-primary text-primary-foreground' : 'text-gray-600 hover:text-gray-900'}`}
              aria-pressed={lang === 'tr'}
            >
              TR
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-2 py-1 text-xs font-medium rounded ${lang === 'en' ? 'bg-primary text-primary-foreground' : 'text-gray-600 hover:text-gray-900'}`}
              aria-pressed={lang === 'en'}
            >
              EN
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
