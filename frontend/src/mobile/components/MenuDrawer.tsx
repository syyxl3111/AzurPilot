/**
 * 左侧抽屉与「关于」模态。
 *
 * 五处刻意的设计：
 *   1. 最上方「logo + AzurPilot + ✕」那条与页眉同款毛玻璃，其下为普通表面；
 *   2. 抽屉里**没有「设置」** —— 浏览器用户不进设置页，App 内由页眉的 ⚙ 进入；
 *   3. 开发者模式入口是**连点品牌 logo 10 次**，复用 PC 的 recordDevLogoClick，
 *      同键 azurpilot.dev-mode，语义与 PC 逐字一致（间隔 >900ms 计数重置）；
 *   4. 两个弹层都挂 useOverlayBack：Android 返回手势先关弹层，而不是离开当前页；
 *   5. 外观与语言是**点击即切换**，不带开关控件 —— 选中项用强调色标出来即可。
 *
 * 关于页里**刻意没有「进入电脑版」** —— 这是产品上明确要求的移除。副作用是
 * 一旦用 ?pc=1 切到 PC 会写死 cookie，而界面上再没有回手机端的入口；
 * 回程只能手输 ?mobile=1（已记在 frontend/README.md）。不要再擅自加回来。
 */
import { CenterPopup, List, Popup } from 'antd-mobile'
import { Globe, Moon, Package, Search, Smartphone, X } from 'lucide-react'
import { useState, type CSSProperties } from 'react'
import { readDevMode, recordDevLogoClick, writeDevMode } from '../../app/devMode'
import { useOverlayBack } from '../backGuard'
import { drawerModel, type DrawerKey } from '../shell'
import { languages, type Language } from '../../i18n'
import type { MobileKey, MobileTranslator } from '../i18n'

export type Appearance = 'light' | 'dark' | 'system'

/**
 * 关于页的声明文案。
 *
 * 刻意硬编码简体中文、不进 i18n：这是要逐字稳定的声明，翻译容易走样；
 * 与 PC README「控制台固定文案仍为简体中文」的既有做法一致。
 */
export const ABOUT_NOTICE = '本项目是开源项目，禁止倒卖。如果你是通过购买获得的，请凭本页面找商家退款。'

export const APPEARANCE_OPTIONS: Array<{value: Appearance; labelKey: MobileKey}> = [
  {value: 'light', labelKey: 'mobile.appearance.light'},
  {value: 'dark', labelKey: 'mobile.appearance.dark'},
  {value: 'system', labelKey: 'mobile.appearance.system'},
]

/**
 * 语言表直接取 PC 导出的 `languages` 常量，手机端不再自维护一份。
 *
 * 原先手机端自己登记了 `mobile.language.*` 五条，结果「喵语」被写成了「喵」，
 * 与 PC 的系统设置对不上。共用一份就不会再漂移。
 */
export const LANGUAGE_OPTIONS: Array<{value: Language; label: string}> =
  (Object.entries(languages) as Array<[Language, string]>).map(([value, label]) => ({value, label}))

const DRAWER_ICONS: Partial<Record<DrawerKey, typeof Search>> = {
  home: Smartphone,
  search: Search,
  download: Package,
  appearance: Moon,
  language: Globe,
}

interface Props {
  visible: boolean
  onClose: () => void
  ui: MobileTranslator
  appearance: Appearance
  appearanceLabel: string
  languageLabel: string
  onAppearance: () => void
  onLanguage: () => void
  onNavigate: (key: DrawerKey) => void
  onOpenAbout: () => void
  onDevModeEnabled: () => void
}

/** 抽屉内容。devMode 变化通过回调上抛，由外层持久化。 */
export function MenuDrawer(props: Props) {
  const {visible, onClose, ui} = props
  const [devMode, setDevMode] = useState(readDevMode)
  const keys = drawerModel(devMode)

  /* Android 返回手势先关抽屉 */
  useOverlayBack(visible, onClose)

  function handleLogoClick() {
    if (!recordDevLogoClick()) return
    const next = !devMode
    writeDevMode(next)
    setDevMode(next)
    props.onDevModeEnabled()
  }

  return <Popup visible={visible} onMaskClick={onClose} position="left"
    bodyStyle={{width: '82vw', maxWidth: 330, height: '100%'}}>
    <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
      {/* 品牌行：与页眉同款毛玻璃 */}
      <div className="m-bar-brand">
        <div className="glass-material" aria-hidden="true" />
        {/* 连点 10 次开开发者模式，所以这里是真按钮而不是裸 img */}
        <button type="button" className="m-bar-brand-logo" data-testid="drawer-logo"
          aria-label={ui('mobile.drawer.logoLabel')} title={ui('mobile.drawer.logoLabel')}
          onClick={handleLogoClick}>
          <img src="/azurpilot.svg" alt="" width={30} height={30} />
        </button>
        <strong className="m-bar-brand-title">AzurPilot</strong>
        <button type="button" className="m-bar-button" aria-label={ui('nav.close')} onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div style={{flex: 1, overflowY: 'auto'}}>
        <List>
          {keys.map(key => {
            /* 「搜索」不再是抽屉里的输入框 —— 它是**跳转到任务页**的入口，
               真正的搜索框在任务页顶部（那里能搜分组名，也能搜组内任务）。 */
            const Icon = DRAWER_ICONS[key] ?? Smartphone
            const extra = key === 'appearance' ? props.appearanceLabel
              : key === 'language' ? props.languageLabel : undefined
            return <List.Item key={key} clickable
              onClick={() => {
                if (key === 'appearance') return props.onAppearance()
                if (key === 'language') return props.onLanguage()
                if (key === 'about') return props.onOpenAbout()
                props.onNavigate(key)
              }}
              /* extra 只放当前值：`List.Item clickable` 自己就会画行尾箭头，
                 这里再塞一个 ChevronRight 会变成两个箭头并排（外观 / 语言两行）。 */
              prefix={<Icon size={18} />} extra={extra ? <span>{extra}</span> : undefined}>
              {ui(`mobile.drawer.${key}` as MobileKey)}
            </List.Item>
          })}
        </List>
      </div>
    </div>
  </Popup>
}

