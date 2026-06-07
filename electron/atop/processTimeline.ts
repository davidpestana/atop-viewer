import { stat } from 'node:fs/promises'
import type { ProcessTimeline, ProcessTimelinePoint, ProcessTimelineSeries } from '../../src/types'
import { runAtopJson, parseNdjson, formatTimeLabel } from './parser'
const HZ = 100
const DEFAULT_TOP_N = 12

interface CpuJson {
  nrcpu: number
}

interface PrcJson {
  pid: number
  cmd: string
  utime: number
  stime: number
  isproc?: number
  cgroup?: string
}

interface PrmJson {
  pid: number
  cmd: string
  rmem: number
  cgroup?: string
}

interface CombinedSample {
  timestamp: number
  elapsed: number
  CPU?: CpuJson
  PRC?: PrcJson[]
  PRM?: PrmJson[]
}

interface ParsedLog {
  mtimeMs: number
  sizeBytes: number
  times: ProcessTimeline['times']
  sampleMetrics: Map<string, { cpuPct: number; rssMb: number }>[]
  procMeta: Map<string, { pid: number; cmd: string; cgroup: string }>
  rankScores: Map<string, number>
}

const cache = new Map<string, ParsedLog>()

function processKey(pid: number, cmd: string): string {
  return `${pid}|${cmd}`
}

async function parseProcessLog(logPath: string): Promise<ParsedLog> {
  const info = await stat(logPath)
  const cached = cache.get(logPath)
  if (cached && cached.mtimeMs === info.mtimeMs && cached.sizeBytes === info.size) {
    return cached
  }

  const stdout = await runAtopJson(logPath, 'CPU,PRC,PRM')
  const rows = parseNdjson<CombinedSample>(stdout)

  const times = rows.map((row, index) => ({
    index,
    timestamp: row.timestamp,
    timeLabel: formatTimeLabel(row.timestamp)
  }))

  const sampleMetrics: Map<string, { cpuPct: number; rssMb: number }>[] = []
  const procMeta = new Map<string, { pid: number; cmd: string; cgroup: string }>()
  const rankScores = new Map<string, number>()

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const prev = rows[Math.max(0, i - 1)]
    const cpus = row.CPU?.nrcpu ?? prev.CPU?.nrcpu ?? 1
    const elapsedDelta = Math.max(1, i === 0 ? row.elapsed : row.timestamp - prev.timestamp)

    const prcMap = new Map<number, PrcJson>()
    const prmMap = new Map<number, PrmJson>()
    for (const proc of row.PRC ?? []) {
      if (proc.isproc === 0) continue
      prcMap.set(proc.pid, proc)
    }
    for (const proc of row.PRM ?? []) {
      prmMap.set(proc.pid, proc)
    }

    const prevPrcMap = new Map<number, PrcJson>()
    for (const proc of prev.PRC ?? []) {
      if (proc.isproc === 0) continue
      prevPrcMap.set(proc.pid, proc)
    }

    const bucket = new Map<string, { cpuPct: number; rssMb: number }>()

    for (const [pid, proc] of prcMap) {
      const key = processKey(pid, proc.cmd)
      const prevProc = prevPrcMap.get(pid)
      const utime = proc.utime - (prevProc?.utime ?? proc.utime)
      const stime = proc.stime - (prevProc?.stime ?? proc.stime)
      const totalTicks = Math.max(0, utime + stime)
      const cpuPct = i === 0 ? 0 : (totalTicks / (elapsedDelta * HZ * cpus)) * 100
      const rssMb = (prmMap.get(pid)?.rmem ?? 0) / 1024

      bucket.set(key, { cpuPct, rssMb })
      procMeta.set(key, {
        pid,
        cmd: proc.cmd,
        cgroup: proc.cgroup ?? prmMap.get(pid)?.cgroup ?? ''
      })

      if (i > 0) {
        rankScores.set(key, (rankScores.get(key) ?? 0) + cpuPct)
      }
    }

    sampleMetrics.push(bucket)
  }

  const parsed: ParsedLog = {
    mtimeMs: info.mtimeMs,
    sizeBytes: info.size,
    times,
    sampleMetrics,
    procMeta,
    rankScores
  }

  cache.set(logPath, parsed)
  return parsed
}

function buildSeries(parsed: ParsedLog, keys: string[]): ProcessTimelineSeries[] {
  return keys
    .filter((key) => parsed.procMeta.has(key))
    .map((key) => {
      const meta = parsed.procMeta.get(key)!
      const points: ProcessTimelinePoint[] = parsed.times.map((time, index) => {
        const metrics = parsed.sampleMetrics[index]?.get(key)
        return {
          sampleIndex: index,
          timeLabel: time.timeLabel,
          timestamp: time.timestamp,
          cpuPct: metrics?.cpuPct ?? 0,
          rssMb: metrics?.rssMb ?? 0,
          present: metrics != null
        }
      })

      const active = points.filter((point) => point.present)
      return {
        id: key,
        pid: meta.pid,
        cmd: meta.cmd,
        cgroup: meta.cgroup,
        points,
        peakCpuPct: active.reduce((max, point) => Math.max(max, point.cpuPct), 0),
        peakRssMb: active.reduce((max, point) => Math.max(max, point.rssMb), 0)
      }
    })
}

function topKeys(parsed: ParsedLog, topN: number): string[] {
  return [...parsed.rankScores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([key]) => key)
}

export async function loadProcessTimeline(logPath: string, topN = DEFAULT_TOP_N): Promise<ProcessTimeline> {
  const parsed = await parseProcessLog(logPath)
  const keys = topKeys(parsed, topN)

  return {
    sampleCount: parsed.times.length,
    times: parsed.times,
    series: buildSeries(parsed, keys)
  }
}

export async function loadProcessSeries(
  logPath: string,
  pid: number,
  cmd: string
): Promise<ProcessTimelineSeries | null> {
  const parsed = await parseProcessLog(logPath)
  const key = processKey(pid, cmd)
  if (!parsed.procMeta.has(key)) return null
  return buildSeries(parsed, [key])[0] ?? null
}

export function invalidateProcessTimelineCache(logPath?: string): void {
  if (logPath) cache.delete(logPath)
  else cache.clear()
}
