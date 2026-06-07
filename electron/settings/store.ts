import { app } from 'electron'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { AppSettings, Locale } from '../../src/types'

export const DEFAULT_SETTINGS: AppSettings = {
  locale: 'es',
  processFilter: {
    minCpuPct: 0.05,
    maxRows: 40
  },
  timeline: {
    topN: 12
  }
}

let cached: AppSettings | null = null

function settingsFilePath(): string {
  return path.join(app.getPath('userData'), 'settings.json')
}

function mergeSettings(partial: Partial<AppSettings>, base: AppSettings): AppSettings {
  return {
    locale: partial.locale ?? base.locale,
    processFilter: {
      minCpuPct: partial.processFilter?.minCpuPct ?? base.processFilter.minCpuPct,
      maxRows: partial.processFilter?.maxRows ?? base.processFilter.maxRows
    },
    timeline: {
      topN: partial.timeline?.topN ?? base.timeline.topN
    }
  }
}

function detectDefaultLocale(): Locale {
  try {
    return app.getLocale().toLowerCase().startsWith('es') ? 'es' : 'en'
  } catch {
    return 'es'
  }
}

export async function loadSettings(): Promise<AppSettings> {
  if (cached) return { ...cached }

  try {
    const raw = await readFile(settingsFilePath(), 'utf8')
    const parsed = JSON.parse(raw) as Partial<AppSettings>
    cached = mergeSettings(parsed, {
      ...DEFAULT_SETTINGS,
      locale: detectDefaultLocale()
    })
  } catch {
    cached = { ...DEFAULT_SETTINGS, locale: detectDefaultLocale() }
  }

  return { ...cached }
}

export function getSettingsSnapshot(): AppSettings {
  return cached ? { ...cached } : { ...DEFAULT_SETTINGS }
}

export async function saveSettings(partial: Partial<AppSettings>): Promise<AppSettings> {
  const current = cached ?? (await loadSettings())
  cached = mergeSettings(partial, current)
  await mkdir(path.dirname(settingsFilePath()), { recursive: true })
  await writeFile(settingsFilePath(), `${JSON.stringify(cached, null, 2)}\n`, 'utf8')
  return { ...cached }
}

export function getSettingsFilePath(): string {
  return settingsFilePath()
}
