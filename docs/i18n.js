const SITE_LOCALES = ['en', 'es']

const SITE_MESSAGES = {
  en: {
    htmlLang: 'en',
    pageTitle: 'Atop Viewer — Linux atop log analyzer (desktop app)',
    metaDescription:
      'Atop Viewer — desktop GUI for Linux atop historical logs. Atop log analyzer and visualizer. Requires atop installed. Download .deb or AppImage.',
    badge: 'Beta · Linux desktop · MIT',
    tagline: 'Desktop GUI for Linux atop historical logs — not a browser app.',
    lead:
      'Explore daily <a href="https://www.atoptool.nl/">atop</a> logs with charts, live refresh, process tables, and timelines. Uses <code>atop -r -J</code> on your machine — data never leaves your system.',
    versionLoading: 'Loading version…',
    versionLine: (v) => `Latest release: ${v} (beta)`,
    versionFallback: 'Beta — see GitHub Releases',
    demoCaption: 'Full dashboard — load/CPU charts, process map, lifecycle detail, and process table.',
    featuresTitle: 'Features',
    features: [
      'Time slider across atop samples (load, CPU, memory)',
      'Process table with live / terminated / PID-reused status',
      'Live mode when atop writes new samples',
      'Process heatmap, stack, and lifecycle views',
      'Configurable CPU filter and ES/EN UI',
      'Local-only — no upload server'
    ],
    howTitle: 'How it works',
    howCode: '/var/log/atop/atop_YYYYMMDD  →  atop -r LOG -J JSON  →  Atop Viewer',
    howNote:
      'Requires <code>atop</code> installed (<code>sudo apt install atop</code>). Does not parse binary logs in the browser and does not need <code>atop -P</code>.',
    downloadTitle: 'Download',
    downloadHint: 'Linux amd64 · requires atop on the system.',
    downloadsLoading: 'Loading installers…',
    alsoOn: 'Also on',
    releaseLink: 'GitHub Releases',
    readmeLink: 'README',
    installDebTitle: 'Install on Ubuntu / Debian',
    installDebCode: 'sudo dpkg -i ~/atop-viewer-VERSION-amd64.deb\nsudo apt -f install   # if needed\natop-viewer',
    installDebNote:
      'Prefer <code>dpkg -i</code> when the file is in <code>$HOME</code>. Replace VERSION with the downloaded beta tag.',
    installAppImageTitle: 'Other Linux distributions',
    installAppImageCode: 'chmod +x atop-viewer-VERSION-x86_64.AppImage\n./atop-viewer-VERSION-x86_64.AppImage',
    installAppImageNote: 'Portable AppImage — still needs atop and often libfuse2.',
    limitsTitle: 'Limitations (beta)',
    limits: [
      'Linux desktop only (Electron), not a web UI',
      'Reads system atop logs under /var/log/atop by default',
      'Live refresh bounded by atop LOGINTERVAL (often 10 min)',
      'amd64 installers; beta APIs may change'
    ],
    roadmapTitle: 'Roadmap',
    roadmap: [
      'Open user-selected log files',
      'Disk and network charts',
      'Export CSV/JSON',
      'Stable 1.0 after wider testing'
    ],
    license: (url) => `License <a href="${url}">MIT</a>.`,
    debLabel: 'Debian/Ubuntu (.deb)',
    appImageLabel: 'AppImage (portable Linux)',
    manifestError: (url) =>
      `No local manifest yet. Use <a href="${url}">GitHub Releases</a>.`
  },
  es: {
    htmlLang: 'es',
    pageTitle: 'Atop Viewer — analizador visual de logs atop (app de escritorio Linux)',
    metaDescription:
      'Atop Viewer — interfaz gráfica de escritorio para logs históricos de atop en Linux. Analizador y visualizador de logs atop. Requiere atop instalado.',
    badge: 'Beta · escritorio Linux · MIT',
    tagline: 'Interfaz de escritorio para logs históricos de atop — no es una app web.',
    lead:
      'Explora logs diarios de <a href="https://www.atoptool.nl/">atop</a> con gráficas, modo en vivo, procesos y líneas temporales. Usa <code>atop -r -J</code> en tu máquina — los datos no salen del sistema.',
    versionLoading: 'Cargando versión…',
    versionLine: (v) => `Última release: ${v} (beta)`,
    versionFallback: 'Versión beta — consulta GitHub Releases',
    demoCaption: 'Panel completo — gráficas, mapa de procesos, ciclo de vida y tabla.',
    featuresTitle: 'Características',
    features: [
      'Slider temporal sobre muestras atop (load, CPU, memoria)',
      'Tabla de procesos con estado vivo / terminado / PID reutilizado',
      'Modo en vivo cuando atop escribe una muestra nueva',
      'Heatmap, stack y ciclo de vida de procesos',
      'Filtro CPU configurable e interfaz ES/EN',
      'Solo local — sin servidor de subida'
    ],
    howTitle: 'Cómo funciona',
    howCode: '/var/log/atop/atop_YYYYMMDD  →  atop -r LOG -J JSON  →  Atop Viewer',
    howNote:
      'Requiere <code>atop</code> instalado (<code>sudo apt install atop</code>). No parsea binarios en el navegador ni necesita <code>atop -P</code>.',
    downloadTitle: 'Descargar',
    downloadHint: 'Linux amd64 · requiere atop en el sistema.',
    downloadsLoading: 'Cargando instaladores…',
    alsoOn: 'También en',
    releaseLink: 'GitHub Releases',
    readmeLink: 'README',
    installDebTitle: 'Instalar en Ubuntu / Debian',
    installDebCode: 'sudo dpkg -i ~/atop-viewer-VERSION-amd64.deb\nsudo apt -f install   # si hace falta\natop-viewer',
    installDebNote:
      'Mejor <code>dpkg -i</code> si el fichero está en <code>$HOME</code>. Sustituye VERSION por la beta descargada.',
    installAppImageTitle: 'Otras distribuciones Linux',
    installAppImageCode: 'chmod +x atop-viewer-VERSION-x86_64.AppImage\n./atop-viewer-VERSION-x86_64.AppImage',
    installAppImageNote: 'AppImage portable — igualmente necesitas atop y a menudo libfuse2.',
    limitsTitle: 'Limitaciones (beta)',
    limits: [
      'Solo escritorio Linux (Electron), no es una web',
      'Lee logs atop del sistema en /var/log/atop por defecto',
      'El modo en vivo depende del LOGINTERVAL de atop (a menudo 10 min)',
      'Instaladores amd64; APIs beta pueden cambiar'
    ],
    roadmapTitle: 'Roadmap',
    roadmap: [
      'Abrir ficheros de log elegidos por el usuario',
      'Gráficas de disco y red',
      'Exportar CSV/JSON',
      'Estable 1.0 tras más pruebas en distros'
    ],
    license: (url) => `Licencia <a href="${url}">MIT</a>.`,
    debLabel: 'Debian/Ubuntu (.deb)',
    appImageLabel: 'AppImage (portable Linux)',
    manifestError: (url) =>
      `No hay manifiesto local todavía. Usa <a href="${url}">GitHub Releases</a>.`
  }
}

