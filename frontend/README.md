# AzurPilot React 控制台

前端采用 React、TypeScript、Vite 与 React Router。使用「实例和任务导航 → 工作区」两栏布局，采用 Apple 风格的分组布局、系统字体与 Lucide 标准图标，支持移动端折叠菜单。业务通信统一使用 `/api/v1/ws`，不依赖 PyWebIO、Vue 或 Electron。

默认进入主页，点击 AzurPilot 标题或图标也可返回。主页的实例卡片显示运行状态、当前任务与连接信息，点击进入以实例名为标题的总览。顶部导航固定，面包屑中实例名右侧的三角按钮用于快速切换实例，并保留当前任务或统计页面；支持方向键、Home/End 和 Escape。任务配置标题旁的放大镜展开搜索框，默认收起；日志搜索与级别筛选也默认收起，通过滑杆图标切换，筛选生效时图标高亮。

系统设置与更新器均为主页下的全局页面，无实例时仍可访问。主题和语言在系统设置中调整，偏好保存在当前浏览器。语言选择沿用五种现有翻译，切换任务菜单、配置字段和说明，控制台固定文案仍为简体中文。实例自动运行与删除操作在实例总览的设置按钮中；旧实例设置链接重定向至全局系统设置。

更新器展示本地 HEAD、配置分支对应的上游 HEAD、领先/落后数量，以及双方完整可达提交历史。每页 50 条，提交正文可展开。获取更新只获取远程内容，更新按钮复用原有实例停止、依赖同步与监督器重启流程；本地分叉或缺少重启服务时不可应用更新。更新提示显示在顶部导航，点击跳转更新器，无自动弹窗。

配置表单只显示名称和说明，内部路径仍可作为搜索关键词。多行输入位于说明下方并占满宽度，高度随输入内容和自动换行增减，空值或单行只占一行；带 `mode: yaml` 的参数使用按需加载的 CodeMirror 编辑器，提供行号、语法颜色、自动缩进和撤销，颜色随主题切换。

## 界面材质

系统设置提供「浅色」「深色」「简约」三种主题。简约主题包含五套预设主副色，选择后立即生效并保存在当前浏览器。主色用于主要按钮、开关、选中态和图表，副色用于辅助图标和信息；内容面板保留圆角，侧栏与顶栏使用贴边直角。

简约主题的「主题模式」位于配色方案上方，支持自动、浅色、深色。自动模式实时跟随系统外观，预设色块、界面与统计图一同切换；固定模式不受系统变化影响。可添加、编辑和删除自定义方案，每套方案保存一套主副色，浅色与深色通用，支持取色器与 `#RRGGBB` 输入。背景、选中态及按钮文字颜色自动生成，必要时调整主副色明度以保持文字清晰。方案与模式保存在当前浏览器，删除当前自定义方案后回到默认配色。自动模式只使用一个系统事件监听，切回固定模式或经典主题时释放监听，离开简约主题时清理其专属颜色变量。简约主题内切换明暗或配色只更新颜色变量，不加载其他主题资源。

简约主题使用不透明实色，关闭壁纸、毛玻璃、渐变、阴影和装饰动画；分段控件直接标记选中项，不运行装饰滑块的尺寸监听。主题样式由 `src/app/theme.ts` 按需加载，首屏根据已保存的偏好加载对应样式后再挂载页面；切换时替换唯一的主题样式节点，快速切换以最后一次选择为准。玻璃组件及其依赖、壁纸模块仅在浅色或深色主题下动态导入。简约主题不请求外部 `theme.css`，从经典主题切回时移除其样式链接。浏览器可能保留曾访问主题的资源缓存，但旧样式和装饰组件不再参与当前页面渲染。

以下玻璃材质与外部主题定制说明适用于浅色和深色主题。

顶部导航和页面操作栏使用 `liquid-glass-react`，玻璃装饰层不参与点击与键盘交互。表单、日志和统计卡片使用实色背景，保持文字对比度；系统蓝表示主要操作，绿色表示运行状态。深色模式沿用系统设置中的主题选择。

背景默认由 `https://api.yppp.net/api.php` 提供，浏览器每次打开或刷新页面时请求一次，应用内导航复用图片。系统设置可改用图片或视频 URL，也可直接上传图片或视频；URL 偏好保存在 localStorage，上传文件保存在当前浏览器的 IndexedDB（最大 200 MB），不会写入服务端部署配置。视频静音、循环并内联播放。默认随机图片请求不携带页面来源；加载失败时保留渐变底色。减少透明度、高对比度与强制颜色模式隐藏背景并使用实色材质；减少动态效果时不挂载折射组件。Safari 和 Firefox 对第三方库的折射支持有限，会保留基础磨砂效果。

`src/styles/apple.css` 统一导航、工具栏和各页面的视觉样式，`GlassMaterial` 单独封装库的布局适配，`Wallpaper` 负责背景媒体加载与失败降级。

### 表单控件

`src/styles/forms.css` 统一任务配置、系统设置、登录与实例弹窗、统计和日志筛选的表单样式，沿用 `--theme-*` 主题变量及外部 `theme.css`。输入控件采用轻边框、圆角、系统蓝焦点环，错误同时显示红色边框与文字提示；开关实际点击区域为 52×44px，移动端输入和选项标签至少高 44px。

`FormControls.tsx` 提供自定义选择器、复选框与可显隐密码输入框。下拉箭头、勾选、密码显隐及保存状态使用 Lucide 图标；选择菜单使用顶层圆角浮层，提供选中勾、方向键导航、文字查找、Enter 确认、Escape 取消及视口边缘避让；数字步进和日期选择保留浏览器原生行为。多行输入继续自动增减高度，YAML 编辑器保留语法高亮与独立滚动。深色、减少动态效果及强制颜色模式共用这些控件。

新增选择器应使用 `Select`，配置字段继续使用 `FieldInput`，避免各页面单独绘制箭头或勾选图标。`e2e/forms.spec.ts` 验证键盘操作、值类型、密码显隐、错误提示和移动端布局，并生成浅色、深色及移动端截图。

## 手机端

### 两个入口，一份界面

| 入口 | 文件 | 数据 | 用途 |
|---|---|---|---|
| 正式 | `mobile.html` → `src/mobile/main.tsx` | `/api/v1/ws` 真实数据 | 真机 / App 宿主 |
| 评审 | `mobile-mockup.html` → `src/mobile/mockup/main.tsx` | `mockup/data.ts` 假数据 | 改样式时节省得连后端 |

**外壳与全部屏幕只有一份**（`src/mobile/MobileShell.tsx`），它不取数据，只读
`MobileDataContext`（`src/mobile/data.ts`）。两个入口各自把数据塞进这个上下文：

