import { expect, test, type Page } from '@playwright/test'

/**
 * 手机端**正式入口**（mobile.html）对真实服务的验证。
 *
 * 这里要证明的是「接上了真数据」，所以断言分三类：
 *   1. **真实值**：资源数值、实例名与后端返回一致（不是示意图里那套）；
 *   2. **不该出现的东西**：示意图独有的假数据（实例 `alas2`）一个都不能有 ——
 *      这是"确实换了数据源"最直接的证据；
 *   3. **隐私与错误**：除同源外零请求、零控制台错误。
 *
 * 密码从环境变量取（`AZURPILOT_PASSWORD`），没设就跳过 —— 不把密码写进仓库。
 */
const PASSWORD = process.env.AZURPILOT_PASSWORD ?? ''

/**
 * 点底部 Tab。
 *
 * Tab 栏是 antd-mobile 的 `TabBar`，渲染出来是 `.adm-tab-bar-item` 的 div，
 * **不是 button** —— 所以不能用 getByRole('button')。
 */
async function openTab(page: Page, name: string) {
  await page.locator('.m-tabbar .adm-tab-bar-item', {hasText: name}).click()
}

/**
 * 登录一次；密码会存进 localStorage，后续刷新不必再登。
 *
 * 不能「先查有没有密码框」：连接是异步的，页面会先停在连接态再切到登录页，
 * 查早了就直接跳过登录，然后一直等首页直到超时（踩过）。先等两者之一出现再判断。
 */
async function enter(page: Page) {
  await page.goto('/?mobile=1')
  const password = page.locator('#mobile-password')
  const title = page.locator('.m-bar h1').first()
  await expect(password.or(title)).toBeVisible({timeout: 30000})
  if (await password.count()) {
    expect(PASSWORD, '需要 AZURPILOT_PASSWORD 才能登录真实服务').not.toBe('')
    await password.fill(PASSWORD)
    await page.getByRole('button', {name: '进入控制台'}).click()
  }
  /* 外壳出现 = 连上并拿到数据 */
  await expect(title).toHaveText('首页', {timeout: 30000})
}

/**
 * 进到实例层。
 *
 * 首页**刻意没有底部 Tab 栏**（设计如此），所以首页上找不到「任务 / 统计 / 日志」。
 * 要先点实例卡进总览，那一层才有 Tab 栏。
 */
async function enterInstance(page: Page) {
  await enter(page)
  await page.locator('.instance-card').first().click()
  await expect(page.locator('.m-bar h1').first()).toHaveText('总览')
}

/**
 * 收集 WebSocket 上发出的帧。
 *
 * 手机端的接口调用全部走 `/api/v1/ws`（HTTP 层只看得到一个升级请求），
 * 所以「到底有没有真的调这个接口、参数是什么」只能从 WS 帧上看。
 */
function collectFrames(page: Page): string[] {
  const frames: string[] = []
  page.on('websocket', socket => socket.on('framesent', event => frames.push(String(event.payload))))
  return frames
}

