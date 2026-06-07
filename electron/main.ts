import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'node:path'
import { getAtopConfig } from './atop/config'
import { AtopLiveService } from './atop/live'
import { listAtopLogs, loadProcessRows, loadSystemSamples } from './atop/parser'
import { loadProcessSeries, loadProcessTimeline } from './atop/processTimeline'
import { getSettingsSnapshot, getSettingsFilePath, loadSettings, saveSettings } from './settings/store'
import { ProcessRegistryService } from './system/processRegistry'
import type { ProcessRow } from '../src/types'

const liveService = new AtopLiveService()
const processRegistry = new ProcessRegistryService()
let logListTimer: NodeJS.Timeout | null = null
let mainWindow: BrowserWindow | null = null

const gotSingleInstanceLock = app.requestSingleInstanceLock()
if (!gotSingleInstanceLock) {
  app.quit()
  process.exit(0)
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.show()
    mainWindow.focus()
  })
}

const IPC_CHANNELS = [
  'atop:listLogs',
  'atop:loadSamples',
  'atop:loadProcesses',
  'atop:loadProcessTimeline',
  'atop:loadProcessSeries',
  'atop:getConfig',
  'atop:startLiveWatch',
  'atop:stopLiveWatch',
  'system:getProcessSnapshot',
  'settings:get',
  'settings:save',
  'settings:getPath'
] as const

function enrichProcesses(rows: ProcessRow[]): ProcessRow[] {
  return rows.map((row) => ({
    ...row,
    liveStatus: processRegistry.matchProcess(row.pid, row.cmd)
  }))
}

function setupIpcHandlers(): void {
  for (const channel of IPC_CHANNELS) {
    ipcMain.removeHandler(channel)
  }

  ipcMain.handle('atop:listLogs', () => listAtopLogs())
  ipcMain.handle('atop:loadSamples', (_event, logPath: string) => loadSystemSamples(logPath))
  ipcMain.handle('atop:loadProcesses', async (_event, logPath: string, sampleIndex: number) => {
    const settings = getSettingsSnapshot()
    const rows = await loadProcessRows(logPath, sampleIndex, settings.processFilter)
    return enrichProcesses(rows)
  })
  ipcMain.handle('atop:loadProcessTimeline', (_event, logPath: string) => {
    const settings = getSettingsSnapshot()
    return loadProcessTimeline(logPath, settings.timeline.topN)
  })
  ipcMain.handle('atop:loadProcessSeries', (_event, logPath: string, pid: number, cmd: string) =>
    loadProcessSeries(logPath, pid, cmd)
  )
  ipcMain.handle('atop:getConfig', () => getAtopConfig())
  ipcMain.handle('atop:startLiveWatch', (_event, logPath: string) => liveService.start(logPath))
  ipcMain.handle('atop:stopLiveWatch', () => liveService.stop())
  ipcMain.handle('system:getProcessSnapshot', () => processRegistry.getSnapshot())
  ipcMain.handle('settings:get', () => loadSettings())
  ipcMain.handle('settings:save', (_event, partial) => saveSettings(partial))
  ipcMain.handle('settings:getPath', () => getSettingsFilePath())
}

// Registrar siempre al cargar el módulo (también tras hot-reload del main en dev)
setupIpcHandlers()

// Linux: packaged installs need no-sandbox and X11 ozone (Wayland/GTK4 breaks Electron).
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('no-sandbox')
  app.commandLine.appendSwitch('ozone-platform', 'x11')
}

function attachServices(win: BrowserWindow): void {
  liveService.attachWindow(win)
  processRegistry.attachWindow(win)
}

function detachServices(): void {
  liveService.detachWindow()
  processRegistry.detachWindow()
}

async function loadRenderer(win: BrowserWindow): Promise<void> {
  const devUrl = process.env.ELECTRON_RENDERER_URL
  const candidates = [devUrl, 'http://localhost:5173/', 'http://localhost:5174/'].filter(
    (url, index, list): url is string => Boolean(url) && list.indexOf(url) === index
  )

  for (const url of candidates) {
    try {
      await win.loadURL(url)
      console.log('[atop-viewer] loaded', url)
      return
    } catch (error) {
      console.error('[atop-viewer] loadURL failed', url, error)
    }
  }

  const indexPath = path.join(__dirname, '../renderer/index.html')
  await win.loadFile(indexPath)
  console.log('[atop-viewer] loaded file', indexPath)
}

function wireWindowDiagnostics(win: BrowserWindow): void {
  win.webContents.on('did-fail-load', (_event, code, desc, url, isMainFrame) => {
    if (!isMainFrame) return
    console.error('[atop-viewer] did-fail-load', code, desc, url)
    if (url !== 'http://localhost:5173/') {
      void win.loadURL('http://localhost:5173/').catch(() => undefined)
    }
  })

  win.webContents.on('render-process-gone', (_event, details) => {
    console.error('[atop-viewer] render-process-gone', details.reason, details.exitCode)
  })

  win.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    if (level >= 2) {
      console.error('[renderer]', message, sourceId, line)
    }
  })
}

function createWindow(): void {
  if (mainWindow) {
    mainWindow.focus()
    return
  }

  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    title: 'Atop Viewer',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow = win
  wireWindowDiagnostics(win)

  win.once('ready-to-show', () => {
    win.show()
    win.focus()
  })

  win.webContents.once('did-finish-load', () => {
    attachServices(win)
  })

  win.on('closed', () => {
    mainWindow = null
    detachServices()
  })

  if (process.env.ELECTRON_RENDERER_URL || !app.isPackaged) {
    void loadRenderer(win)
  } else {
    void win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

if (gotSingleInstanceLock) {
  app.whenReady().then(async () => {
    await loadSettings()
    createWindow()

    if (logListTimer) clearInterval(logListTimer)
    logListTimer = setInterval(() => void liveService.refreshLogs(), 60_000)

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
      else mainWindow?.focus()
    })
  })

  app.on('window-all-closed', () => {
    if (logListTimer) clearInterval(logListTimer)
    liveService.stop()
    processRegistry.detachWindow()
    if (process.platform !== 'darwin') app.quit()
  })
}