- `mobile/mockup/mockDataSource.tsx` —— 假数据，并集里没有的字段（连接态、登录）不走；
- `mobile/app/liveData.tsx` —— 真实数据：`overview.get` / `logs.get` + `logs` 事件 /
  `statistics.report` / `config.get` + **`config.patch`（写回）** /
  `startup.get`·`startup.set` / `instances.delete`·`instances.create` / `tasks.run`，
  按 `events.subscribe` 的推送更新。

所以评审时改的样式，正式入口会一起变；反过来也一样。改动屏幕组件前先想清楚它读的是哪个字段。

**凡是看得见的功能都必须真的写。** 这一轮把三处「看着能用、其实没接」的补上了，它们也正是
用户报的三个问题：

| 屏幕 | 之前 | 现在 |
|---|---|---|
| 统计 | 六个类目共用一条写死的 `statistics.resources {resource:'ActionPoint'}` 曲线，切类目只动滑块 | `statistics.report {category, days, month, period}`，类目/区间/周期/曲线选择全部进请求；指标与明细表都来自后端 |
| 任务配置 | 只读：`Switch` 只有 `defaultChecked`，其余是纯文本加一个点了没反应的箭头 | 可读可写：走 PC 的 `config/EditQueue` → `config.patch`，开关/下拉/日期/数字/多行各有对应控件，带「待提交 / 提交中 / 已保存 / 提交失败·重试」状态 |
| 任务页 | 只读 schema 菜单，不看 `overview.tasks` —— 哪个任务在队列里、什么时候跑一概看不出来 | 顶部有调度器摘要（状态 + 运行中/待运行/等待中计数），每个任务行右侧有状态徽标，启用中的行第二行显示下次运行时间 |

写路径**不新造**：手机端直接用 PC 的 `config/EditQueue`（模块级单例，键 `config:<实例>`），
所以排队、去重、失败退避重试、`sessionStorage` 草稿、断线后 `resumeEditors()` 恢复、
「启动 / 运行前先等未保存修改排空」（`settled()`）这些行为与 PC 完全一致，两边打开同一实例时
未确认的草稿也落在同一个键上。

> **`config.patch` 不需要 `revision`。** 后端 `config_service.py` 明确忽略它（注释写着「revision
> 仅为旧客户端兼容参数」）；真正用 `revision` 做乐观并发校验的是 `instances.delete`，所以
> 「删除实例」那一步必须先 `config.get` 取一次 `revision`（PC 的 `InstanceActions` 同款）。

正式入口的**连接、实例列表、schema、语言/主题、Toast 全部复用 PC 的 `AppProvider`**
（`src/app/context.tsx`），手机端不重写一套。手机端自己只负责三件事：当前实例（存本地）、
当前任务（进 URL，用来按需拉 `config.get`）、登录页。

> **两个接口字段陷阱**（都踩过）：
> 1. `overview.get` 的 `resources[].label` **不能用** —— 后端是 `configs.translate('X._info.name')`，
>    查不到就退化成路径末段，实测返回字符串 `"name"`。资源名走 `resourceLabel()`
>    （复用 PC `ResourceCards.tsx` 的 `resourceLabels` 表）。
> 2. `instances.list` 的 `server` 是配置里的**原始值**（实测 `cn_android-29`），不是 `cn`；
>    显示交给 schema 翻译 `Emulator.ServerName.*`，PC 首页也是这么做的。
>
> **真实数据是异步的，首帧必须是空的。** `taskGroups` 来自 `schema.get`、`resources` 来自
> `overview.get`，第一帧都还没有。`taskGroups[0].key`、`resources[0]` 这类写法会直接把整页
> 打崩（真机白屏两次都是这个原因）。屏幕组件里对空数组的兜底不是防御性编程，是必需的。

### 连真实数据怎么测

```powershell
# 起服务（25548），然后：
cd frontend
npm run build
$env:AZURPILOT_PASSWORD = '<config/deploy.yaml 里的 Webui.Password>'
npm run test:e2e:mobile:live
```

密码走环境变量，不写进仓库；没设就整组跳过。这份配置打的是**真实服务**（不需要 webServer），
与 `playwright.mockup.config.ts`（vite preview + 假数据）分开。`e2e-mobile/live.spec.ts` 里最有力的
断言是「示意图独有的假数据一个都不能出现」（比如假实例 `alas2`、写死的分组列表），
以及「分组/任务名必须是翻译过的中文，不能是 `menu.json` 的键」。

> **接口调用只能从 WebSocket 帧上看。** 手机端的请求全部走 `/api/v1/ws`，HTTP 层只看得到一个
> 升级请求，所以「到底有没有真的调这个接口、参数是什么」要靠 `page.on('websocket')` 收
> `framesent`。两个坑：收集器必须在**导航之前**挂上（该事件只对新建立的连接触发），
> 断言要用 `expect.poll`（帧是异步到的，直接断言会读到 0）。「配置真的写回服务端」与
> 「统计请求参数随类目变化」两条用例就是这么写的。

> 首页**刻意没有底部 Tab 栏**，所以从首页点不到任务/统计/日志 —— 要先点实例卡进总览。
> Tab 栏是 antd-mobile 的 `TabBar`，渲染成 `.adm-tab-bar-item` 的 **div**，不是 button，
> 测试里不能用 `getByRole('button')`。

手机端**与电脑端共用同一套设计系统**。样式分两层，入口里的加载顺序即层叠顺序：

```
antd-mobile/es/global                      antd-mobile 自身的组件样式
src/styles/tokens.css                      PC 设计令牌 + box-sizing + 元素重置
src/styles/components.css                  .panel / .button / .status / .empty / .field-row …
src/styles/apple.css                       Apple 观感层 + --glass-* 令牌
src/styles/forms.css                       表单控件
src/styles/insights.css                    资源卡与卡片管理（.resource-settings 一族）
src/styles/theme-system.css                --theme-* 契约（含 .panel/.resource-card 的毛玻璃）
src/mobile/mobile.css                      ← 手机端布局层，必须最后加载
```

所以手机端页面里的卡片、按钮、状态徽标、空态、表单字段**直接用 PC 的类名**，不去另画一套。`mobile.css` 只负责 PC 完全没有的东西：固定的页眉与底部 Tab 栏、安全区让位、整屏自适应、长列表虚拟化、宽表在窄屏的替代，以及把手机端必须放大的触控目标补到 44px。

刻意**不引** `layout.css` / `home.css`（PC 侧栏外壳与页面专用，手机端一件都用不到）；`dev.css` 由组件测试页按需加载。

