(async function loadDownloads() {
  const versionLine = document.getElementById('version-line')
  const downloadsEl = document.getElementById('downloads')
  const releaseLink = document.getElementById('release-link')

  try {
    const response = await fetch('downloads.json', { cache: 'no-store' })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()

    versionLine.textContent = `Versión ${data.version} (beta)`
    releaseLink.href = data.releasePage || releaseLink.href

    const items = [data.assets.deb, data.assets.appimage].filter(Boolean)
    downloadsEl.innerHTML = items
      .map(
        (asset) => `
        <a class="download-btn" href="${asset.url}" rel="noopener">
          ${asset.label}
          <small>${asset.file}</small>
        </a>`
      )
      .join('')
  } catch (error) {
    versionLine.textContent = 'Versión beta — consulta GitHub Releases'
    downloadsEl.innerHTML =
      '<p class="error">No hay manifiesto local todavía. Usa <a href="https://github.com/davidpestana/atop-viewer/releases">GitHub Releases</a>.</p>'
    console.error(error)
  }
})()
