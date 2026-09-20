/**
 * 手机端专用文案。
 *
 * 单独成文件、**不并入 i18n.ts 的共用词表**，两个原因：
 *   1. 并入会让 PC 的四个 Record<UiKey, string> 也背上手机端文案 ——
 *      实测 PC 入口因此从 663 kB 涨到 680 kB，而且以后每加一条手机端文案
 *      都要同步改 PC 的四个词表；
 *   2. 手机端文案里没有需要 PC 复用的条目，独立词表更干净。
 *
 * 翻译走下面的 createMobileTranslator()：mobile.* 命中本表，其余键回落到 PC 的
 * translateUi，所以 status.* / scheduler.* / stats.* / log.* / task.* 这些共用文案
 * 不必重复登记 —— 能用 PC 的键就用 PC 的键。
 */
import { translateUi, type Language, type TranslationParams, type UiKey } from '../i18n'

export const mobileZhCN = {
  'mobile.tab.overview': '总览',
  'mobile.tab.instance': '实例',
  'mobile.tab.tasks': '任务',
  'mobile.tab.stats': '统计',
  'mobile.tab.logs': '日志',

  /* 正式入口的连接态（评审入口不需要） */
  'mobile.app.connecting': '正在连接服务…',
  'mobile.app.offline': '与服务的连接已断开，正在重试。',
  'mobile.app.noInstance': '还没有实例，请先在电脑端新建一个。',
  'mobile.logs.empty': '当前视图没有日志。',
  'mobile.tasks.runQueued': '已触发立即执行。',
  'mobile.instance.stopConfirm': '停止调度器？当前任务会被中断。',
  'mobile.error.title': '数据没拉下来',
  /* 设置页还没有实现：App 宿主里的 ⚙ 目前只给这一句，别写成「只在 App 内可达」——
     那时用户已经在 App 里了。 */
  'mobile.settings.appHostOnly': '设置页尚未实现，请先用电脑端',

  'mobile.drawer.home': '首页',
  'mobile.drawer.search': '搜索',
  'mobile.drawer.download': 'App 下载',
  'mobile.drawer.appearance': '外观',
  'mobile.drawer.language': '语言',
  'mobile.drawer.gallery': '组件测试',
  'mobile.drawer.about': '关于',
  'mobile.drawer.logoLabel': 'AzurPilot 标志，连点十次开启开发者模式',
  'mobile.drawer.downloadHint': 'App 下载还没有落地页，先在电脑端用浏览器打开吧。',

  /* 页眉的四个图标按钮只有无障碍名，必须跟界面语言走 */
  'mobile.bar.back': '返回',
  'mobile.bar.menu': '打开菜单',
  'mobile.bar.refresh': '刷新',
  'mobile.bar.settings': '设置',

  'mobile.appearance.light': '浅色',
  'mobile.appearance.dark': '深色',
  'mobile.appearance.system': '跟随系统',

  'mobile.language.zhCN': '简体中文',
  'mobile.language.zhTW': '繁體中文',
  'mobile.language.enUS': 'English',
  'mobile.language.jaJP': '日本語',
  'mobile.language.zhMiao': '喵',

  'mobile.search.groups': '分组',
  'mobile.search.tasks': '任务',
  'mobile.search.empty': '没有匹配的任务',

  /* 资源卡上的相对采集时间 */
  'mobile.time.justNow': '刚刚',
  'mobile.time.minutesAgo': '{count} 分钟前',
  'mobile.time.hoursAgo': '{count} 小时前',
  'mobile.time.daysAgo': '{count} 天前',

  'mobile.instance.more': '{name} 的更多操作',
  'mobile.instance.delete': '删除实例',
  'mobile.instance.deleteConfirm': '删除 {name}？配置会保留在备份里。',
  'mobile.instance.deleteDone': '已删除实例 {name}',
  'mobile.instance.startupOn': '已开启开机自动运行',
  'mobile.instance.startupOff': '已关闭开机自动运行',

  'mobile.overview.never': '未采集',
  'mobile.overview.cards': '卡片管理',
  'mobile.overview.cardsDone': '完成',

  'mobile.fab.start': '启动调度器',
  'mobile.fab.stop': '停止调度器',
  'mobile.fab.starting': '正在启动调度器',
  'mobile.fab.stopping': '正在停止调度器',

  'mobile.tasks.overview': '总览',
  'mobile.tasks.count': '共 {count} 项',
  'mobile.tasks.run': '立即执行',
  'mobile.tasks.runConfirm': '立即执行 {task}？',
  'mobile.tasks.noRunningHint': '实例已停止。启动后第一个到点的任务会出现在这里。',
  'mobile.tasks.noPendingHint': '已经到点、排队等待执行的任务会出现在这里。',
  'mobile.tasks.noWaitingHint': '还没到点的任务会按时间顺序出现在这里。',
  'mobile.tasks.disabled': '未启用',
  'mobile.tasks.enabledCount': '已启用 {count}',

  'mobile.stats.export': '导出',
  'mobile.stats.metrics': '指标',
  'mobile.stats.noRecord': '这段时间没有有效记录',
  'mobile.stats.noRecordHint': '换个时间范围或类目再试。',

  'mobile.config.hint': '点一下就能改，改完自动保存到实例配置。',
  'mobile.config.queued': '待提交',
  'mobile.config.saving': '提交中',
  'mobile.config.saved': '已保存',
  'mobile.config.failed': '提交失败',
  'mobile.config.error': '配置没拉下来',

  'mobile.logs.tab.logs': '日志',
  'mobile.logs.tab.preview': '截图',
  'mobile.logs.autoScroll': '自动滚动',
  'mobile.logs.clear': '清空',

  'mobile.gallery.title': '组件测试',

  'mobile.about.title': '关于',
  'mobile.about.version': '版本',
  'mobile.about.license': '开源协议',
  'mobile.about.licenseValue': 'GNU General Public License v3.0',
  'mobile.about.notice': '声明',
  'mobile.about.disclaimer': '免责声明',
  'mobile.about.disclaimerText': '本前端为非官方第三方实现，与 AzurPilot 项目无关。请遵守你所在地的法律法规以及游戏的服务条款，因使用本工具产生的一切后果由使用者自行承担。',
  'mobile.about.dependencies': '依赖许可证位于仓库的 /licenses 目录。',

  'mobile.common.confirm': '确认',
} as const