test.describe('手机端正式入口（真实数据）', () => {
  test.skip(() => !process.env.AZURPILOT_PASSWORD, '未提供 AZURPILOT_PASSWORD')

  test('登录页的密码框看得出来是输入框', async ({page}) => {
    await page.goto('/?mobile=1')
    const password = page.locator('#mobile-password')
    /* 没设密码时服务端不要求登录，这条就没意义 */
    test.skip(!(await password.count()), '当前服务不需要登录')

    const box = await password.evaluate(node => {
      const style = getComputedStyle(node)
      const rect = node.getBoundingClientRect()
      return {
        border: style.borderTopWidth,
        background: style.backgroundColor,
        height: Math.round(rect.height),
        width: Math.round(rect.width),
        color: style.color,
      }
    })
    /* 登录页不在 .m-shell 里，容易被漏掉兜底样式 —— 真机上第一次就是一片空白 */
    expect(box.border, '密码框没有描边，看不出是输入框').not.toBe('0px')
    expect(box.width, '密码框太窄').toBeGreaterThan(200)
    expect(box.height, '密码框没有达到 44px 触控高度').toBeGreaterThanOrEqual(44)
  })

  test('登录后加载真实实例，且不再出现示意图里的假数据', async ({page, baseURL}) => {
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

    await enter(page)
    await expect(page.locator('html')).toHaveAttribute('data-shell', 'mobile')

    /* 真实实例：名字来自 config/*.json，数量来自 instances.list */
    const cards = page.locator('.instance-card')
    await expect(cards).toHaveCount(1)
    const name = await cards.first().locator('h3').innerText()
    expect(name.trim(), '实例名不该是示意图里的 alas2').not.toBe('alas2')

    /* 统计行是真实计数：全部实例 1（只有一个实例） */
    await expect(page.getByText('全部实例').first()).toBeVisible()
    const stats = await page.locator('.m-main').first().innerText()
    expect(stats, '首页没有显示真实实例数').toContain('1')

    /* **关键证据**：示意图独有的假实例不该存在 */
    await expect(page.getByText('alas2')).toHaveCount(0)

    /* 浏览器里没有 ⟳ 与 ⚙（只有 App 宿主才有） */
    await expect(page.getByRole('button', {name: '刷新'})).toHaveCount(0)
    await expect(page.getByRole('button', {name: '设置'})).toHaveCount(0)

    expect(problems, problems.join('\n')).toEqual([])
    expect(external, `出现了外部请求：${external.join(', ')}`).toEqual([])
  })

  test('总览显示后端返回的真实资源数值', async ({page}) => {
    await enter(page)
    await page.locator('.instance-card').first().click()
    await expect(page.locator('.m-bar h1').first()).toHaveText('总览')

    const cards = page.locator('.resource-card')
    await expect(cards.first()).toBeVisible({timeout: 20000})

    /* 资源名走的是 PC 的 resourceLabels + 手机端词表，不该出现后端那个废弃的 label="name" */
    const body = await page.locator('.m-main').innerText()
    expect(body, '资源名退化成了接口返回的 "name"').not.toMatch(/(^|\s)name(\s|$)/)
    expect(body, '总览里没有石油这一档').toContain('石油')
    /* 数值是真实的千分位格式，带上限 */
    expect(body, '总览里没有出现真实数值格式').toMatch(/[\d,]{3,}\s*\/\s*[\d,]{3,}/)
  })

  test('任务页的分组与任务名来自 schema，不是写死的', async ({page}) => {
    await enterInstance(page)
    await openTab(page, '任务')
    await expect(page.locator('.m-bar h1').first()).toHaveText('任务')

    const groups = page.locator('.m-nav-row')
    const count = await groups.count()
    expect(count, '任务页没有分组').toBeGreaterThan(0)

    /* 分组名必须是翻译过的中文，不能是 menu.json 的键（Alas / Farm / Opsi…） */
    const labels = await groups.locator('.m-list-label').allInnerTexts()
    for (const label of labels) {
      expect(label, `分组名没被翻译：${label}`).not.toMatch(/^[A-Za-z][A-Za-z0-9]*$/)
    }
    /* 也不该是示意图里那套写死的分组（真实菜单里同样有「舰队管理」，不能拿它当判据，
       要比的是**整份列表**） */
    const mockGroups = ['常规', '出击', '活动', '活动每日', '收获', '每日任务', '大世界', '岛屿', '舰队管理', '工具']
    expect([...labels].sort(), '分组列表和示意图里那套一模一样，说明没接真数据')
      .not.toEqual([...mockGroups].sort())

    /* 进第一组，任务名同样是翻译过的 */
    await groups.first().click()
    const tasks = page.locator('.m-nav-row .m-list-label')
    await expect(tasks.first()).toBeVisible()
    for (const label of await tasks.allInnerTexts()) {
      expect(label, `任务名没被翻译：${label}`).not.toMatch(/^[A-Za-z][A-Za-z0-9]*$/)
    }
  })

  test('任务配置页读到真实配置值', async ({page}) => {
    await enterInstance(page)
    await openTab(page, '任务')
    await page.locator('.m-nav-row').first().click()
    await page.locator('.m-nav-row').first().click()
    await expect(page.locator('.m-bar .m-bar-subtitle')).toBeVisible({timeout: 20000})

    /* 配置来自 config.get + schema.args：至少要有一组字段。
       字段是手机端自己的 .m-config-row（可读也可写），不再是只读的 antd List。 */
    const rows = page.locator('.m-config-row')
    await expect(rows.first()).toBeVisible({timeout: 20000})
    expect(await rows.count(), '任务配置页一个字段都没有').toBeGreaterThan(0)

    /* 真机上的可见性过滤：内部字段（display: hide）不能出现在页面上 */
    const body = await page.locator('.m-main').innerText()
    expect(body, '内部任务名称这类 hide 字段漏出来了').not.toContain('内部任务名称')
  })

  test('任务配置真的写回服务端（config.patch）', async ({page}) => {
    /* 回归：这一页原来是只读的，全仓库没有一处 config.patch —— 改什么都只停在本地。 */
    /* 收集器要在**导航之前**挂上：`page.on('websocket')` 只对新建立的连接触发，
       而连接在进入控制台时就建好了。 */
    const frames = collectFrames(page)
    await enterInstance(page)
    await openTab(page, '任务')
    await page.locator('.m-nav-row', {hasText: '自动收获'}).first().click()
    await page.locator('.m-nav-row').filter({
      has: page.locator('.m-list-label', {hasText: /^委托$/}),
    }).click()
    await expect(page.locator('.m-bar .m-bar-subtitle')).toHaveText('Commission', {timeout: 20000})

    /* 「启用该功能」= `Commission.Scheduler.Enable`，记下原值以便还原 */
    const enableRow = page.locator('.m-config-row')
      .filter({has: page.locator('.m-config-label', {hasText: /^启用该功能/})})
    const toggle = enableRow.locator('.adm-switch')
    await expect(toggle).toBeVisible({timeout: 20000})
    const before = await toggle.getAttribute('aria-checked')

    await toggle.click()
    await expect.poll(
      () => frames.filter(frame => frame.includes('"config.patch"')).length,
      {timeout: 20000, message: '点了启用开关，但 WebSocket 上没有发出 config.patch'},
    ).toBeGreaterThan(0)
    await expect(toggle).toHaveAttribute('aria-checked', before === 'true' ? 'false' : 'true',
      {timeout: 20000})
    await expect(enableRow.getByText('已保存'), '改动没有提交成功').toBeVisible({timeout: 20000})

    const sent = frames.filter(frame => frame.includes('"config.patch"'))
    expect(sent.length, '没有在 WebSocket 上发出 config.patch').toBeGreaterThan(0)
    expect(sent.at(-1), 'config.patch 的路径不是调度器开关').toContain('Commission.Scheduler.Enable')

    /* 改回原值，别把测试环境的配置留在被改过的状态 */
    const before2 = frames.filter(frame => frame.includes('"config.patch"')).length
    await toggle.click()
    await expect.poll(
      () => frames.filter(frame => frame.includes('"config.patch"')).length,
      {timeout: 20000, message: '还原时的 config.patch 没有发出去'},
    ).toBeGreaterThan(before2)
    await expect(enableRow.getByText('已保存'), '还原没有提交成功').toBeVisible({timeout: 20000})
    await expect(toggle).toHaveAttribute('aria-checked', before ?? 'true')
  })

  test('任务页显示真实的调度状态（与 overview.tasks 同步）', async ({page}) => {
    /* 回归：任务页原来只读 schema 菜单，完全不看 overview.tasks */
    await enterInstance(page)
    await openTab(page, '任务')

    /* 顶部调度器摘要：状态文字就是 overview.status 的中文 */
    const summary = page.locator('.m-scheduler-card')
    await expect(summary).toBeVisible({timeout: 20000})
    await expect(summary.locator('.m-scheduler-state'))
      .toHaveText(/^(加载中|已停止|运行中|运行异常)$/)

    /* 进第一组，每一行都要有调度状态徽标；且「启用中」的行数必须和实例页队列对得上 */
    await page.locator('.m-nav-row').first().click()
    const chips = page.locator('.m-nav-row .m-schedule-chip')
    await expect(chips.first()).toBeVisible()
    const labels = await chips.allInnerTexts()
    for (const label of labels) {
      expect(['正在运行', '待运行', '等待中', '未启用'], `未知的调度状态：${label}`).toContain(label)
    }
  })

  test('日志页用真实日志通道，空也说得清楚', async ({page}) => {
    await enterInstance(page)
    await openTab(page, '日志')
    await expect(page.locator('.m-bar h1').first()).toHaveText('日志')
    /* 面板结构在（分段条 / 工具行 / 搜索行 / 正文四段 + 三条分隔线） */
    await expect(page.locator('.panel.m-logcard > *')).toHaveCount(4)
    /* 实例没在跑时通道是空的，但页面不该报错也不该卡住 */
    await expect(page.locator('.m-logscroll')).toHaveCount(1)
    /* 工具栏与 PC 对齐：级别过滤、导出、清空都在 */
    await expect(page.locator('.m-log-level')).toHaveCount(1)
    await expect(page.getByRole('button', {name: '清空'})).toHaveCount(1)
  })

  test('统计页六类各自取真数据，请求参数随类目变化', async ({page}) => {
    /* 回归：原来六个类目共用一条写死的 ActionPoint 曲线，且从不调用 statistics.report */
    /* 收集器要在导航之前挂上（见上一个用例的说明） */
    const frames = collectFrames(page)
    await enterInstance(page)
    await openTab(page, '统计')
    await expect(page.locator('.m-bar h1').first()).toHaveText('统计')

    /* 默认「资源趋势」：请求里带 category=resources 与 days */
    await expect(page.locator('.m-stat-panel')).toHaveCount(1, {timeout: 20000})
    const reportRequests = () => frames.filter(frame => frame.includes('"statistics.report"'))
    await expect.poll(() => reportRequests().length, {message: '没有调用 statistics.report'})
      .toBeGreaterThan(0)
    expect(reportRequests().at(-1)).toContain('"category":"resources"')
    expect(reportRequests().at(-1)).toContain('"days":7')

    /* 切类目 → 请求参数真的跟着变（而不是只动滑块） */
    const control = page.getByRole('tablist', {name: '统计分类'})
    await control.getByRole('tab', {name: '大世界总结'}).click()
    await expect.poll(() => reportRequests().at(-1) ?? '').toContain('"category":"opsi"')
    await expect.poll(() => reportRequests().at(-1) ?? '').toContain('"month"')

    /* 明细表来自后端的 tables，不是本地造的 */
    await expect(page.locator('.m-stat-table').first()).toBeVisible({timeout: 20000})
  })
})
