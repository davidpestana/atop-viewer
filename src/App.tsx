import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import LanguageSwitcher from './components/LanguageSwitcher'
import ProcessTimelinePanel from './components/ProcessTimelinePanel'
import SettingsPanel from './components/SettingsPanel'
import { useAppSettings } from './hooks/useAppSettings'
import { useAtopLiveFeed } from './hooks/useAtopLiveFeed'
import { useI18n } from './i18n'
import { useLiveProcessSnapshot } from './hooks/useLiveProcessSnapshot'
import type { AppSettings, AtopLogFile, ProcessLiveStatus, ProcessRow, ProcessTimeline, ProcessTimelineSeries, TimelineMetric } from './types'
import { applyLiveStatus, countLiveStats } from './utils/liveProcess'

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`
}

function statusLabel(t: (key: string) => string, status: ProcessLiveStatus): string {
  return t(`processStatus.${status}`)
}

export default function App() {
  const { t } = useI18n()
  const [logs, setLogs] = useState<AtopLogFile[]>([])
  const [selectedPath, setSelectedPath] = useState<string>('')
  const [processes, setProcesses] = useState<ProcessRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [timeline, setTimeline] = useState<ProcessTimeline | null>(null)
  const [timelineLoading, setTimelineLoading] = useState(false)
  const [timelineMetric, setTimelineMetric] = useState<TimelineMetric>('cpu')
  const [selectedSeries, setSelectedSeries] = useState<ProcessTimelineSeries | null>(null)
  const liveSnapshot = useLiveProcessSnapshot()
  const { settings, settingsPath, updateSettings, ready: settingsReady } = useAppSettings()
  const [settingsVersion, setSettingsVersion] = useState(0)

  const handleSettingsChange = useCallback(
    async (partial: Partial<AppSettings>) => {
      await updateSettings(partial)
      setSettingsVersion((version) => version + 1)
    },
    [updateSettings]
  )

  const {
    liveEnabled,
    followLive,
    samples,
    sampleIndex,
    refreshing,
    initialLoading,
    setLiveEnabled,
    setFollowLive,
    setSampleIndex,
    refreshNow,
    intervalLabel,
    statusText
  } = useAtopLiveFeed(selectedPath, logs)

  const current = samples[sampleIndex]

  const chartData = samples.map((sample, index) => ({
    index,
    time: sample.timeLabel,
    load1: sample.load1,
    load5: sample.load5,
    cpuUser: sample.cpuUserPct,
    cpuSys: sample.cpuSysPct,
    memUsed: sample.memUsedPct
  }))

  const loadLogs = useCallback(async () => {
    setError(null)
    try {
      const items = await window.atopViewer.listLogs()
      setLogs(items)
      if (items.length > 0) {
        setSelectedPath((prev) => prev || items[0].path)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }, [])

  useEffect(() => {
    void loadLogs()
  }, [loadLogs])

  useEffect(() => {
    return window.atopViewer.onLogsChanged(({ logs: updatedLogs }) => {
      setLogs(updatedLogs)
    })
  }, [])

  useEffect(() => {
    if (!selectedPath || samples.length === 0) {
      setProcesses([])
      return
    }

    let cancelled = false
    void window.atopViewer
      .loadProcesses(selectedPath, sampleIndex)
      .then((rows) => {
        if (!cancelled) setProcesses(rows)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err))
      })

    return () => {
      cancelled = true
    }
  }, [selectedPath, sampleIndex, samples.length, refreshing, settingsVersion])

  useEffect(() => {
    if (!selectedPath || samples.length === 0) {
      setTimeline(null)
      setSelectedSeries(null)
      return
    }

    let cancelled = false
    setTimelineLoading(true)

    void window.atopViewer
      .loadProcessTimeline(selectedPath)
      .then((data) => {
        if (cancelled) return
        setTimeline(data)
        setSelectedSeries((prev) => {
          if (prev && data.series.some((series) => series.id === prev.id)) return prev
          return data.series[0] ?? null
        })
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err))
      })
      .finally(() => {
        if (!cancelled) setTimelineLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [selectedPath, samples.length, refreshing, settingsVersion])

  const selectProcess = useCallback(
    async (proc: ProcessRow) => {
      if (!selectedPath) return
      const key = `${proc.pid}|${proc.cmd}`
      const fromTimeline = timeline?.series.find((series) => series.id === key)
      if (fromTimeline) {
        setSelectedSeries(fromTimeline)
        return
      }

      const series = await window.atopViewer.loadProcessSeries(selectedPath, proc.pid, proc.cmd)
      if (series) setSelectedSeries(series)
    },
    [selectedPath, timeline]
  )

  const displayedProcesses = useMemo(
    () => applyLiveStatus(processes, liveSnapshot),
    [processes, liveSnapshot]
  )

  const liveStats = useMemo(() => countLiveStats(displayedProcesses), [displayedProcesses])

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>{t('app.title')}</h1>
          <p>{t('app.subtitle')}</p>
        </div>
        <div className="header-actions">
          <LanguageSwitcher />
          <span className={`live-badge ${liveEnabled ? 'live-badge--on' : ''}`}>
            {liveEnabled ? `● ${t('live.on')}` : `○ ${t('live.off')}`}
          </span>
          <button type="button" onClick={() => void refreshNow()} disabled={refreshing}>
            {refreshing ? t('actions.refreshing') : t('actions.refresh')}
          </button>
        </div>
      </header>

      <section className="controls panel">
        <label>
          {t('controls.dailyLog')}
          <select value={selectedPath} onChange={(e) => setSelectedPath(e.target.value)}>
            {logs.length === 0 ? <option value="">{t('controls.noLogs')}</option> : null}
            {logs.map((log) => (
              <option key={log.path} value={log.path}>
                {log.date} · {formatSize(log.sizeBytes)}
              </option>
            ))}
          </select>
        </label>

        <label className="toggle">
          <input
            type="checkbox"
            checked={liveEnabled}
            onChange={(e) => setLiveEnabled(e.target.checked)}
          />
          {t('live.autoRefresh')}
        </label>

        {!followLive ? (
          <button type="button" className="secondary" onClick={() => setFollowLive(true)}>
            {t('live.follow')}
          </button>
        ) : null}

        <label className="timeline">
          {t('controls.timeline')} · {t('controls.samples', { count: samples.length, interval: intervalLabel })}
          <input
            type="range"
            min={0}
            max={Math.max(0, samples.length - 1)}
            value={sampleIndex}
            disabled={samples.length === 0}
            onChange={(e) => setSampleIndex(Number(e.target.value))}
          />
          <span className="timeline-meta">{statusText}</span>
        </label>
      </section>

      {settingsReady && settings ? (
        <SettingsPanel
          settings={settings}
          settingsPath={settingsPath}
          onChange={(partial) => void handleSettingsChange(partial)}
        />
      ) : null}

      {error ? <div className="error">{error}</div> : null}
      {initialLoading ? <div className="loading panel">{t('loading.data')}</div> : null}

      {!initialLoading && samples.length === 0 ? (
        <div className="panel empty-state">
          {t('empty.noSamples')} <code>systemctl status atop</code>
        </div>
      ) : null}

      {current ? (
        <>
          <section className="stats">
            <div className="stat">
              <div className="stat-label">{t('stats.sampleTime')}</div>
              <div className="stat-value">{current.timeLabel}</div>
            </div>
            <div className="stat">
              <div className="stat-label">{t('stats.load1')}</div>
              <div className="stat-value">{current.load1.toFixed(2)}</div>
            </div>
            <div className="stat">
              <div className="stat-label">{t('stats.cpuUser')}</div>
              <div className="stat-value">{current.cpuUserPct.toFixed(0)}%</div>
            </div>
            <div className="stat">
              <div className="stat-label">{t('stats.memFree')}</div>
              <div className="stat-value">{current.memAvailGb.toFixed(1)} GB</div>
            </div>
          </section>

          <section className="charts">
            <div className="panel">
              <h2 className="chart-title">{t('charts.load')}</h2>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={chartData}>
                  <CartesianGrid stroke="#2a2f3a" strokeDasharray="3 3" />
                  <XAxis dataKey="time" minTickGap={24} stroke="#9aa0a6" />
                  <YAxis stroke="#9aa0a6" />
                  <Tooltip contentStyle={{ background: '#171923', border: '1px solid #2a2f3a' }} />
                  <Legend />
                  <Line type="monotone" dataKey="load1" name={t('charts.load1')} stroke="#8ab4f8" dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="load5" name={t('charts.load5')} stroke="#81c995" dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="panel">
              <h2 className="chart-title">{t('charts.cpuMem')}</h2>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={chartData}>
                  <CartesianGrid stroke="#2a2f3a" strokeDasharray="3 3" />
                  <XAxis dataKey="time" minTickGap={24} stroke="#9aa0a6" />
                  <YAxis stroke="#9aa0a6" />
                  <Tooltip contentStyle={{ background: '#171923', border: '1px solid #2a2f3a' }} />
                  <Legend />
                  <Line type="monotone" dataKey="cpuUser" name={t('charts.cpuUser')} stroke="#f28b82" dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="cpuSys" name={t('charts.cpuSys')} stroke="#fdd663" dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="memUsed" name={t('charts.memUsed')} stroke="#c58af9" dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <ProcessTimelinePanel
            timeline={timeline}
            metric={timelineMetric}
            onMetricChange={setTimelineMetric}
            selected={selectedSeries}
            onSelect={setSelectedSeries}
            sampleIndex={sampleIndex}
            loading={timelineLoading}
          />

          <section className="panel">
            <div className="panel-heading panel-heading--row">
              <h2 className="chart-title">{t('processes.title')}</h2>
              <span className="panel-meta">
                {liveStats.alive}/{displayedProcesses.length} · {liveSnapshot?.totalCount ?? '…'} total
              </span>
            </div>
            <table className="process-table">
              <thead>
                <tr>
                  <th>{t('processes.columnStatus')}</th>
                  <th>{t('processes.columnPid')}</th>
                  <th>{t('processes.columnName')}</th>
                  <th>{t('processes.columnCpu')}</th>
                  <th>{t('processes.columnUser')}</th>
                  <th>{t('processes.columnSys')}</th>
                </tr>
              </thead>
              <tbody>
                {displayedProcesses.map((proc) => (
                  <tr
                    key={`${proc.pid}-${proc.cmd}`}
                    className={`proc-row proc-row--${proc.liveStatus ?? 'dead'} ${
                      selectedSeries?.id === `${proc.pid}|${proc.cmd}` ? 'proc-row--selected' : ''
                    }`}
                    onClick={() => void selectProcess(proc)}
                  >
                    <td>
                      <span className={`proc-status proc-status--${proc.liveStatus ?? 'dead'}`}>
                        {statusLabel(t, proc.liveStatus ?? 'dead')}
                      </span>
                    </td>
                    <td className="num">{proc.pid}</td>
                    <td>{proc.cmd}</td>
                    <td className="num">{proc.cpuPct.toFixed(1)}</td>
                    <td className="num">{proc.userMs}</td>
                    <td className="num">{proc.sysMs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      ) : null}
    </div>
  )
}