/** 手机端专属文案的键。 */
export type MobileKey = keyof typeof mobileZhCN

export const mobileZhTW: Record<MobileKey, string> = {
  'mobile.tab.overview': '總覽',
  'mobile.tab.instance': '實例',
  'mobile.tab.tasks': '任務',
  'mobile.tab.stats': '統計',
  'mobile.tab.logs': '日誌',
  'mobile.app.connecting': '正在連線服務…',
  'mobile.app.offline': '與服務的連線已中斷，正在重試。',
  'mobile.app.noInstance': '還沒有實例，請先在電腦端新增一個。',
  'mobile.logs.empty': '目前檢視沒有日誌。',
  'mobile.tasks.runQueued': '已觸發立即執行。',
  'mobile.instance.stopConfirm': '停止排程器？目前任務會被中斷。',
  'mobile.error.title': '資料沒拉下來',
  'mobile.settings.appHostOnly': '設定頁尚未實作，請先用電腦端',

  'mobile.drawer.home': '首頁',
  'mobile.drawer.search': '搜尋',
  'mobile.drawer.download': 'App 下載',
  'mobile.drawer.appearance': '外觀',
  'mobile.drawer.language': '語言',
  'mobile.drawer.gallery': '元件測試',
  'mobile.drawer.about': '關於',
  'mobile.drawer.logoLabel': 'AzurPilot 標誌，連點十次開啟開發者模式',
  'mobile.drawer.downloadHint': 'App 下載還沒有落地頁，請先在電腦端用瀏覽器開啟。',

  'mobile.bar.back': '返回',
  'mobile.bar.menu': '開啟選單',
  'mobile.bar.refresh': '重新整理',
  'mobile.bar.settings': '設定',

  'mobile.appearance.light': '淺色',
  'mobile.appearance.dark': '深色',
  'mobile.appearance.system': '跟隨系統',

  'mobile.language.zhCN': '简体中文',
  'mobile.language.zhTW': '繁體中文',
  'mobile.language.enUS': 'English',
  'mobile.language.jaJP': '日本語',
  'mobile.language.zhMiao': '喵',

  'mobile.search.groups': '分組',
  'mobile.search.tasks': '任務',
  'mobile.search.empty': '沒有符合的任務',

  'mobile.time.justNow': '剛剛',
  'mobile.time.minutesAgo': '{count} 分鐘前',
  'mobile.time.hoursAgo': '{count} 小時前',
  'mobile.time.daysAgo': '{count} 天前',

  'mobile.instance.more': '{name} 的更多操作',
  'mobile.instance.delete': '刪除實例',
  'mobile.instance.deleteConfirm': '刪除 {name}？設定會保留在備份裡。',
  'mobile.instance.deleteDone': '已刪除實例 {name}',
  'mobile.instance.startupOn': '已開啟開機自動執行',
  'mobile.instance.startupOff': '已關閉開機自動執行',

  'mobile.overview.never': '未擷取',
  'mobile.overview.cards': '卡片管理',
  'mobile.overview.cardsDone': '完成',

  'mobile.fab.start': '啟動排程器',
  'mobile.fab.stop': '停止排程器',
  'mobile.fab.starting': '正在啟動排程器',
  'mobile.fab.stopping': '正在停止排程器',

  'mobile.tasks.overview': '總覽',
  'mobile.tasks.count': '共 {count} 項',
  'mobile.tasks.run': '立即執行',
  'mobile.tasks.runConfirm': '立即執行 {task}？',
  'mobile.tasks.noRunningHint': '實例已停止。啟動後第一個到點的任務會出現在這裡。',
  'mobile.tasks.noPendingHint': '已經到點、排隊等待執行的任務會出現在這裡。',
  'mobile.tasks.noWaitingHint': '還沒到點的任務會按時間順序出現在這裡。',
  'mobile.tasks.disabled': '未啟用',
  'mobile.tasks.enabledCount': '已啟用 {count}',

  'mobile.stats.export': '匯出',
  'mobile.stats.metrics': '指標',
  'mobile.stats.noRecord': '這段時間沒有有效記錄',
  'mobile.stats.noRecordHint': '換個時間範圍或分類再試。',

  'mobile.config.hint': '點一下就能改，改完自動儲存到實例設定。',
  'mobile.config.queued': '待提交',
  'mobile.config.saving': '提交中',
  'mobile.config.saved': '已儲存',
  'mobile.config.failed': '提交失敗',
  'mobile.config.error': '設定沒拉下來',

  'mobile.logs.tab.logs': '日誌',
  'mobile.logs.tab.preview': '截圖',
  'mobile.logs.autoScroll': '自動捲動',
  'mobile.logs.clear': '清空',

  'mobile.gallery.title': '元件測試',

  'mobile.about.title': '關於',
  'mobile.about.version': '版本',
  'mobile.about.license': '開源授權',
  'mobile.about.licenseValue': 'GNU General Public License v3.0',
  'mobile.about.notice': '聲明',
  'mobile.about.disclaimer': '免責聲明',
  'mobile.about.disclaimerText': '本前端為非官方第三方實作，與 AzurPilot 專案無關。請遵守你所在地的法律法規以及遊戲的服務條款，因使用本工具產生的一切後果由使用者自行承擔。',
  'mobile.about.dependencies': '相依套件授權位於倉庫的 /licenses 目錄。',

  'mobile.common.confirm': '確認',
}

