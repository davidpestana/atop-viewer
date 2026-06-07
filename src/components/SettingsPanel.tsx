import { useI18n } from '../i18n'
import type { AppSettings } from '../types'

interface Props {
  settings: AppSettings
  settingsPath: string
  onChange: (partial: Partial<AppSettings>) => void
}

export default function SettingsPanel({ settings, settingsPath, onChange }: Props) {
  const { t } = useI18n()

  return (
    <details className="settings panel">
      <summary>{t('settings.title')}</summary>
      <div className="settings-grid">
        <label>
          {t('settings.minCpu')}
          <input
            type="range"
            min={0}
            max={2}
            step={0.01}
            value={settings.processFilter.minCpuPct}
            onChange={(e) =>
              onChange({
                processFilter: { ...settings.processFilter, minCpuPct: Number(e.target.value) }
              })
            }
          />
          <span className="settings-value">
            {settings.processFilter.minCpuPct === 0
              ? t('settings.minCpuAll')
              : `${settings.processFilter.minCpuPct.toFixed(2)}%`}
          </span>
        </label>

        <label>
          {t('settings.maxRows')}
          <input
            type="number"
            min={10}
            max={500}
            step={10}
            value={settings.processFilter.maxRows}
            onChange={(e) =>
              onChange({
                processFilter: {
                  ...settings.processFilter,
                  maxRows: Math.max(10, Math.min(500, Number(e.target.value) || 40))
                }
              })
            }
          />
        </label>

        <label>
          {t('settings.timelineTopN')}
          <input
            type="number"
            min={4}
            max={40}
            step={1}
            value={settings.timeline.topN}
            onChange={(e) =>
              onChange({
                timeline: {
                  topN: Math.max(4, Math.min(40, Number(e.target.value) || 12))
                }
              })
            }
          />
        </label>
      </div>
      <p className="settings-path" title={settingsPath}>
        {t('settings.savedTo')} <code>{settingsPath}</code>
      </p>
    </details>
  )
}
