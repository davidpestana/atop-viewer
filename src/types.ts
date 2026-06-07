export interface AtopLogFile {
  id: string
  path: string
  date: string
  sizeBytes: number
}

export interface SystemSample {
  timestamp: number
  elapsed: number
  timeLabel: string
  load1: number
  load5: number
  load15: number
  cpuUserPct: number
  cpuSysPct: number
  cpuIdlePct: number
  memUsedPct: number
  memAvailGb: number
}

export interface ProcessRow {
  pid: number
  cmd: string
  cpuPct: number
  userMs: number
  sysMs: number
  liveStatus?: ProcessLiveStatus
}

export type ProcessLiveStatus = 'alive' | 'reused' | 'dead'

export interface ProcessTimelinePoint {
  sampleIndex: number
  timeLabel: string
  timestamp: number
  cpuPct: number
  rssMb: number
  present: boolean
}

export interface ProcessTimelineSeries {
  id: string
  pid: number
  cmd: string
  cgroup: string
  points: ProcessTimelinePoint[]
  peakCpuPct: number
  peakRssMb: number
}

export interface ProcessTimeline {
  sampleCount: number
  times: { index: number; timeLabel: string; timestamp: number }[]
  series: ProcessTimelineSeries[]
}

export type TimelineMetric = 'cpu' | 'rss'

export type Locale = 'es' | 'en'

export interface AppSettings {
  locale: Locale
  processFilter: {
    /** Minimum CPU % in the sample interval to list a process (0 = all in sample) */
    minCpuPct: number
    maxRows: number
  }
  timeline: {
    topN: number
  }
}

export interface LiveProcessEntry {
  comm: string
  cmdline: string
}

export interface LiveProcessSnapshot {
  byPid: Record<number, LiveProcessEntry>
  updatedAt: number
  totalCount: number
}

export interface AtopConfigInfo {
  sampleIntervalSec: number
  logPath: string
  logGenerations: number
}

export interface AtopLiveUpdate {
  logPath: string
  samples: SystemSample[]
  sizeBytes: number
  mtimeMs: number
  sampleIntervalSec: number
  updatedAt: number
  kind?: 'data' | 'heartbeat'
}

export interface AtopLiveHeartbeat {
  logPath?: string
  sizeBytes: number
  mtimeMs: number
  sampleIntervalSec: number
  polledAt: number
}

export interface AtopViewerApi {
  listLogs: () => Promise<AtopLogFile[]>
  loadSamples: (logPath: string) => Promise<SystemSample[]>
  loadProcesses: (logPath: string, sampleIndex: number) => Promise<ProcessRow[]>
  loadProcessTimeline: (logPath: string) => Promise<ProcessTimeline>
  loadProcessSeries: (logPath: string, pid: number, cmd: string) => Promise<ProcessTimelineSeries | null>
  getConfig: () => Promise<AtopConfigInfo>
  startLiveWatch: (logPath: string) => Promise<AtopLiveUpdate>
  stopLiveWatch: () => Promise<void>
  onLiveUpdate: (callback: (payload: AtopLiveUpdate) => void) => () => void
  onLiveHeartbeat: (callback: (payload: AtopLiveHeartbeat) => void) => () => void
  onLogsChanged: (callback: (payload: { logs: AtopLogFile[]; updatedAt: number }) => void) => () => void
  onLiveError: (callback: (payload: { logPath?: string; message: string }) => void) => () => void
  getProcessSnapshot: () => Promise<LiveProcessSnapshot>
  onProcessSnapshot: (callback: (snapshot: LiveProcessSnapshot) => void) => () => void
  getSettings: () => Promise<AppSettings>
  saveSettings: (partial: Partial<AppSettings>) => Promise<AppSettings>
  getSettingsPath: () => Promise<string>
}

declare global {
  interface Window {
    atopViewer: AtopViewerApi
  }
}

export {}
