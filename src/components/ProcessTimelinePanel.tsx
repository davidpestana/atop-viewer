import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { useI18n } from '../i18n'
import type { ProcessTimeline, ProcessTimelineSeries, TimelineMetric } from '../types'

const STACK_COLORS = ['#8ab4f8', '#81c995', '#f28b82', '#fdd663', '#c58af9', '#78d9ec', '#fcad70', '#a8dab5']

function metricValue(series: ProcessTimelineSeries, index: number, metric: TimelineMetric): number {
  const point = series.points[index]
  if (!point?.present) return 0
  return metric === 'cpu' ? point.cpuPct : point.rssMb
}

function heatColor(value: number, metric: TimelineMetric, max: number): string {
  if (value <= 0) return '#12141c'
  const t = Math.min(1, value / Math.max(max, 0.001))
  if (metric === 'cpu') {
    const r = Math.round(26 + t * 216)
    const g = Math.round(20 + t * 60)
    const b = Math.round(28 + t * 80)
    return `rgb(${r}, ${g}, ${b})`
  }
  const r = Math.round(26 + t * 100)
  const g = Math.round(20 + t * 120)
  const b = Math.round(60 + t * 180)
  return `rgb(${r}, ${g}, ${b})`
}

function shortLabel(cmd: string, cgroup: string): string {
  if (cmd.length > 18) return `${cmd.slice(0, 16)}…`
  return cmd || cgroup.split('/').filter(Boolean).pop() || 'proc'
}

interface Props {
  timeline: ProcessTimeline | null
  metric: TimelineMetric
  onMetricChange: (metric: TimelineMetric) => void
  selected: ProcessTimelineSeries | null
  onSelect: (series: ProcessTimelineSeries) => void
  sampleIndex: number
  loading: boolean
}

