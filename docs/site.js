const RELEASES_URL = 'https://github.com/davidpestana/atop-viewer/releases'

function renderDownloads(data) {
  const t = window.__siteT
  const versionLine = document.getElementById('version-line')
  const downloadsEl = document.getElementById('downloads')
  const releaseLink = document.getElementById('release-link')

  versionLine.textContent = t.versionLine(data.version)
  releaseLink.href = data.releasePage || RELEASES_URL

  const labels = {
    deb: t.debLabel,
    appimage: t.appImageLabel
  }

  const items = [data.assets.deb, data.assets.appimage].filter(Boolean)
  downloadsEl.innerHTML = items
    .map((asset) => {
      const key = asset === data.assets.deb ? 'deb' : 'appimage'
      return `
        <a class="download-btn" href="${asset.url}" rel="noopener">
          ${labels[key] || asset.label}
          <small>${asset.file}</small>
        </a>`
    })
    .join('')
}

function renderDownloadError() {
  const t = window.__siteT
  document.getElementById('version-line').textContent = t.versionFallback
  document.getElementById('downloads').innerHTML =
    `<p class="error">${t.manifestError(RELEASES_URL)}</p>`
}

async function loadDownloads() {
  const loading = document.getElementById('downloads-loading')
  try {
    const response = await fetch('downloads.json', { cache: 'no-store' })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    if (loading) loading.remove()
    renderDownloads(data)
  } catch (error) {
    if (loading) loading.remove()
    renderDownloadError()
    console.error(error)
  }
}

document.querySelectorAll('[data-locale]').forEach((btn) => {
  btn.addEventListener('click', () => setSiteLocale(btn.dataset.locale))
})

document.addEventListener('site-locale-change', () => {
  void loadDownloads()
})

applySiteLocale(detectSiteLocale())
void loadDownloads()
