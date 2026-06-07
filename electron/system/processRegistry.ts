import type { BrowserWindow } from 'electron'
import { readdir, readFile } from 'node:fs/promises'
import type { LiveProcessSnapshot } from '../../src/types'

const POLL_MS = 5_000

interface LiveEntry {
  comm: string
  cmdline: string
}

export class ProcessRegistryService {
  private win: BrowserWindow | null = null
  private timer: NodeJS.Timeout | null = null
  private snapshot: LiveProcessSnapshot = {
    byPid: {},
    updatedAt: 0,
    totalCount: 0
  }
  private busy = false

  attachWindow(win: BrowserWindow): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    this.win = win
    void this.refresh()
    this.timer = setInterval(() => void this.refresh(), POLL_MS)
  }

  detachWindow(): void {
    this.win = null
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  getSnapshot(): LiveProcessSnapshot {
    return this.snapshot
  }

  isPidAlive(pid: number): boolean {
    return Object.prototype.hasOwnProperty.call(this.snapshot.byPid, pid)
  }

  matchProcess(pid: number, atopCmd: string): 'alive' | 'reused' | 'dead' {
    const live = this.snapshot.byPid[pid]
    if (!live) return 'dead'
    return cmdMatches(atopCmd, live.comm, live.cmdline) ? 'alive' : 'reused'
  }

  private async refresh(_force: boolean): Promise<void> {
    if (this.busy) return
    this.busy = true

    try {
      const byPid: Record<number, LiveEntry> = {}
      const entries = await readdir('/proc')

      await Promise.all(
        entries.map(async (entry) => {
          if (!/^\d+$/.test(entry)) return
          const pid = Number(entry)
          try {
            const [commRaw, cmdlineRaw] = await Promise.all([
              readFile(`/proc/${pid}/comm`, 'utf8'),
              readFile(`/proc/${pid}/cmdline`, 'utf8')
            ])
            byPid[pid] = {
              comm: commRaw.trim(),
              cmdline: cmdlineRaw.replace(/\0/g, ' ').trim()
            }
          } catch {
            // proceso terminado durante el barrido
          }
        })
      )

      const next: LiveProcessSnapshot = {
        byPid,
        updatedAt: Date.now(),
        totalCount: Object.keys(byPid).length
      }

      this.snapshot = next
      this.win?.webContents.send('system:process-snapshot', next)
    } finally {
      this.busy = false
    }
  }
}

function cmdMatches(atopCmd: string, comm: string, cmdline: string): boolean {
  const token = atopCmd.trim().split(/\s+/)[0] ?? atopCmd
  const base = token.split('/').pop() ?? token
  if (!base) return false
  return comm === base || cmdline.includes(base) || atopCmd.includes(comm)
}
