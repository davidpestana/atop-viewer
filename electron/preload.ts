import { contextBridge, ipcRenderer } from 'electron'
import type { AtopLiveHeartbeat, AtopLiveUpdate, AtopLogFile, AtopViewerApi, LiveProcessSnapshot } from '../src/types'

const api: AtopViewerApi = {
  listLogs: () => ipcRenderer.invoke('atop:listLogs'),
  loadSamples: (logPath) => ipcRenderer.invoke('atop:loadSamples', logPath),
  loadProcesses: (logPath, sampleIndex) => ipcRenderer.invoke('atop:loadProcesses', logPath, sampleIndex),
  loadProcessTimeline: (logPath) => ipcRenderer.invoke('atop:loadProcessTimeline', logPath),
  loadProcessSeries: (logPath, pid, cmd) => ipcRenderer.invoke('atop:loadProcessSeries', logPath, pid, cmd),
  getConfig: () => ipcRenderer.invoke('atop:getConfig'),
  startLiveWatch: (logPath) => ipcRenderer.invoke('atop:startLiveWatch', logPath),
  stopLiveWatch: () => ipcRenderer.invoke('atop:stopLiveWatch'),
  onLiveUpdate: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: AtopLiveUpdate) => callback(payload)
    ipcRenderer.on('atop:live-update', handler)
    return () => ipcRenderer.removeListener('atop:live-update', handler)
  },
  onLiveHeartbeat: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: AtopLiveHeartbeat) => callback(payload)
    ipcRenderer.on('atop:live-heartbeat', handler)
    return () => ipcRenderer.removeListener('atop:live-heartbeat', handler)
  },
  onLogsChanged: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: { logs: AtopLogFile[]; updatedAt: number }) =>
      callback(payload)
    ipcRenderer.on('atop:logs-changed', handler)
    return () => ipcRenderer.removeListener('atop:logs-changed', handler)
  },
  onLiveError: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: { logPath?: string; message: string }) =>
      callback(payload)
    ipcRenderer.on('atop:live-error', handler)
    return () => ipcRenderer.removeListener('atop:live-error', handler)
  },
  getProcessSnapshot: () => ipcRenderer.invoke('system:getProcessSnapshot'),
  onProcessSnapshot: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, snapshot: LiveProcessSnapshot) => callback(snapshot)
    ipcRenderer.on('system:process-snapshot', handler)
    return () => ipcRenderer.removeListener('system:process-snapshot', handler)
  },
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (partial) => ipcRenderer.invoke('settings:save', partial),
  getSettingsPath: () => ipcRenderer.invoke('settings:getPath')
}

contextBridge.exposeInMainWorld('atopViewer', api)