> **耦合说明**：改 PC 的 `components.css` / `apple.css` / `insights.css` / `theme-system.css` 会同时影响手机端 —— 这是「组件换成 PC 的」的必然代价。需要只改手机端时，一律用 `[data-shell='mobile']` 前缀把规则限定住。
>
> **已知的泄漏点与处理**：PC 的 `tokens.css` 是给 PC 表单写的**全局元素规则** —— `input/select/textarea { border; border-radius: 7px; padding: 10px 12px; background: var(--surface) }` 与 `input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px … }`。这些规则会作用到 **antd-mobile 组件内部的 input**：组件自己已经画了一层输入框，PC 那层再叠上去就成了「框里还有个框」，聚焦时外面还多一圈蓝光（搜索框最明显）。`mobile.css` 里把 `[class^='adm-'] input`（含 `[class*=' adm-']`）一律还原成无样式，`input:focus` 的描边与 focus ring 也一并压掉；同样地，手机端那条「裸控件最小 44px」只作用于 `:not([class*='adm-'])`，免得把组件内部的输入框撑高、把文字挤到图标上。
>
> 引入 PC 样式栈后如果发现某个 antd 组件「多了个框」，先怀疑这条全局元素规则。

### 列表与行样式

两套行样式，按内容厚度选：

- **分组列表**（实例页的调度队列）：一屏一个卡片（`.m-list`），行与行用发丝线分隔（`.m-list-row + .m-list-row`），段落标题右侧带计数徽标（`.m-count-badge`）；某一组为空时给一张居中空态卡（`.m-empty-card`，标题 + 说明），而不是一行灰字。
- **逐行卡片**（任务分组、组内任务）：一行一张卡（`.panel.m-nav-row`），靠 `.m-stack` 的间距留出呼吸感。

两者都**不放行首图标** —— 图标一多画面就吵，层级靠字号与颜色就够（`.m-list-label` 16px 常规字重、`.m-list-sub` 13px 弱化）。

文字不贴边：行内边距 ≥10/16px、最小行高 48px（`--m-row-height`）；行内正文用 `.m-list-body` 撑开，把行尾的动作按钮（如调度队列的「立即执行」）推到最右。**不要给正文写 `all: unset`** —— 那会把 `flex: 1` 一起抹掉，按钮就会紧贴在文字后面。

> **行内不放第二列数字。** 任务分组行曾经在中间放一个条数（`.m-list-count`），结果 `justify-content: space-between` 把它推到行中央，配上 56px 行高看着像三行文字。现在分组行与组内任务行都只有「左边文字 + 右边箭头」两个子元素，`.m-nav-row .m-list-label` 用 `flex: 1` 吃掉中间的空档；条数改由段落标题右侧的 `.m-count-badge` 承担（`e2e-mobile/mockup.spec.ts` 断言 `node.children.length === 2` 且行高落在 44–50px）。

### 搜索框

搜索框对齐系统设置：胶囊全圆角、**比页面底色深一档的灰底**、左侧放大镜、46px 高，**且聚焦时不换底色也不描边**（antd 默认的激活态是白底 + 主色边框，那个观感不对）。

- 底色与前景各有一个手机端专用令牌：`--m-search-bg` / `--m-search-fg`（亮色 `#e3e3e6` / `#5c5c61` = 5.19:1，深色 `#2a2a2c` / `#aaaab0` = 6.20:1）。**不能复用 `--muted`** —— `#6e6e73` 压在 `#e3e3e6` 上只有 3.96:1，不达 AA。
- **必须在搜索栏作用域内改写 `--adm-color-light`。** antd 的放大镜用 `color: var(--adm-color-light)`（默认 `#ccc`，压在这个深灰底上只有 1.25:1），聚焦态还有一条三重类的 `.adm-search-bar-active .adm-input.adm-input.adm-input` 把占位符也拉回同一个令牌。这两条选择器与 `mobile.css` 里同分的规则在**同一个 chunk 中排在 mobile.css 之后**，拼特异度不划算；改写令牌让整棵子树继承深灰前景色，一次覆盖放大镜、占位符和清除按钮。图标规则另外多带一层 `.adm-search-bar-input-box` 把特异度抬到 `(0,4,0)`，`font-size: 20px` 才落得下去。
- 任务页的搜索**分两段**：命中的分组（`.m-section-title`「分组」）与命中的任务（「任务」，每条标出所属分组）。只搜分组名会漏掉「我记不住任务在哪个组」这个最常见的场景。`theme.test.ts` 的 `search field` 一档直接读 `mobile.css` 取令牌算对比度，并断言那条 `--adm-color-light` 覆盖还在。
- 抽屉里的「搜索」是**导航项，不是搜索框**：点它直接跳到任务页，不自动聚焦（突然弹键盘很突兀）。

### 首页实例卡

首页的实例卡与 PC 首页**同构**，也用组件测试第 8 区那张预览卡的同款类名：`.instance-card.panel` + `.instance-card-heading`（`.home-instance-icon` + `.status`）+ `<h3>` + `.instance-device` + `.instance-card-footer`。

> **`.panel` 一点内边距都没有。** `components.css` 里的 `.panel` 只给背景、边框、圆角、阴影 —— PC 是靠 apple.css 的 `.instance-card {padding: 26px}` 撑开的，而 `.instance-card-heading` / `.instance-device` / `.instance-card-footer` 的排布**全写在 `home.css` 里，手机端的样式栈不含这个文件**。少了补齐的这段，卡片会退化成「文字图标贴着边框、状态徽标掉到图标下面、`ADB127.0.0.1:5555` 连成一片」—— 组件测试那张预览卡之前就是这样。补齐的规则在 `mobile.css` 的「实例卡」一节，两边共用，所以一起变对。

- PC 的 padding 是 26px（窄屏媒体查询里 24px），桌面尺度；手机端按 12px 圆角的节奏收到 **16px**。这条就是「文字与图标不贴边」的那一条，E2E 断言 ≥14px，并逐项断言图标与实例名的左内距。
- **黄金比例**：卡片不通栏，宽 `min(315px, 100%)`、`aspect-ratio: 1.618 / 1`（315 → 高 194.7），左右居中留白。用 `aspect-ratio` 而不是写死高度，窗口更窄时整卡等比缩小、比例不变；多出来的那点余量由 `.m-instance-open` 的 flex 列 + 页脚 `margin-top: auto` 吸收，页脚永远贴底。E2E 断言宽度为 315 且宽高比 ≈1.618。
- 整卡是一个 `<a>`（`href` 指向 `?screen=overview`）：内容模型合法、可键盘激活、长按还能新开标签。`⋯` 是它的**兄弟**节点、绝对定位在卡片右侧 —— 交互元素不能嵌套，所以没有把按钮塞进按钮里（`::after` 把 32px 的视觉尺寸撑成 44px 触控目标）。
- **状态徽标贴右上角（与图标同一行），`⋯` 落在徽标下方**并保持右对齐：头部 `align-items: flex-start` + 徽标 `margin-left: auto`；`⋯` 用绝对定位 `top: 40px; right: 10px`。头部因此要 `min-height: 56px` 给 `⋯` 留出竖直空间，否则它会压到下面的实例名（E2E 断言 `⋯` 底边 ≤ 实例名顶边）。`⋯` 的位置对调过一次（先是 `⋯` 在角上、徽标在下），改动时记得同时调整头部的预留高度。
- 这条 `width/height: 32px` 必须写成 `[data-shell='mobile'] .icon-button.m-instance-more`（0,3,0）：下面「触控尺寸」那节有一条同分但更靠后的 `.icon-button`，只写 `.m-instance-more` 会被顶回 44px —— `⋯` 会往下多占 12px，把实例名压住（先是踩了这个坑，E2E 的 `moreBottom <= nameTop` 就是为它写的）。同理 `.button.m-home-new`。
- 卡片是 `aspect-ratio` 定高的，**内容溢出不会把卡片撑高，而是直接溢出去**（黄金比例就不成立了）。所以 E2E 还断言 `scrollHeight <= clientHeight`。往卡里加内容时要一起看这条。
- 让位/尺寸这类覆盖**只挂在 `.m-instance-card` 上**，不要写进 `.instance-card-heading` 这类共用选择器 —— 组件测试第 8 区那张预览卡用的是同一套类名，它没有 `⋯`，共用会让它的徽标被白白推进去。