interface AboutProps {
  visible: boolean
  onClose: () => void
  ui: MobileTranslator
  version: string
}

/** 关于：版本 / 开源协议 / 声明 / 免责 / 依赖许可。 */
export function AboutModal({visible, onClose, ui, version}: AboutProps) {
  /* Android 返回手势先关模态 */
  useOverlayBack(visible, onClose)
  /* 宽度必须走 antd 的变量，而不是给内层 div 写 width。
     .adm-center-popup-wrap 自带 --max-width:75vw / --min-width:280px；在 360dp 的
     屏幕上 min-width 会盖过 max-width 把 wrap 定成 280px，内层再写 min(86vw,360px)
     就等于把内容顶出容器（叠加 content-box 的 padding，右缘会超出屏幕 30px）。

     圆角**必须内外一致**：antd 的 .adm-center-popup-body 默认 8px，而内层原来用的是
     tokens.css 的 --radius（20px，PC 桌面尺度）—— 内外两个圆角差一倍，外框看着是歪的。

     变量要设在**根节点**（style）而不是 bodyStyle：antd 是在
     `.adm-center-popup {--border-radius: var(--adm-center-popup-border-radius, 8px)}`
     这一步解析的；自定义属性只向下继承，设在 body 上改不了根节点已经算好的值。 */
  const radius = 'var(--theme-radius-panel)'
  return <CenterPopup visible={visible} onMaskClick={onClose}
    style={{'--adm-center-popup-border-radius': radius} as CSSProperties}
    bodyStyle={{
      '--adm-center-popup-max-width': '86vw',
      '--adm-center-popup-min-width': '0px',
    } as CSSProperties}>
    <div style={{
      background: 'var(--surface)', borderRadius: radius,
      padding: '16px 16px 14px', width: 'min(86vw, 320px)',
      maxHeight: '76dvh', overflowY: 'auto',
    }}>
      <h2 style={{margin: '0 0 10px', fontSize: 16}}>{ui('mobile.about.title')}</h2>

      {/* 长值（如 GNU 协议名）改成上下堆叠，横排会把整行挤成错位换行 */}
      <dl style={{margin: 0, fontSize: 12, lineHeight: 1.5}}>
        <div style={{display: 'flex', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border)'}}>
          <dt style={{color: 'var(--muted)', flex: '0 0 auto'}}>{ui('mobile.about.version')}</dt>
          <dd style={{margin: 0, marginLeft: 'auto', fontWeight: 600}}>{version}</dd>
        </div>
        <div style={{padding: '7px 0', borderBottom: '1px solid var(--border)'}}>
          <dt style={{color: 'var(--muted)', marginBottom: 2}}>{ui('mobile.about.license')}</dt>
          <dd style={{margin: 0, fontWeight: 600}}>{ui('mobile.about.licenseValue')}</dd>
        </div>
      </dl>

      <h3 style={{margin: '12px 0 4px', fontSize: 12, color: 'var(--muted)'}}>
        {ui('mobile.about.notice')}
      </h3>
      <p style={{margin: 0, fontSize: 12, lineHeight: 1.6}} data-testid="about-notice">{ABOUT_NOTICE}</p>

      <h3 style={{margin: '12px 0 4px', fontSize: 12, color: 'var(--muted)'}}>
        {ui('mobile.about.disclaimer')}
      </h3>
      <p style={{margin: 0, fontSize: 12, lineHeight: 1.6}}>
        {ui('mobile.about.disclaimerText')}
      </p>

      <p style={{margin: '10px 0 0', fontSize: 11, color: 'var(--muted)'}}>
        {ui('mobile.about.dependencies')}
      </p>

      <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: 14}}>
        <button type="button" onClick={onClose} className="button primary">
          {ui('mobile.common.confirm')}
        </button>
      </div>
    </div>
  </CenterPopup>
}

interface PickerProps<T extends string> {
  visible: boolean
  title: string
  options: Array<{value: T; label: string}>
  value: T
  onPick: (value: T) => void
  onClose: () => void
}

/**
 * 外观 / 语言共用的单列选择弹层。
 *
 * **点击即切换，不带开关控件。** 原先选中项会渲染一个 `<Switch checked disabled />`，
 * 而 antd-mobile 的 `extra` 会顶掉 List.Item 默认的可点箭头 —— 于是「选中」看起来
 * 像个拨动开关，而另外两行才是可点的，语义自相矛盾。现在所有行都保留可点箭头，
 * 选中项只用强调色 + 加粗标出。
 */
export function OptionPicker<T extends string>({visible, title, options, value, onPick, onClose}: PickerProps<T>) {
  return <Popup visible={visible} onMaskClick={onClose} bodyStyle={{padding: '12px 0 20px'}}>
    <p style={{margin: '0 0 8px', padding: '0 16px', fontSize: 13, color: 'var(--muted)'}}>{title}</p>
    <List>
      {options.map(option => <List.Item key={option.value} clickable
        onClick={() => { onPick(option.value); onClose() }}
        style={option.value === value
          ? {color: 'var(--accent)', fontWeight: 600}
          : undefined}>
        {option.label}
      </List.Item>)}
    </List>
  </Popup>
}
