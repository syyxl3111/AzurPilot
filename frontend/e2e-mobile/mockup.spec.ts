import { mkdirSync, rmSync } from 'node:fs'
import { expect, test } from '@playwright/test'

/**
 * 手机端示意图的浏览器验证。
 *
 * 五件事：
 *   1. **依赖可燃性关口（Phase 0）**：Dialog / Toast / ActionSheet / Popup /
 *      CenterPopup 都走 antd-mobile 的动画层（传递依赖 @react-spring/web，其 peer
 *      范围只声明到 React 18），只有在真浏览器里把它们点一遍、并断言零控制台错误，
 *      才算确认 React 19 下可用 —— jsdom 里跑不出这个结论。
 *   2. **与 PC 同一套设计系统**：手机端加载 PC 的样式栈，页面直接用 PC 的类名
 *      （.panel / .button / .status / .resource-card / dev-* ）。这里断言这些类
 *      真的生效（毛玻璃的 backdrop-filter、玻璃描边、状态徽标取色）。
 *   3. **手机端独有的布局契约**：固定页眉与 Tab 栏、安全区让位、日志整屏自适应、
 *      资源卡数值两行、任务三级导航、卡片管理可拖动。
 *   4. **隐私要求**：除同源外零请求。
 *   5. **无障碍底线**：图标按钮有无障碍名、结构图标不是 emoji、文字令牌过 4.5:1。
 *
 * 弹层一律用无障碍角色与文案断言，不依赖 antd-mobile 的内部 class 名。
 */

/** PC tokens.css 的取值，手机端与电脑端共用。 */
const ACCENT = 'rgb(0, 113, 227)' // --accent #0071e3
const DARK_BG = 'rgb(22, 22, 24)' // --bg #161618
const DARK_SURFACE = 'rgb(36, 36, 38)' // --surface #242426

/** 直接开某一屏。屏幕进 URL 是为了让返回手势与深链都能用。 */
function url(screen: string, extra = ''): string {
  return `/mobile-mockup.html?screen=${screen}${extra}`
}

/** 页面到底能不能滚动（日志页整屏自适应时应该不能）。 */
async function pageScrolls(page: import('@playwright/test').Page): Promise<boolean> {
  return page.evaluate(() =>
    document.documentElement.scrollHeight > window.innerHeight + 1)
}

/** 在浏览器里按 WCAG 相对亮度算对比度。传计算后的 `rgb(...)` 字符串即可。 */
async function ratioOn(
  page: import('@playwright/test').Page, foreground: string, background: string,
): Promise<number> {
  return page.evaluate(([fg, bg]) => {
    const parse = (value: string) => value.match(/\d+/g)!.slice(0, 3).map(Number)
    const lum = (value: string) => parse(value).map(channel => {
      const c = channel / 255
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    }).reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0)
    const a = lum(fg), b = lum(bg)
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
  }, [foreground, background] as const)
}