export const mobileEnUS: Record<MobileKey, string> = {
  'mobile.tab.overview': 'Overview',
  'mobile.tab.instance': 'Instance',
  'mobile.tab.tasks': 'Tasks',
  'mobile.tab.stats': 'Statistics',
  'mobile.tab.logs': 'Logs',
  'mobile.app.connecting': 'Connecting to the service…',
  'mobile.app.offline': 'Disconnected from the service, retrying.',
  'mobile.app.noInstance': 'No instance yet — create one on the desktop first.',
  'mobile.logs.empty': 'No logs in the current view.',
  'mobile.tasks.runQueued': 'Queued to run now.',
  'mobile.instance.stopConfirm': 'Stop the scheduler? The running task will be interrupted.',
  'mobile.error.title': 'Could not load data',
  'mobile.settings.appHostOnly': 'The settings page is not implemented yet — use the desktop console',

  'mobile.drawer.home': 'Home',
  'mobile.drawer.search': 'Search',
  'mobile.drawer.download': 'App download',
  'mobile.drawer.appearance': 'Appearance',
  'mobile.drawer.language': 'Language',
  'mobile.drawer.gallery': 'Component gallery',
  'mobile.drawer.about': 'About',
  'mobile.drawer.logoLabel': 'AzurPilot logo, tap ten times to enable developer mode',
  'mobile.drawer.downloadHint': 'The app download page is not ready — use the desktop browser for now.',

  'mobile.bar.back': 'Back',
  'mobile.bar.menu': 'Open menu',
  'mobile.bar.refresh': 'Refresh',
  'mobile.bar.settings': 'Settings',

  'mobile.appearance.light': 'Light',
  'mobile.appearance.dark': 'Dark',
  'mobile.appearance.system': 'Follow system',

  'mobile.language.zhCN': '简体中文',
  'mobile.language.zhTW': '繁體中文',
  'mobile.language.enUS': 'English',
  'mobile.language.jaJP': '日本語',
  'mobile.language.zhMiao': 'Miao',

  'mobile.search.groups': 'Groups',
  'mobile.search.tasks': 'Tasks',
  'mobile.search.empty': 'No matching task',

  'mobile.time.justNow': 'just now',
  'mobile.time.minutesAgo': '{count} min ago',
  'mobile.time.hoursAgo': '{count} h ago',
  'mobile.time.daysAgo': '{count} d ago',

  'mobile.instance.more': 'More actions for {name}',
  'mobile.instance.delete': 'Delete instance',
  'mobile.instance.deleteConfirm': 'Delete {name}? Its configuration stays in the backup.',
  'mobile.instance.deleteDone': 'Instance {name} deleted',
  'mobile.instance.startupOn': 'Run on startup enabled',
  'mobile.instance.startupOff': 'Run on startup disabled',

  'mobile.overview.never': 'Not collected',
  'mobile.overview.cards': 'Card manager',
  'mobile.overview.cardsDone': 'Done',

  'mobile.fab.start': 'Start scheduler',
  'mobile.fab.stop': 'Stop scheduler',
  'mobile.fab.starting': 'Starting scheduler',
  'mobile.fab.stopping': 'Stopping scheduler',

  'mobile.tasks.overview': 'Overview',
  'mobile.tasks.count': '{count} items',
  'mobile.tasks.run': 'Run now',
  'mobile.tasks.runConfirm': 'Run {task} now?',
  'mobile.tasks.noRunningHint': 'The instance is stopped. The first task to come due will show up here once you start it.',
  'mobile.tasks.noPendingHint': 'Tasks that are already due and queued to run will show up here.',
  'mobile.tasks.noWaitingHint': 'Tasks that are not due yet will show up here in time order.',
  'mobile.tasks.disabled': 'Disabled',
  'mobile.tasks.enabledCount': '{count} enabled',

  'mobile.stats.export': 'Export',
  'mobile.stats.metrics': 'Metrics',
  'mobile.stats.noRecord': 'No valid record in this period',
  'mobile.stats.noRecordHint': 'Try another time range or category.',

  'mobile.config.hint': 'Tap to edit; changes are saved to the instance configuration automatically.',
  'mobile.config.queued': 'Queued',
  'mobile.config.saving': 'Saving',
  'mobile.config.saved': 'Saved',
  'mobile.config.failed': 'Save failed',
  'mobile.config.error': 'Could not load the configuration',

  'mobile.logs.tab.logs': 'Logs',
  'mobile.logs.tab.preview': 'Screenshot',
  'mobile.logs.autoScroll': 'Auto scroll',
  'mobile.logs.clear': 'Clear',

  'mobile.gallery.title': 'Component gallery',

  'mobile.about.title': 'About',
  'mobile.about.version': 'Version',
  'mobile.about.license': 'License',
  'mobile.about.licenseValue': 'GNU General Public License v3.0',
  'mobile.about.notice': 'Notice',
  'mobile.about.disclaimer': 'Disclaimer',
  'mobile.about.disclaimerText': 'This front end is an unofficial third-party implementation and is not affiliated with the AzurPilot project. Follow the laws of your region and the game terms of service; you are responsible for any consequence of using this tool.',
  'mobile.about.dependencies': 'Dependency licenses live in the /licenses directory of the repository.',

  'mobile.common.confirm': 'Confirm',
}

