import { useEffect, useState } from 'react'
import type { LiveProcessSnapshot } from '../types'

export function useLiveProcessSnapshot(): LiveProcessSnapshot | null {
  const [snapshot, setSnapshot] = useState<LiveProcessSnapshot | null>(null)

  useEffect(() => {
    if (!window.atopViewer) return
    void window.atopViewer.getProcessSnapshot().then(setSnapshot).catch(console.error)
    return window.atopViewer.onProcessSnapshot(setSnapshot)
  }, [])

  return snapshot
}
