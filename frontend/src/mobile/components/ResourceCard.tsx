/**
 * 资源卡：一行一块，外观直接套 PC 的 `.resource-card`。
 *
 * 毛玻璃、描边、圆角都来自 PC 的 theme-system.css（`.resource-card` 与 `.panel`
 * 同属玻璃表面那一组），手机端只在 mobile.css 里把它排成一行：
 *   左列 = PC 的 `.resource-heading`（图标 + 资源名）+ `.resource-foot`（采集时间）
 *   右列 = PC 的 `.resource-value`（加粗主值）+ 更小字号的细则
 *
 * 四条刻意的约束（都来自产品确认）：
 *   1. 等高 68px —— 无上限的资源不缩高，否则一列卡片参差不齐；
 *   2. 没有进度条，也不在超上限时追加任何标注，只照实显示；
 *   3. **加粗主值在最右且垂直居中，细则减小字号排在它下面** ——
 *      行动力就是 `148` 在上面、`（3,080）` 在下面；
 *   4. 从未采集的资源显示「—」，不用 0 冒充真实值（0 是有意义的游戏数值）。
 */
import { ResourceIcon } from './resourceIcons'
import { isNeverRecorded, relativeTime, resourceValueText } from '../shell'
import type { MobileTranslator } from '../i18n'

export interface ResourceView {
  name: string
  label: string
  value: number | null
  limit?: number | null
  total?: number | null
  record?: string | null
}

interface Props {
  resource: ResourceView
  now: Date
  ui: MobileTranslator
  onClick: (resource: ResourceView) => void
}

export function ResourceCard({resource, now, ui, onClick}: Props) {
  const amount = resourceValueText(resource)
  const never = isNeverRecorded(resource.record)
  /* 相对时间走 ui()：写死中文的话，英文/日文界面上的采集时间会一直是「3 分钟前」 */
  const stamp = never ? ui('mobile.overview.never') : relativeTime(resource.record, now, ui)
  const main = never ? '—' : amount.main
  /* 细则只有一条：要么是未开箱总量（行动力），要么是上限。 */
  const secondary = never ? '' : amount.total || amount.limit
  return <button type="button" className="resource-card m-resource-row"
    onClick={() => onClick(resource)}>
    <div className="m-resource-lead">
      <div className="resource-heading">
        <span>{resource.label}</span>
        <div className="resource-image-wrap"><ResourceIcon resourceKey={resource.name} size={22} /></div>
      </div>
      <div className="resource-foot">
        {never ? stamp : ui('resource.recordedAt', {time: stamp})}
      </div>
    </div>
    <div className="m-resource-amount">
      <div className={never ? 'resource-value is-empty' : 'resource-value'}>{main}</div>
      {secondary ? <small>{secondary}</small> : null}
    </div>
  </button>
}
