'use client'

import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { createTranslator, DICTS } from './index'
import type { I18nContextValue, Language } from './types'

export const I18nContext = createContext<I18nContextValue | undefined>(undefined)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // Varsayılan dil: tarayıcı/localStorage, yoksa TR
  const [lang, setLangState] = useState<Language>('tr')

  useEffect(() => {
    try {
      const saved = localStorage.getItem('lang') as Language | null
      if (saved && (saved === 'tr' || saved === 'en')) {
        setLangState(saved)
        return
      }

      // Otomatik dil tespiti (yalnızca cihaz dili)
      try {
        const langs: string[] = Array.isArray((navigator as any)?.languages) && (navigator as any)?.languages.length
          ? (navigator as any).languages
          : [ (navigator as any)?.language ].filter(Boolean)
        const primary = (langs[0] || '').toLowerCase()
        const detected: Language = primary.startsWith('tr') ? 'tr' : 'en'
        setLangState(detected)
        localStorage.setItem('lang', detected)
      } catch {}
    } catch {}
  }, [])

  const setLang = useCallback((l: Language) => {
    setLangState(l)
    try { localStorage.setItem('lang', l) } catch {}
  }, [])

  const t = useMemo(() => createTranslator(lang), [lang])

  const value: I18nContextValue = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t])

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  )
}
