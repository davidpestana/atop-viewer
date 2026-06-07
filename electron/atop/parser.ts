import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import type { AtopLogFile, ProcessRow, SystemSample } from '../src/types'

const execFileAsync = promisify(execFile)
const LOG_DIR = '/var/log/atop'
const ATOP_BIN = '/usr/bin/atop'

interface CpuJson {
  hertz: number
  nrcpu: number
  stime: number
  utime: number
  itime: number
}

interface CplJson {
  lavg1: number
  lavg5: number
  lavg15: number
}

interface MemJson {
  physmem: number
  freemem: number
  availablemem: number
}

interface SampleJson {
  timestamp: number
  elapsed: number
  CPU?: CpuJson
  CPL?: CplJson
  MEM?: MemJson
}

interface PrcJson {
  pid: number
  cmd: string
  utime: number
  stime: number
  isproc?: number
}

export function formatTimeLabel(ts: number): string {
  return new Date(ts * 1000).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

export async function runAtopJson(logPath: string, labels: string, begin?: string, end?: string): Promise<string> {
  const args = ['-r', logPath, '-J', labels]
  if (begin) args.push('-b', begin)
  if (end) args.push('-e', end)

  try {
    const { stdout } = await execFileAsync(ATOP_BIN, args, {
      maxBuffer: 256 * 1024 * 1024,
      timeout: 120_000
    })
    return stdout
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`atop failed: ${message}`)
  }
}

export function parseNdjson<T>(stdout: string): T[] {
  return stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as T)
}

function cpuPercents(cpu: CpuJson | undefined): { user: number; sys: number; idle: number } {
  if (!cpu || cpu.hertz <= 0) return { user: 0, sys: 0, idle: 100 }
  const total = cpu.utime + cpu.stime + cpu.itime
  if (total <= 0) return { user: 0, sys: 0, idle: 100 }
  const n = cpu.nrcpu || 1
  return {
    user: (cpu.utime / total) * 100 * n,
    sys: (cpu.stime / total) * 100 * n,
    idle: (cpu.itime / total) * 100 * n
  }
}

export async function listAtopLogs(): Promise<AtopLogFile[]> {
  const entries = await readdir(LOG_DIR)
  const logs = entries.filter((name) => name.startsWith('atop_'))

  const files = await Promise.all(
    logs.map(async (name) => {
      const fullPath = path.join(LOG_DIR, name)
      const info = await stat(fullPath)
      const id = name.replace(/^atop_/, '')
      const date = `${id.slice(0, 4)}-${id.slice(4, 6)}-${id.slice(6, 8)}`
      return {
        id,
        path: fullPath,
        date,
        sizeBytes: info.size
      }
    })
  )

  return files.sort((a, b) => b.id.localeCompare(a.id))
}

export async function loadSystemSamples(logPath: string): Promise<SystemSample[]> {
  const stdout = await runAtopJson(logPath, 'CPU,CPL,MEM')
  const rows = parseNdjson<SampleJson>(stdout)

  return rows.map((row) => {
    const cpu = cpuPercents(row.CPU)
    const phys = row.MEM?.physmem ?? 1
    const avail = row.MEM?.availablemem ?? row.MEM?.freemem ?? 0
    const usedPct = Math.max(0, Math.min(100, ((phys - avail) / phys) * 100))

    return {
      timestamp: row.timestamp,
      elapsed: row.elapsed,
      timeLabel: formatTimeLabel(row.timestamp),
      load1: row.CPL?.lavg1 ?? 0,
      load5: row.CPL?.lavg5 ?? 0,
      load15: row.CPL?.lavg15 ?? 0,
      cpuUserPct: cpu.user,
      cpuSysPct: cpu.sys,
      cpuIdlePct: cpu.idle,
      memUsedPct: usedPct,
      memAvailGb: avail / 1024 ** 3
    }
  })
}

export async function loadProcessRows(
  logPath: string,
  sampleIndex: number,
  filter: { minCpuPct: number; maxRows: number }
): Promise<ProcessRow[]> {
  const stdout = await runAtopJson(logPath, 'PRC')
  const rows = parseNdjson<{ PRC?: PrcJson[] }>(stdout)

  if (rows.length === 0) return []
  const index = Math.max(0, Math.min(sampleIndex, rows.length - 1))
  const prevIndex = Math.max(0, index - 1)

  const current = rows[index]
  const previous = rows[prevIndex]
  const currentMap = new Map<number, PrcJson>()
  const previousMap = new Map<number, PrcJson>()

  for (const proc of current.PRC ?? []) {
    if (proc.isproc === 0) continue
    currentMap.set(proc.pid, proc)
  }
  for (const proc of previous.PRC ?? []) {
    if (proc.isproc === 0) continue
    previousMap.set(proc.pid, proc)
  }

  const elapsedDelta = Math.max(1, current.timestamp - previous.timestamp)
  const hz = 100
  const cpuSample = await runAtopJson(logPath, 'CPU')
  const cpuRows = parseNdjson<SampleJson>(cpuSample)
  const cpus = cpuRows[0]?.CPU?.nrcpu ?? 1

  const processes: ProcessRow[] = []
  for (const [pid, proc] of currentMap) {
    const prev = previousMap.get(pid)
    const utime = proc.utime - (prev?.utime ?? proc.utime)
    const stime = proc.stime - (prev?.stime ?? proc.stime)
    const totalTicks = Math.max(0, utime + stime)
    const cpuPct = index === prevIndex ? 0 : (totalTicks / (elapsedDelta * hz * cpus)) * 100

    if (cpuPct < filter.minCpuPct && index !== prevIndex) continue

    processes.push({
      pid,
      cmd: proc.cmd,
      cpuPct,
      userMs: Math.round(utime / hz),
      sysMs: Math.round(stime / hz)
    })
  }

  return processes.sort((a, b) => b.cpuPct - a.cpuPct).slice(0, filter.maxRows)
}
