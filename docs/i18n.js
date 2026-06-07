const SITE_LOCALES = ['en', 'es']

const SITE_MESSAGES = {
  en: {
    htmlLang: 'en',
    pageTitle: 'Atop Viewer — Downloads',
    metaDescription:
      'Graphical explorer for Linux atop logs. .deb and AppImage installers.',
    badge: 'Beta · open source (MIT)',
    lead:
      'Explore daily <a href="https://www.atoptool.nl/">atop</a> logs: system charts, live mode, processes, and timelines.',
    versionLoading: 'Loading version…',
    versionLine: (v) => `Version ${v} (beta)`,
    versionFallback: 'Beta — see GitHub Releases',
    downloadTitle: 'Download',
    downloadHint:
      'Requires <code>atop</code> on the system (<code>sudo apt install atop</code>).',
    downloadsLoading: 'Loading installers…',
    alsoOn: 'Also on',
    releaseLink: 'GitHub Releases',
    installDebTitle: 'Install on Ubuntu / Debian',
    installDebNote:
      'Replace <code>VERSION</code> with the downloaded release. The package depends on <code>atop</code>.',
    installAppImageTitle: 'Other Linux distributions',
    installAppImageNote:
      'AppImage needs no install step. Ensure <code>atop</code> and FUSE/libfuse2 are available on your distro.',
    devTitle: 'Source code & development',
    repoLabel: 'Repository:',
    license: (url) => `License <a href="${url}">MIT</a>.`,
    debLabel: 'Debian/Ubuntu (.deb)',
    appImageLabel: 'AppImage (portable Linux)',
    manifestError: (url) =>
      `No local manifest yet. Use <a href="${url}">GitHub Releases</a>.`
  },
  es: {
    htmlLang: 'es',
    pageTitle: 'Atop Viewer — Descargas',
    metaDescription:
      'Explorador gráfico de logs atop para Linux. Instaladores .deb y AppImage.',
    badge: 'Beta · software libre (MIT)',
    lead:
      'Visualiza logs diarios de <a href="https://www.atoptool.nl/">atop</a>: gráficas de sistema, modo en vivo, procesos y líneas temporales.',
    versionLoading: 'Cargando versión…',
    versionLine: (v) => `Versión ${v} (beta)`,
    versionFallback: 'Versión beta — consulta GitHub Releases',
    downloadTitle: 'Descargar',
    downloadHint:
      'Requiere <code>atop</code> instalado en el sistema (<code>sudo apt install atop</code>).',
    downloadsLoading: 'Cargando instaladores…',
    alsoOn: 'También en',
    releaseLink: 'GitHub Releases',
    installDebTitle: 'Instalar en Ubuntu / Debian',
    installDebNote:
      'Sustituye <code>VERSION</code> por la versión descargada. El paquete declara dependencia de <code>atop</code>.',
    installAppImageTitle: 'Otras distribuciones Linux',
    installAppImageNote:
      'AppImage no requiere instalación. Asegúrate de tener <code>atop</code> y FUSE/libfuse2 según tu distro.',
    devTitle: 'Código fuente y desarrollo',
    repoLabel: 'Repositorio:',
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

function applySiteLocale(locale) {
  const t = SITE_MESSAGES[locale]
  document.documentElement.lang = t.htmlLang
  document.title = t.pageTitle

  const meta = document.querySelector('meta[name="description"]')
  if (meta) meta.content = t.metaDescription

  const map = {
    badge: t.badge,
    lead: t.lead,
    'download-title': t.downloadTitle,
    'download-hint': t.downloadHint,
    'also-on': t.alsoOn,
    'release-link': t.releaseLink,
    'install-deb-title': t.installDebTitle,
    'install-deb-note': t.installDebNote,
    'install-appimage-title': t.installAppImageTitle,
    'install-appimage-note': t.installAppImageNote,
    'dev-title': t.devTitle,
    'repo-label': t.repoLabel
  }

  for (const [id, html] of Object.entries(map)) {
    const el = document.getElementById(id)
    if (!el) continue
    if (id === 'release-link') el.textContent = html
    else el.innerHTML = html
  }

  document.getElementById('license-line').innerHTML = t.license(
    'https://github.com/davidpestana/atop-viewer/blob/master/LICENSE'
  )

  for (const btn of document.querySelectorAll('[data-locale]')) {
    btn.setAttribute('aria-pressed', btn.dataset.locale === locale ? 'true' : 'false')
  }

  window.__siteLocale = locale
  window.__siteT = t
  document.dispatchEvent(new CustomEvent('site-locale-change', { detail: { locale } }))
}