### 日志页

四段（分段条 / 视图工具行 / 搜索行 / 日志正文）**同在一个 `.panel` 里**，靠 `border-bottom`
的发丝线分开，圆角由 `.panel` 的 `overflow: hidden` 裁掉 —— 之前是「一个分段框 + 一张日志卡」
两个盒子，看着散。每段自带内边距：`.panel` 自己没有 padding，正文那 16px 来自 `.m-logscroll`，
改之前滚动区一点内边距都没有，文字距离边框只有 1px。

工具行与 PC 的 `LogPanel` 对齐：**自动滚动开关 / 级别过滤 / 关键字搜索 / 导出 txt / 清空当前视图**。
分两行是因为 360dp 上「自动滚动 + 开关 + 级别 + 导出 + 清空 + 搜索框」一行放不下：第一行放视图与
过滤，第二行放搜索。导出与清空**用图标而不是文字** —— 文字版会被挤成竖排的「导 / 出」两行，
整个工具行高得离谱（真机上量过）。

日志行**直接挂 PC 的 `LogLine` 组件**（`components/LogPanel.tsx` 里是 `export` 的），不是手机端重画一遍：

- 顺序、DOM 与配色全部与 PC 同源：`.log-line.log-entry-line.level-*` > `.log-lvl.lvl-*` + `.log-ts` + `.log-divider` + `.log-msg`，即**级别 → 时间 → │ → 正文**；颜色走 `theme-system.css` 的 `--theme-log-*`（info `#0ea5e9`、warning `#eab308`、error `#ef4444`、debug `#85929e`、critical `#f43f5e`）。这两张表手机端本来就加载，所以不必重画。
- 假数据是 `LogEntry {id, level, text}`，`text` 用 PC 的真实行格式 `LEVEL  时间 │ 正文`。`data.test.ts` 拿 PC 的 `LOG_LINE_RE` 逐行验证 —— 格式跑偏就会整片退化成「原始行」样式、级别也不上色。级别**必须是大写**：后端 `runtime_service.logs()` 是用 `re.search(r'\b(DEBUG|INFO|WARNING|ERROR|CRITICAL)\b')` 从正文里提出来的，给小写的话真机上按级别过滤会全部落空（假数据曾经就是小写，测试还把它固化了）。
- `.log-lvl` 的宽度用 **`8ch`** 而不是 PC 的 60px：一列要正好装下最长的级别名 `CRITICAL`，**时间列才会对齐**；给窄了 `WARNING` / `CRITICAL` 会把时间往右顶，整列看着是歪的。E2E 断言前 60 行的时间列只有一个左起点。

**合并规则与 PC 的 `LogPanel` 逐字一致**（`src/mobile/logs.ts` 的 `mergeLogs`，有单元测试）：
按 `id` 用 Map 去重、按 `id` 排序、`slice(-400)`，`reset` 时才整段替换。直接
`[...previous, ...entries]` 会把重叠段重复追加（`logs.get` 与 2 秒一次的推送必然重叠，
切到截图 tab 重订阅会再重复一次），后端裁剪缓冲那一次还会让区间回退，结果是**重复行 + 整段乱序**。

**「清空」是本地 floor，不是真清空** —— 后端没有清空接口（PC 也一样）。配套的
`logsCursor` 判据必须留着：游标比上一轮小说明 API 进程重启过、`id` 从 1 重算，
此时 floor 要归零，否则新日志的 id 永远小于 floor，页面是一片空白。

**行高按内容算，不再写死 18px。** rich 会把超过约 151 列的正文 fold 成多行，回溯信息
（traceback）本身就是多行，`logger.hr` 的分割线行还带外边距 —— 按定高渲染这些行会**溢出并与
下一行叠字**。所以：行高 = 内容行数 × `LOG_ROW_HEIGHT`（多行条目再加 4px 呼吸），虚拟化换成
`useVirtualRows`（前缀和 + 二分定位）。假日志里刻意塞了多行回溯与分割线行，`data.test.ts`
断言这两类必须在场，否则这个分支永远评审不到。

- 日志行仍然是**不折行 + 横向滚动**（PC 的 `.log-content` 本身也有 `overflow: auto`），
  级别、时间、正文三列宽度与 PC 完全一致，一个字符都不截；长消息横向滑一下看全。
  - 一开始试的是「单行 + 省略号」，在 412px 视口上看不出问题，但真机 360dp 上时间戳加级别就吃掉 45% 宽度，**几乎每一行都被截断**。E2E 因此把这条断言放在 `setViewportSize(360×800)` 下跑：`scrollWidth <= clientWidth + 1`（没被截）且容器有横向滚动余量。
  - 横向滚动需要 `.m-virtual` / `.m-virtual-window` / `.log-entry-line` 都写 `width: max-content`（**不要 `min-width: 100%`**，百分比 min-width 在 `max-content` 容器上是循环依赖），并把 PC 给 `.log-msg` 的 `flex: 1` 与 `word-break: break-all` 还原 —— 那两个都会把行压回容器宽度，横向滚动就没内容可滚了。

### 任务页：与调度器同步

后端的 `overview.tasks` **只包含已启用的任务**（`<Task>.Scheduler.Enable` 为真，或此刻正在跑
那一个），所以「不在表里」就等于「没被调度器接管」。任务页据此：

- 顶部一张**调度器摘要卡**（`SchedulerCard`，总览页也挂同一张）：状态文字用 `overview.status`，
  三个计数是 `overview.tasks` 按 `state` 分组的真实条数 —— 语义与 PC 的右栏 `RightRail` 相同；
- **任务行右侧一枚状态徽标**（正在运行 / 待运行 / 等待中 / 未启用），启用中的行第二行显示
  下次运行时间，未启用的行显示任务键；
- 分组行**保持「左文字 + 右箭头」两样东西**，不放计数 —— 中间塞数量会把行撑高、也不好读。
  调度状态全部落在任务行上。

