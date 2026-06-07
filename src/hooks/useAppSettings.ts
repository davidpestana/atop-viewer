import { useCallback, useEffect, useState } from 'react'
import type { AppSettings } from '../types'

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [settingsPath, setSettingsPath] = useState('')

  useEffect(() => {
    void Promise.all([window.atopViewer.getSettings(), window.atopViewer.getSettingsPath()]).then(
      ([loaded, path]) => {
        setSettings(loaded)
        setSettingsPath(path)
      }
    )
  }, [])

  const updateSettings = useCallback(async (partial: Partial<AppSettings>) => {
    const next = await window.atopViewer.saveSettings(partial)
    setSettings(next)
    return next
  }, [])

  return { settings, settingsPath, updateSettings, ready: settings !== null }
}