export const mobileJaJP: Record<MobileKey, string> = {
  'mobile.tab.overview': '概要',
  'mobile.tab.instance': 'インスタンス',
  'mobile.tab.tasks': 'タスク',
  'mobile.tab.stats': '統計',
  'mobile.tab.logs': 'ログ',
  'mobile.app.connecting': 'サービスに接続中…',
  'mobile.app.offline': 'サービスとの接続が切れました。再試行中。',
  'mobile.app.noInstance': 'インスタンスがありません。まず PC 側で作成してください。',
  'mobile.logs.empty': '現在の表示にログはありません。',
  'mobile.tasks.runQueued': '即時実行を開始しました。',
  'mobile.instance.stopConfirm': 'スケジューラーを停止しますか？実行中のタスクは中断されます。',
  'mobile.error.title': 'データを取得できませんでした',
  'mobile.settings.appHostOnly': '設定ページは未実装です。PC 側で変更してください',

  'mobile.drawer.home': 'ホーム',
  'mobile.drawer.search': '検索',
  'mobile.drawer.download': 'アプリを入手',
  'mobile.drawer.appearance': '外観',
  'mobile.drawer.language': '言語',
  'mobile.drawer.gallery': 'コンポーネント',
  'mobile.drawer.about': 'このアプリについて',
  'mobile.drawer.logoLabel': 'AzurPilot ロゴ、10 回タップで開発者モード',
  'mobile.drawer.downloadHint': 'アプリ配布ページは未公開です。まず PC 側のブラウザでお使いください。',

  'mobile.bar.back': '戻る',
  'mobile.bar.menu': 'メニューを開く',
  'mobile.bar.refresh': '更新',
  'mobile.bar.settings': '設定',

  'mobile.appearance.light': 'ライト',
  'mobile.appearance.dark': 'ダーク',
  'mobile.appearance.system': 'システムに従う',

  'mobile.language.zhCN': '简体中文',
  'mobile.language.zhTW': '繁體中文',
  'mobile.language.enUS': 'English',
  'mobile.language.jaJP': '日本語',
  'mobile.language.zhMiao': 'ミャオ',

  'mobile.search.groups': 'グループ',
  'mobile.search.tasks': 'タスク',
  'mobile.search.empty': '一致するタスクがありません',

  'mobile.time.justNow': 'たった今',
  'mobile.time.minutesAgo': '{count} 分前',
  'mobile.time.hoursAgo': '{count} 時間前',
  'mobile.time.daysAgo': '{count} 日前',

  'mobile.instance.more': '{name} の操作',
  'mobile.instance.delete': 'インスタンスを削除',
  'mobile.instance.deleteConfirm': '{name} を削除しますか？設定はバックアップに残ります。',
  'mobile.instance.deleteDone': 'インスタンス {name} を削除しました',
  'mobile.instance.startupOn': '起動時の自動実行を有効にしました',
  'mobile.instance.startupOff': '起動時の自動実行を無効にしました',

  'mobile.overview.never': '未取得',
  'mobile.overview.cards': 'カード管理',
  'mobile.overview.cardsDone': '完了',

  'mobile.fab.start': 'スケジューラーを開始',
  'mobile.fab.stop': 'スケジューラーを停止',
  'mobile.fab.starting': 'スケジューラーを開始しています',
  'mobile.fab.stopping': 'スケジューラーを停止しています',

  'mobile.tasks.overview': '概要',
  'mobile.tasks.count': '全 {count} 件',
  'mobile.tasks.run': '今すぐ実行',
  'mobile.tasks.runConfirm': '{task} を今すぐ実行しますか？',
  'mobile.tasks.noRunningHint': 'インスタンスは停止中です。起動後、最初に時刻が来たタスクがここに表示されます。',
  'mobile.tasks.noPendingHint': '時刻が来て実行待ちのタスクがここに表示されます。',
  'mobile.tasks.noWaitingHint': 'まだ時刻が来ていないタスクが時刻順にここに表示されます。',
  'mobile.tasks.disabled': '未有効',
  'mobile.tasks.enabledCount': '有効 {count}',

  'mobile.stats.export': 'エクスポート',
  'mobile.stats.metrics': '指標',
  'mobile.stats.noRecord': 'この期間に有効な記録がありません',
  'mobile.stats.noRecordHint': '期間か分類を変えて試してください。',

  'mobile.config.hint': 'タップで編集でき、変更は自動的にインスタンス設定に保存されます。',
  'mobile.config.queued': '送信待ち',
  'mobile.config.saving': '送信中',
  'mobile.config.saved': '保存済み',
  'mobile.config.failed': '送信に失敗',
  'mobile.config.error': '設定を取得できませんでした',

  'mobile.logs.tab.logs': 'ログ',
  'mobile.logs.tab.preview': 'スクリーンショット',
  'mobile.logs.autoScroll': '自動スクロール',
  'mobile.logs.clear': 'クリア',

  'mobile.gallery.title': 'コンポーネント',

  'mobile.about.title': 'このアプリについて',
  'mobile.about.version': 'バージョン',
  'mobile.about.license': 'ライセンス',
  'mobile.about.licenseValue': 'GNU General Public License v3.0',
  'mobile.about.notice': '声明',
  'mobile.about.disclaimer': '免責事項',
  'mobile.about.disclaimerText': '本フロントエンドは非公式の第三者実装であり、AzurPilot プロジェクトとは無関係です。お住まいの地域の法令とゲームの利用規約に従ってください。本ツールの使用による一切の結果は利用者の責任となります。',
  'mobile.about.dependencies': '依存関係のライセンスはリポジトリの /licenses にあります。',

  'mobile.common.confirm': '確認',
}

const dictionaries: Record<Language, Record<MobileKey, string>> = {
  'zh-CN': mobileZhCN,
  'zh-TW': mobileZhTW,
  'en-US': mobileEnUS,
  'ja-JP': mobileJaJP,
  /* 喵语沿用简体，与 PC 的 zhMiao 用 {...zhCN} 的做法一致。 */
  'zh-MIAO': mobileZhCN,
}

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    params[name] === undefined ? match : String(params[name]))
}

/** 手机端翻译器：key 是手机端键，也可以直接给 PC 的 UiKey（回落共用词表）。 */
export type MobileTranslator = (key: MobileKey | UiKey, params?: TranslationParams) => string

export function createMobileTranslator(language: Language): MobileTranslator {
  const table = dictionaries[language] ?? mobileZhCN
  return (key, params) => {
    if (Object.prototype.hasOwnProperty.call(table, key)) {
      return interpolate(table[key as MobileKey], params)
    }
    return translateUi(language, key as UiKey, params)
  }
}
