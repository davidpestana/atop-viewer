import { useCallback, useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n'
import type { AtopConfigInfo, AtopLiveUpdate, AtopLogFile, SystemSample } from '../types'

function formatInterval(seconds: number): string {
  if (seconds < 60) return `${seconds} s`
  if (seconds % 60 === 0) return `${seconds / 60} min`
  return `${(seconds / 60).toFixed(1)} min`
}

function applyPayload(
  payload: AtopLiveUpdate,
  followLive: boolean
): { samples: SystemSample[]; sampleIndex: number } {
  if (payload.samples.length === 0) {
    return { samples: [], sampleIndex: 0 }
  }
  return {
    samples: payload.samples,
    sampleIndex: followLive ? payload.samples.length - 1 : Math.min(payload.samples.length - 1, 0)
  }
}

export interface AtopLiveFeedState {
  config: AtopConfigInfo | null
  liveEnabled: boolean
  followLive: boolean
  samples: SystemSample[]
  sampleIndex: number
  lastUpdatedAt: number | null
  nextSampleInSec: number | null
  refreshing: boolean
  initialLoading: boolean
  setLiveEnabled: (value: boolean) => void
  setFollowLive: (value: boolean) => void
  setSampleIndex: (index: number) => void
  refreshNow: () => Promise<void>
  intervalLabel: string
  pollLabel: string
  statusText: string
}

export function useAtopLiveFeed(selectedPath: string, logs: AtopLogFile[]): AtopLiveFeedState {
  const { t, dateLocale } = useI18n()
  const [config, setConfig] = useState<AtopConfigInfo | null>(null)
  const [liveEnabled, setLiveEnabled] = useState(true)
  const [followLive, setFollowLive] = useState(true)
  const [samples, setSamples] = useState<SystemSample[]>([])
  const [sampleIndex, setSampleIndexState] = useState(0)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null)
  const [nextSampleInSec, setNextSampleInSec] = useState<number | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [nowTick, setNowTick] = useState(Date.now())

  const followLiveRef = useRef(followLive)
  followLiveRef.current = followLive

  const ingestUpdate = useCallback((payload: AtopLiveUpdate) => {
    if (payload.samples.length === 0) return
    const { samples: nextSamples, sampleIndex: nextIndex } = applyPayload(
      payload,
      followLiveRef.current
    )
    setSamples(nextSamples)
    setSampleIndexState(nextIndex)
    setLastUpdatedAt(payload.updatedAt)
    setRefreshing(false)
    setInitialLoading(false)
  }, [])

  useEffect(() => {
    void window.atopViewer.getConfig().then(setConfig)
  }, [])

  useEffect(() => {
    if (!selectedPath) {
      setSamples([])
      setInitialLoading(false)
      return
    }

    setInitialLoading(true)
    setRefreshing(true)
    setFollowLive(true)
    followLiveRef.current = true

    let cancelled = false

    const offUpdate = window.atopViewer.onLiveUpdate((payload) => {
      if (cancelled || payload.logPath !== selectedPath) return
      ingestUpdate(payload)
    })

    const offHeartbeat = window.atopViewer.onLiveHeartbeat((payload) => {
      if (cancelled || payload.logPath !== selectedPath) return
      setLastUpdatedAt(payload.polledAt)
    })

    const offError = window.atopViewer.onLiveError((payload) => {
      if (cancelled || payload.logPath !== selectedPath) return
      setRefreshing(false)
      setInitialLoading(false)
    })

    const boot = async () => {
      try {
        if (liveEnabled) {
          const payload = await window.atopViewer.startLiveWatch(selectedPath)
          if (!cancelled) ingestUpdate(payload)
        } else {
          await window.atopViewer.stopLiveWatch()
          const data = await window.atopViewer.loadSamples(selectedPath)
          if (cancelled) return
          setSamples(data)
          setSampleIndexState(Math.max(0, data.length - 1))
          setLastUpdatedAt(Date.now())
        }
      } catch (err) {
        if (cancelled) return
        if (liveEnabled) {
          const data = await window.atopViewer.loadSamples(selectedPath)
          if (cancelled) return
          setSamples(data)
          setSampleIndexState(Math.max(0, data.length - 1))
          setLastUpdatedAt(Date.now())
        }
      } finally {
        if (!cancelled) {
          setInitialLoading(false)
          setRefreshing(false)
        }
      }
    }

    void boot()

    return () => {
      cancelled = true
      offUpdate()
      offHeartbeat()
      offError()
      void window.atopViewer.stopLiveWatch()
    }
  }, [selectedPath, liveEnabled, ingestUpdate])

  useEffect(() => {
    const timer = setInterval(() => setNowTick(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const intervalSec = config?.sampleIntervalSec ?? 600
    const last = samples[samples.length - 1]
    if (!last) {
      setNextSampleInSec(null)
      return
    }

    const nextAt = (last.timestamp + intervalSec) * 1000
    setNextSampleInSec(Math.max(0, Math.round((nextAt - nowTick) / 1000)))
  }, [samples, config, nowTick])

  const setSampleIndex = useCallback((index: number) => {
    setFollowLive(false)
    setSampleIndexState(index)
  }, [])

  const refreshNow = useCallback(async () => {
    if (!selectedPath) return
    setRefreshing(true)
    try {
      if (liveEnabled) {
        const payload = await window.atopViewer.startLiveWatch(selectedPath)
        ingestUpdate(payload)
      } else {
        const data = await window.atopViewer.loadSamples(selectedPath)
        setSamples(data)
        if (followLiveRef.current) setSampleIndexState(Math.max(0, data.length - 1))
        setLastUpdatedAt(Date.now())
      }
    } finally {
      setRefreshing(false)
    }
  }, [selectedPath, liveEnabled, ingestUpdate])

  const intervalSec = config?.sampleIntervalSec ?? 600
  const intervalLabel = formatInterval(intervalSec)
  const pollLabel = '15 s'
  const selectedLog = logs.find((log) => log.path === selectedPath)
  const isToday = selectedLog?.date === new Date().toISOString().slice(0, 10)

  const parts: string[] = [t('status.sampleEvery', { interval: intervalLabel })]

  if (liveEnabled && isToday) {
    if (nextSampleInSec != null && nextSampleInSec > 0) {
      const mins = Math.floor(nextSampleInSec / 60)
      const secs = nextSampleInSec % 60
      parts.push(
        t('status.nextSample', { time: `${mins}:${secs.toString().padStart(2, '0')}` })
      )
    } else {
      parts.push(t('status.waitingSample'))
    }
  }

  if (lastUpdatedAt) {
    parts.push(
      t('status.updated', {
        time: new Date(lastUpdatedAt).toLocaleTimeString(dateLocale, {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      })
    )
  }

  const statusText = parts.join(' · ')

  return {
    config,
    liveEnabled,
    followLive,
    samples,
    sampleIndex,
    lastUpdatedAt,
    nextSampleInSec,
    refreshing,
    initialLoading,
    setLiveEnabled,
    setFollowLive,
    setSampleIndex,
    refreshNow,
    intervalLabel,
    pollLabel,
    statusText
  }
}
