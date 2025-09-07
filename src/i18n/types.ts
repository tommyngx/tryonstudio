export type Language = 'tr' | 'en'

export type Dict = Record<string, any>

export interface I18nContextValue {
  lang: Language
  setLang: (lang: Language) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}
