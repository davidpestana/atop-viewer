import type { BrowserWindow } from 'electron'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const SET_SLIDER_VALUE = `
async (value) => {
  const slider = document.querySelector('.timeline input[type="range"]')
  if (!slider) return false
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
  if (!setter) return false
  setter.call(slider, String(value))
  slider.dispatchEvent(new Event('input', { bubbles: true }))
  slider.dispatchEvent(new Event('change', { bubbles: true }))
  return true
}
`

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForCharts(win: BrowserWindow, timeoutMs: number): Promise<boolean> {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    const ready = await win.webContents.executeJavaScript(
      'Boolean(document.querySelector(".charts")) && !document.querySelector(".loading")',
      true
    )
    if (ready) return true
    await sleep(500)
  }
  return false
}

async function writePng(win: BrowserWindow, targetPath: string): Promise<void> {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true })
  const image = await win.webContents.capturePage()
  fs.writeFileSync(targetPath, image.toPNG())
  console.log('[atop-viewer] capture wrote', targetPath)
}

function buildGif(framesDir: string, gifPath: string): void {
  const result = spawnSync(
    'ffmpeg',
    [
      '-y',
      '-framerate',
      '2',
      '-i',
      path.join(framesDir, 'frame-%02d.png'),
      '-vf',
      'scale=960:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse',
      gifPath
    ],
    { stdio: 'inherit' }
  )
  if (result.status !== 0) {
    throw new Error('ffmpeg failed — install ffmpeg to build demo.gif')
  }
  console.log('[atop-viewer] capture wrote', gifPath)
}

export async function runCaptureMode(win: BrowserWindow): Promise<void> {
  const pngPath = process.env.ATOP_VIEWER_CAPTURE_PATH
  if (!pngPath) return

  const gifPath = process.env.ATOP_VIEWER_CAPTURE_GIF
  const framesDir = path.join(path.dirname(pngPath), '.demo-frames')

  const ready = await waitForCharts(win, 120_000)
  if (!ready) {
    throw new Error('Timed out waiting for charts — is atop installed and /var/log/atop readable?')
  }

  await sleep(1500)
  await writePng(win, pngPath)

  if (!gifPath) return

  fs.rmSync(framesDir, { recursive: true, force: true })
  fs.mkdirSync(framesDir, { recursive: true })

  const max = await win.webContents.executeJavaScript(
    'Number(document.querySelector(".timeline input[type=\\"range\\"]")?.max ?? 0)',
    true
  )
  const steps = Math.min(12, Math.max(4, max + 1))
  const indices = [...Array(steps)].map((_, i) => Math.round((i * max) / (steps - 1 || 1)))

  for (let i = 0; i < indices.length; i++) {
    await win.webContents.executeJavaScript(`(${SET_SLIDER_VALUE})(${indices[i]})`, true)
    await sleep(450)
    const framePath = path.join(framesDir, `frame-${String(i).padStart(2, '0')}.png`)
    await writePng(win, framePath)
  }

  buildGif(framesDir, gifPath)
  fs.rmSync(framesDir, { recursive: true, force: true })
}

export function isCaptureMode(): boolean {
  return Boolean(process.env.ATOP_VIEWER_CAPTURE_PATH)
}
