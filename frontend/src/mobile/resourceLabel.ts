/**
 * 资源名 → 显示文案。
 *
 * **不要用接口返回的 `resources[].label`。** 后端那是
 * `configs.translate(f'{name}._info.name')` 的结果，查不到就退化成路径末段 ——
 * 实测 25548 返回的是字符串 `"name"`，直接渲染出来就是一行「name」。
 *
 * PC 也是绕开它的：`components/ResourceCards.tsx` 里有一张 `resourceLabels` 表，
 * 把 `Oil` 映射到 i18n key `resource.Oil`。这里复用**同一张表**，
 * 而不是在手机端再抄一份（抄一份迟早会漂移）。
 */
import { resourceLabels } from '../components/ResourceCards'
import type { MobileTranslator } from './i18n'

export function resourceLabel(key: string, ui: MobileTranslator): string {
  const i18nKey = resourceLabels[key]
  return i18nKey ? ui(i18nKey) : key
}