export default function ProcessTimelinePanel({
  timeline,
  metric,
  onMetricChange,
  selected,
  onSelect,
  sampleIndex,
  loading
}: Props) {
  const { t } = useI18n()

  const stackSeries = useMemo(() => timeline?.series.slice(0, 8) ?? [], [timeline])

  const stackData = useMemo(() => {
    if (!timeline) return []
    return timeline.times.map((time) => {
      const row: Record<string, string | number> = {
        time: time.timeLabel,
        index: time.index
      }
      for (const series of stackSeries) {
        row[series.id] = metricValue(series, time.index, metric)
      }
      return row
    })
  }, [timeline, stackSeries, metric])

  const heatMax = useMemo(() => {
    if (!timeline) return 1
    let max = 0.001
    for (const series of timeline.series) {
      for (const point of series.points) {
        if (!point.present) continue
        max = Math.max(max, metric === 'cpu' ? point.cpuPct : point.rssMb)
      }
    }
    return max
  }, [timeline, metric])

  const lifecycleData = useMemo(() => {
    if (!selected) return []
    return selected.points.map((point) => ({
      time: point.timeLabel,
      index: point.sampleIndex,
      cpuPct: point.present ? point.cpuPct : null,
      rssMb: point.present ? point.rssMb : null,
      present: point.present
    }))
  }, [selected])

  if (loading) {
    return <div className="panel loading">{t('loading.timeline')}</div>
  }

  if (!timeline || timeline.series.length === 0) {
    return null
  }

  const currentTime = timeline.times[sampleIndex]?.timeLabel
  const stackTitle = metric === 'cpu' ? t('processes.stackCpu') : t('processes.stackRam')

  return (
    <section className="timeline-panel">
      <div className="panel">
        <div className="panel-heading panel-heading--row">
          <h2 className="chart-title">{t('processes.heatmap')}</h2>
          <div className="metric-toggle">
            <button
              type="button"
              className={metric === 'cpu' ? 'active' : 'secondary'}
              onClick={() => onMetricChange('cpu')}
            >
              {t('processes.metricCpu')}
            </button>
            <button
              type="button"
              className={metric === 'rss' ? 'active' : 'secondary'}
              onClick={() => onMetricChange('rss')}
            >
              {t('processes.metricRam')}
            </button>
          </div>
        </div>

        <div className="heatmap-wrap">
          <table className="heatmap">
            <thead>
              <tr>
                <th>{t('processes.columnProcess')}</th>
                {timeline.times.map((time) => (
                  <th key={time.index} className={time.index === sampleIndex ? 'heatmap-now' : ''}>
                    {time.timeLabel}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeline.series.map((series) => (
                <tr
                  key={series.id}
                  className={selected?.id === series.id ? 'heatmap-row--selected' : ''}
                  onClick={() => onSelect(series)}
                >
                  <th title={`${series.cmd} (${series.pid}) ${series.cgroup}`}>
                    <span className="heatmap-label">{shortLabel(series.cmd, series.cgroup)}</span>
                    <span className="heatmap-meta">{series.pid}</span>
                  </th>
                  {series.points.map((point) => {
                    const value = point.present ? (metric === 'cpu' ? point.cpuPct : point.rssMb) : 0
                    return (
                      <td
                        key={point.sampleIndex}
                        className={point.sampleIndex === sampleIndex ? 'heatmap-now' : ''}
                        style={{ background: heatColor(value, metric, heatMax) }}
                        title={
                          point.present
                            ? `${point.timeLabel}\n${
                                metric === 'cpu'
                                  ? t('processes.tooltipCpu', { value: value.toFixed(1) })
                                  : t('processes.tooltipRam', { value: value.toFixed(1) })
                              }`
                            : `${point.timeLabel}\n${t('processes.inactive')}`
                        }
                      />
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <h2 className="chart-title">{stackTitle}</h2>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={stackData}>
            <CartesianGrid stroke="#2a2f3a" strokeDasharray="3 3" />
            <XAxis dataKey="time" minTickGap={24} stroke="#9aa0a6" />
            <YAxis stroke="#9aa0a6" unit={metric === 'cpu' ? '%' : ' MB'} />
            <Tooltip contentStyle={{ background: '#171923', border: '1px solid #2a2f3a' }} />
            <Legend />
            {currentTime ? <ReferenceLine x={currentTime} stroke="#e8eaed" strokeDasharray="4 4" /> : null}
            {stackSeries.map((series, index) => (
              <Area
                key={series.id}
                type="monotone"
                dataKey={series.id}
                name={shortLabel(series.cmd, series.cgroup)}
                stackId="1"
                stroke={STACK_COLORS[index % STACK_COLORS.length]}
                fill={STACK_COLORS[index % STACK_COLORS.length]}
                fillOpacity={0.55}
                isAnimationActive={false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {selected ? (
        <div className="panel">
          <div className="panel-heading">
            <h2 className="chart-title">
              {t('processes.lifecycle')} — {selected.cmd}
            </h2>
            <p className="panel-subtitle">
              PID {selected.pid} · {selected.cgroup || t('empty.noCgroup')} ·{' '}
              {t('processes.lifecycleMeta', {
                cpu: selected.peakCpuPct.toFixed(1),
                ram: selected.peakRssMb.toFixed(1)
              })}
            </p>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={lifecycleData}>
              <CartesianGrid stroke="#2a2f3a" strokeDasharray="3 3" />
              <XAxis dataKey="time" minTickGap={24} stroke="#9aa0a6" />
              <YAxis yAxisId="cpu" stroke="#f28b82" unit="%" />
              <YAxis yAxisId="rss" orientation="right" stroke="#c58af9" unit=" MB" />
              <Tooltip contentStyle={{ background: '#171923', border: '1px solid #2a2f3a' }} />
              <Legend />
              {currentTime ? (
                <ReferenceLine
                  x={currentTime}
                  yAxisId="cpu"
                  stroke="#e8eaed"
                  strokeDasharray="4 4"
                />
              ) : null}
              <Line
                yAxisId="cpu"
                type="monotone"
                dataKey="cpuPct"
                name={t('processes.metricCpu')}
                stroke="#f28b82"
                dot={{ r: 3 }}
                connectNulls={false}
                isAnimationActive={false}
              />
              <Line
                yAxisId="rss"
                type="monotone"
                dataKey="rssMb"
                name={t('processes.metricRam')}
                stroke="#c58af9"
                dot={{ r: 3 }}
                connectNulls={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </section>
  )
}