`state` 一律用后端给的值，不自己推断（原先实例页用「`nextRun` 是否为空」猜运行中，语义正好反了）。

### 任务配置页：可读也可写

一行一个字段，左说明（标签 + 细则，最多三行）、右控件；控件一律 ≥44px 触控高度。
控件按 schema 的类型分派（`src/mobile/components/ConfigField.tsx`）：

| 类型 | 控件 | 提交时机 |
|---|---|---|
| `checkbox` / `bool` | antd-mobile `Switch` | 点一下即提交 |
| 有 `option` 的 `select` | 可点行 + 弹层选择 | 选中即提交 |
| `multiselect` | 一排 chip | 点一下即提交 |
| `datetime` | 原生 `datetime-local`（带系统选择器），**单独占一行** | 改变即提交 |
| `textarea` / `task_priority` / `yaml` | `TextArea` | **失焦**提交 |
| 数字 / 文本 | `input` | **失焦或回车**提交 |
| `storage` | JSON 预览 + 「清空」（写 `{}`） | 点「清空」即提交 |
| 只读（`display: disabled\|readonly\|display`，或类型是 `stored`/`state`/`lock`） | 纯文本 + 「只读」标记 | —— |

文本类之所以用本地草稿 + 失焦提交：手机上每敲一个字符发一次 WebSocket 请求既费流量也没意义
（PC 有队列把连续输入合并掉，手机端没有那个必要）。数值的中间态（空串、`-`、`1.`）由 PC 的
`prepareValue` 判定，格式不对就**留在本地、不进网络**，行内显示可点重试的「提交失败」。

顶部有搜索框（PC 的配置页也有）与分组锚点 chip —— 配置动辄二十来个字段，没有锚点只能一路盲滚。
可见性复用 PC 的 `isFieldVisible`：`display: hide` 与空 `storage` 不出现，真机上「内部任务名称」
「服务器刷新时间」这类内部字段就不会漏出来。**工具类任务（menu 的 `page: tool`）没有
`Scheduler.Enable`，不进队列，配置页底部给一个「运行工具」按钮**；它必须也出现在「没有可配置项」
的分支里 —— 工具本来就可能一个可调字段都没有（舰队扫描只有一块空的存储空间）。

### 「面」的阴影，按钮除外

PC 的 `--theme-shadow-panel` 只有 `0 8px 32px rgba(29,29,31,.03)`，在小屏上几乎看不出起伏，卡片和页面底色糊成一片。手机端换成 `--m-card-shadow`（贴着的一层 + 收近的扩散，深色另有更重的一档），作用在 `.panel` / `.resource-card` / `.summary-metrics section` / `.instance-card` / `.m-nav-row` / `.m-list` / `.monitor-segmented` 上。

**按钮不在这张表里** —— apple.css 已经把 `.button.primary` 的 `box-shadow` 压成 `none`，两处保持一致。要加阴影时别顺手把 `.button` 加进去。底部弹出层 `.m-sheet-body` 单独用**朝上**的投影，朝下的那份在贴底的抽屉上完全看不见。

首页的「新建实例」**单独占一行、落在「实例 (N)」标题下方**（`Section` 的 `action` 槽位；`trailing` 会贴在标题同一行右侧，那样按钮的上沿会顶到上面那排统计）。视觉收到 30px（PC 的 `.button` 是 40px 高、`0 17px` 内边距，摆在 13px 的段落标题旁边太重），但**触控目标仍是 44px**：`::after` 用 `inset: -7px -6px` 把可点区域向外撑开，不占布局。选择器必须写成 `[data-shell='mobile'] .button.m-home-new`（0,3,0）—— 下面「触控尺寸」那节有一条同分但更靠后的 `.button {height: min-height: var(--m-tap-min)}`，只写 `.m-home-new` 会被它顶回 44px。E2E 断言按钮顶边比统计行底边低 ≥8px。

### 分段控件

PC 的分段控件是「胶囊容器 + 滑块 + 选中项只改字色」，在手机上还会多出一圈聚焦描边，看着没做完。手机端改成**每项各成一块实心块**：选中项铺强调色 + 白字，未选中项透明 + 弱化字色，整条装在一个完整的浅色框里 —— 这就是「整框」。同时只保留 `:focus-visible` 的键盘聚焦描边，指针点按不再留蓝环。

### 圆角与字重

PC 的 `--theme-radius-panel` 是 **26px**、`--theme-radius-card` 24px —— 那是桌面尺度，在 360dp 上显得过圆、也不像手机系统。手机端在 `[data-shell='mobile']` 作用域内覆盖成 12px（选择器特异性与 `theme-system.css` 的 `:root` 相同，靠后加载生效）。

统计页的数值一律**常规字重**（`.m-stat-*`），靠字号与留白分层，不加粗。

### 统计页：一个面板，六类各取各的数据

数据来自**唯一一个真接口** `statistics.report`（PC 的统计页也只用它），查询条件与 PC 逐项对应：
`resources` 给回溯天数（1/7/30/90/365），`action`/`opsi`/`commission` 给月份，`commission` 多一个
周期。**不要退回 `statistics.resources`** —— 那个接口一次只能取一种资源（手机端原先写死
`ActionPoint`，于是六个类目画的都是同一条行动力曲线），而且它给不出 metrics / tables。

整页只有**一个面板**，内部用发丝线分段（查询条件 / 指标 / 趋势 / 明细表）。原先四块内容各占一个
独立小盒子，一屏叠四五个边框，视觉噪音很大；PC 的统计页也是「外层一个大面板 + 内部用分隔线分段」
的结构，手机端照这个来。段的个数随类目变：`resources` 没有指标也没有表格（两段），
`opsi` 没有曲线（指标 + 表格），这些都是后端给的形状，前端不补空盒子。

窄屏上的取舍：曲线**一次只画一条**（PC 用下拉选指标，这里用一排 chip，`role="group"` + `aria-pressed`），
分桶复用 PC 的 `aggregatePoints`（按真实时间分桶，取桶的**收盘值** —— 与 PC 的 `StatisticsChart`
取 `item.close` 一致；默认「每小时」而不是「每条记录」，手写 SVG 画不了几千个原始点）；
明细表是自己画的窄屏表格（横向滚动、25 行一页、能搜索、能导出 CSV，算法与分页口径与 PC 的
`StatisticsTable` 相同）。

> 统计分类条（6 项）在真机 1080px/2.75 ≈ 393dp 上**一行放不下**，而分段控件不能折行（折行会让
> 滑块定位错乱），所以 `.m-segmented-bar` 自己横向滚动 + `scrollbar-width: none`，
> 内容用 `min-width: max-content` 撑开自然宽度，不然会被压到容器宽度以内、根本滚不动。

### 进入方式

服务端按 UA 分流，同一个地址对手机和电脑返回不同页面：

