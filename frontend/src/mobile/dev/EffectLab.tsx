/**
 * 视觉效果实验室 —— 对齐 PC `DevControls.tsx` 的第一块分区。
 *
 * PC 那块用 `liquid-glass-react` 现场调模糊/饱和/透明/圆角/阴影。手机端用**原生
 * `backdrop-filter`** 做同一件事：那个库是 174 kB 的 WebGL/SVG 位移层，为了一个
 * 开发者页面把它带进手机端不划算，而毛玻璃观感 CSS 就能拿到。
 *
 * 预设档位与分档文案与 PC 逐项一致（0/6/12/18/24/32，无/轻/中/重）。
 */
import { useState } from 'react'
import { DEV_BLUR_PRESETS, DEV_SLIDERS, blurLevelKey } from './sections'
import type { MobileTranslator } from '../i18n'

export function EffectLab({ui}: {ui: MobileTranslator}) {
  const [blur, setBlur] = useState(24)
  const [saturation, setSaturation] = useState(130)
  const [opacity, setOpacity] = useState(72)
  const [radius, setRadius] = useState(26)
  const [shadow, setShadow] = useState(24)
  const values: Record<string, number> = {blur, saturation, opacity, radius, shadow}
  const setters: Record<string, (value: number) => void> = {
    blur: setBlur, saturation: setSaturation, opacity: setOpacity, radius: setRadius, shadow: setShadow,
  }

  return <>
    <div className="dev-effect-lab m-dev-lab">
      <div className="dev-effect-stage">
        <div className="dev-effect-wallpaper" aria-hidden="true"><i /><i /><i /><span>AzurPilot</span></div>
        <div className="dev-effect-glass" style={{
          backdropFilter: `blur(${blur}px) saturate(${saturation}%)`,
          WebkitBackdropFilter: `blur(${blur}px) saturate(${saturation}%)`,
          background: `color-mix(in srgb, var(--surface) ${opacity}%, transparent)`,
          borderRadius: `${radius}px`,
          boxShadow: `0 ${Math.round(shadow / 3)}px ${shadow * 2}px #00000020, inset 0 1px 0 #ffffff66`,
        }}>
          <span className="small-label">{ui('developer.backdropGlass')}</span>
          <strong>{ui('developer.glassProperties')}</strong>
          <p>{ui('developer.glassHint')}</p>
        </div>
      </div>
      <div className="dev-effect-controls">
        {DEV_SLIDERS.map(slider => <label key={slider.key}>
          {ui(slider.labelKey)} <strong>{values[slider.key]}{slider.unit}</strong>
          <input type="range" min={slider.min} max={slider.max} value={values[slider.key]}
            aria-label={ui(slider.labelKey)}
            onChange={event => setters[slider.key](Number(event.target.value))} />
        </label>)}
      </div>
    </div>
    <div className="dev-blur-presets m-dev-presets">
      {DEV_BLUR_PRESETS.map(value => <div key={value} className="dev-blur-preset-wrap">
        <div className="dev-blur-preset-bg">
          <div style={{backdropFilter: `blur(${value}px)`, WebkitBackdropFilter: `blur(${value}px)`}}>
            {ui('developer.blur')} {value}px
          </div>
        </div>
        <span>{ui(blurLevelKey(value))}</span>
      </div>)}
    </div>
  </>
}
