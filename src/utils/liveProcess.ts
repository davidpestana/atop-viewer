import type { LiveProcessSnapshot, ProcessLiveStatus, ProcessRow } from '../types'

function cmdMatches(atopCmd: string, comm: string, cmdline: string): boolean {
  const token = atopCmd.trim().split(/\s+/)[0] ?? atopCmd
  const base = token.split('/').pop() ?? token
  if (!base) return false
  return comm === base || cmdline.includes(base) || atopCmd.includes(comm)
}

export function matchLiveStatus(
  pid: number,
  atopCmd: string,
  snapshot: LiveProcessSnapshot | null
): ProcessLiveStatus {
  if (!snapshot) return 'dead'
  const live = snapshot.byPid[pid]
  if (!live) return 'dead'
  return cmdMatches(atopCmd, live.comm, live.cmdline) ? 'alive' : 'reused'
}

export function applyLiveStatus(rows: ProcessRow[], snapshot: LiveProcessSnapshot | null): ProcessRow[] {
  if (!snapshot) return rows
  return rows.map((row) => ({
    ...row,
    liveStatus: matchLiveStatus(row.pid, row.cmd, snapshot)
  }))
}

export function countLiveStats(rows: ProcessRow[]): { alive: number; reused: number; dead: number } {
  return rows.reduce(
    (acc, row) => {
      if (row.liveStatus === 'alive') acc.alive += 1
      else if (row.liveStatus === 'reused') acc.reused += 1
      else acc.dead += 1
      return acc
    },
    { alive: 0, reused: 0, dead: 0 }
  )
}
