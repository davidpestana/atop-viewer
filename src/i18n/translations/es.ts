export const es = {
  app: {
    title: 'Atop Viewer',
    subtitle: 'Explorador de logs atop'
  },
  lang: {
    es: 'ES',
    en: 'EN'
  },
  live: {
    on: 'En vivo',
    off: 'Pausado',
    follow: 'Seguir último',
    autoRefresh: 'Actualización automática'
  },
  actions: {
    refresh: 'Actualizar',
    refreshing: 'Actualizando…',
    reloadLogs: 'Logs'
  },
  controls: {
    dailyLog: 'Log',
    noLogs: 'Sin logs',
    samples: '{{count}} muestras · {{interval}}',
    timeline: 'Muestra'
  },
  status: {
    sampleEvery: 'Muestreo {{interval}}',
    nextSample: 'Próxima en {{time}}',
    waitingSample: 'Esperando muestra',
    updated: 'Actualizado {{time}}'
  },
  loading: {
    data: 'Cargando…',
    timeline: 'Cargando procesos…'
  },
  empty: {
    noSamples: 'Sin muestras. Comprueba atop:',
    noCgroup: 'sin cgroup'
  },
  stats: {
    sampleTime: 'Hora',
    load1: 'Load 1m',
    cpuUser: 'CPU user',
    memFree: 'RAM libre'
  },
  charts: {
    load: 'Load average',
    load1: '1 min',
    load5: '5 min',
    cpuMem: 'CPU y memoria',
    cpuUser: 'CPU user',
    cpuSys: 'CPU sys',
    memUsed: 'RAM usada'
  },
  processes: {
    title: 'Procesos',
    heatmap: 'Mapa de procesos',
    stackCpu: 'CPU por proceso',
    stackRam: 'RAM por proceso',
    lifecycle: 'Ciclo de vida',
    lifecycleMeta: 'CPU máx {{cpu}}% · RAM máx {{ram}} MB',
    columnProcess: 'Proceso',
    columnStatus: 'Estado',
    columnPid: 'PID',
    columnName: 'Nombre',
    columnCpu: 'CPU %',
    columnUser: 'User ms',
    columnSys: 'Sys ms',
    metricCpu: 'CPU',
    metricRam: 'RAM',
    inactive: 'inactivo',
    tooltipCpu: '{{value}}% CPU',
    tooltipRam: '{{value}} MB'
  },
  processStatus: {
    alive: 'Vivo',
    dead: 'Terminado',
    reused: 'PID reutilizado'
  },
  settings: {
    title: 'Relevancia en interfaz',
    minCpu: 'CPU mínima en intervalo',
    minCpuAll: 'Todos (0%)',
    maxRows: 'Máx. filas en tabla',
    timelineTopN: 'Procesos en mapa temporal',
    savedTo: 'Guardado en'
  },
  errors: {
    uiTitle: 'Error en la interfaz',
    reload: 'Recargar',
    bootTitle: 'No se pudo iniciar',
    noPreload: 'API no disponible. Reinicia la app.'
  }
} as const

export type TranslationTree = typeof es
