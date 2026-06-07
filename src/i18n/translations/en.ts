import type { TranslationTree } from './es'

export const en: TranslationTree = {
  app: {
    title: 'Atop Viewer',
    subtitle: 'Atop log explorer'
  },
  lang: {
    es: 'ES',
    en: 'EN'
  },
  live: {
    on: 'Live',
    off: 'Paused',
    follow: 'Follow latest',
    autoRefresh: 'Auto refresh'
  },
  actions: {
    refresh: 'Refresh',
    refreshing: 'Refreshing…',
    reloadLogs: 'Logs'
  },
  controls: {
    dailyLog: 'Log',
    noLogs: 'No logs',
    samples: '{{count}} samples · {{interval}}',
    timeline: 'Sample'
  },
  status: {
    sampleEvery: 'Sample every {{interval}}',
    nextSample: 'Next in {{time}}',
    waitingSample: 'Waiting for sample',
    updated: 'Updated {{time}}'
  },
  loading: {
    data: 'Loading…',
    timeline: 'Loading processes…'
  },
  empty: {
    noSamples: 'No samples. Check atop:',
    noCgroup: 'no cgroup'
  },
  stats: {
    sampleTime: 'Time',
    load1: 'Load 1m',
    cpuUser: 'CPU user',
    memFree: 'Free RAM'
  },
  charts: {
    load: 'Load average',
    load1: '1 min',
    load5: '5 min',
    cpuMem: 'CPU & memory',
    cpuUser: 'CPU user',
    cpuSys: 'CPU sys',
    memUsed: 'RAM used'
  },
  processes: {
    title: 'Processes',
    heatmap: 'Process map',
    stackCpu: 'CPU by process',
    stackRam: 'Memory by process',
    lifecycle: 'Lifecycle',
    lifecycleMeta: 'Peak CPU {{cpu}}% · Peak RAM {{ram}} MB',
    columnProcess: 'Process',
    columnStatus: 'Status',
    columnPid: 'PID',
    columnName: 'Name',
    columnCpu: 'CPU %',
    columnUser: 'User ms',
    columnSys: 'Sys ms',
    metricCpu: 'CPU',
    metricRam: 'RAM',
    inactive: 'inactive',
    tooltipCpu: '{{value}}% CPU',
    tooltipRam: '{{value}} MB'
  },
  processStatus: {
    alive: 'Running',
    dead: 'Stopped',
    reused: 'PID reused'
  },
  settings: {
    title: 'Display relevance',
    minCpu: 'Min CPU per interval',
    minCpuAll: 'All (0%)',
    maxRows: 'Max table rows',
    timelineTopN: 'Processes in timeline map',
    savedTo: 'Saved to'
  },
  errors: {
    uiTitle: 'UI error',
    reload: 'Reload',
    bootTitle: 'Could not start',
    noPreload: 'API unavailable. Restart the app.'
  }
}
