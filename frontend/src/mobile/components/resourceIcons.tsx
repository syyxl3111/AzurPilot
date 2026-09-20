/**
 * 资源图标。
 *
 * 与 PC `components/ResourceCards.tsx` 里的 iconImages 同源 —— 那份是模块私有
 * 的（未导出），而那个模块本身依赖 PC 的 AppProvider，手机端无法直接 import，
 * 所以这里保留一份副本。新增资源时两处都要加；漏加只会退化成 Box 占位图标，
 * 不会报错。
 *
 * 全部是同源静态资源（/oil.webp 等），不产生任何第三方请求。
 */
import { Box } from 'lucide-react'

export const RESOURCE_ICONS: Record<string, string> = {
  Oil: '/oil.webp',
  Coin: '/gold.webp',
  Gem: '/diamond.webp',
  Cube: '/cube.webp',
  Pt: '/pt.webp',
  ActionPoint: '/guild_coin.webp',
  YellowCoin: '/supply_token.webp',
  PurpleCoin: '/special_token.webp',
  Core: '/core_data.webp',
  Medal: '/honor_medal.webp',
  Merit: '/merit.webp',
  GuildCoin: '/stamina.webp',
}

export function ResourceIcon({resourceKey, size = 30}: {resourceKey: string; size?: number}) {
  const src = RESOURCE_ICONS[resourceKey]
  return src
    ? <img className="resource-icon-image" src={src} alt="" width={size} height={size} />
    : <Box size={Math.round(size * 0.62)} />
}
