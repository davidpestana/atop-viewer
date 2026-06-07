import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Locale } from '../types'
import { en } from './translations/en'
import { es, type TranslationTree } from './translations/es'

export type { Locale }

const catalogs: Record<Locale, TranslationTree> = { es, en }

function getNested(obj: TranslationTree, path: string): string | undefined {
  const value = path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in acc) {
      return (acc as Record<string, unknown>)[key]
    }
    return undefined
  }, obj)
  return typeof value === 'string' ? value : undefined
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(params[key] ?? ''))
}

interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, params?: Record<string, string | number>) => string
  dateLocale: string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('es')

  useEffect(() => {
    if (!window.atopViewer) return
    void window.atopViewer.getSettings().then((settings) => {
      setLocaleState(settings.locale)
      document.documentElement.lang = settings.locale
    })
  }, [])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    document.documentElement.lang = next
    void window.atopViewer?.saveSettings({ locale: next })
  }, [])

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const text = getNested(catalogs[locale], key) ?? getNested(catalogs.en, key) ?? key
      return interpolate(text, params)
    },
    [locale]
  )

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      dateLocale: locale === 'es' ? 'es-ES' : 'en-GB'
    }),
    [locale, setLocale, t]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