| 访问 | 结果 |
| --- | --- |
| 手机 UA 打开 `/` | `mobile.html` |
| 电脑 UA 打开 `/` | `index.html` |
| `/mobile.html`、`/mobile-mockup.html` | 始终直接打开，不写 Cookie |
| `?pc=1` | 强制电脑版，并把选择写入 Cookie（一年） |
| `?mobile=1` | 强制手机版，并把选择写入 Cookie（一年） |

Cookie 名为 `azurpilot.shell`，响应带 `Vary: User-Agent, Cookie`，所以 CDN 或反向代理不会把两个版本串起来。判定逻辑在 `module/api/static.py`，纯函数有单测覆盖（`tests/test_frontend_static.py`）。

> **`?pc=1` 之后界面上没有回手机端的入口。** 「关于」里的「进入电脑版」已按产品要求删除，抽屉里也没有该选项。回程只能手输 `?mobile=1`，或清除 `azurpilot.shell` Cookie。这是刻意取舍，不是遗漏。

### 结构与隐私

`mobile.html` 不加载统计脚本、不请求外部字体、也不请求 PC 首页那张 `api.yppp.net` 背景图 —— 除同源外零网络请求，且由 `e2e-mobile/mockup.spec.ts` 逐条断言。`viewport-fit=cover` 配合 `env(safe-area-inset-*)` 让内容铺到刘海与手势条区域。

页面结构：`/` 实例列表（无底部 Tab）· `/i/:instance/{overview,instance,tasks,stats,logs}`（有底部 Tab）· **任务分组列表**是「任务」段下的第二层（仍是列表，保留 Tab 栏）· 任务配置与设置是全屏推入页（盖住 Tab 栏）· `/dev` 组件测试页只在开发者模式可达。

页眉与 Tab 栏都是 `position: fixed`，骨架 `.m-shell` 用 `--m-bar-h` / `--m-tab-h` 让出同位高度。日志页额外挂 `data-fixed="on"`：整页不滚动，由 `.m-logscroll` 自己滚 —— 400 行日志不会再把页面一直往下撑。

`⟳` 与 `⚙` **只在 App 宿主内出现**（`isAppHost`），普通浏览器里设置页不可达 —— 这条判定收在 `ShellBar` 内部，调用方即使把回调传进来也不会渲染。开发者模式入口是连点抽屉品牌 logo 十次，复用 PC 的 `recordDevLogoClick`。

抽屉用 antd 的 `List`，行的箭头由 `List.Item clickable` 自己画。**不要在 `extra` 里再放一个 `ChevronRight`** —— 「外观」「语言」两行因此曾经并排出现两个箭头。`extra` 只放当前值（浅色 / 简体中文）。E2E 按图标数断言每行恰好 2 个 svg（前缀 + 一个箭头）。

### 毛玻璃常驻栏

页眉与 Tab 栏照搬 PC `.topbar` 的结构：透明底 + 一层 `.glass-material` + `--glass-edge` 描边 + `--glass-shadow`。玻璃本身由 PC 的类提供（`background: var(--theme-glass)` + `backdrop-filter`），深色自动跟着 `--glass-tint` 走。

**刻意不引 `liquid-glass-react` 的折射镜头**：那是 174 kB 的 WebGL/SVG 位移层，压在一个 fixed 页眉上会拖累中低端安卓的滚动。毛玻璃观感用 CSS 就够。

### 配色与对比度

令牌全部来自 PC：亮色 `--accent #0071e3` / `--bg #f5f5f7` / `--surface #fff` / `--muted #6e6e73`，深色 `--accent #64aaff` / `--bg #161618` / `--surface #242426`。**手机端不再自有色阶**（原先那条玫红色阶已整体删除）。

页眉与 Tab 栏是半透明的，所以 `theme.test.ts` 先把 `--glass-tint` 按 alpha **合成**到页面底色上，再拿合成后的颜色算对比度 —— 直接拿 `#ffffffb8` 去比会得到偏乐观的结果。合成后亮色玻璃是 `#fcfcfd`、深色是 `#222224`，六个文字角色（条上的 text/muted/accent、卡片上的三档）逐项断言 ≥4.5:1。

### 状态徽标的取舍

PC 的 `.status` 取值在手机上**不达标**：`running` 的 `--green #248a3d` 压在 `--green-soft #eaf6ed` 上只有 3.96:1，`updating` 的 `#997000` 压在 `#fff3cd` 上 3.98:1，`error` 的 `#c9342c` 压在 10% 红底上 4.52:1（临界）。而且 `--theme-warning-soft` 在 PC 里根本没有深色覆盖，深色下会是一块浅黄底。

因此手机端保留 PC 的 `.status` **类名与标记**，但在 `[data-shell='mobile']` 作用域内把四档的前景与底色都换成达标取值（`mobile.css` 的 `--m-status-*`，同源副本在 `theme.ts` 的 `STATUS_COLORS`，由 `theme.test.ts` 断言）。**PC 那份没有改动**，问题记录在这里。

同样出于这个原因，`--accent` 压在 `--accent-soft` 上只有 4.15:1，这是 PC 侧的既有问题，本次只报告不改。

### 资源卡与卡片管理

资源卡用 PC 的 `.resource-card`（自带毛玻璃、描边与 `--theme-radius-card` 圆角）与 PC 的 webp 图标（`src/mobile/components/resourceIcons.tsx` 与 PC 同源；PC 那份未导出，且其模块依赖 PC 的 AppProvider，无法直接 import）。手机端只把它排成一行：

```
[图标] 资源名                4,844
       记录于 3 分钟前       / 12,200
```

加粗主值在最右、垂直居中；细则（上限或行动力的未开箱总量）减小字号排在它下面。

卡片管理按 PC 的 `ResourceSettings` 重做：已选卡片可拖动排序 + ✕ 移除 + 「添加卡片」选择器 + 「恢复默认」，默认四张与 PC 的 `defaultResourceKeys` 一致。**拖动改用指针事件** —— PC 用的 HTML5 拖放（`draggable` + dragstart/drop）在触屏浏览器上根本不触发，这正是原先「卡片管理中不能拖动」的原因。排序算法与 PC 的 `move()` 逐字一致，存储键也沿用 PC 的 `azurpilot.resources.<实例>`，**与电脑端互通**。

### 组件测试页

`src/mobile/dev/` 是手机端的「开发者 · 控件预览」，**分区、标题、文案逐项对齐 PC 的 `pages/DevControls.tsx`**：分区清单在 `dev/sections.ts`（由 `sections.test.ts` 断言与 PC 一致），11 个分区的标题直接复用 PC 的 `developer.*` 文案键（定义在 `i18n.dev.ts`，5 种语言齐全，手机端 translator 本就会回落到 PC 词表），并直接加载 PC 的 `dev.css`。整页 `lazy()` 加载，PC 的 `dev.css` 与 CodeMirror 都切进独立 chunk。

与 PC 的三处差异，都是能力边界决定的：