test.describe('手机端示意图', () => {
  test('页眉与 Tab 栏是毛玻璃且固定，首页没有 Tab 栏', async ({page, baseURL}) => {
    const problems: string[] = []
    const external: string[] = []
    const origin = new URL(baseURL!).origin
    page.on('pageerror', error => problems.push(`pageerror: ${error.message}`))
    page.on('console', message => {
      if (message.type() === 'error') problems.push(`console: ${message.text()}`)
    })
    page.on('request', request => {
      if (new URL(request.url()).origin !== origin) external.push(request.url())
    })

    await page.goto(url('home'))
    await expect(page.locator('html')).toHaveAttribute('data-shell', 'mobile')

    /* 页眉：PC .topbar 同款结构 —— 透明底 + 一层 .glass-material + 玻璃描边 */
    const bar = page.locator('.m-bar').first()
    await expect(bar).toHaveCSS('position', 'fixed')
    await expect(bar.locator('> .glass-material')).toHaveCount(1)
    const barBlur = await bar.locator('> .glass-material')
      .evaluate(node => getComputedStyle(node).backdropFilter)
    expect(barBlur, '页眉玻璃层没有 backdrop-filter').not.toBe('none')
    /* 文字用 PC 的 --text，不再是白字压在彩色底上 */
    await expect(bar.locator('h1')).toHaveCSS('color', 'rgb(29, 29, 31)')
    await expect(bar.locator('h1')).toHaveText('首页')

    /* 首页：指挥中心 + 按时间问候 + 祝福 + 三项统计 + 实例卡片 */
    await expect(page.getByText('你的指挥中心')).toBeVisible()
    await expect(page.getByText(/指挥官/).first()).toBeVisible()
    await expect(page.getByText('全部实例')).toBeVisible()
    await expect(page.getByText('需要处理')).toBeVisible()

    /* 实例卡 = PC 首页的 .instance-card + .panel，与组件测试第 8 区那张预览卡同款 */
    const cards = page.locator('.instance-card')
    await expect(cards).toHaveCount(2)
    await expect(cards.first()).toHaveClass(/panel/)
    const widths = await cards.evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().width))
    expect(new Set(widths.map(value => Math.round(value))).size, `实例卡宽度不一致: ${widths}`).toBe(1)
    await expect(page.locator('.status.running').first()).toBeVisible()

    /* 黄金比例：宽收窄到 315，高 = 315 / 1.618 ≈ 194.7 */
    const shape = await cards.first().evaluate(node => {
      const box = node.getBoundingClientRect()
      return {width: box.width, height: box.height, ratio: box.width / box.height}
    })
    expect(Math.round(shape.width), '实例卡没有收窄到 315px').toBe(315)
    expect(shape.ratio, `卡片宽高比 ${shape.ratio.toFixed(3)}，不是黄金比例`).toBeCloseTo(1.618, 2)

    /* 文字与图标不能贴边。`.panel` 自己没有内边距（components.css 只给背景/边框/圆角/阴影），
       PC 是靠 `.instance-card {padding}` 撑开的 —— 那批规则在 home.css 里，手机端不加载。 */
    const inset = await cards.first().evaluate(node => {
      const box = node.getBoundingClientRect()
      const icon = node.querySelector('.home-instance-icon')!.getBoundingClientRect()
      const name = node.querySelector('h3')!.getBoundingClientRect()
      return {
        padding: parseFloat(getComputedStyle(node).paddingLeft),
        iconLeft: Math.round(icon.left - box.left),
        nameLeft: Math.round(name.left - box.left),
      }
    })
    expect(inset.padding, '卡片没有内边距，文字图标就会贴着边框').toBeGreaterThanOrEqual(14)
    expect(inset.iconLeft, '图标贴到左边框了').toBeGreaterThanOrEqual(14)
    expect(inset.nameLeft, '实例名贴到左边框了').toBeGreaterThanOrEqual(14)

    /* 状态徽标在卡片右上角，⋯ 落在它**下方**、仍然右对齐 */
    const corner = await cards.first().evaluate(node => {
      const box = node.getBoundingClientRect()
      const more = node.querySelector('.m-instance-more')!.getBoundingClientRect()
      const badge = node.querySelector('.status')!.getBoundingClientRect()
      return {
        badgeTop: Math.round(badge.top - box.top),
        badgeRight: Math.round(box.right - badge.right),
        gapBelowBadge: Math.round(more.top - badge.bottom),
        moreRight: Math.round(box.right - more.right),
        nameTop: Math.round(node.querySelector('h3')!.getBoundingClientRect().top - box.top),
        moreBottom: Math.round(more.bottom - box.top),
        overflow: node.scrollHeight - node.clientHeight,
      }
    })
    expect(corner.badgeRight, '状态徽标没有贴右上角').toBeLessThanOrEqual(20)
    expect(corner.badgeTop, '状态徽标没有贴右上角').toBeLessThanOrEqual(20)
    expect(corner.gapBelowBadge, '⋯ 没有落在状态徽标下方').toBeGreaterThanOrEqual(0)
    expect(corner.moreRight, '⋯ 没有靠右').toBeLessThanOrEqual(20)
    /* ⋯ 必须待在头部预留的那 56px 里，不能压到实例名上 */
    expect(corner.moreBottom, `⋯ 底边 ${corner.moreBottom}px 压到了实例名（${corner.nameTop}px）`)
      .toBeLessThanOrEqual(corner.nameTop)
    /* 卡片是 aspect-ratio 定高的，内容超出会直接溢出（黄金比例就不成立了） */
    expect(corner.overflow, `卡片内容溢出 ${corner.overflow}px`).toBeLessThanOrEqual(0)

    /* PC 的结构：设备行是带间距的横排，页脚有发丝线分隔 */
    const structure = await cards.first().evaluate(node => {
      const device = node.querySelector('.instance-device')!
      const foot = node.querySelector('.instance-card-footer')!
      return {
        deviceDisplay: getComputedStyle(device).display,
        deviceGap: parseFloat(getComputedStyle(device).columnGap),
        footBorderTop: getComputedStyle(foot).borderTopWidth,
      }
    })
    expect(structure.deviceDisplay, '设备行没排成一行，服务器名会和序列号粘在一起').toBe('flex')
    expect(structure.deviceGap, '设备行两个 span 之间没有间距').toBeGreaterThanOrEqual(6)
    expect(structure.footBorderTop, '页脚没有分隔线').not.toBe('0px')

    /* 所有「面」都有轻阴影，按钮除外 */
    const shadows = await cards.first().evaluate(node => ({
      card: getComputedStyle(node).boxShadow,
      button: getComputedStyle(document.querySelector('.m-home-new')!).boxShadow,
    }))
    expect(shadows.card, '卡片四周没有阴影').not.toBe('none')
    expect(shadows.button, '按钮不该有阴影').toBe('none')

    /* 「新建实例」单独占一行、在「实例 (N)」标题下方，且不能再和上面那排统计贴在一起 */
    const header = await page.evaluate(() => {
      const action = document.querySelector('.m-section-action')!.getBoundingClientRect()
      const label = Array.from(document.querySelectorAll('.m-main span'))
        .find(node => node.textContent === '需要处理')!
      const statRow = label.closest('div')!.getBoundingClientRect()
      const titleRow = document.querySelector('.m-main section > div')!.getBoundingClientRect()
      return {
        actionTop: Math.round(action.top),
        statBottom: Math.round(statRow.bottom),
        titleBottom: Math.round(titleRow.bottom),
      }
    })
    expect(header.actionTop, '新建实例按钮跟「需要处理」那排统计挤在一起')
      .toBeGreaterThanOrEqual(header.statBottom + 8)
    expect(header.actionTop, '新建实例按钮没有落在「实例 (N)」标题下方')
      .toBeGreaterThanOrEqual(header.titleBottom)

    /* 视觉收小，但触控目标仍要 44px：伪元素把可点区域向上撑开了 7px，
       所以点在按钮上边缘之外 3px 也该命中。 */
    const buttonBox = (await page.locator('.m-home-new').boundingBox())!
    expect(Math.round(buttonBox.height), `新建实例按钮还有 ${buttonBox.height}px 高`).toBeLessThanOrEqual(32)
    await page.mouse.click(buttonBox.x + buttonBox.width / 2, buttonBox.y - 3)
    /* 打开的是**真弹窗**（PC 的 instances.create 那套参数），不再是「新建实例表单」占位 Toast。
       注意 antd-mobile 的弹窗根节点（`.adm-center-popup.adm-dialog`）本身高度是 0，
       要对内容下手才判得准可见性。 */
    await expect(page.getByText('创建配置实例')).toBeVisible()
    await expect(page.getByText('初始配置')).toBeVisible()
    /* 名字不合法时不能提交（后端按这个名字建配置与进程） */
    const submit = page.getByRole('button', {name: '创建实例'})
    await expect(submit).toBeDisabled()
    await page.locator('.adm-dialog input').fill('1bad name')
    await expect(submit).toBeDisabled()
    await page.locator('.adm-dialog input').fill('pilot2')
    await expect(submit).toBeEnabled()
    await page.getByRole('button', {name: '取消'}).click()
    await expect(page.getByText('创建配置实例')).not.toBeVisible()

    /* ⋯ 同理：视觉 32px，::after 把触控目标撑到 44px，点在盒子上沿之外也该命中 */
    const moreBox = (await page.locator('.m-instance-more').first().boundingBox())!
    expect(Math.round(moreBox.width), '⋯ 的视觉尺寸变了').toBe(32)
    await page.mouse.click(moreBox.x + moreBox.width / 2, moreBox.y - 2)
    await expect(page.getByText('自动运行')).toBeVisible()
    await page.keyboard.press('Escape')

    /* 还没进实例，所以没有底部 Tab 栏 —— 这是设计要求 */
    await expect(page.locator('.m-tabbar')).toHaveCount(0)

    /* 浏览器里没有 ⟳ 与 ⚙：设置页对浏览器用户不可达 */
    await expect(page.getByRole('button', {name: '刷新'})).toHaveCount(0)
    await expect(page.getByRole('button', {name: '设置'})).toHaveCount(0)

    /* 页眉固定 → 内容必须让出同位高度，否则首屏会被盖住 */
    const top = await page.locator('.m-main').evaluate(node => node.getBoundingClientRect().top)
    const barHeight = await bar.evaluate(node => node.getBoundingClientRect().height)
    expect(Math.abs(top - barHeight), `内容顶部 ${top} 未对齐页眉高度 ${barHeight}`).toBeLessThanOrEqual(1)

    expect(problems, problems.join('\n')).toEqual([])
    expect(external, external.join('\n')).toEqual([])
  })

  test('总览：PC 毛玻璃资源卡、数值两行、图标来自 PC', async ({page}) => {
    await page.goto(url('overview'))

    /* 默认卡片是 PC 的 defaultResourceKeys（四张），先确认这一点 */
    const cards = page.locator('.resource-card')
    await expect(cards).toHaveCount(4)

    /* 行动力不在默认里 —— 通过 PC 那套「添加卡片」把它加上，顺便验证选择器 */
    await page.getByRole('button', {name: '卡片管理'}).click()
    await page.getByRole('button', {name: '添加卡片'}).click()
    await page.locator('.resource-picker-card', {hasText: '行动力'}).click()
    await page.getByRole('button', {name: '完成'}).click()
    await expect(cards).toHaveCount(5)

    /* Tab 栏也是毛玻璃，整宽五项 */
    const tabbar = page.locator('.m-tabbar')
    await expect(tabbar).toHaveCSS('position', 'fixed')
    await expect(tabbar.locator('> .glass-material')).toHaveCount(1)
    const tabs = tabbar.locator('.adm-tab-bar-item')
    await expect(tabs).toHaveCount(5)
    await expect(tabs).toHaveText([/总览/, /实例/, /任务/, /统计/, /日志/])
    const viewport = page.viewportSize()!
    const barBox = await tabbar.evaluate(node => {
      const rect = node.getBoundingClientRect()
      return {left: Math.round(rect.left), right: Math.round(rect.right)}
    })
    expect(barBox.left).toBe(0)
    expect(Math.abs(barBox.right - viewport.width)).toBeLessThanOrEqual(1)

    /* 资源卡：PC 的 .resource-card（毛玻璃表面），等宽等高、无进度条 */
    await expect(cards.first()).toBeVisible()
    const glass = await cards.first().evaluate(node => {
      const style = getComputedStyle(node)
      return {backdrop: style.backdropFilter, border: style.borderTopColor}
    })
    expect(glass.backdrop, '资源卡没有毛玻璃').not.toBe('none')

    const boxes = await cards.evaluateAll(nodes => nodes.map(node => {
      const rect = node.getBoundingClientRect()
      return {width: Math.round(rect.width), height: Math.round(rect.height), top: Math.round(rect.top)}
    }))
    expect(boxes.length).toBeGreaterThan(2)
    expect(new Set(boxes.map(box => box.width)).size, `资源卡宽度不一致: ${JSON.stringify(boxes)}`).toBe(1)
    expect(new Set(boxes.map(box => box.height)).size, `资源卡高度不一致: ${JSON.stringify(boxes)}`).toBe(1)
    const gaps = boxes.slice(1).map((box, index) => box.top - boxes[index].top)
    expect(new Set(gaps).size, `资源卡间距不一致: ${gaps}`).toBe(1)
    await expect(page.locator('.adm-progress-bar')).toHaveCount(0)

    /* 资源图标改用 PC 的 webp 图，不再是自造的色点 */
    await expect(cards.first().locator('img.resource-icon-image')).toHaveCount(1)

    /* 数值两行：加粗主值在最右且垂直居中，细则减小字号排在它下面 */
    const action = cards.filter({hasText: '行动力'})
    await expect(action.locator('.resource-value')).toHaveText('148')
    await expect(action.locator('small')).toHaveText('（3,080）')
    const amount = await action.locator('.m-resource-amount').evaluate(node => {
      const value = node.querySelector('.resource-value')!.getBoundingClientRect()
      const small = node.querySelector('small')!.getBoundingClientRect()
      const card = node.closest('.resource-card')!.getBoundingClientRect()
      return {
        align: getComputedStyle(node).alignItems,
        fontSize: getComputedStyle(node.querySelector('.resource-value')!).fontSize,
        smallFontSize: getComputedStyle(node.querySelector('small')!).fontSize,
        valueWeight: getComputedStyle(node.querySelector('.resource-value')!).fontWeight,
        smallWeight: getComputedStyle(node.querySelector('small')!).fontWeight,
        /* 细则必须在主值下方（top 更大），且两者都靠卡片右侧 */
        stackedBelow: small.top > value.top,
        rightGap: Math.round(card.right - Math.max(value.right, small.right)),
        /* 整块垂直居中：上下留白差不超过 2px */
        topGap: Math.round(value.top - card.top),
        bottomGap: Math.round(card.bottom - small.bottom),
      }
    })
    expect(amount.align).toBe('flex-end')
    expect(amount.stackedBelow, '细则没有排到主值下面').toBe(true)
    expect(amount.valueWeight, '总览右侧数值不该加粗').toBe('400')
    expect(Number(amount.valueWeight)).toBeLessThanOrEqual(Number(amount.smallWeight) + 100)
    expect(amount.topGap).toBeGreaterThan(0)
    expect(Math.abs(amount.topGap - amount.bottomGap), '数值块没有垂直居中').toBeLessThanOrEqual(2)

    /* 从未采集的资源不显示成 0（核心数据是 Core，也不在 PC 的默认四张里） */
    await page.getByRole('button', {name: '卡片管理'}).click()
    await page.getByRole('button', {name: '添加卡片'}).click()
    await page.locator('.resource-picker-card', {hasText: '核心数据'}).click()
    await page.getByRole('button', {name: '完成'}).click()
    await expect(cards.filter({hasText: '核心数据'})).toContainText('未采集')
  })

  test('统计：次级类目条紧贴页眉下方并吸顶，粒度默认每小时', async ({page}) => {
    await page.goto(url('stats'))

    const bar = page.locator('.m-bar').first()
    const segBar = page.locator('.m-segmented-bar')
    await expect(segBar).toBeVisible()
    const barHeight = await bar.evaluate(node => Math.round(node.getBoundingClientRect().height))
    const segTop = await segBar.evaluate(node => Math.round(node.getBoundingClientRect().top))
    expect(Math.abs(segTop - barHeight), `类目条顶部 ${segTop} 未紧贴页眉 ${barHeight}`).toBeLessThanOrEqual(1)

    /* 分段控件直接复用 PC 的 SegmentedControl，滑块随之位移 */
    const control = page.getByRole('tablist', {name: '统计分类'})
    await expect(control).toHaveCSS('flex-wrap', 'nowrap')
    const indicator = control.locator('.segmented-indicator')
    await expect(indicator).toHaveCount(1)
    const pillOn = async (name: string) => {
      const tab = await control.getByRole('tab', {name, exact: true}).boundingBox()
      const pill = await indicator.boundingBox()
      if (!tab || !pill) return -1
      return Math.abs(tab.x - pill.x)
    }
    await expect.poll(() => pillOn('资源趋势')).toBeLessThanOrEqual(1)

    /* 资源趋势这一页有曲线，所以分桶控件在；默认「每小时」（手机端手写 SVG 画不了几千个原始点） */
    await expect(page.getByRole('tablist', {name: '采样粒度'}).getByRole('tab', {name: '每小时'}))
      .toHaveAttribute('aria-selected', 'true')

    await control.getByRole('tab', {name: '大世界总结'}).click()
    await expect.poll(() => pillOn('大世界总结'), {message: '滑块没有跟着选中项走'}).toBeLessThanOrEqual(1)

    /* 吸顶：滚动后仍贴在页眉下方 */
    await page.evaluate(() => window.scrollTo(0, 400))
    await page.waitForTimeout(120)
    const stuckTop = await segBar.evaluate(node => Math.round(node.getBoundingClientRect().top))
    expect(Math.abs(stuckTop - barHeight)).toBeLessThanOrEqual(1)
  })

  test('统计：六个类目各拿各的真数据，切类目真的换内容', async ({page}) => {
    /* 回归：手机端原先六个类目画的都是同一条写死的 ActionPoint 曲线 ——
       切类目只动滑块不换数据，评审时看着像切了，其实没有。 */
    await page.goto(url('stats'))
    const control = page.getByRole('tablist', {name: '统计分类'})
    const panel = page.locator('.m-stat-panel')

    /* 资源趋势：9 条曲线、没有指标也没有明细表（与后端 statistics_service 一致） */
    await expect(page.getByRole('group', {name: '指标'}).getByRole('button')).toHaveCount(9)
    await expect(panel.locator('.m-stat-table')).toHaveCount(0)
    await expect(page.getByRole('button', {name: '石油', exact: true})).toBeVisible()

    /* 大世界总结：有 11 个指标 + 1 张表，但没有曲线 */
    await control.getByRole('tab', {name: '大世界总结'}).click()
    await expect(panel.locator('.m-stat-metrics').getByText('战斗次数')).toBeVisible()
    await expect(panel.locator('.m-stat-table').getByText('短猫运行统计')).toBeVisible()
    await expect(page.getByRole('group', {name: '指标'})).toHaveCount(0)

    /* 委托收益：有指标 + 2 张表 + 5 条曲线，且曲线的键与资源趋势不是同一批 */
    await control.getByRole('tab', {name: '委托收益'}).click()
    await expect(panel.locator('.m-stat-metrics').getByText('完成委托')).toBeVisible()
    await expect(panel.locator('.m-stat-table')).toHaveCount(2)
    await expect(page.getByRole('group', {name: '指标'}).getByRole('button', {name: '心智单元', exact: true}))
      .toBeVisible()

    /* 掉落明细：只有一张表（refreshLoot 是对应的刷新动作） */
    await control.getByRole('tab', {name: '短猫掉落'}).click()
    await expect(panel.locator('.m-stat-table').getByText('短猫掉落收益')).toBeVisible()
    await expect(panel.locator('.m-stat-table')).toHaveCount(1)

    /* 整页只有**一个**面板，段与段之间是发丝线 */
    await expect(page.locator('.panel')).toHaveCount(1)
  })

  test('组件测试页对齐 PC 开发者页：11 个分区、PC 类名、零控制台错误', async ({page}) => {
    const problems: string[] = []
    page.on('pageerror', error => problems.push(`pageerror: ${error.message}`))
    page.on('console', message => {
      if (message.type() === 'error') problems.push(`console: ${message.text()}`)
    })

    await page.goto(url('gallery'))
    await expect(page.locator('.m-bar h1').first()).toHaveText('组件测试')

    /* 11 个分区标题与 PC 的 DevControls 逐项一致（文案直接复用 PC 的 developer.*）。
       简介条在 PC 里用的是 <strong> 而不是标题元素，所以单独断言。 */
    await expect(page.locator('.dev-intro')).toContainText('UI 试验场')
    for (const title of [
      '视觉效果实验室', '玻璃、表面与层级', '颜色与设计 Token',
      '文字层级与内容样式', '按钮与操作', '表单控件', '选择器与状态',
      '导航、卡片与层级关系', '数据、表格与滚动区域', '反馈状态',
    ]) {
      await expect(page.getByRole('heading', {name: title}).first(), `缺少分区：${title}`).toBeVisible()
    }

    /* 用的是 PC dev.css 的类，不是自己画的一套 */
    await expect(page.locator('.dev-intro')).toHaveCount(1)
    await expect(page.locator('.dev-effect-lab')).toHaveCount(1)
    await expect(page.locator('.dev-surface-grid')).toHaveCount(1)
    await expect(page.locator('.dev-token-grid .dev-token')).toHaveCount(12)
    await expect(page.locator('.dev-shadow-grid .dev-shadow-sample')).toHaveCount(5)
    await expect(page.locator('.dev-radius-grid > div')).toHaveCount(9)
    await expect(page.locator('.dev-blur-presets .dev-blur-preset-wrap')).toHaveCount(6)
    /* 玻璃样本用 PC 的 .glass-material */
    await expect(page.locator('.dev-surface-glass > .glass-material')).toHaveCount(1)

    /* 第 8 区那张实例卡预览：类名与首页同款，但 home.css 不在手机端的样式栈里，
       所以它的排布全靠 mobile.css 的「实例卡」一节补。这里守住三点 ——
       徽标靠右（不因首页那个 ⋯ 的让位而内缩）、设备行有间距、页脚有分隔线。 */
    const devCard = page.locator('.instance-card').first()
    await expect(devCard).toBeVisible()
    const dev = await devCard.evaluate(node => {
      const box = node.getBoundingClientRect()
      const badge = node.querySelector('.status')!.getBoundingClientRect()
      const device = node.querySelector('.instance-device')!
      const foot = node.querySelector('.instance-card-footer')!
      return {
        padding: parseFloat(getComputedStyle(node).paddingLeft),
        badgeRight: Math.round(box.right - badge.right),
        deviceDisplay: getComputedStyle(device).display,
        deviceGap: parseFloat(getComputedStyle(device).columnGap),
        footBorderTop: getComputedStyle(foot).borderTopWidth,
        hasMore: Boolean(node.querySelector('.m-instance-more')),
      }
    })
    expect(dev.padding, '组件测试的实例卡也没有内边距').toBeGreaterThanOrEqual(14)
    expect(dev.hasMore, '组件测试的卡不该有 ⋯').toBe(false)
    /* 没有 ⋯ 就不该留那 52px 让位，徽标应当只比内边距多一点点 */
    expect(dev.badgeRight, `徽标离右边框 ${dev.badgeRight}px，被首页那 52px 让位带偏了`)
      .toBeLessThanOrEqual(24)
    expect(dev.deviceDisplay, '设备行没排成一行').toBe('flex')
    expect(dev.deviceGap, 'ADB 和 127.0.0.1:5555 会粘在一起').toBeGreaterThanOrEqual(6)
    expect(dev.footBorderTop, '页脚没有分隔线').not.toBe('0px')

    /* 对比度自查：两套主题都全部达标 */
    const audit = page.locator('.m-dev-audit')
    await expect(audit).toHaveCount(2)
    await expect(page.locator('p', {hasText: '全部达标'})).toHaveCount(2)
    await expect(page.locator('.m-dev-fail')).toHaveCount(0)

    /* YAML 字段（CodeMirror）按需加载后真的挂上 */
    await expect(page.locator('.cm-editor')).toHaveCount(1)

    /* 命令式弹层 —— react-spring + React 19 垫片的重点 */
    await page.getByRole('button', {name: 'Dialog.alert'}).count().catch(() => 0)
    await page.getByRole('button', {name: '打开 Modal'}).click()
    await expect(page.getByRole('dialog')).toContainText('Modal 样式预览')
    await page.getByRole('dialog').getByRole('button', {name: '确认'}).click()
    await expect(page.getByRole('dialog')).toBeHidden()

    /* 退出开发者模式：PC 有、手机端原先缺 */
    await expect(page.getByRole('button', {name: '退出 Dev 模式'})).toBeVisible()

    expect(problems, problems.join('\n')).toEqual([])
  })

  test('抽屉：品牌行毛玻璃、无设置、无电脑版、语言含「喵语」', async ({page}) => {
    await page.goto(url('home'))
    await page.getByRole('button', {name: '打开菜单'}).click()

    const brand = page.locator('.adm-popup .m-bar-brand')
    await expect(brand).toHaveCount(1)
    await expect(brand.locator('> .glass-material')).toHaveCount(1)
    await expect(brand).toContainText('AzurPilot')
    await expect(page.locator('.adm-popup .m-bar')).toHaveCount(0)

    const drawer = page.locator('.adm-popup')
    await expect(drawer.getByText('首页')).toBeVisible()
    await expect(drawer.getByText('App 下载')).toBeVisible()
    await expect(drawer.getByText('外观')).toBeVisible()
    await expect(drawer.getByText('语言')).toBeVisible()
    await expect(drawer.getByText('关于')).toBeVisible()
    /* 设置不在抽屉里：浏览器用户不进设置页 */
    await expect(drawer.getByText('设置', {exact: true})).toHaveCount(0)
    await expect(drawer.getByText('组件测试')).toHaveCount(0)

    /* 每行只有一个行尾箭头。带当前值的「外观 / 语言」两行曾经有两个 ——
       我们在 extra 里又塞了一个 ChevronRight，而 List.Item clickable 本来就会画一个。
       所以按图标数断言：1 个前缀图标 + 1 个箭头 = 2。 */
    const iconCounts = await drawer.locator('.adm-list-item').evaluateAll(nodes =>
      nodes.map(node => ({
        label: node.textContent?.replace(/\s+/g, '') ?? '',
        icons: node.querySelectorAll('svg').length,
      })))
    expect(iconCounts.length).toBeGreaterThanOrEqual(5)
    for (const {label, icons} of iconCounts) {
      expect(icons, `抽屉行「${label}」有 ${icons} 个图标，应当只有前缀 + 一个箭头`).toBe(2)
    }

    /* 语言列表改用 PC 的 languages，标签是「喵语」而不是手机端自造的「喵」 */
    await drawer.getByText('语言').click()
    /* 喵语只存在于语言选择器里，不必去猜哪个 popup 是当前那个 */
    await expect(page.getByText('喵语')).toBeVisible()
  })

  test('外观与语言是点击即切换，不带开关控件', async ({page}) => {
    await page.goto(url('home'))
    await page.getByRole('button', {name: '打开菜单'}).click()
    await page.locator('.adm-popup').getByText('外观').click()

    /* 选择器里不该出现任何开关 —— 选中项原先渲染成 <Switch checked disabled> */
    /* 「跟随系统」只出现在外观选择器里，用它把那个弹层挑出来 */
    const picker = page.locator('.adm-popup').filter({hasText: '跟随系统'})
    await expect(picker.locator('.adm-switch')).toHaveCount(0)

    /* 点「深色」立即生效并关闭 */
    await picker.getByText('深色', {exact: true}).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await expect(page.locator('.adm-switch')).toHaveCount(0)
  })

  test('关于弹窗不再溢出屏幕', async ({page}) => {
    await page.goto(url('home'))
    await page.getByRole('button', {name: '打开菜单'}).click()
    await page.locator('.adm-popup').getByText('关于').click()

    await expect(page.getByTestId('about-notice')).toHaveText(
      '本项目是开源项目，禁止倒卖。如果你是通过购买获得的，请凭本页面找商家退款。')

    /* 根因是缺 box-sizing：内层宽度算成 content-box，再叠加 padding 就顶出屏幕 */
    const box = await page.locator('.adm-center-popup-wrap').first().evaluate(node => {
      const wrap = node.getBoundingClientRect()
      const body = node.querySelector('div')!.getBoundingClientRect()
      return {
        wrapRight: Math.round(wrap.right),
        bodyRight: Math.round(body.right),
        bodyLeft: Math.round(body.left),
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      }
    })
    const width = page.viewportSize()!.width
    expect(box.bodyRight, `弹窗右缘 ${box.bodyRight} 超出屏幕 ${width}`).toBeLessThanOrEqual(width)
    expect(box.bodyLeft).toBeGreaterThanOrEqual(0)

    /* 外框与内层的圆角必须**一致且小**。
       曾经外层是 antd 默认的 8px、内层用 tokens.css 的 --radius（20px，PC 桌面尺度），
       两个圆角差一倍，外框看着是歪的。 */
    const radii = await page.locator('.adm-center-popup-wrap').first().evaluate(node => {
      const body = node.querySelector('.adm-center-popup-body')!
      const inner = node.querySelector('.adm-center-popup-body > div')!
      const corners = (element: Element) => {
        const style = getComputedStyle(element)
        return [style.borderTopLeftRadius, style.borderTopRightRadius,
          style.borderBottomRightRadius, style.borderBottomLeftRadius]
      }
      return {outer: corners(body), inner: corners(inner)}
    })
    for (const [name, corners] of Object.entries(radii)) {
      expect(new Set(corners).size, `${name} 的四个圆角不对称：${corners.join(', ')}`).toBe(1)
    }
    expect(radii.outer[0], `内外圆角不一致：外 ${radii.outer[0]} / 内 ${radii.inner[0]}`)
      .toBe(radii.inner[0])
    expect(parseFloat(radii.outer[0]), `圆角 ${radii.outer[0]} 太大，不是小圆角`).toBeLessThanOrEqual(14)
    expect(box.overflow, '弹窗撑出了横向滚动条').toBeLessThanOrEqual(0)

    /* 没有电脑版入口 */
    await expect(page.getByRole('link', {name: /电脑版/})).toHaveCount(0)
  })

  test('任务页三级导航：分组 → 该组任务 → 任务配置', async ({page}) => {
    await page.goto(url('tasks'))
    /* 一级：10 个分组（menu.json 的真实分组数） */
    const rows = page.locator('.m-nav-row')
    await expect(rows).toHaveCount(10)
    await expect(page.getByText(/共 \d+ 项/)).toBeVisible()

    /* 一行一张卡：分组之间有呼吸感，不做成一整张卡里塞十行 */
    await expect(page.locator('.panel.m-nav-row')).toHaveCount(10)
    const gaps = await rows.evaluateAll(nodes => nodes.slice(1).map((node, index) =>
      Math.round(node.getBoundingClientRect().top - nodes[index].getBoundingClientRect().bottom)))
    expect(new Set(gaps).size, `卡片间距不一致：${gaps}`).toBe(1)
    expect(gaps[0], '卡片之间没有留白').toBeGreaterThanOrEqual(8)

    /* 行内只有文字：分组名 + 条数 + 箭头，**不放行首图标** */
    await expect(page.locator('.m-list-icon')).toHaveCount(0)
    await expect(page.locator('.m-nav-row svg')).toHaveCount(10) // 只有收尾的箭头

    /* 文字不贴边 */
    const layout = await rows.first().evaluate(node => {
      const label = node.querySelector('.m-list-label') as HTMLElement
      const box = node.getBoundingClientRect()
      const labelBox = label.getBoundingClientRect()
      return {
        insetTop: Math.round(labelBox.top - box.top),
        insetBottom: Math.round(box.bottom - labelBox.bottom),
        insetLeft: Math.round(labelBox.left - box.left),
        labelFont: parseFloat(getComputedStyle(label).fontSize),
        labelWeight: getComputedStyle(label).fontWeight,
        height: Math.round(box.height),
      }
    })
    expect(layout.insetTop, '标题贴到上边框了').toBeGreaterThanOrEqual(8)
    expect(layout.insetBottom, '标题贴到下边框了').toBeGreaterThanOrEqual(8)
    expect(layout.insetLeft, '标题贴到左边框了').toBeGreaterThanOrEqual(14)
    expect(layout.labelFont).toBe(16)
    expect(layout.labelWeight, '行标签不该加粗').toBe('400')
    /* 行高要短：之前 56px 配 16px 字看着有三行文字那么高 */
    expect(layout.height, `分组行还有 ${layout.height}px 高`).toBeLessThanOrEqual(50)
    expect(layout.height, '行高低于 44px 会达不到触控尺寸').toBeGreaterThanOrEqual(44)

    /* 行内只有「左边文字 + 右边箭头」：不放中间的数量 */
    await expect(page.locator('.m-nav-row .m-list-count')).toHaveCount(0)
    await expect(page.locator('.m-nav-row .m-list-icon')).toHaveCount(0)
    const rowParts = await rows.first().evaluate(node => {
      const box = node.getBoundingClientRect()
      const label = node.querySelector('.m-list-label')!.getBoundingClientRect()
      const chevron = node.querySelector('.m-list-chevron')!.getBoundingClientRect()
      return {
        children: node.children.length,
        labelLeft: Math.round(label.left - box.left),
        chevronRight: Math.round(box.right - chevron.right),
      }
    })
    expect(rowParts.children, '分组行只剩两个元素：文字 + 箭头').toBe(2)
    expect(rowParts.labelLeft).toBeLessThanOrEqual(20)
    expect(rowParts.chevronRight).toBeLessThanOrEqual(20)

    /* 二级：点第一个分组进入该组的任务列表，页眉标题变成分组名。
       分组来自真实 menu.json（夹具生成），第一组是「系统」，共 3 个任务。 */
    await page.locator('.m-nav-row', {hasText: '系统'}).click()
    await expect(page.locator('.m-bar h1').first()).toHaveText('系统')
    const tasks = page.locator('.m-nav-row')
    await expect(tasks).toHaveCount(3)
    await expect(page).toHaveURL(/group=/)
    /* 底部 Tab 栏在分组列表这一层仍在 */
    await expect(page.locator('.m-tabbar')).toHaveCount(1)
    await expect(page.locator('.m-list-icon')).toHaveCount(0)

    /* 组内任务行：两行文字（中文名 + 任务键），间距要够，不能挤在一起 */
    const taskLayout = await tasks.first().evaluate(node => {
      const title = node.querySelector('.m-list-label') as HTMLElement
      const key = node.querySelector('.m-list-sub') as HTMLElement
      const box = node.getBoundingClientRect()
      return {
        hasTitle: !!title, hasKey: !!key,
        gap: Math.round(key.getBoundingClientRect().top - title.getBoundingClientRect().bottom),
        titleFont: parseFloat(getComputedStyle(title).fontSize),
        keyFont: parseFloat(getComputedStyle(key).fontSize),
        insetTop: Math.round(title.getBoundingClientRect().top - box.top),
        insetBottom: Math.round(box.bottom - key.getBoundingClientRect().bottom),
      }
    })
    expect(taskLayout.hasTitle && taskLayout.hasKey).toBe(true)
    expect(taskLayout.gap, '任务名与任务键挤在一起').toBeGreaterThanOrEqual(2)
    expect(taskLayout.titleFont).toBeGreaterThan(taskLayout.keyFont)
    expect(taskLayout.insetTop).toBeGreaterThanOrEqual(10)
    expect(taskLayout.insetBottom).toBeGreaterThanOrEqual(10)

    /* 组内每一行都要有中文名 —— 漏登记会回显任务键，看起来像「中文没翻译」 */
    const labels = await tasks.evaluateAll(nodes => nodes.map(node => ({
      title: node.querySelector('.m-list-label')?.textContent ?? '',
      key: node.querySelector('.m-list-sub')?.textContent ?? '',
    })))
    const untranslated = labels.filter(item => item.title === item.key).map(item => item.key)
    expect(untranslated, `这些任务没有中文名：${untranslated.join(', ')}`).toEqual([])
    for (const item of labels) expect(item.title.trim(), `${item.key} 的名字是空的`).not.toBe('')

    /* 三级：点具体任务才进配置页，页眉是任务名 + 任务键 */
    await tasks.first().click()
    await expect(page.locator('.m-bar h1').first()).not.toHaveText('常规')
    await expect(page.locator('.m-bar .m-bar-subtitle')).toBeVisible()
    /* 配置页是全屏推入，盖住 Tab 栏 */
    await expect(page.locator('.m-tabbar')).toHaveCount(0)

    /* 返回逐层退：配置 → 分组列表 → 任务页 */
    await page.getByRole('button', {name: '返回'}).click()
    await expect(page.locator('.m-bar h1').first()).toHaveText('系统')
    await page.getByRole('button', {name: '返回'}).click()
    await expect(page.locator('.m-bar h1').first()).toHaveText('任务')
    await expect(page.locator('.m-nav-row')).toHaveCount(10)
  })

  test('实例页：调度队列分组、无图标、计数徽标、动作靠右', async ({page}) => {
    await page.goto(url('instance'))

    /* 三个状态各一组，组内是「一个卡片多行 + 发丝线」 */
    await expect(page.locator('.m-list-group')).toHaveCount(3)
    await expect(page.locator('.m-list')).toHaveCount(3)
    await expect(page.locator('.m-list .m-list-row')).toHaveCount(7)

    /* 不放行首图标 */
    await expect(page.locator('.m-list-icon')).toHaveCount(0)

    /* 段落标题右侧是计数徽标 */
    const badges = page.locator('.m-section-title .m-count-badge')
    await expect(badges).toHaveCount(3)
    await expect(badges).toHaveText(['1', '2', '4'])

    /* 行间发丝线：每个卡片内部除首行外都有上边线，首行没有（否则卡片顶上多一条） */
    const dividers = await page.locator('.m-list').evaluateAll(cards => cards.map(card => {
      const rows = Array.from(card.querySelectorAll('.m-list-row'))
      return {
        count: rows.length,
        first: getComputedStyle(rows[0]).borderTopWidth,
        rest: rows.slice(1).map(row => getComputedStyle(row).borderTopWidth),
      }
    }))
    for (const card of dividers) {
      expect(card.first, '卡片首行不该有上分隔线').toBe('0px')
      expect(card.rest.every(width => width === '1px'), `行间分隔线缺失：${card.rest}`).toBe(true)
    }
    expect(dividers.map(card => card.count)).toEqual([1, 2, 4])

    /* 行内正文要撑开，把「立即执行」推到最后；正文与按钮之间正好是行的 gap */
    const alignment = await page.locator('.m-list-row').first().evaluate(node => {
      const body = node.querySelector('.m-list-row-button')!.getBoundingClientRect()
      const action = node.querySelector('.m-list-action')!.getBoundingClientRect()
      const row = node.getBoundingClientRect()
      const gap = parseFloat(getComputedStyle(node).columnGap) || 0
      return {
        bodyWidth: Math.round(body.width),
        toAction: Math.round(action.left - body.right),
        rowGap: Math.round(gap),
        actionRightInset: Math.round(row.right - action.right),
      }
    })
    expect(alignment.actionRightInset, '「立即执行」没有靠右').toBeLessThanOrEqual(12)
    expect(alignment.bodyWidth, '正文没有撑开').toBeGreaterThan(150)
    expect(Math.abs(alignment.toAction - alignment.rowGap)).toBeLessThanOrEqual(1)

    /* 动作按钮要有无障碍名 */
    await expect(page.locator('.m-list-action').first()).toHaveAttribute('aria-label', /立即执行/)

    /* FAB 不会永久压住最后一行 */
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    await page.waitForTimeout(150)
    const overlaps = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('.m-list-row'))
      const last = rows.at(-1)!.getBoundingClientRect()
      const fab = document.querySelector('.adm-floating-bubble')!.getBoundingClientRect()
      return fab.top < last.bottom && fab.left < last.right
    })
    expect(overlaps, '滚到底后 FAB 仍压住最后一行').toBe(false)
  })

  test('任务搜索：深灰搜索框、能搜到组内任务', async ({page}) => {
    await page.goto(url('tasks'))

    /* 搜索框是比页面底色深一档的灰 */
    const box = page.locator('.adm-search-bar .adm-search-bar-input-box')
    const bg = await box.evaluate(node => getComputedStyle(node).backgroundColor)
    const pageBg = await page.locator('body').evaluate(node => getComputedStyle(node).backgroundColor)
    expect(bg, `搜索框底色 ${bg} 与页面底色 ${pageBg} 相同，看不出是输入框`).not.toBe(pageBg)
    /* 占位文字与放大镜必须仍然过 4.5:1（深灰底上 --muted 只有 3.96:1） */
    const iconColor = await page.locator('.adm-search-bar-input-box-icon')
      .evaluate(node => getComputedStyle(node).color)
    const ratio = await ratioOn(page, iconColor, bg)
    expect(ratio, `放大镜/占位文字在搜索框底上只有 ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5)

    /* 聚焦态同样要过：antd 有一条三重类规则
       `.adm-search-bar-active .adm-input.adm-input.adm-input` 会把占位符颜色拉回
       --adm-color-light(#ccc)，必须在搜索栏作用域内被改写掉。 */
    await page.locator('.adm-search-bar input').focus()
    await expect(page.locator('.adm-search-bar')).toHaveClass(/adm-search-bar-active/)
    const focused = await page.locator('.adm-search-bar input').evaluate(node => ({
      icon: getComputedStyle(node.closest('.adm-search-bar')!
        .querySelector('.adm-search-bar-input-box-icon')!).color,
      placeholder: getComputedStyle(node, '::placeholder').color,
      boxBg: getComputedStyle(node.closest('.adm-search-bar-input-box')!).backgroundColor,
    }))
    for (const [name, fg] of [['放大镜', focused.icon], ['占位文字', focused.placeholder]] as const) {
      const focusedRatio = await ratioOn(page, fg, focused.boxBg)
      expect(focusedRatio, `聚焦态的${name}只有 ${focusedRatio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5)
    }
    expect(focused.boxBg, '聚焦时底色不该翻白').toBe(bg)

    /* 搜索必须能命中组内任务，而不只是分组名。
       `Research` 在真实 menu.json 里只属于「自动收获」一组 —— 只匹配分组名的旧实现
       一条都给不出来（没有任何分组名含 research）。 */
    const input = page.locator('.adm-search-bar input')
    await input.fill('Research')
    await expect(page.locator('.m-section-title', {hasText: '任务'})).toBeVisible()
    const taskHits = page.locator('.m-nav-row', {hasText: 'Research'})
    await expect(taskHits).toHaveCount(1)
    /* 命中项要标出**自己**的所属分组 */
    await expect(taskHits.first()).toContainText('自动收获')
    /* 分组区这时是空的：没有任何分组名含 `research` */
    await expect(page.locator('.m-section-title', {hasText: '分组'})).toHaveCount(0)

    /* 中文标签同样能搜到：`Research` 的标签是「科研」，不是把 key 原样显示 */
    await input.fill('科研')
    await expect(page.locator('.m-nav-row', {hasText: 'Research'})).toHaveCount(1)
    await expect(page.locator('.m-nav-row', {hasText: 'Research'}).first()).toContainText('科研')

    /* 分组名同样能搜，且与任务结果分成两段（分组名来自真实 menu.json） */
    await input.fill('系统')
    await expect(page.locator('.m-section-title', {hasText: '分组'})).toBeVisible()
    await expect(page.locator('.m-nav-row', {hasText: '系统'}).first()).toBeVisible()

    /* 点命中的任务直接进它的配置页 */
    await input.fill('Research')
    await page.locator('.m-nav-row', {hasText: 'Research'}).first().click()
    await expect(page.locator('.m-bar .m-bar-subtitle')).toHaveText('Research')
    await expect(page.locator('.m-tabbar')).toHaveCount(0)

    /* 搜不到时给空态卡 */
    await page.goto(url('tasks'))
    await page.locator('.adm-search-bar input').fill('zzzz-no-such-task')
    await expect(page.locator('.panel.m-empty-card')).toHaveCount(1)
  })

  test('抽屉里的「搜索」是跳转，不是输入框', async ({page}) => {
    await page.goto(url('home'))
    await page.getByRole('button', {name: '打开菜单'}).click()
    const drawer = page.locator('.adm-popup')
    /* 抽屉里不该再有搜索框 */
    await expect(drawer.locator('.adm-search-bar')).toHaveCount(0)
    /* 点「搜索」跳到任务页，任务页顶部才有搜索框 */
    await drawer.getByText('搜索', {exact: true}).click()
    await expect(page.locator('.m-bar h1').first()).toHaveText('任务')
    await expect(page.locator('.adm-search-bar')).toHaveCount(1)
    /* 不自动聚焦：跳页就弹键盘太突然 */
    const focused = await page.evaluate(() => document.activeElement?.tagName.toLowerCase())
    expect(focused, '抽屉跳转后自动聚焦了搜索框').not.toBe('input')
  })

  test('统计页只有一个面板，段与段之间用分隔线', async ({page}) => {
    await page.goto(url('stats'))
    /* 原先四块内容各占一个独立小盒子，一屏叠四五个边框 —— 现在合并成一个面板。
       查询条件 / 趋势 / 明细表都是这个面板里的一段；指标段只在有指标的类目里出现，
       所以默认的「资源趋势」是两段（条件 + 趋势），这与后端给的形状一致。 */
    await expect(page.locator('.m-stat-panel')).toHaveCount(1)
    await expect(page.locator('.panel')).toHaveCount(1)
    const sections = page.locator('.m-stat-panel > .m-stat-section')
    await expect(sections).toHaveCount(2)
    /* 段与段之间是发丝线，第一段没有 */
    const borders = await sections.evaluateAll(nodes =>
      nodes.map(node => getComputedStyle(node).borderTopWidth))
    expect(borders[0], '第一段不该有上分隔线').toBe('0px')
    expect(borders.slice(1).every(width => width === '1px'), `分隔线缺失：${borders}`).toBe(true)
    /* 每一段都要有内边距，文字不能贴着面板边框 */
    const pads = await sections.evaluateAll(nodes =>
      nodes.map(node => parseFloat(getComputedStyle(node).paddingLeft)))
    expect(pads.every(value => value >= 14), `有段落没有内边距：${pads}`).toBe(true)

    /* 切到有指标的类目后，指标段插进来，仍然是同一个面板 */
    await page.getByRole('tablist', {name: '统计分类'}).getByRole('tab', {name: '大世界总结'}).click()
    await expect(page.locator('.m-stat-panel > .m-stat-section')).toHaveCount(3)
    await expect(page.locator('.panel')).toHaveCount(1)
  })

  test('搜索框是单层胶囊，聚焦不会套出第二个框', async ({page}) => {
    /* PC 的 tokens.css 给所有 input 套了边框/圆角/白底/内边距与蓝色 focus ring。
       那些规则漏进 antd 组件内部时，搜索框会出现「框里还有个框」、占位文字被挤到
       放大镜上。这里把三层都盯住：外层胶囊、内层无样式、聚焦态不换底不描边。 */
    await page.goto(url('tasks'))

    const box = page.locator('.adm-search-bar .adm-search-bar-input-box')
    await expect(box).toHaveCount(1)
    const boxStyle = await box.evaluate(node => {
      const style = getComputedStyle(node)
      return {radius: parseFloat(style.borderRadius), height: Math.round(node.getBoundingClientRect().height),
        background: style.backgroundColor, borderWidth: style.borderTopWidth}
    })
    expect(boxStyle.radius, '搜索框不是全圆角胶囊').toBeGreaterThanOrEqual(20)
    expect(boxStyle.height, '搜索框太矮，不像系统设置').toBeGreaterThanOrEqual(44)
    expect(boxStyle.borderWidth, '搜索框多了一圈描边').toBe('1px')
    expect(boxStyle.background, '搜索框不是浅灰底').not.toBe('rgb(255, 255, 255)')

    /* 内层 input 必须是无样式的 —— 有边框或白底就是「框里还有个框」 */
    const input = page.locator('.adm-search-bar input')
    const inputStyle = await input.evaluate(node => {
      const style = getComputedStyle(node)
      return {borderWidth: style.borderTopWidth, background: style.backgroundColor, boxShadow: style.boxShadow,
        radius: parseFloat(style.borderRadius), height: Math.round(node.getBoundingClientRect().height)}
    })
    expect(inputStyle.borderWidth, '内层输入框又画了一层边框').toBe('0px')
    expect(inputStyle.radius, '内层输入框又画了一层圆角').toBe(0)
    expect(['rgba(0, 0, 0, 0)', 'transparent']).toContain(inputStyle.background)
    expect(inputStyle.boxShadow, '内层输入框带了阴影').toBe('none')
    expect(inputStyle.height, '内层输入框被撑高了，会把文字挤到放大镜上').toBeLessThan(44)

    /* 聚焦：不换白底、不描主色边、不加 focus ring */
    await input.focus()
    await page.waitForTimeout(150)
    const focused = await box.evaluate(node => getComputedStyle(node).backgroundColor)
    const focusedInput = await input.evaluate(node => {
      const style = getComputedStyle(node)
      return {borderWidth: style.borderTopWidth, boxShadow: style.boxShadow}
    })
    expect(focused, '聚焦后底色变成了白色').toBe(boxStyle.background)
    expect(focusedInput.borderWidth).toBe('0px')
    expect(focusedInput.boxShadow, '聚焦后多了一圈 focus ring').toBe('none')

    /* 放大镜与占位文字不能叠在一起 */
    const overlap = await page.locator('.adm-search-bar').evaluate(node => {
      const icon = node.querySelector('.adm-search-bar-input-box-icon')!.getBoundingClientRect()
      const field = node.querySelector('input')!.getBoundingClientRect()
      return Math.round(field.left - icon.right)
    })
    expect(overlap, '占位文字压到放大镜上了').toBeGreaterThanOrEqual(0)
  })

  test('统计页：圆角收小且数值不加粗', async ({page}) => {
    await page.goto(url('stats'))

    /* PC 的 --theme-radius-panel 是 26px（桌面尺度），手机端覆盖成 12px */
    const radius = await page.locator('.m-stat-panel').first()
      .evaluate(node => parseFloat(getComputedStyle(node).borderRadius))
    expect(radius, `统计卡片圆角还有 ${radius}px`).toBeLessThanOrEqual(14)
    /* 资源卡与其它面板也一起收小 */
    const cardRadius = await page.goto(url('overview')).then(() =>
      page.locator('.resource-card').first().evaluate(node => parseFloat(getComputedStyle(node).borderRadius)))
    expect(cardRadius).toBeLessThanOrEqual(14)

    await page.goto(url('stats'))
    /* 数值、标题、明细一律常规字重 */
    for (const selector of ['.m-stat-title', '.m-stat-value', '.m-stat-delta', '.m-stat-metrics b']) {
      const weight = await page.locator(selector).first().evaluate(node => getComputedStyle(node).fontWeight)
      expect(weight, `${selector} 还是加粗的`).toBe('400')
    }
    /* 也不该再有 <strong> 撑着 */
    const bold = await page.locator('.m-stat-panel strong').count()
    expect(bold, '统计面板里还有 <strong>').toBe(0)
  })

  test('日志区域自适应：整页不滚动，日志在自己区域里滚', async ({page}) => {
    await page.goto(url('logs'))

    /* 页面本身不滚 —— 之前 500 行日志把页面撑到 9000px */
    expect(await pageScrolls(page), '日志页整页仍可滚动，没有自适应').toBe(false)

    /* 一整块面板，不是「分段框 + 日志卡」两个盒子；段与段之间用发丝线隔开 */
    await expect(page.locator('.panel.m-logcard')).toHaveCount(1)
    const sections = await page.locator('.panel.m-logcard > *').evaluateAll(nodes => nodes.map(node => ({
      cls: node.className,
      borderBottom: getComputedStyle(node).borderBottomWidth,
      paddingLeft: parseFloat(getComputedStyle(node).paddingLeft),
    })))
    /* 分段条 / 视图工具行 / 搜索行 / 正文 —— 搜索单独占一行而不是塞进工具行：
       360dp 上「自动滚动 + 开关 + 级别 + 导出 + 清空 + 搜索框」一行放不下。 */
    expect(sections.length, '面板里应当是「分段条 + 工具行 + 搜索行 + 正文」四段').toBe(4)
    for (const section of sections) {
      expect(section.paddingLeft, `${section.cls} 没有内边距，文字会贴着边框`).toBeGreaterThanOrEqual(14)
    }
    /* 前三段有分隔线，最后一段（滚动正文）不需要 */
    expect(sections[0].borderBottom, '分段条与工具行之间没有横线').not.toBe('0px')
    expect(sections[1].borderBottom, '工具行与搜索行之间没有横线').not.toBe('0px')
    expect(sections[2].borderBottom, '搜索行与日志正文之间没有横线').not.toBe('0px')

    /* 日志行照搬 PC 的 LogLine：级别在前、时间在后、再是分隔符与正文 */
    const firstLine = page.locator('.m-logscroll .log-entry-line').first()
    await expect(firstLine).toHaveCount(1)
    const line = await firstLine.evaluate(node => {
      const parts = Array.from(node.children).map(child => ({
        cls: child.className,
        text: (child.textContent ?? '').trim(),
      }))
      const lvl = node.querySelector('.log-lvl')!
      const ts = node.querySelector('.log-ts')!
      return {
        parts,
        levelColor: getComputedStyle(lvl).color,
        timeColor: getComputedStyle(ts).color,
        fontFamily: getComputedStyle(node).fontFamily,
        whiteSpace: getComputedStyle(node).whiteSpace,
      }
    })
    expect(line.parts.map(part => part.cls)).toEqual(['log-lvl lvl-info', 'log-ts', 'log-divider', 'log-msg'])
    expect(line.parts[0].text, '级别不在最前面').toBe('INFO')
    expect(line.parts[1].text, '时间没有跟在级别后面').toMatch(/^\d{2}:\d{2}:\d{2}/)
    /* 走 PC 的 .lvl-* 取色，不是手机端自己画的一套 */
    expect(line.levelColor, 'INFO 没有用 PC 的强调蓝').toBe('rgb(14, 165, 233)')
    expect(line.timeColor, '时间没有用 PC 的青色').toBe('rgb(6, 182, 212)')
    expect(line.fontFamily.toLowerCase(), '日志没有用等宽字体').toContain('monospace')
    /* 定高虚拟化要求一行一行是等高的：不折行，超宽走横向滚动（PC 的 .log-content 同样可滚） */
    expect(line.whiteSpace, '日志行会折行，定高虚拟化会算错位').toBe('pre')

    /* 正文不能被截断：ellipsis / line-clamp 会让 scrollWidth 大于 clientWidth。
       412px 视口下大部分行本来就放得下，所以缩到真机的 360dp 再测一遍 ——
       那里时间戳加级别就吃掉 45% 宽度，是最容易暴露截断的地方。 */
    await page.setViewportSize({width: 360, height: 800})
    await page.waitForTimeout(150)
    const clipped = await page.locator('.m-logscroll .log-msg').evaluateAll(nodes =>
      nodes.filter(node => node.scrollWidth > node.clientWidth + 1).length)
    expect(clipped, `${clipped} 行日志的正文被截断了`).toBe(0)
    const overflow = await page.locator('.m-logscroll')
      .evaluate(node => node.scrollWidth - node.clientWidth)
    expect(overflow, '360dp 下日志没有横向滚动余量，正文应当放不下才对').toBeGreaterThan(0)
    await page.setViewportSize({width: 412, height: 915})
    await page.waitForTimeout(150)

    /* 级别列要够宽，时间才会对齐成一列 —— 给窄了 WARNING / CRITICAL 会把时间往右顶 */
    const columns = await page.locator('.m-logscroll .log-entry-line').evaluateAll(nodes =>
      nodes.slice(0, 60).map(node => Math.round(node.querySelector('.log-ts')!.getBoundingClientRect().left)))
    expect(new Set(columns).size, `时间列没对齐，出现了 ${new Set(columns).size} 种起点`).toBe(1)

    /* 正文左内边距。`.panel` 自己没有 padding，这 16px 来自 `.m-logscroll` ——
       改之前滚动区一点内边距都没有，正文距离边框只有 1px，这就是「文字离边框太近」。 */
    const textInset = await firstLine.evaluate(node => {
      const panel = node.closest('.panel')!.getBoundingClientRect()
      return Math.round(node.querySelector('.log-lvl')!.getBoundingClientRect().left - panel.left)
    })
    expect(textInset, `日志正文离左边框只有 ${textInset}px`).toBeGreaterThanOrEqual(14)

    /* 级别配色逐档抽查：error 必须是红的，且与 info 不同 */
    const errorLine = page.locator('.m-logscroll .lvl-error').first()
    await expect(errorLine).toHaveCount(1)
    expect(await errorLine.evaluate(node => getComputedStyle(node).color)).toBe('rgb(239, 68, 68)')
    expect(await errorLine.evaluate(node => getComputedStyle(node).color)).not.toBe(line.levelColor)

    const scroller = page.locator('.m-logscroll')
    await expect(scroller).toHaveCount(1)
    const metrics = await scroller.evaluate(node => ({
      overflowY: getComputedStyle(node).overflowY,
      clientHeight: node.clientHeight,
      scrollHeight: node.scrollHeight,
    }))
    expect(metrics.overflowY).toBe('auto')
    /* 400 行 × 18px = 7200，加上下内边距 */
    expect(metrics.scrollHeight, '日志没有撑开自己的滚动高度').toBeGreaterThan(7000)
    expect(metrics.clientHeight).toBeLessThan(metrics.scrollHeight)

    /* 只渲染窗口内的行 */
    const rows = await page.locator('.m-virtual-row').count()
    expect(rows, `日志渲染了 ${rows} 行`).toBeLessThan(80)

    /* 滚容器（不是滚页面）后窗口前移 */
    const before = await page.locator('.m-virtual-row').first().innerText()
    await scroller.evaluate(node => { node.scrollTop = 4000 })
    await page.waitForTimeout(200)
    const after = await page.locator('.m-virtual-row').first().innerText()
    expect(after, '滚动容器后窗口没有前移').not.toBe(before)

    /* 页眉与 Tab 栏仍在原位 */
    const bar = await page.locator('.m-bar').first().evaluate(node => Math.round(node.getBoundingClientRect().top))
    expect(bar).toBe(0)
    expect(await pageScrolls(page)).toBe(false)
  })

  test('卡片管理按 PC 重做，拖动真的改变顺序', async ({page}) => {
    await page.goto(url('overview'))
    await page.getByRole('button', {name: '卡片管理'}).click()

    /* PC 的结构：.resource-settings + .resource-card-editor + 「添加卡片」 */
    await expect(page.locator('.resource-settings')).toHaveCount(1)
    await expect(page.locator('.resource-settings-heading')).toContainText('资源卡片')
    await expect(page.getByRole('button', {name: '恢复默认'})).toBeVisible()

    const editorCards = page.locator('.resource-card-editor .resource-editor-card:not(.resource-editor-add)')
    const before = await editorCards.evaluateAll(nodes =>
      nodes.map(node => node.getAttribute('data-card-key')))
    expect(before.length).toBeGreaterThan(2)

    /* 指针事件拖动：把第一张拖到第三张的位置上 */
    const first = await editorCards.first().boundingBox()
    const third = await editorCards.nth(2).boundingBox()
    if (first && third) {
      await page.mouse.move(first.x + first.width / 2, first.y + first.height / 2)
      await page.mouse.down()
      await page.mouse.move(third.x + third.width / 2, third.y + third.height / 2, {steps: 12})
      await page.mouse.up()
    }
    const after = await editorCards.evaluateAll(nodes =>
      nodes.map(node => node.getAttribute('data-card-key')))
    expect(after, `拖动没有改变顺序：${before} → ${after}`).not.toEqual(before)
    expect([...after].sort()).toEqual([...before].sort())

    /* 添加卡片选择器 */
    await page.getByRole('button', {name: '添加卡片'}).click()
    const picker = page.locator('.resource-picker-card')
    expect(await picker.count()).toBeGreaterThan(0)
    await picker.first().click()
    const grown = await editorCards.evaluateAll(nodes =>
      nodes.map(node => node.getAttribute('data-card-key')))
    expect(grown.length).toBe(before.length + 1)

    /* ✕ 移除 */
    await page.locator('.resource-editor-remove').first().click()
    const shrunk = await editorCards.evaluateAll(nodes =>
      nodes.map(node => node.getAttribute('data-card-key')))
    expect(shrunk.length).toBe(grown.length - 1)

    /* 恢复默认 → PC 的四个默认卡片 */
    await page.getByRole('button', {name: '恢复默认'}).click()
    const restored = await editorCards.evaluateAll(nodes =>
      nodes.map(node => node.getAttribute('data-card-key')))
    expect(restored).toEqual(['Oil', 'Coin', 'Gem', 'Cube'])

    /* 关掉管理器后，**总览本身**必须按新顺序出卡 —— 只改管理器内部的顺序不算数 */
    await page.getByRole('button', {name: '完成'}).click()
    await page.waitForTimeout(200)
    const overviewOrder = () => page.locator('.resource-card')
      .evaluateAll(nodes => nodes.map(node => node.querySelector('.resource-heading span')?.textContent))
    expect(await overviewOrder()).toEqual(['石油', '物资', '钻石', '心智魔方'])

    /* 再拖一次，验证总览跟着变 */
    await page.getByRole('button', {name: '卡片管理'}).click()
    const firstBox = await editorCards.first().boundingBox()
    const thirdBox = await editorCards.nth(2).boundingBox()
    if (firstBox && thirdBox) {
      await page.mouse.move(firstBox.x + firstBox.width / 2, firstBox.y + firstBox.height / 2)
      await page.mouse.down()
      await page.mouse.move(thirdBox.x + thirdBox.width / 2, thirdBox.y + thirdBox.height / 2, {steps: 12})
      await page.mouse.up()
    }
    const managerOrder = await editorCards.evaluateAll(nodes =>
      nodes.map(node => node.getAttribute('data-card-key')))
    expect(managerOrder[0], '拖动没有把卡片挪走').not.toBe('Oil')
    await page.getByRole('button', {name: '完成'}).click()
    await page.waitForTimeout(200)
    const afterOrder = await overviewOrder()
    expect(afterOrder[0], '总览没有跟着卡片管理的顺序变').not.toBe('石油')

    /* 刷新后顺序保留（存储键与 PC 的 azurpilot.resources.<实例> 一致） */
    await page.reload()
    await page.waitForTimeout(250)
    expect(await overviewOrder(), '刷新后顺序丢了').toEqual(afterOrder)
    const stored = await page.evaluate(() => localStorage.getItem('azurpilot.resources.alas'))
    expect(stored, '没有写进与 PC 共用的存储键').toBe(JSON.stringify(managerOrder))
  })

  test('连点品牌 logo 十次开启开发者模式', async ({page}) => {
    await page.goto(url('home'))
    await page.getByRole('button', {name: '打开菜单'}).click()
    const logo = page.getByTestId('drawer-logo')
    await expect(logo).toBeVisible()
    await expect(logo).toHaveRole('button')
    await expect(logo).toHaveAttribute('aria-label', /开发者模式/)

    for (let index = 0; index < 10; index += 1) await logo.click()
    await expect(page.locator('.adm-popup').getByText('组件测试')).toBeVisible()
  })

  test('App 宿主内才出现刷新与设置', async ({page}) => {
    await page.goto(url('overview', '&app=1'))
    await expect(page.getByRole('button', {name: '刷新'})).toBeVisible()
    await expect(page.getByRole('button', {name: '设置'})).toBeVisible()

    await page.goto(url('overview'))
    await expect(page.getByRole('button', {name: '刷新'})).toHaveCount(0)
    await expect(page.getByRole('button', {name: '设置'})).toHaveCount(0)
  })

  test('总览的 FAB 不会永久压住最后一张卡', async ({page}) => {
    /* 悬浮按钮固定在视口右下、距底 84px、高 56px。内容不够长时页面滚不动，
       最后一张卡的数值就会被永久压在按钮下面 —— PC 的默认只有四张卡，很容易触发。
       留白够大时，任何视口高度都应该能滚开。 */
    for (const height of [520, 560, 593, 640, 720, 915]) {
      await page.setViewportSize({width: 360, height})
      await page.goto(url('overview'))
      await page.waitForTimeout(250)
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
      await page.waitForTimeout(120)

      const info = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('.resource-card'))
        const value = cards.at(-1)!.querySelector('.m-resource-amount')!.getBoundingClientRect()
        const fab = document.querySelector('.adm-floating-bubble')!.getBoundingClientRect()
        return {
          overlaps: fab.top < value.bottom && fab.bottom > value.top &&
            fab.left < value.right && fab.right > value.left,
          valueBottom: Math.round(value.bottom),
          fabTop: Math.round(fab.top),
        }
      })
      expect(info.overlaps, `视口高 ${height}：数值底 ${info.valueBottom} 仍被 FAB 顶 ${info.fabTop} 压住`)
        .toBe(false)
    }
  })

  test('启停：转圈、失效、轻提示，实例页与总览页都能点', async ({page}) => {
    /* 实例页原来传的是空函数 —— 按钮点下去毫无反应（用户报的 bug）。
       两屏现在共用同一个启停入口，所以两边都要点得动。 */
    for (const [screen, title] of [['instance', '实例'], ['overview', '总览']] as const) {
      await page.goto(url(screen))
      await expect(page.locator('.m-bar h1').first()).toHaveText(title)

      const fab = page.getByRole('button', {name: '启动调度器'})
      await expect(fab, `${title}页没有启停按钮`).toBeVisible()
      /* 用坐标点击而不是 locator.click()：FAB 是可拖动泡泡，locator 的
         「稳定性 + 命中目标」重试会和它的指针逻辑打架，实测点不动；
         坐标点击才是真机上手指的行为。 */
      const center = await fab.evaluate(node => {
        const box = node.getBoundingClientRect()
        return {x: box.left + box.width / 2, y: box.top + box.height / 2}
      })
      await page.mouse.click(center.x, center.y)

      /* 启动中：转圈 + 失效。不失效用户会连点，后端那边是加锁的。 */
      const busy = page.getByRole('button', {name: '正在启动调度器'})
      await expect(busy, `${title}页点下去立刻就不是忙态了，看不到转圈`).toBeVisible()
      await expect(busy).toBeDisabled()
      await expect(busy).toHaveAttribute('aria-busy', 'true')
      await expect(page.locator('.adm-spin-loading'), `${title}页忙碌时没有转圈`).toHaveCount(1)

      /* 轻提示：完成后给结果，不打断操作 */
      await expect(page.getByText('调度器已启动')).toBeVisible({timeout: 10000})
      /* 状态翻转：按钮变成停止 */
      await expect(page.getByRole('button', {name: '停止调度器'})).toBeVisible()
    }

    /* 停止是危险动作：先确认再执行 */
    await page.getByRole('button', {name: '停止调度器'}).click()
    await expect(page.getByText('停止调度器？当前任务会被中断。')).toBeVisible()
  })

  test('日志：自动跟随最新一行、往回翻历史自动关闭、横竖都能拖、清空是真的', async ({page}) => {
    await page.goto(url('logs'))
    const scroller = page.locator('.m-logscroll')
    await expect(scroller).toHaveCount(1)

    /* 开关默认开；打开状态下应当已经贴在最新一行（自动跟随） */
    /* antd 的 Switch 里那个 input 是 display: none，直接按类名判状态 */
    const switchInput = page.locator('.m-logtoolbar .adm-switch').first()
    await expect(switchInput).toHaveClass(/adm-switch-checked/)
    const atBottom = () => scroller.evaluate(node =>
      Math.round(node.scrollHeight - node.clientHeight - node.scrollTop))
    expect(await atBottom(), '开了自动滚动却没有贴在最新一行').toBeLessThanOrEqual(4)

    /* 往回翻历史（scrollTop 变小）→ 自动关闭。
       这里用滚轮而不是鼠标拖拽：**鼠标拖拽不会平移滚动容器**（那是触屏行为），
       真机上的手指拖动由 C4 的真机验证覆盖。 */
    const box = (await scroller.boundingBox())!
    const bottomTop = await scroller.evaluate(node => node.scrollTop)
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.wheel(0, -400)
    await page.waitForTimeout(150)
    await expect(switchInput, '往回翻历史之后自动滚动没有关闭').not.toHaveClass(/adm-switch-checked/)
    const scrolledUp = await scroller.evaluate(node => node.scrollTop)
    expect(scrolledUp, `往回翻历史没有真的滚动（${bottomTop} → ${scrolledUp}）`).toBeLessThan(bottomTop - 100)

    /* 重新打开 → 立刻回到最新一行 */
    await switchInput.click()
    await expect(switchInput).toHaveClass(/adm-switch-checked/)
    expect(await atBottom(), '重新打开后没有跳回最新一行').toBeLessThanOrEqual(4)

    /* 横向拖动：scrollTop 不变、scrollLeft 变大（页眉与 Tab 栏不许跟着动） */
    const barBefore = await page.locator('.m-bar').first().evaluate(node => Math.round(node.getBoundingClientRect().top))
    /* 横向溢出只在真机宽度（360dp）出现 —— 412 视口下大多数行本来就放得下 */
    await page.setViewportSize({width: 360, height: 800})
    await page.waitForTimeout(150)
    const left = await scroller.evaluate(node => node.scrollLeft)
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.wheel(400, 0)
    await page.waitForTimeout(150)
    const horizontal = await scroller.evaluate(node => ({left: node.scrollLeft, top: node.scrollTop}))
    expect(horizontal.left, `横向拖不动（scrollLeft 仍是 ${horizontal.left}）`).toBeGreaterThan(left)
    expect(await page.locator('.m-bar').first().evaluate(node => Math.round(node.getBoundingClientRect().top)),
      '横向拖动把整页带滚了').toBe(barBefore)

    /* 显式声明双向平移，免得被父级或 App 宿主的手势策略接管 */
    expect(await scroller.evaluate(node => getComputedStyle(node).touchAction)).toMatch(/pan-x.*pan-y|pan-y.*pan-x/)

    /* 清空：原来只弹 Toast，什么都没清 —— 现在真的清当前视图 */
    await page.getByRole('button', {name: '清空'}).click()
    await expect(page.locator('.m-logscroll .log-entry-line')).toHaveCount(0)
    await expect(page.locator('.m-logscroll .m-empty-card')).toHaveCount(1)
  })

  test('截图 tab 用 PC 的逻辑：后端推帧才显示，不再有写死的图', async ({page}) => {
    await page.goto(url('logs'))
    await page.getByText('截图', {exact: true}).click()

    /* 写死的 /oil.webp 必须彻底消失 */
    await expect(page.locator('img[src*="oil.webp"]'), '截图区还在用写死的假图').toHaveCount(0)
    /* 评审入口给的是标注过的占位帧；点击仍进 ImageViewer 全屏缩放（app 现有交互） */
    const frame = page.locator('.m-logpreview img')
    await expect(frame).toHaveCount(1)
    /* 评审入口给的是 data-URL 占位帧；正式入口这里是后端推来的 data:image/jpeg 帧 */
    await expect(frame).toHaveAttribute('src', /^data:image\//)
  })

  test('实例页：点行进该任务自己的配置页，点闪电触发立即执行', async ({page}) => {
    await page.goto(url('instance'))

    /* 点行 → 进的是**这个任务**的配置页（页眉是它的中文名、副标题是任务键），
       而不是笼统跳到任务页 */
    await page.locator('.m-list-row', {hasText: '委托'}).locator('.m-list-row-button').click()
    await expect(page.locator('.m-bar h1').first()).toHaveText('委托')
    await expect(page.locator('.m-bar .m-bar-subtitle')).toHaveText('Commission')

    /* 返回后点闪电 → 先确认（立即执行会打断当前任务）→ 轻提示 */
    await page.getByRole('button', {name: '返回'}).click()
    await expect(page.locator('.m-bar h1').first()).toHaveText('实例')
    await page.locator('.m-list-row', {hasText: '大舰队'}).locator('.m-list-action').click()
    await expect(page.getByText(/立即执行/).first()).toBeVisible()
    /* antd 的 Dialog.confirm 默认按钮是「确定」；「确认」是 About 那种自定义 actions 的文案 */
    await page.getByRole('button', {name: '确定'}).click()
    await expect(page.getByText('已触发立即执行。')).toBeVisible()

    /* 已经在跑的那一行，闪电是灰的 —— 再执行一次没有意义 */
    await expect(page.locator('.m-list-row', {hasText: '智能调度Plus'}).locator('.m-list-action'))
      .toBeDisabled()
  })

  test('任务配置真的能改：开关落盘、下拉可选、数字报错可重试', async ({page}) => {
    /* 回归：这一页原来是只读的 —— Switch 只有 `defaultChecked` 没有 `onChange`，
       其余字段是纯文本加一个点了没反应的箭头。看着像能改，其实一个字都写不回去。 */
    /* 行内文字包含匹配会撞名（「委托」也命中「作战委托」），所以按标题精确匹配 */
    const navRow = (name: string) => page.locator('.m-nav-row')
      .filter({has: page.locator('.m-list-label', {hasText: new RegExp(`^${name}$`)})})
    const row = (name: string) => page.locator('.m-config-row')
      .filter({has: page.locator('.m-config-label', {hasText: new RegExp(`^${name}`)})})
    await page.goto(url('tasks'))
    await navRow('自动收获').click()
    await navRow('委托').click()
    await expect(page.locator('.m-bar h1').first()).toHaveText('委托')

    const rows = page.locator('.m-config-row')
    /* 当前任务要经外壳 → 数据源两跳才传到配置页，等第一行出来再数 */
    await expect(rows.first()).toBeVisible()
    expect(await rows.count(), '委托的配置项太少，说明字段没从 schema 摊出来').toBeGreaterThan(15)

    /* hide 字段不能出现（PC 的 isFieldVisible 过滤）：真机上会多出四行内部配置 */
    await expect(page.locator('.m-main')).not.toContainText('内部任务名称')
    await expect(page.locator('.m-main')).not.toContainText('服务器刷新时间')

    /* 开关：点一下就提交，状态从「待提交」走到「已保存」，值本身也真的翻了。
       夹具里 Commission 的 `Scheduler.Enable` 默认是 true（与 template 的默认值一致）。 */
    const toggle = row('启用该功能').locator('.adm-switch')
    await expect(toggle).toHaveAttribute('aria-checked', 'true')
    await toggle.click()
    await expect(row('启用该功能').getByText('已保存')).toBeVisible()
    await expect(toggle).toHaveAttribute('aria-checked', 'false')

    /* 下拉：点开弹层选一项，同样落盘并回显。选项文案走 PC 的 `<Group>.<Arg>.<option>` 键，
       不是 cube / oil 这种原始值。
       注意 antd-mobile 的弹层根节点（`.adm-popup`）自身高度是 0，要对内容下手判可见性。 */
    const filter = row('委托过滤器')
    await expect(filter.locator('.m-config-pick')).toContainText('钻石>魔方>石油')
    await filter.locator('.m-config-pick').click()
    await expect(page.locator('.adm-popup-body').filter({hasText: '委托过滤器'})).toBeVisible()
    await page.locator('.adm-popup-body').getByText('钻石>石油>魔方', {exact: true}).click()
    await expect(filter.locator('.m-config-pick')).toContainText('钻石>石油>魔方')
    await expect(filter.getByText('已保存')).toBeVisible()

    /* 数字：中间态（半截输入）留在本地、不进网络；格式错了给可重试的红字 */
    const ratio = row('相邻层级价值倍率')
    await ratio.locator('input').fill('-')
    await ratio.locator('input').blur()
    await expect(ratio.getByText(/提交失败/)).toBeVisible()
    /* 改回合法值 → 重新排队 → 保存 */
    await ratio.locator('input').fill('3')
    await ratio.locator('input').blur()
    await expect(ratio.getByText('已保存')).toBeVisible()

    /* 只读字段标出来，且没有输入控件。Commission 里没有这类字段（它的 disabled 都是
       存储空间），所以去「系统 → 重启」看 —— 那里的启用开关是 `type: state` 的运行期值。 */
    await page.goto(url('tasks'))
    await navRow('系统').click()
    await navRow('重启设置').click()
    const readonly = page.locator('.m-config-row[data-readonly="on"]').first()
    await expect(readonly).toBeVisible()
    await expect(readonly.getByText('只读')).toBeVisible()
    await expect(readonly.locator('input, textarea, .adm-switch')).toHaveCount(0)

    /* 工具类任务没有 Scheduler.Enable，只能手动运行 —— 配置页底部要有运行按钮 */
    await page.goto(url('tasks'))
    await navRow('工具Plus').click()
    await navRow('舰队扫描').click()
    await expect(page.getByRole('button', {name: '运行工具'})).toBeVisible()
  })

  test('任务页与调度器同步：启用中/未启用、下次运行、运行中都能看出来', async ({page}) => {
    /* 回归：任务页原来只读 schema 菜单，完全不看 overview.tasks ——
       哪个任务真的在队列里、什么时候跑，在任务页上一概看不出来。 */
    const navRow = (name: string) => page.locator('.m-nav-row')
      .filter({has: page.locator('.m-list-label', {hasText: new RegExp(`^${name}$`)})})
    await page.goto(url('tasks'))

    /* 顶部有调度器摘要（状态 + 三态计数），与 PC 右栏同义 */
    const summary = page.locator('.m-scheduler-card')
    await expect(summary).toBeVisible()
    await expect(summary.locator('.m-scheduler-counts b')).toHaveText(['1', '2', '4'])
    await expect(summary.locator('.m-scheduler-state')).toHaveText('已停止')

    /* 分组行保持「左文字 + 右箭头」—— 不放计数 */
    await expect(page.locator('.m-nav-row .m-list-count')).toHaveCount(0)
    await expect(page.locator('.m-nav-row')).toHaveCount(10)

    /* 进「自动收获」组：委托在待运行、战术学院在等待中、科研未启用 */
    await navRow('自动收获').click()
    await expect(navRow('委托').locator('.m-schedule-chip')).toHaveText('待运行')
    await expect(navRow('战术学院').locator('.m-schedule-chip')).toHaveText('等待中')
    await expect(navRow('科研').locator('.m-schedule-chip')).toHaveText('未启用')
    /* 启用中的行，第二行给的是下次运行时间；未启用的行给任务键 */
    await expect(navRow('战术学院').locator('.m-list-sub')).toHaveText('06:00')
    await expect(navRow('科研').locator('.m-list-sub')).toHaveText('Research')

    /* 实例页那一组「运行中」的任务，在任务页也是「运行中」 */
    await page.goto(url('tasks'))
    await navRow('大世界Plus').click()
    await expect(navRow('智能调度Plus').locator('.m-schedule-chip')).toHaveText('正在运行')
  })

  test('图标按钮都有无障碍名，且结构图标不是 emoji', async ({page}) => {
    await page.goto(url('instance'))
    const buttons = page.locator('.m-bar button, .m-tabbar button')
    const count = await buttons.count()
    expect(count).toBeGreaterThan(0)
    for (let index = 0; index < count; index += 1) {
      const button = buttons.nth(index)
      const name = (await button.getAttribute('aria-label')) ?? (await button.innerText()).trim()
      expect(name, `第 ${index} 个图标按钮没有无障碍名`).not.toBe('')
    }

    await page.goto(url('tasks'))
    await expect(page.locator('.m-main')).not.toContainText('⚡')
  })

  test('深色模式：用 PC 的深色令牌', async ({page}) => {
    await page.goto(url('overview'))
    await page.getByRole('button', {name: '打开菜单'}).click()
    await page.locator('.adm-popup').getByText('外观').click()
    await page.locator('.adm-popup').filter({hasText: '跟随系统'}).getByText('深色', {exact: true}).click()
    await page.getByRole('button', {name: '关闭导航'}).click()
    await page.waitForTimeout(300)

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await expect(page.locator('html')).toHaveAttribute('data-prefers-color-scheme', 'dark')
    /* PC 的深色令牌：--bg #161618 / --text #f5f5f7 */
    await expect(page.locator('body')).toHaveCSS('background-color', DARK_BG)
    await expect(page.locator('.m-bar h1').first()).toHaveCSS('color', 'rgb(245, 245, 247)')
    /* 表面是毛玻璃（--glass-tint 半透明），所以底色是 rgba 而不是实色 */
    const surface = await page.locator('.resource-card').first()
      .evaluate(node => getComputedStyle(node).backgroundColor)
    expect(surface, `深色卡片底色异常：${surface}`).toContain('36, 36, 38')

    /* 状态徽标在首页的实例卡上；外观偏好是持久化的，跳过去仍是深色 */
    await page.goto(url('home'))
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    /* 换成手机端那套达标取值（PC 的 running 只有 3.96:1） */
    await expect(page.locator('.status.running').first()).toHaveCSS('color', 'rgb(108, 218, 134)')
    await expect(page.locator('.status.stopped').first()).toHaveCSS('color', 'rgb(170, 170, 176)')
  })

  /* 产出评审用的截图。刻意写进 screenshots/mobile 而不是 test-results ——
     Playwright 每次运行会清空自己的 outputDir，PC 端的 E2E 一跑就会把这里删掉。 */
  test('导出各屏截图供评审', async ({page}) => {
    /* 先清空：截图目录由这条用例独占，残留的旧命名文件会让评审看到重复编号。
       只清 mobile/，同级的 emulator/ 是真机截图，不归这里管。 */
    const shotDir = 'screenshots/mobile'
    rmSync(shotDir, {recursive: true, force: true})
    mkdirSync(shotDir, {recursive: true})

    const screens: Array<[string, string]> = [
      ['01-首页', 'home'],
      ['02-总览', 'overview'],
      ['03-实例', 'instance'],
      ['04-任务', 'tasks'],
      ['05-任务配置', 'taskConfig'],
      ['06-统计', 'stats'],
      ['07-日志', 'logs'],
      ['08-组件', 'gallery'],
    ]
    await page.setViewportSize({width: 412, height: 915})
    for (const [name, screen] of screens) {
      await page.goto(url(screen))
      await page.waitForTimeout(350)
      await page.screenshot({path: `screenshots/mobile/${name}.png`, animations: 'disabled'})
    }

    /* 分组内任务列表（三级导航的中间一层） */
    await page.goto(url('taskGroup', '&group=常规'))
    await page.waitForTimeout(300)
    await page.screenshot({path: 'screenshots/mobile/09-分组任务.png', animations: 'disabled'})

    /* 抽屉、关于、卡片管理、App 宿主页眉 */
    await page.goto(url('home'))
    await page.getByRole('button', {name: '打开菜单'}).click()
    await page.waitForTimeout(250)
    await page.screenshot({path: 'screenshots/mobile/10-抽屉.png', animations: 'disabled'})
    await page.locator('.adm-popup').getByText('关于').click()
    await page.waitForTimeout(300)
    await page.screenshot({path: 'screenshots/mobile/11-关于.png', animations: 'disabled'})
    await page.getByRole('button', {name: '确认'}).click()
    /* 弹层关闭后守卫会延迟补退一条历史记录；紧接着 goto 会被它中止，等它落定 */
    await page.waitForTimeout(200)

    await page.goto(url('overview'))
    await page.getByRole('button', {name: '卡片管理'}).click()
    await page.waitForTimeout(300)
    await page.screenshot({path: 'screenshots/mobile/12-卡片管理.png', animations: 'disabled'})
    await page.getByRole('button', {name: '完成'}).click()
    await page.waitForTimeout(200)

    await page.goto(url('overview', '&app=1'))
    await page.waitForTimeout(250)
    await page.screenshot({path: 'screenshots/mobile/13-总览-App宿主.png', animations: 'disabled'})

    /* 深色：抽屉里把外观切到深色，再关掉抽屉 */
    await page.getByRole('button', {name: '打开菜单'}).click()
    await page.locator('.adm-popup').getByText('外观').click()
    await page.locator('.adm-popup').filter({hasText: '跟随系统'}).getByText('深色', {exact: true}).click()
    await page.getByRole('button', {name: '关闭导航'}).click()
    await page.waitForTimeout(700)
    expect(await page.locator('.adm-mask:visible').count(), '抽屉遮罩还在屏幕上').toBe(0)
    await page.screenshot({path: 'screenshots/mobile/14-总览-深色.png', animations: 'disabled'})

    for (const [name, screen] of [['15-统计-深色', 'stats'], ['16-组件-深色', 'gallery']] as const) {
      await page.goto(url(screen))
      await page.waitForTimeout(600)
      await page.screenshot({path: `screenshots/mobile/${name}.png`, animations: 'disabled'})
    }
  })
})
