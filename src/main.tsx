import { createRoot } from 'react-dom/client'
import App from './App'
import { ErrorBoundary } from './ErrorBoundary'
import { I18nProvider } from './i18n'
import './index.css'

const rootEl = document.getElementById('root')

if (!rootEl) {
  throw new Error('Missing #root element')
}

if (!window.atopViewer) {
  rootEl.innerHTML =
    '<div class="panel error" style="margin:1rem;padding:1rem"><h2>Atop Viewer</h2><p>API unavailable. Restart the app.</p></div>'
} else {
  createRoot(rootEl).render(
    <I18nProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </I18nProvider>
  )
}
