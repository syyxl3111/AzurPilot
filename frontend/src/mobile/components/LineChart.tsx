/**
 * 手写 SVG 折线图。
 *
 * 刻意不引 ECharts：PC 的图表 chunk 是 581 kB（gzip 196 kB），而手机端这里只需要
 * 一条折线加面积填充。默认粒度「每小时」由 statisticsData.ts 的 aggregatePoints
 * 在调用方完成聚合（每桶取末值），本组件只负责画。
 */

export interface LinePoint {
  time: string
  value: number
}

interface Props {
  points: LinePoint[]
  /** 无障碍描述 */
  label: string
  height?: number
  /** 数据不足以成线时给出的提示 */
  hint?: string
}

export function LineChart({points, label, height = 160, hint}: Props) {
  if (!points.length) return null
  const values = points.map(point => point.value)
  const minimum = Math.min(...values)
  const maximum = Math.max(...values)
  const span = maximum - minimum || 1
  const width = 300
  const pad = 8
  const usable = height - pad * 2

  const x = (index: number) => points.length === 1
    ? width / 2
    : pad + (index / (points.length - 1)) * (width - pad * 2)
  const y = (value: number) => pad + (1 - (value - minimum) / span) * usable

  const line = points.map((point, index) => `${x(index)},${y(point.value)}`).join(' ')
  const area = `${pad},${height - pad} ${line} ${width - pad},${height - pad}`
  const singlePoint = points.length === 1

  return <div>
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height}
      role="img" aria-label={label} preserveAspectRatio="none">
      <polygon points={area} fill="var(--accent)" opacity="0.12" />
      {singlePoint
        ? <circle cx={x(0)} cy={y(values[0])} r="4" fill="var(--accent)" />
        : <polyline points={line} fill="none" stroke="var(--accent)" strokeWidth="2"
            strokeLinejoin="round" strokeLinecap="round" />}
    </svg>
    {hint ? <p style={{margin: '4px 0 0', fontSize: 12, color: 'var(--muted)'}}>{hint}</p> : null}
  </div>
}
