import type { BrowserWindow } from 'electron'
import { stat } from 'node:fs/promises'
import { getAtopConfig } from './config'
import { listAtopLogs, loadSystemSamples } from './parser'
import type { AtopLiveUpdate, SystemSample } from '../../src/types'

const POLL_MS = 15_000

interface WatchState {
  logPath: string
  lastSize: number
  lastMtimeMs: number
  timer: NodeJS.Timeout
  generation: number
}

export class AtopLiveService {
  private win: BrowserWindow | null = null
  private state: WatchState | null = null
  private sampleIntervalSec = 600

  attachWindow(win: BrowserWindow): void {
    this.win = win
  }

  detachWindow(): void {
    this.win = null
    this.stop()
  }

  async start(logPath: string): Promise<AtopLiveUpdate> {
    this.stop()

    const config = await getAtopConfig()
    this.sampleIntervalSec = config.sampleIntervalSec

    const info = await stat(logPath)
    const generation = Date.now()
    this.state = {
      logPath,
      lastSize: info.size,
      lastMtimeMs: info.mtimeMs,
      timer: setInterval(() => void this.tick(generation), POLL_MS),
      generation
    }

    return this.loadAndEmit(generation)
  }

  stop(): void {
    if (this.state) {
      clearInterval(this.state.timer)
      this.state = null
    }
  }

  private async tick(generation: number): Promise<void> {
    if (!this.state || this.state.generation !== generation) return

    try {
      const info = await stat(this.state.logPath)
      const changed = info.size !== this.state.lastSize || info.mtimeMs !== this.state.lastMtimeMs

      if (!changed) {
        this.win?.webContents.send('atop:live-heartbeat', {
          logPath: this.state.logPath,
          sizeBytes: info.size,
          mtimeMs: info.mtimeMs,
          sampleIntervalSec: this.sampleIntervalSec,
          polledAt: Date.now()
        })
        return
      }

      this.state.lastSize = info.size
      this.state.lastMtimeMs = info.mtimeMs
      await this.loadAndEmit(generation)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.win?.webContents.send('atop:live-error', { logPath: this.state?.logPath, message })
    }
  }

  private async loadAndEmit(generation: number): Promise<AtopLiveUpdate> {
    if (!this.state || this.state.generation !== generation) {
      throw new Error('watch stopped')
    }

    const samples = await loadSystemSamples(this.state.logPath)
    const info = await stat(this.state.logPath)

    this.state.lastSize = info.size
    this.state.lastMtimeMs = info.mtimeMs

    const payload: AtopLiveUpdate = {
      logPath: this.state.logPath,
      samples,
      sizeBytes: info.size,
      mtimeMs: info.mtimeMs,
      sampleIntervalSec: this.sampleIntervalSec,
      updatedAt: Date.now(),
      kind: 'data'
    }

    this.win?.webContents.send('atop:live-update', payload)
    return payload
  }

  async refreshLogs(): Promise<void> {
    if (!this.win) return
    const logs = await listAtopLogs()
    this.win.webContents.send('atop:logs-changed', { logs, updatedAt: Date.now() })
  }
}