1. PC 的 `ui.tsx` 组件（`Modal` / `Empty` / `ErrorBox` / `Loading` / `StatusBadge`）与 `YamlEditor` 都硬绑 PC 的 `useApp()`，无法 import；手机端用**同样的类名与同样的标记**渲染等价结构，外观由 PC 的 styles 提供。
2. 视觉效果实验室用原生 `backdrop-filter` 而不是 `liquid-glass-react`（理由同上）。
3. 数据表格在 360dp 上会横向撑破，改用 PC 令牌画的卡片行。

`src/mobile/components/YamlField.tsx` 是与 PC `YamlEditor` 同配置的编辑器，区别只有一个：标题走 prop 而不是 `useApp()`。这二十来行扩展配置是**刻意与 PC 重复**的 —— 另一种做法要改 PC 源码，而本轮边界是一条 PC 文件都不动。

### 长列表

`src/mobile/virtual.ts` 有两套虚拟化，按「行高是否一致」选：

- `useVirtualWindow(count, rowHeight)` —— **等高**行，用下标整除定位。任务列表用它。
- `useVirtualRows(heights)` —— **变高**行，先算前缀和再二分定位。日志用它，因为多行回溯与
  `logger.hr` 的分割线行装不进定高行（详见「日志页」那节）。

两者都有两种滚动来源：`window`（页面在滚，用 `rect.top` 算已滚距离）与 `container`（日志页整屏
自适应，读容器的 `scrollTop`）。不到 50 行的列表直接全量渲染，不为炫技而虚拟化 —— 任务分组只有
10 行，就不走虚拟化。窗口在**行数变化时也要重新量一次**（新日志进来、列表被清空），所以滚动监听
的 effect 依赖里带着 `count` / `prefix`，不能只挂一次。

### 已知取舍

- **不引外部字体**：设计工具建议的 Fira Code / Fira Sans 被否掉，改用 PC 的系统字体栈，以维持「除同源外零请求」。
- **不引动效库**：没有 GSAP 之类的页面转场，过渡只用 CSS。
- **字号用 px**：不随系统动态字号缩放，与 PC 一致；靠 `--m-*` 尺寸令牌统一调整。
- **手机端多背约 90 kB CSS（约 17 kB gzip）**，换来与 PC 同一套设计系统。
- **`mobile-mockup.html` 是评审用的临时入口**，渲染假数据。它的配置夹具只覆盖 4 个代表性任务
  （`Alas` / `Commission` / `Restart` / `FleetScan`，覆盖开关、下拉、数字、多行、日期、存储、
  只读、hide 与工具任务），其余任务在示意图里会显示「没有可配置项」—— 真机上它们是有配置的。
  全量 96 个任务的 `args.json` 有 410 KB，搬进前端夹具不划算。真机验证一律走 `e2e-mobile/live.spec.ts`。

## 启动

需要 Python 3.14、uv，以及 Node.js 22.12 或更高版本（推荐 Node.js 24）。在仓库根目录运行：

```powershell
uv sync --frozen
npm ci --prefix frontend
npm run build --prefix frontend
uv run python gui.py --host 127.0.0.1 --port 22267
```

浏览器打开 `http://127.0.0.1:22267`。不指定端口时沿用 `config/deploy.yaml` 的 `WebuiPort`，代码默认值为 25548。首次使用可从默认模板创建实例，再设置模拟器序列号、服务器及需要启用的任务。

`gui.py` 会检查前端源码摘要，缺少产物或源码有变化时自动执行 `npm ci` 和构建。Docker 通过多阶段构建预装静态产物，并在最终镜像中保留 Node.js 24 与 npm；挂载源码或容器内自动更新后，可在启动时重新构建前端。

## 开发

后端：

```powershell
uv run python gui.py --host 127.0.0.1 --port 22267
```

另一个终端：

```powershell
cd frontend
npm run dev
```

浏览器打开 `http://127.0.0.1:5173`。Vite 将 WebSocket 代理到 22267；其他端口可设置 `AZURPILOT_BACKEND=http://127.0.0.1:实际端口`。代理保留 Host，使浏览器来源校验仍然有效。

## 独立前端模拟服务

只需 Node.js 和前端依赖，无需 Python、ADB 或模拟器：

```powershell
npm ci --prefix frontend
npm run dev:mock --prefix frontend
```

打开 `http://127.0.0.1:5173`。此命令同时启动 Vite 和监听 `127.0.0.1:22392` 的 mock server，按 Ctrl+C 一并退出。也可单独运行 `npm run mock --prefix frontend`，另开终端执行 `npm run dev --prefix frontend -- --mode mock`。mock 模式始终代理到模拟服务，不使用 `AZURPILOT_BACKEND`。

若 5173 已被占用，可执行 `npm run dev:mock --prefix frontend -- --port 5175` 更换页面端口。

模拟服务从公开的 `args.json`、`menu.json`、翻译文件和 `template.json` 读取元数据，所有实例、部署设置和日志写入只存在内存，重启即重置；不读取或修改用户配置、不启动游戏进程。它使用真实 WebSocket 信封和生成的参数契约，覆盖实例创建/复制/删除、配置字段合并与校验错误、模拟启停、日志订阅、预览、统计和启动偏好。

默认包含 `demo-main`（正常数据）、`demo-alt`（不同连接与空统计）和 `demo-error`（错误状态与无截图）。预览是 1280×720 的 SVG 测试图；运行中的实例每三秒产生一条日志。此服务用于验证前端交互，真实运行、完整业务校验和安全策略仍以 Python API 测试为准。

可在启动前设置以下环境变量：

| 变量 | 用途 |
| --- | --- |
| `AZURPILOT_MOCK_PORT` | 修改模拟服务端口，默认 22392；Vite 自动使用相同端口 |
| `AZURPILOT_MOCK_PASSWORD` | 设置测试密码，验证登录和重连；默认无需认证 |
| `AZURPILOT_MOCK_SCENARIO=empty` | 从零实例开始，测试欢迎页和首次创建 |

浏览器刷新保留本次模拟服务的数据。两个标签页可直接保存各自修改的字段，无关字段互不覆盖；同字段按服务端接收顺序写入。输入立即提交，断线时保留草稿并在重连后自动保存；格式错误保留输入并在字段下方提示。

## 目录职责

