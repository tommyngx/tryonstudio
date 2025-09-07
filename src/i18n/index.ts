import tr from './tr.json'
import en from './en.json'
import type { Dict } from './types'

const DICTS: Record<string, Dict> = { tr, en }

function get(obj: any, path: string): any {
  // Basit nested key okuma: "a.b.c"
  return path.split('.').reduce((acc: any, part: string) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj)
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!template || !vars) return template
  return template.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? String(vars[k]) : `{${k}}`))
}

export function createTranslator(lang: 'tr' | 'en') {
  const dict = DICTS[lang] || DICTS.tr
  return (key: string, vars?: Record<string, string | number>) => {
    const raw = get(dict, key)
    if (typeof raw === 'string') return interpolate(raw, vars)
    // Bulunamazsa anahtarın kendisini döndür, kırılmayı önle
    return key
  }
}

export { DICTS }