function detectSiteLocale() {
  const saved = localStorage.getItem('atop-viewer-site-locale')
  if (saved && SITE_LOCALES.includes(saved)) return saved
  const lang = (navigator.language || 'en').toLowerCase()
  return lang.startsWith('es') ? 'es' : 'en'
}

function setSiteLocale(locale) {
  if (!SITE_LOCALES.includes(locale)) return
  localStorage.setItem('atop-viewer-site-locale', locale)
  applySiteLocale(locale)
}

function renderList(id, items) {
  const el = document.getElementById(id)
  if (!el || !items) return
  el.innerHTML = items.map((item) => `<li>${item}</li>`).join('')
}

function applySiteLocale(locale) {
  const t = SITE_MESSAGES[locale]
  if (!t) return
  document.documentElement.lang = t.htmlLang
  document.title = t.pageTitle

  const meta = document.querySelector('meta[name="description"]')
  if (meta) meta.content = t.metaDescription

  const textMap = {
    badge: t.badge,
    tagline: t.tagline,
    lead: t.lead,
    'demo-caption': t.demoCaption,
    'features-title': t.featuresTitle,
    'how-title': t.howTitle,
    'how-note': t.howNote,
    'download-title': t.downloadTitle,
    'download-hint': t.downloadHint,
    'also-on': t.alsoOn,
    'release-link': t.releaseLink,
    'readme-link': t.readmeLink,
    'install-deb-title': t.installDebTitle,
    'install-deb-note': t.installDebNote,
    'install-appimage-title': t.installAppImageTitle,
    'install-appimage-note': t.installAppImageNote,
    'limits-title': t.limitsTitle,
    'roadmap-title': t.roadmapTitle
  }

  for (const [id, html] of Object.entries(textMap)) {
    const el = document.getElementById(id)
    if (!el) continue
    if (id === 'release-link' || id === 'readme-link') el.textContent = html
    else el.innerHTML = html
  }

  const howCode = document.querySelector('#how-code code')
  if (howCode) howCode.textContent = t.howCode
  const debCode = document.querySelector('#install-deb-code code')
  if (debCode) debCode.textContent = t.installDebCode
  const appCode = document.querySelector('#install-appimage-code code')
  if (appCode) appCode.textContent = t.installAppImageCode

  const demoImg = document.getElementById('demo-img')
  if (demoImg) demoImg.alt = t.pageTitle

  renderList('features-list', t.features)
  renderList('limits-list', t.limits)
  renderList('roadmap-list', t.roadmap)

  document.getElementById('license-line').innerHTML = t.license(
    'https://github.com/davidpestana/atop-viewer/blob/master/LICENSE'
  )

  const versionLine = document.getElementById('version-line')
  if (versionLine && !versionLine.dataset.loaded) {
    versionLine.textContent = t.versionLoading
  }

  for (const btn of document.querySelectorAll('[data-locale]')) {
    btn.setAttribute('aria-pressed', btn.dataset.locale === locale ? 'true' : 'false')
  }

  window.__siteLocale = locale
  window.__siteT = t
  document.dispatchEvent(new CustomEvent('site-locale-change', { detail: { locale } }))
}