| 目录 | 职责 |
| --- | --- |
| `src/api/client.ts` | 连接、认证、心跳、请求关联、超时和重连 |
| `src/api/generated.ts` | 从 Python 模型生成的方法参数类型 |
| `src/api/contract.json` | 版本化参数 JSON Schema |
| `src/api/types.ts` | 响应数据及页面领域类型 |
| `src/config` | 跨页面字段保存队列、草稿恢复、重试与数值输入校验 |
| `src/app` | 应用布局、连接状态、共享元数据 |
| `src/components` | 可复用表单、弹窗、空状态等 |
| `src/pages` | 总览、配置、分类统计和系统设置 |
| `src/mobile` | 手机端外壳与页面（布局层；设计令牌与组件外观来自 PC 的 `src/styles`） |
| `src/mobile/dev` | 组件测试页，分区与文案对齐 PC 的 `pages/DevControls.tsx`，按需加载 |
| `src/styles` | 设计变量、布局、组件样式（**电脑端与手机端共用**） |
| `e2e` | 连接真实测试 API 的 PC 浏览器回归（`npm run test:e2e`） |
| `e2e-mobile` | 手机端回归：`mockup.spec.ts` 是纯前端示意图，`live.spec.ts` 打真实服务；**独立目录**，不会被 PC 的 `test:e2e` 拉进来 |
| `mock` | 独立的内存模拟服务及状态测试 |
| `../module/api` | 协议、认证会话、路由、业务适配与前后端 UA 分流 |
| `../module/runtime` | 独立于界面的进程、OCR、更新与认证服务 |

配置表单直接读取已有 `args.json`、`menu.json` 和中文翻译，覆盖全部任务菜单；无需在 React 中重复登记游戏配置。字段支持字符串、数值、范围、开关、日期、多选、选项和任务优先级。隐藏字段不展示，固定字段禁止经 API 修改。存储空间沿用旧版行为：空字典时隐藏字段、空分组和导航；有状态时展示完整格式化 JSON，可点击清除按钮重置为空字典，不能任意改写状态内容。

## 验证

```powershell
uv run python -m dev_tools.export_api_schema
uv run python -m unittest tests.test_api tests.test_api_lifecycle tests.test_config_transaction tests.test_runtime_task_handler tests.test_frontend_build
npm run build --prefix frontend
npm test --prefix frontend
cd frontend
npx playwright install chromium
npm run test:e2e
npm run test:e2e:mock
```

手机端示意图是纯前端的，不需要 Python 服务，用独立的配置跑：

```powershell
npm run build --prefix frontend
cd frontend
npm run test:e2e:mobile
```

它的 `webServer` 用 `vite preview` 托管构建产物，视口固定为 412×915 的安卓 UA。最后一条用例会把各屏截图导出到 `frontend/screenshots/mobile/`（**刻意不写进 `test-results/`** —— Playwright 每次运行都会清空那个目录，截图留不住）。**改完手机端样式必须先 `npm run build` 再跑它** —— 它读的是 `dist` 而不是源码。

手机端正式入口打真实服务的那份配置（同样读 `dist`，所以也要先构建）：

```powershell
cd frontend
npm run build
$env:AZURPILOT_PASSWORD = '<config/deploy.yaml 里的 Webui.Password>'
npm run test:e2e:mobile:live
```

它验证的是**真的写回了后端**：`config.patch` 帧、`statistics.report` 的参数、
任务页的调度状态、日志页的工具行。示意图那份配置证明不了这些 —— 它没有后端。

浏览器测试服务只使用临时配置，并拒绝执行真实游戏任务。截图输出在被忽略的 `frontend/test-results`。模拟器截图和游戏实际执行仍需连接模拟器验收。

## 迁移边界

- `gui.py` 保留原有父监督器、依赖同步、双栈监听与工作进程回收，应用入口改为 `module.api.app:create_app`。
- 原有 `module/webui` 和 `webapp` 源码已移除。运行服务迁往 `module/runtime`，核心配置类不再引用 PyWebIO 或修改其全局类型。
- JSON 配置、YAML 参数生成流程、现有调度器和 `/mcp` 挂载保持兼容。独立 MCP 使用迁移后的运行服务。
- 总览右侧支持日志/截图切换。预览订阅底层实际截图，所有截图方案共用统一发布入口；每张新截图触发更新，空闲保留最后画面，不产生额外截图请求。旧日志链接重定向到总览。
- 统计页按资源趋势、大世界趋势、大世界总结、委托收益、舰船经验、短猫掉落分类，复用旧统计源及计算口径。提供折线、K 线、时间过滤、缩放、十字游标、原始明细与 CSV 导出；旧统计 HTML/JavaScript 无需加载。
- 服务端部署设置重启后生效；浏览器主题即时生效。密码不会由设置接口返回，填写空密码表示保留。

协议详情见 [API.md](API.md)，验证结果与迁移限制见 [REVIEW.md](REVIEW.md)。增加方法时先定义后端参数模型和路由，再生成契约，更新响应类型与对应测试；不得通过方法名反射任意 Python 属性。

## 总览与统计交互

- 总览资源支持全部 12 种资源自由选择、调整顺序和恢复默认；卡片自动换行并填满空间，搭配按实例保存在当前浏览器。
- 任务计划展示全部任务，明确区分运行中、待执行、等待中。右侧日志包含搜索、级别筛选、暂停自动滚动、清空当前视图及导出，切换截图后保留日志条件。
- 心情等只读日期沿用旧版文本显示，保留历史记录的小数秒；可编辑日期仍使用日期控件。
- 访问密码在首次成功登录后记忆于当前浏览器，刷新和重开页面自动登录；修改密码后旧值会失效。
- 图表按需加载 [Apache ECharts](https://echarts.apache.org/handbook/en/concepts/axis/)，支持滑块、Ctrl + 滚轮、框选缩放和图像导出。放大查看后可按 Escape 收起。
- 大世界和委托支持历史月份；今日、本周委托以当前日期为准。短猫掉落保留旧版全设备累计统计，刷新统计会重算已有本地掉落记录。界面说明标注估算、聚合与缺失值口径。

## 手机端与电脑端的差异

一份界面（`src/mobile/MobileShell.tsx`）同时喂真数据与假数据，所以手机端的**能力**与电脑端一一对应，
差别只在窄屏的呈现方式：

| 能力 | 电脑端 | 手机端 |
|---|---|---|
| 任务配置读写 | `config.patch` + `EditQueue` | 同一套 `EditQueue`，同一批接口；控件换成 antd-mobile，文本类改成失焦提交 |
| 任务与调度 | 右栏 `RightRail` 显示队列与三态计数 | 实例页 + 任务页各一张调度器摘要卡，任务行带状态徽标 |
| 统计 | `statistics.report` + ECharts（多序列、K 线、缩放） | 同一接口；曲线一次画一条（chip 切换），分桶复用 `aggregatePoints`，明细表窄屏横向滚动 |
| 日志 | 全部 400 行直接渲染 + 级别筛选/搜索/导出 | 同一套合并规则与工具栏；虚拟化（变高行）是手机端独有的加强 |
| 截图预览 | 打开 tab 才订阅 `preview`，纯推送 + `<a download>` | 完全相同（手机端**不主动抓图**） |
| 实例操作 | `InstanceActions` / `CreateInstance` | 首页实例卡的 ⋯ 与「新建实例」弹窗，同一批接口（删除前先取 `revision`） |
| 设置 / 更新 | 有设置页与更新页 | 无（只在 App 宿主内可达；抽屉里没有入口） |

