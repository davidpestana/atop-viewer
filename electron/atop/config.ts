import { readFile } from 'node:fs/promises'

export interface AtopConfig {
  sampleIntervalSec: number
  logPath: string
  logGenerations: number
}

export async function getAtopConfig(): Promise<AtopConfig> {
  let sampleIntervalSec = 600
  let logPath = '/var/log/atop'
  let logGenerations = 28

  try {
    const content = await readFile('/etc/default/atop', 'utf8')
    for (const line of content.split('\n')) {
      const interval = line.match(/^LOGINTERVAL=(\d+)/)
      if (interval) sampleIntervalSec = Number(interval[1])

      const pathMatch = line.match(/^LOGPATH=(.+)/)
      if (pathMatch) logPath = pathMatch[1].replace(/"/g, '').trim()

      const gens = line.match(/^LOGGENERATIONS=(\d+)/)
      if (gens) logGenerations = Number(gens[1])
    }
  } catch {
    // defaults
  }

  return { sampleIntervalSec, logPath, logGenerations }
}
