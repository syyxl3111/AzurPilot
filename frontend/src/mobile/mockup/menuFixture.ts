/**
 * 手机端评审入口的夹具 —— **由 ../dev_tools/export_mobile_menu.mjs 生成，请勿手动编辑**。
 *
 * 结构（分组 / 任务列表 / page）取自 module/config/argument/menu.json，
 * 任务配置的字段定义取自 module/config/argument/args.json，
 * 中文标签说明取自 module/config/i18n/zh-CN.json。
 * 所以评审入口（示意图）与真机是同一份数据形状，不会各写一套再慢慢漂移。
 *
 * 重新生成：在 frontend/ 下运行 node ../dev_tools/export_mobile_menu.mjs
 */
export const MENU_GROUPS: Array<{key: string; name: string; page: string; tasks: string[]}> = [
  {
    "key": "Alas",
    "name": "系统",
    "page": "setting",
    "tasks": [
      "Alas",
      "General",
      "Restart"
    ]
  },
  {
    "key": "Farm",
    "name": "出击Plus",
    "page": "setting",
    "tasks": [
      "Main",
      "Main2",
      "Main3",
      "GemsFarming",
      "ThreeOilLowCost",
      "Ambush11"
    ]
  },
  {
    "key": "Event",
    "name": "活动Plus",
    "page": "setting",
    "tasks": [
      "EventGeneral",
      "Event",
      "Event2",
      "Event3",
      "Raid",
      "RaidScuttle",
      "Hospital",
      "Coalition",
      "CoalitionScuttle",
      "MaritimeEscort",
      "EventShop",
      "WarArchives"
    ]
  },
  {
    "key": "EventDaily",
    "name": "活动-每日任务",
    "page": "setting",
    "tasks": [
      "EventA",
      "EventB",
      "EventC",
      "EventD",
      "EventSp",
      "RaidDaily",
      "CoalitionSp"
    ]
  },
  {
    "key": "Reward",
    "name": "自动收获",
    "page": "setting",
    "tasks": [
      "Commission",
      "Tactical",
      "Research",
      "Dorm",
      "Meowfficer",
      "Guild",
      "Reward",
      "Awaken",
      "Secretary",
      "OperationHandover"
    ]
  },
  {
    "key": "DailyMission",
    "name": "每日任务",
    "page": "setting",
    "tasks": [
      "Daily",
      "Hard",
      "Exercise",
      "ShopFrequent",
      "ShopOnce",
      "Shipyard",
      "Gacha",
      "Freebies",
      "Minigame",
      "PrivateQuarters"
    ]
  },
  {
    "key": "Opsi",
    "name": "大世界Plus",
    "page": "setting",
    "tasks": [
      "OpsiGeneral",
      "OpsiAshBeacon",
      "OpsiAshAssist",
      "OpsiExplore",
      "OpsiShop",
      "OpsiVoucher",
      "OpsiDaily",
      "OpsiObscure",
      "OpsiAbyssal",
      "OpsiArchive",
      "OpsiStronghold",
      "OpsiMonthBoss",
      "OpsiMeowfficerFarming",
      "OpsiHazard1Leveling",
      "OpsiScheduling",
      "OpsiPreventActionPointOverflow",
      "OpsiCrossMonth",
      "OpsiSimulator"
    ]
  },
  {
    "key": "Island",
    "name": "赤石计划",
    "page": "setting",
    "tasks": [
      "IslandPlan",
      "IslandBusiness",
      "IslandFarm",
      "IslandRancher",
      "IslandMineForest",
      "IslandRestaurant",
      "IslandTeahouse",
      "IslandGrill",
      "IslandJuuEatery",
      "IslandJuuCoffee",
      "IslandManufacture",
      "IslandDailyGather",
      "IslandAirDrop",
      "IslandCargoPreparation",
      "IslandDailyOrder",
      "IslandDailyInteract",
      "IslandPearlSell"
    ]
  },
  {
    "key": "FleetManagement",
    "name": "舰队管理",
    "page": "setting",
    "tasks": [
      "FleetInfo"
    ]
  },
  {
    "key": "Tool",
    "name": "工具Plus",
    "page": "tool",
    "tasks": [
      "FleetScan",
      "Daemon",
      "OpsiDaemon",
      "EventStory",
      "BoxDisassemble",
      "AutoEquip",
      "Benchmark",
      "OcrBenchmark",
      "AzurLaneUncensored",
      "GameManager",
      "EmulatorManager"
    ]
  }
]

export const MENU_TASK_LABELS: Record<string, string> = {
  "Alas": "系统设置",
  "General": "通用设置",
  "Restart": "重启设置",
  "Main": "主线图-1Plus",
  "Main2": "主线图-2Plus",
  "Main3": "主线图-3Plus",
  "GemsFarming": "紧急委托Plus",
  "ThreeOilLowCost": "三油低耗Plus",
  "Ambush11": "1-1刷伏击(尚不完善)",
  "EventGeneral": "活动通用设置",
  "Event": "活动图-1Plus",
  "Event2": "活动图-2Plus",
  "Event3": "活动图-3Plus",
  "Raid": "共斗活动Plus",
  "RaidScuttle": "共斗沉船Plus",
  "Hospital": "深谷来信",
  "Coalition": "夜勤病栋",
  "CoalitionScuttle": "联盟沉船",
  "MaritimeEscort": "商路护航",
  "EventShop": "活动商店",
  "WarArchives": "作战档案",
  "EventA": "每日A图",
  "EventB": "每日B图",
  "EventC": "每日C图",
  "EventD": "每日D图",
  "EventSp": "每日SP图",
  "RaidDaily": "共斗活动每日",
  "CoalitionSp": "怪谈纪实：逃离白夜山庄SP",
  "Commission": "委托",
  "Tactical": "战术学院",
  "Research": "科研",
  "Dorm": "后宅",
  "Meowfficer": "指挥喵",
  "Guild": "大舰队",
  "Reward": "收获",
  "Awaken": "认知觉醒",
  "Secretary": "秘书舰",
  "OperationHandover": "作战委托",
  "Daily": "每日任务",
  "Hard": "主线-困难图",
  "Exercise": "演习",
  "ShopFrequent": "军火商商店",
  "ShopOnce": "其他商店",
  "Shipyard": "开发船坞",
  "Gacha": "每日抽卡",
  "Freebies": "白嫖奖励",
  "Minigame": "小游戏",
  "PrivateQuarters": "宿舍计划",
  "OpsiGeneral": "通用设置",
  "OpsiAshBeacon": "META作战",
  "OpsiAshAssist": "META支援",
  "OpsiExplore": "每月开荒Plus",
  "OpsiShop": "大世界商店Plus",
  "OpsiVoucher": "白票商店",
  "OpsiDaily": "大世界每日Plus",
  "OpsiObscure": "隐秘海域",
  "OpsiAbyssal": "深渊坐标",
  "OpsiArchive": "档案坐标",
  "OpsiStronghold": "塞壬要塞",
  "OpsiMonthBoss": "月度Boss",
  "OpsiMeowfficerFarming": "耄耋相接",
  "OpsiHazard1Leveling": "侵蚀1练级",
  "OpsiScheduling": "智能调度Plus",
  "OpsiPreventActionPointOverflow": "防止行动力溢出",
  "OpsiCrossMonth": "跨月每日",
  "OpsiSimulator": "大世界模拟器 Alpha",
  "IslandPlan": "全局配置",
  "IslandBusiness": "经营模块",
  "IslandFarm": "农田",
  "IslandRancher": "牧场",
  "IslandMineForest": "矿山林场",
  "IslandRestaurant": "有鱼餐馆",
  "IslandTeahouse": "白熊饮品",
  "IslandGrill": "乌鱼烤肉",
  "IslandJuuEatery": "啾啾简餐",
  "IslandJuuCoffee": "啾咖啡",
  "IslandManufacture": "制造业",
  "IslandDailyGather": "每日采集",
  "IslandAirDrop": "每日补给",
  "IslandCargoPreparation": "货物筹备",
  "IslandDailyOrder": "每日订单",
  "IslandDailyInteract": "每日/周任务",
  "IslandPearlSell": "每周珍珠采购与售卖",
  "FleetInfo": "舰队信息",
  "FleetScan": "舰队扫描",
  "Daemon": "半自动点击",
  "OpsiDaemon": "大世界半自动",
  "EventStory": "活动剧情",
  "BoxDisassemble": "拆装备箱",
  "AutoEquip": "自动装备",
  "Benchmark": "性能测试",
  "OcrBenchmark": "OCR性能测试",
  "AzurLaneUncensored": "反和谐",
  "GameManager": "游戏管理器(未完成)",
  "EmulatorManager": "模拟器管理器"
}

/**
 * 配置页夹具：若⼲个真实任务的字段定义 + 默认值 + 中文说明。
 *
 * **不是全部 96 个任务**：args.json 有 401 KB，全量搬进前端会让示意图入口的包
 * 膨胀十几倍。评审需要的是「几种典型形状都有人演」，具体挑选理由见下面这个列表。
 */
export type TaskConfigFixture = {
  task: string
  label: string
  groupLabels: Record<string, string>
  args: Record<string, Record<string, unknown>>
  values: Record<string, Record<string, unknown>>
  translations: Record<string, string>
}

export const TASK_CONFIG_FIXTURES: Record<string, TaskConfigFixture> = {
  "Alas": {
    "task": "Alas",
    "label": "系统设置",
    "groupLabels": {
      "Emulator": "模拟器设置",
      "EmulatorInfo": "模拟器设置",
      "Error": "调试设置",
      "DailySummary": "每日总结",
      "Optimization": "优化设置",
      "DropRecord": "掉落记录",
      "EmulatorManagement": "模拟器管理",
      "Storage": "任务状态"
    },
    "args": {
      "Emulator": {
        "Serial": {
          "type": "input",
          "value": "auto"
        },
        "PackageName": {
          "type": "select",
          "value": "auto",
          "option": [
            "auto",
            "com.bilibili.azurlane",
            "com.YoStarEN.AzurLane",
            "com.YoStarJP.AzurLane",
            "com.hkmanjuu.azurlane.gp",
            "com.bilibili.blhx.huawei",
            "com.bilibili.blhx.honor",
            "com.bilibili.blhx.mi",
            "com.tencent.tmgp.bilibili.blhx",
            "com.bilibili.blhx.baidu",
            "com.bilibili.blhx.qihoo",
            "com.bilibili.blhx.nearme.gamecenter",
            "com.bilibili.blhx.vivo",
            "com.bilibili.blhx.mz",
            "com.bilibili.blhx.dl",
            "com.bilibili.blhx.lenovo",
            "com.bilibili.blhx.uc",
            "com.bilibili.blhx.mzw",
            "com.yiwu.blhx.yx15",
            "com.bilibili.blhx.m4399",
            "com.bilibili.blhx.bilibiliMove",
            "com.hkmanjuu.azurlane.gp.mc"
          ]
        },
        "ServerName": {
          "type": "select",
          "value": "disabled",
          "option": [
            "disabled",
            "cn_android-0",
            "cn_android-1",
            "cn_android-2",
            "cn_android-3",
            "cn_android-4",
            "cn_android-5",
            "cn_android-6",
            "cn_android-7",
            "cn_android-8",
            "cn_android-9",
            "cn_android-10",
            "cn_android-11",
            "cn_android-12",
            "cn_android-13",
            "cn_android-14",
            "cn_android-15",
            "cn_android-16",
            "cn_android-17",
            "cn_android-18",
            "cn_android-19",
            "cn_android-20",
            "cn_android-21",
            "cn_android-22",
            "cn_android-23",
            "cn_android-24",
            "cn_android-25",
            "cn_android-26",
            "cn_android-27",
            "cn_android-28",
            "cn_android-29",
            "cn_ios-0",
            "cn_ios-1",
            "cn_ios-2",
            "cn_ios-3",
            "cn_ios-4",
            "cn_ios-5",
            "cn_ios-6",
            "cn_ios-7",
            "cn_ios-8",
            "cn_ios-9",
            "cn_ios-10",
            "cn_channel-0",
            "cn_channel-1",
            "cn_channel-2",
            "cn_channel-3",
            "cn_channel-4",
            "cn_channel-5",
            "en-0",
            "en-1",
            "en-2",
            "en-3",
            "en-4",
            "en-5",
            "en-6",
            "jp-0",
            "jp-1",
            "jp-2",
            "jp-3",
            "jp-4",
            "jp-5",
            "jp-6",
            "jp-7",
            "jp-8",
            "jp-9",
            "jp-10",
            "jp-11",
            "jp-12",
            "jp-13",
            "jp-14",
            "jp-15",
            "jp-16",
            "jp-17",
            "tw-0",
            "tw-1",
            "tw-2",
            "tw-3",
            "tw-4"
          ]
        },
        "ScreenshotMethod": {
          "type": "select",
          "value": "auto",
          "option": [
            "auto",
            "ADB",
            "ADB_nc",
            "uiautomator2",
            "aScreenCap",
            "aScreenCap_nc",
            "DroidCast",
            "DroidCast_raw",
            "nemu_ipc",
            "ldopengl"
          ]
        },
        "ControlMethod": {
          "type": "select",
          "value": "MaaTouch",
          "option": [
            "ADB",
            "uiautomator2",
            "minitouch",
            "Hermit",
            "MaaTouch",
            "nemu_ipc"
          ]
        },
        "GameSettings": {
          "type": "checkbox",
          "value": false,
          "option": [
            true,
            false
          ]
        },
        "ScreenshotDedithering": {
          "type": "checkbox",
          "value": false
        },
        "AdbRestart": {
          "type": "checkbox",
          "value": false
        }
      },
      "EmulatorInfo": {
        "Emulator": {
          "type": "select",
          "value": "auto",
          "option": [
            "auto",
            "NoxPlayer",
            "NoxPlayer64",
            "BlueStacks4",
            "BlueStacks5",
            "BlueStacks4HyperV",
            "BlueStacks5HyperV",
            "LDPlayer3",
            "LDPlayer4",
            "LDPlayer9",
            "LDPlayer14",
            "MuMuPlayer",
            "MuMuPlayerX",
            "MuMuPlayer12",
            "MEmuPlayer",
            "BlueStacksAir",
            "MuMuPro",
            "SSH"
          ]
        },
        "name": {
          "type": "textarea",
          "value": null
        },
        "path": {
          "type": "textarea",
          "value": null
        },
        "EnableRemoteSSH": {
          "type": "checkbox",
          "value": false,
          "option": [
            true,
            false
          ]
        },
        "RemoteSSHHost": {
          "type": "input",
          "value": null
        },
        "RemoteSSHPort": {
          "type": "input",
          "value": 22
        },
        "RemoteSSHUser": {
          "type": "input",
          "value": "root"
        },
        "RemoteSSHPublicKey": {
          "type": "textarea",
          "value": null
        },
        "RemoteStartCommand": {
          "type": "textarea",
          "value": ""
        },
        "RemoteStopCommand": {
          "type": "textarea",
          "value": ""
        }
      },
      "Error": {
        "HandleError": {
          "type": "checkbox",
          "value": true
        },
        "SaveError": {
          "type": "checkbox",
          "value": true
        },
        "StrictRestart": {
          "type": "checkbox",
          "value": false
        },
        "SaveErrorCount": {
          "type": "input",
          "value": 30
        },
        "OnePushConfig": {
          "type": "textarea",
          "value": "provider: null",
          "mode": "yaml"
        },
        "ScreenshotLength": {
          "type": "input",
          "value": 1
        },
        "GameStuckRestart": {
          "type": "checkbox",
          "value": false
        },
        "GameStuckThreshold": {
          "type": "input",
          "value": 3,
          "validate": [
            1,
            10
          ]
        },
        "AdbOfflineRestart": {
          "type": "checkbox",
          "value": false
        },
        "AdbOfflineThreshold": {
          "type": "input",
          "value": 3,
          "validate": [
            1,
            10
          ]
        },
        "WatchdogEnable": {
          "type": "checkbox",
          "value": false
        },
        "WatchdogTaskEnable": {
          "type": "checkbox",
          "value": false
        },
        "WatchdogTaskTimeout": {
          "type": "input",
          "value": 120,
          "validate": [
            0,
            99999
          ]
        },
        "RestartOperationTimeoutEnable": {
          "type": "checkbox",
          "value": false
        },
        "RestartOperationTimeout": {
          "type": "input",
          "value": 120,
          "validate": [
            10,
            600
          ]
        },
        "LlmAnalysis": {
          "type": "checkbox",
          "value": true
        },
        "LlmApiKey": {
          "type": "textarea",
          "value": ""
        },
        "LlmApiBase": {
          "type": "textarea",
          "value": "https://api.xiaomimimo.com/v1"
        },
        "LlmModel": {
          "type": "input",
          "value": "mimo-v2.5-pro"
        }
      },
      "DailySummary": {
        "Enable": {
          "type": "checkbox",
          "value": false,
          "option": [
            true,
            false
          ]
        },
        "TriggerTime": {
          "type": "input",
          "value": "20:00"
        }
      },
      "Optimization": {
        "OcrDevice": {
          "type": "select",
          "value": "auto",
          "option": [
            "auto",
            "qnn_npu",
            "openvino_npu",
            "openvino_gpu",
            "gpu",
            "openvino_cpu",
            "cpu",
            "ane"
          ]
        },
        "OcrBackend": {
          "type": "select",
          "value": "auto",
          "option": [
            "auto",
            "onnxruntime",
            "ncnn"
          ]
        },
        "OcrWindowsMlVendorEp": {
          "type": "checkbox",
          "value": true,
          "option": [
            true,
            false
          ]
        },
        "OcrModelVersionEnglish": {
          "type": "select",
          "value": "auto",
          "option": [
            "auto",
            "lite",
            "standard",
            "pro",
            "alocr_en_v2_6"
          ]
        },
        "OcrModelVersionChinese": {
          "type": "select",
          "value": "auto",
          "option": [
            "auto",
            "lite",
            "standard",
            "pro",
            "alocr_cn_v3"
          ]
        },
        "OcrModelVersionJapanese": {
          "type": "select",
          "value": "auto",
          "option": [
            "auto",
            "lite",
            "standard",
            "pro"
          ]
        },
        "OcrModelVersionTraditionalChinese": {
          "type": "select",
          "value": "auto",
          "option": [
            "auto",
            "lite",
            "standard",
            "pro"
          ]
        },
        "ScreenshotInterval": {
          "type": "input",
          "value": 0.3
        },
        "CombatScreenshotInterval": {
          "type": "input",
          "value": 1
        },
        "TaskHoardingDuration": {
          "type": "input",
          "value": 0
        },
        "CloseEmulatorDuringLongWait": {
          "type": "checkbox",
          "value": true,
          "option": [
            true,
            false
          ]
        },
        "WhenTaskQueueEmpty": {
          "type": "select",
          "value": "goto_main",
          "option": [
            "stay_there",
            "goto_main",
            "close_game"
          ]
        },
        "WhenSchedulerStopped": {
          "type": "select",
          "value": "stay_there",
          "option": [
            "stay_there",
            "goto_main",
            "close_game",
            "close_emulator"
          ]
        },
        "WarmupEnable": {
          "type": "checkbox",
          "value": true,
          "option": [
            true,
            false
          ]
        },
        "WarmupMinutes": {
          "type": "input",
          "value": 15,
          "validate": [
            1,
            1440
          ]
        }
      },
      "DropRecord": {
        "SaveFolder": {
          "type": "input",
          "value": "./screenshots"
        },
        "AzurStatsID": {
          "type": "input",
          "value": null
        },
        "API": {
          "type": "select",
          "value": "default",
          "option": [
            "default",
            "cn_gz_reverse_proxy"
          ]
        },
        "ResearchRecord": {
          "type": "select",
          "value": "do_not",
          "option": [
            "do_not",
            "save",
            "upload",
            "save_and_upload"
          ]
        },
        "CommissionRecord": {
          "type": "select",
          "value": "do_not",
          "option": [
            "do_not",
            "save",
            "upload",
            "save_and_upload"
          ]
        },
        "CombatRecord": {
          "type": "select",
          "value": "do_not",
          "option": [
            "do_not",
            "save"
          ]
        },
        "OpsiRecord": {
          "type": "select",
          "value": "upload",
          "option": [
            "do_not",
            "save",
            "upload",
            "save_and_upload"
          ]
        },
        "MeowfficerBuy": {
          "type": "select",
          "value": "do_not",
          "option": [
            "do_not",
            "save"
          ]
        },
        "MeowfficerTalent": {
          "type": "select",
          "value": "do_not",
          "option": [
            "do_not",
            "save",
            "upload",
            "save_and_upload"
          ]
        },
        "TelemetryReport": {
          "type": "checkbox",
          "value": true
        },
        "BugReport": {
          "type": "checkbox",
          "value": true
        }
      },
      "EmulatorManagement": {
        "ScheduledEmulatorRestart": {
          "type": "checkbox",
          "value": false
        },
        "ForceScheduledRestart": {
          "type": "checkbox",
          "value": false
        },
        "RestartIntervalHours": {
          "type": "input",
          "value": 4,
          "validate": [
            1,
            24
          ]
        }
      },
      "Storage": {
        "Storage": {
          "type": "storage",
          "value": {},
          "display": "disabled"
        }
      }
    },
    "values": {
      "Emulator": {
        "Serial": "auto",
        "PackageName": "auto",
        "ServerName": "disabled",
        "ScreenshotMethod": "auto",
        "ControlMethod": "MaaTouch",
        "GameSettings": false,
        "ScreenshotDedithering": false,
        "AdbRestart": false
      },
      "EmulatorInfo": {
        "Emulator": "auto",
        "name": null,
        "path": null,
        "EnableRemoteSSH": false,
        "RemoteSSHHost": null,
        "RemoteSSHPort": 22,
        "RemoteSSHUser": "root",
        "RemoteSSHPublicKey": null,
        "RemoteStartCommand": "",
        "RemoteStopCommand": ""
      },
      "Error": {
        "HandleError": true,
        "SaveError": true,
        "StrictRestart": false,
        "SaveErrorCount": 30,
        "OnePushConfig": "provider: null",
        "ScreenshotLength": 1,
        "GameStuckRestart": false,
        "GameStuckThreshold": 3,
        "AdbOfflineRestart": false,
        "AdbOfflineThreshold": 3,
        "WatchdogEnable": false,
        "WatchdogTaskEnable": false,
        "WatchdogTaskTimeout": 120,
        "RestartOperationTimeoutEnable": false,
        "RestartOperationTimeout": 120,
        "LlmAnalysis": true,
        "LlmApiKey": "",
        "LlmApiBase": "https://api.xiaomimimo.com/v1",
        "LlmModel": "mimo-v2.5-pro"
      },
      "DailySummary": {
        "Enable": false,
        "TriggerTime": "20:00"
      },
      "Optimization": {
        "OcrDevice": "auto",
        "OcrBackend": "auto",
        "OcrWindowsMlVendorEp": true,
        "OcrModelVersionEnglish": "auto",
        "OcrModelVersionChinese": "auto",
        "OcrModelVersionJapanese": "auto",
        "OcrModelVersionTraditionalChinese": "auto",
        "ScreenshotInterval": 0.3,
        "CombatScreenshotInterval": 1,
        "TaskHoardingDuration": 0,
        "CloseEmulatorDuringLongWait": true,
        "WhenTaskQueueEmpty": "goto_main",
        "WhenSchedulerStopped": "stay_there",
        "WarmupEnable": true,
        "WarmupMinutes": 15
      },
      "DropRecord": {
        "SaveFolder": "./screenshots",
        "AzurStatsID": null,
        "API": "default",
        "ResearchRecord": "do_not",
        "CommissionRecord": "do_not",
        "CombatRecord": "do_not",
        "OpsiRecord": "upload",
        "MeowfficerBuy": "do_not",
        "MeowfficerTalent": "do_not",
        "TelemetryReport": true,
        "BugReport": true
      },
      "EmulatorManagement": {
        "ScheduledEmulatorRestart": false,
        "ForceScheduledRestart": false,
        "RestartIntervalHours": 4
      },
      "Storage": {
        "Storage": {}
      }
    },
    "translations": {
      "Emulator.Serial.name": "模拟器 Serial",
      "Emulator.Serial.help": "常见的模拟器 Serial 可以查询下方列表\n填 \"auto\" 自动检测模拟器，多个模拟器正在运行或使用不支持自动检测的模拟器时无法使用 \"auto\"，必须手动填写\n\n模拟器默认 Serial：\n- 蓝叠模拟器 127.0.0.1:5555\n- 蓝叠模拟器4 Hyper-v版，填\"bluestacks4-hyperv\"自动连接，多开填\"bluestacks4-hyperv-2\"以此类推\n- 蓝叠模拟器5 Hyper-v版，填\"bluestacks5-hyperv\"自动连接，多开填\"bluestacks5-hyperv-1\"以此类推\n- 夜神模拟器 127.0.0.1:62001\n- 夜神模拟器64位 127.0.0.1:59865\n- MuMu模拟器/MuMu模拟器X 127.0.0.1:7555\n- MuMu模拟器12 127.0.0.1:16384\n- MuMu Pro (macOS) 127.0.0.1:16384，多开依次为 127.0.0.1:16416, 127.0.0.1:16448 ...\n- 逍遥模拟器 127.0.0.1:21503\n- 雷电模拟器 emulator-5554 或 127.0.0.1:5555\n如果你使用了模拟器的多开功能，它们的 Serial 将不是默认的，可以在 console.bat 中执行 `adb devices` 查询，或根据模拟器官方的教程填写",
      "Emulator.PackageName.name": "游戏服务器",
      "Emulator.PackageName.help": "模拟器上装有多个游戏客户端时，需要手动选择服务器",
      "Emulator.PackageName.auto": "自动检测",
      "Emulator.PackageName.com.bilibili.azurlane": "国服",
      "Emulator.PackageName.com.YoStarEN.AzurLane": "国际服",
      "Emulator.PackageName.com.YoStarJP.AzurLane": "日服",
      "Emulator.PackageName.com.hkmanjuu.azurlane.gp": "台服",
      "Emulator.PackageName.com.bilibili.blhx.huawei": "国服 华为渠道服 com.bilibili.blhx.huawei",
      "Emulator.PackageName.com.bilibili.blhx.honor": "国服 荣耀渠道服 com.bilibili.blhx.honor",
      "Emulator.PackageName.com.bilibili.blhx.mi": "国服 小米渠道服 com.bilibili.blhx.mi",
      "Emulator.PackageName.com.tencent.tmgp.bilibili.blhx": "国服 腾讯应用宝渠道服 com.tencent.tmgp.bilibili.blhx",
      "Emulator.PackageName.com.bilibili.blhx.baidu": "国服 百度渠道服 com.bilibili.blhx.baidu",
      "Emulator.PackageName.com.bilibili.blhx.qihoo": "国服 360渠道服 com.bilibili.blhx.qihoo",
      "Emulator.PackageName.com.bilibili.blhx.nearme.gamecenter": "国服 oppo渠道服 com.bilibili.blhx.nearme.gamecenter",
      "Emulator.PackageName.com.bilibili.blhx.vivo": "国服 vivo渠道服 com.bilibili.blhx.vivo",
      "Emulator.PackageName.com.bilibili.blhx.mz": "国服 魅族渠道服 com.bilibili.blhx.mz",
      "Emulator.PackageName.com.bilibili.blhx.dl": "国服 当乐渠道服 com.bilibili.blhx.dl",
      "Emulator.PackageName.com.bilibili.blhx.lenovo": "国服 联想渠道服 com.bilibili.blhx.lenovo",
      "Emulator.PackageName.com.bilibili.blhx.uc": "国服 UC九游渠道服 com.bilibili.blhx.uc",
      "Emulator.PackageName.com.bilibili.blhx.mzw": "国服 拇指玩渠道服 com.bilibili.blhx.mzw",
      "Emulator.PackageName.com.yiwu.blhx.yx15": "国服 一五游戏渠道服 com.yiwu.blhx.yx15",
      "Emulator.PackageName.com.bilibili.blhx.m4399": "国服 4399渠道服 com.bilibili.blhx.m4399",
      "Emulator.PackageName.com.bilibili.blhx.bilibiliMove": "国服 迁移渠道服 com.bilibili.blhx.bilibiliMove",
      "Emulator.PackageName.com.hkmanjuu.azurlane.gp.mc": "台服 com.hkmanjuu.azurlane.gp.mc",
      "Emulator.ServerName.name": "游戏内服务器",
      "Emulator.ServerName.help": "选择游戏内所在的服务器以启用服务器状态检测\n当服务器维护或网络不可用时挂起直到恢复",
      "Emulator.ServerName.disabled": "不使用检测",
      "Emulator.ServerName.cn_android-0": "[国服] 莱茵演习",
      "Emulator.ServerName.cn_android-1": "[国服] 巴巴罗萨",
      "Emulator.ServerName.cn_android-2": "[国服] 霸王行动",
      "Emulator.ServerName.cn_android-3": "[国服] 冰山行动",
      "Emulator.ServerName.cn_android-4": "[国服] 彩虹计划",
      "Emulator.ServerName.cn_android-5": "[国服] 发电机计划",
      "Emulator.ServerName.cn_android-6": "[国服] 瞭望台行动",
      "Emulator.ServerName.cn_android-7": "[国服] 十字路口行动",
      "Emulator.ServerName.cn_android-8": "[国服] 朱诺行动",
      "Emulator.ServerName.cn_android-9": "[国服] 杜立特空袭",
      "Emulator.ServerName.cn_android-10": "[国服] 地狱犬行动",
      "Emulator.ServerName.cn_android-11": "[国服] 开罗宣言",
      "Emulator.ServerName.cn_android-12": "[国服] 奥林匹克行动",
      "Emulator.ServerName.cn_android-13": "[国服] 小王冠行动",
      "Emulator.ServerName.cn_android-14": "[国服] 波茨坦公告",
      "Emulator.ServerName.cn_android-15": "[国服] 白色方案",
      "Emulator.ServerName.cn_android-16": "[国服] 瓦尔基里行动",
      "Emulator.ServerName.cn_android-17": "[国服] 曼哈顿计划",
      "Emulator.ServerName.cn_android-18": "[国服] 八月风暴",
      "Emulator.ServerName.cn_android-19": "[国服] 秋季旅行",
      "Emulator.ServerName.cn_android-20": "[国服] 水星行动",
      "Emulator.ServerName.cn_android-21": "[国服] 莱茵河卫兵",
      "Emulator.ServerName.cn_android-22": "[国服] 北极光计划",
      "Emulator.ServerName.cn_android-23": "[国服] 长戟计划",
      "Emulator.ServerName.cn_android-24": "[国服] 暴雨行动",
      "Emulator.ServerName.cn_android-25": "[国服] 水仙行动",
      "Emulator.ServerName.cn_android-26": "[国服] 冬月计划",
      "Emulator.ServerName.cn_android-27": "[国服] 长弓计划",
      "Emulator.ServerName.cn_android-28": "[国服] 裁决协议",
      "Emulator.ServerName.cn_android-29": "[国服] 帷幕计划",
      "Emulator.ServerName.cn_ios-0": "[国服] 夏威夷",
      "Emulator.ServerName.cn_ios-1": "[国服] 珊瑚海",
      "Emulator.ServerName.cn_ios-2": "[国服] 中途岛",
      "Emulator.ServerName.cn_ios-3": "[国服] 铁底湾",
      "Emulator.ServerName.cn_ios-4": "[国服] 所罗门",
      "Emulator.ServerName.cn_ios-5": "[国服] 马里亚纳",
      "Emulator.ServerName.cn_ios-6": "[国服] 莱特湾",
      "Emulator.ServerName.cn_ios-7": "[国服] 硫磺岛",
      "Emulator.ServerName.cn_ios-8": "[国服] 冲绳岛",
      "Emulator.ServerName.cn_ios-9": "[国服] 阿留申群岛",
      "Emulator.ServerName.cn_ios-10": "[国服] 马耳他",
      "Emulator.ServerName.cn_channel-0": "[国服] 皇家巡游",
      "Emulator.ServerName.cn_channel-1": "[国服] 大西洋宪章",
      "Emulator.ServerName.cn_channel-2": "[国服] 十字军行动",
      "Emulator.ServerName.cn_channel-3": "[国服] 龙骑兵行动",
      "Emulator.ServerName.cn_channel-4": "[国服] 冥王星行动",
      "Emulator.ServerName.cn_channel-5": "[国服] 群岛计划",
      "Emulator.ServerName.en-0": "[EN] Avrora",
      "Emulator.ServerName.en-1": "[EN] Lexington",
      "Emulator.ServerName.en-2": "[EN] Sandy",
      "Emulator.ServerName.en-3": "[EN] Washington",
      "Emulator.ServerName.en-4": "[EN] Amagi",
      "Emulator.ServerName.en-5": "[EN] Little Enterprise",
      "Emulator.ServerName.en-6": "[EN] Belfast",
      "Emulator.ServerName.jp-0": "[JP] ブレスト",
      "Emulator.ServerName.jp-1": "[JP] 横須賀",
      "Emulator.ServerName.jp-2": "[JP] 佐世保",
      "Emulator.ServerName.jp-3": "[JP] 呉",
      "Emulator.ServerName.jp-4": "[JP] 舞鶴",
      "Emulator.ServerName.jp-5": "[JP] ルルイエ",
      "Emulator.ServerName.jp-6": "[JP] サモア",
      "Emulator.ServerName.jp-7": "[JP] 大湊",
      "Emulator.ServerName.jp-8": "[JP] トラック",
      "Emulator.ServerName.jp-9": "[JP] ラバウル",
      "Emulator.ServerName.jp-10": "[JP] 鹿児島",
      "Emulator.ServerName.jp-11": "[JP] マドラス",
      "Emulator.ServerName.jp-12": "[JP] サンディエゴ",
      "Emulator.ServerName.jp-13": "[JP] 竹敷",
      "Emulator.ServerName.jp-14": "[JP] キール",
      "Emulator.ServerName.jp-15": "[JP] 若松",
      "Emulator.ServerName.jp-16": "[JP] オデッサ",
      "Emulator.ServerName.jp-17": "[JP] スイートバン",
      "Emulator.ServerName.tw-0": "[TW] 珍珠港",
      "Emulator.ServerName.tw-1": "[TW] 珊瑚海",
      "Emulator.ServerName.tw-2": "[TW] 中途島",
      "Emulator.ServerName.tw-3": "[TW] 瓜達康納爾",
      "Emulator.ServerName.tw-4": "[TW] 雷伊泰灣",
      "Emulator.ScreenshotMethod.name": "选择截图方案",
      "Emulator.ScreenshotMethod.help": "使用自动选择时，将执行一次性能测试并自动更改为最快的截图方案\n一般情况下的速度: DroidCast_raw >> aScreenCap_nc > ADB_nc >>> aScreenCap > uiautomator2 ~= ADB\n运行 工具 - 性能测试 以寻找最快的方案",
      "Emulator.ScreenshotMethod.auto": "自动选择最快的",
      "Emulator.ScreenshotMethod.ADB": "ADB",
      "Emulator.ScreenshotMethod.ADB_nc": "ADB_nc",
      "Emulator.ScreenshotMethod.uiautomator2": "uiautomator2",
      "Emulator.ScreenshotMethod.aScreenCap": "aScreenCap",
      "Emulator.ScreenshotMethod.aScreenCap_nc": "aScreenCap_nc",
      "Emulator.ScreenshotMethod.DroidCast": "DroidCast",
      "Emulator.ScreenshotMethod.DroidCast_raw": "DroidCast_raw",
      "Emulator.ScreenshotMethod.nemu_ipc": "nemu_ipc",
      "Emulator.ScreenshotMethod.ldopengl": "ldopengl",
      "Emulator.ControlMethod.name": "选择控制方案",
      "Emulator.ControlMethod.help": "点击/滑动的注入方式。速度: minitouch ≈ MaaTouch > ADB >>> uiautomator2，推荐 MaaTouch（minitouch 在部分新安卓设备上不稳定）。\n⚠️ nemu_ipc 需与截图方式配套使用（截图选 nemu_ipc 时启动会自动联动）：其触控走模拟器内部 RPC，低性能电脑上滑动易丢步、拖拽易变形，调用偶发挂死会丢失点击；滑动或拖拽异常时请改回 minitouch / MaaTouch。",
      "Emulator.ControlMethod.ADB": "ADB",
      "Emulator.ControlMethod.uiautomator2": "uiautomator2",
      "Emulator.ControlMethod.minitouch": "minitouch",
      "Emulator.ControlMethod.Hermit": "Hermit",
      "Emulator.ControlMethod.MaaTouch": "MaaTouch",
      "Emulator.ControlMethod.nemu_ipc": "nemu_ipc",
      "Emulator.GameSettings.name": "自动应用推荐游戏设置",
      "Emulator.GameSettings.help": "在启动游戏前，自动尝试应用推荐的帧率、剧情、大型作战、提示及确认设置。仅在游戏进程已完全停止、具备 root 或 su 权限且写入校验通过时执行。设置数据仅在内存中处理，不创建备份或恢复文件；无法安全执行时将跳过，不影响游戏正常启动。",
      "Emulator.GameSettings.true": "true",
      "Emulator.GameSettings.false": "false",
      "Emulator.ScreenshotDedithering.name": "去除图片色彩抖动",
      "Emulator.ScreenshotDedithering.help": "在手机上运行时开启",
      "Emulator.AdbRestart.name": "在检测不到设备的时候尝试重启adb",
      "Emulator.AdbRestart.help": "",
      "EmulatorInfo.Emulator.name": "选择模拟器类型",
      "EmulatorInfo.Emulator.help": "",
      "EmulatorInfo.Emulator.auto": "自动检测",
      "EmulatorInfo.Emulator.NoxPlayer": "夜神模拟器",
      "EmulatorInfo.Emulator.NoxPlayer64": "夜神模拟器64位",
      "EmulatorInfo.Emulator.BlueStacks4": "蓝叠模拟器4",
      "EmulatorInfo.Emulator.BlueStacks5": "蓝叠模拟器5",
      "EmulatorInfo.Emulator.BlueStacks4HyperV": "蓝叠模拟器4 Hyper-V",
      "EmulatorInfo.Emulator.BlueStacks5HyperV": "蓝叠模拟器5 Hyper-V",
      "EmulatorInfo.Emulator.LDPlayer3": "雷电模拟器3",
      "EmulatorInfo.Emulator.LDPlayer4": "雷电模拟器4",
      "EmulatorInfo.Emulator.LDPlayer9": "雷电模拟器9",
      "EmulatorInfo.Emulator.LDPlayer14": "LDPlayer14",
      "EmulatorInfo.Emulator.MuMuPlayer": "MuMu模拟器",
      "EmulatorInfo.Emulator.MuMuPlayerX": "MuMu模拟器X",
      "EmulatorInfo.Emulator.MuMuPlayer12": "MuMu模拟器12",
      "EmulatorInfo.Emulator.MEmuPlayer": "逍遥模拟器",
      "EmulatorInfo.Emulator.BlueStacksAir": "BlueStacksAir",
      "EmulatorInfo.Emulator.MuMuPro": "MuMuPro",
      "EmulatorInfo.Emulator.SSH": "SSH",
      "EmulatorInfo.name.name": "模拟器实例名称",
      "EmulatorInfo.name.help": "",
      "EmulatorInfo.path.name": "模拟器安装路径",
      "EmulatorInfo.path.help": "",
      "EmulatorInfo.EnableRemoteSSH.name": "启用远程 SSH 管理",
      "EmulatorInfo.EnableRemoteSSH.help": "在重启模拟器之前，通过 SSH 在远程服务器上执行特定指令（如重启 Docker 容器）。",
      "EmulatorInfo.EnableRemoteSSH.true": "true",
      "EmulatorInfo.EnableRemoteSSH.false": "false",
      "EmulatorInfo.RemoteSSHHost.name": "远程服务器地址",
      "EmulatorInfo.RemoteSSHHost.help": "远程服务器的 IP 地址或域名，例如: 192.168.1.100",
      "EmulatorInfo.RemoteSSHPort.name": "端口号",
      "EmulatorInfo.RemoteSSHPort.help": "SSH 服务端口，默认 22",
      "EmulatorInfo.RemoteSSHUser.name": "SSH 用户名",
      "EmulatorInfo.RemoteSSHUser.help": "登录 SSH 的用户名，例如: root",
      "EmulatorInfo.RemoteSSHPublicKey.name": "SSH 私钥",
      "EmulatorInfo.RemoteSSHPublicKey.help": "SSH 登录所需的私钥内容（如果需要）",
      "EmulatorInfo.RemoteStartCommand.name": "远程启动指令",
      "EmulatorInfo.RemoteStartCommand.help": "在重启模拟器时执行的启动 SSH 指令（如启动 Docker 容器）",
      "EmulatorInfo.RemoteStopCommand.name": "远程停止指令",
      "EmulatorInfo.RemoteStopCommand.help": "在重启模拟器时执行的停止 SSH 指令（如停止 Docker 容器）",
      "Error.HandleError.name": "启用异常处理",
      "Error.HandleError.help": "处理部分异常，运行出错时撤退",
      "Error.SaveError.name": "出错时，保存 Log 和截图",
      "Error.SaveError.help": "",
      "Error.StrictRestart.name": "敏感任务出错时禁止重启",
      "Error.StrictRestart.help": "运行敏感任务出错时停止AzurPilot，而不是重启游戏\n敏感任务包含隐秘海域、深渊坐标、跨月每日",
      "Error.SaveErrorCount.name": "最多保存 X 个错误日志",
      "Error.SaveErrorCount.help": "超出上限的错误日志将被删除，若为0或负值则没有限制",
      "Error.OnePushConfig.name": "错误推送设置",
      "Error.OnePushConfig.help": "发生无法处理的异常后，使用 Onepush 推送一条错误信息。配置方法见文档：https://github.com/LmeSzinc/AzurLaneAutoScript/wiki/Onepush-configuration-%5BCN%5D",
      "Error.ScreenshotLength.name": "出错时，保留最后 X 张截图",
      "Error.ScreenshotLength.help": "",
      "Error.GameStuckRestart.name": "游戏卡死时重启模拟器",
      "Error.GameStuckRestart.help": "在游戏连续卡死（触发GameStuckError）达到指定次数后，尝试重启模拟器。可能有助于解决模拟器假死或显存溢出等问题。",
      "Error.GameStuckThreshold.name": "游戏卡死超过 X 秒后重启",
      "Error.GameStuckThreshold.help": "连续卡死多少次后触发重启。",
      "Error.AdbOfflineRestart.name": "检测不到设备时重启模拟器",
      "Error.AdbOfflineRestart.help": "在连续检测不到设备（ADB离线或连接失败）达到指定次数后，尝试重启模拟器。",
      "Error.AdbOfflineThreshold.name": "检测不到设备超过 X 秒后重启",
      "Error.AdbOfflineThreshold.help": "连续检测不到设备多少次后触发重启。",
      "Error.WatchdogEnable.name": "启用看门狗总开关",
      "Error.WatchdogEnable.help": "看门狗总开关。关闭后，所有看门狗检测均不生效。开启后，仍需单独开启下面的子开关。默认关闭。",
      "Error.WatchdogTaskEnable.name": "任务跑太久自动重启",
      "Error.WatchdogTaskEnable.help": "开了之后，如果某个任务跑得太久（比如一直卡在某个剧情跳不过去、地图走不动了），就会自动重启模拟器把它打断。\n得先开上面的「看门狗总开关」才管用。默认关。",
      "Error.WatchdogTaskTimeout.name": "任务卡死保护超时（分钟）",
      "Error.WatchdogTaskTimeout.help": "单个任务运行超过指定时间后没切换其他任务（一般委托科研切换后会重新计算）判定任务逻辑死循环（如剧情无法跳过、寻路死循环等），强制重启模拟器以中断任务。\n0 表示禁用；99999 表示几乎无限制。\n默认 120 分钟（2 小时）。",
      "Error.RestartOperationTimeoutEnable.name": "重启游戏保护开关",
      "Error.RestartOperationTimeoutEnable.help": "",
      "Error.RestartOperationTimeout.name": "重启游戏卡多久算死（秒）",
      "Error.RestartOperationTimeout.help": "重启游戏时，关游戏或开游戏这一步卡住超过这个秒数，就当模拟器卡死了，直接去重启模拟器。\n得先开上面的「重启游戏超时保护」才管用。\n默认 120 秒。",
      "Error.LlmAnalysis.name": "启用 LLM 错误分析",
      "Error.LlmAnalysis.help": "在发生无法处理的异常时，自动调用 LLM 分析错误原因并提供改进建议。",
      "Error.LlmApiKey.name": "LLM API Key",
      "Error.LlmApiKey.help": "请自行前往 https://platform.deepseek.com/ 或 https://platform.xiaomimimo.com/ 购买模型服务并获取 API Key。",
      "Error.LlmApiBase.name": "LLM API Base",
      "Error.LlmApiBase.help": "填写模型服务提供商的 OpenAI 兼容 Base URL，可参考 https://platform.deepseek.com/ 或 https://platform.xiaomimimo.com/ 的接入说明。",
      "Error.LlmModel.name": "LLM 模型",
      "Error.LlmModel.help": "填写已购买服务支持的模型名称，请以 https://platform.deepseek.com/ 或 https://platform.xiaomimimo.com/ 平台展示为准。",
      "DailySummary.Enable.name": "启用每日总结",
      "DailySummary.Enable.help": "开启后，AzurPilot 会在设定时间生成并推送当日运行总结。",
      "DailySummary.Enable.true": "true",
      "DailySummary.Enable.false": "false",
      "DailySummary.TriggerTime.name": "生成时间",
      "DailySummary.TriggerTime.help": "按游戏服务器时区生成日报的时间，格式为 HH:MM，例如 20:00。",
      "Optimization.OcrDevice.name": "OCR设备",
      "Optimization.OcrDevice.help": "选择 OCR 推理设备。\n自动选择：Windows 按 QNN NPU、OpenVINO NPU、OpenVINO 独显 GPU、DirectML 独显 GPU、OpenVINO CPU、CPU 的顺序尝试；关闭“自动安装并使用厂商 EP”后只尝试 DirectML 独显 GPU 和 CPU。\nQNN/OpenVINO 设备仅适用于 ONNX Runtime，ANE 仅适用于 Apple Silicon Mac。",
      "Optimization.OcrDevice.auto": "自动选择",
      "Optimization.OcrDevice.qnn_npu": "QNN NPU",
      "Optimization.OcrDevice.openvino_npu": "OpenVINO NPU",
      "Optimization.OcrDevice.openvino_gpu": "OpenVINO 独显 GPU",
      "Optimization.OcrDevice.gpu": "DirectML 独显 GPU",
      "Optimization.OcrDevice.openvino_cpu": "OpenVINO CPU",
      "Optimization.OcrDevice.cpu": "CPU",
      "Optimization.OcrDevice.ane": "ANE (Apple)",
      "Optimization.OcrBackend.name": "OCR后端",
      "Optimization.OcrBackend.help": "选择OCR推理引擎。onnxruntime 使用 ONNX Runtime，ncnn 使用 ncnn Vulkan 后端。自动默认使用 onnxruntime。",
      "Optimization.OcrBackend.auto": "自动 (onnxruntime)",
      "Optimization.OcrBackend.onnxruntime": "ONNX Runtime",
      "Optimization.OcrBackend.ncnn": "ncnn (Vulkan)",
      "Optimization.OcrWindowsMlVendorEp.name": "自动安装并使用厂商 EP",
      "Optimization.OcrWindowsMlVendorEp.help": "允许 Windows ML 通过 Windows Update 下载并使用 QNN/OpenVINO 厂商 EP。",
      "Optimization.OcrWindowsMlVendorEp.true": "true",
      "Optimization.OcrWindowsMlVendorEp.false": "false",
      "Optimization.OcrModelVersionEnglish.name": "OCR英文模型版本",
      "Optimization.OcrModelVersionEnglish.help": "选择英文 OCR 模型档位。lite 轻量最快，standard 均衡，pro 精度最高。auto 使用旧版 alocr_en_v2_6。alocr_en_v2_6 为旧版 AlOCR 专用英文模型，仅 ONNX 后端可用。该项影响英文 Azur Lane 模型。",
      "Optimization.OcrModelVersionEnglish.auto": "自动推荐",
      "Optimization.OcrModelVersionEnglish.lite": "Lite 轻量",
      "Optimization.OcrModelVersionEnglish.standard": "Standard 标准",
      "Optimization.OcrModelVersionEnglish.pro": "Pro 高精度",
      "Optimization.OcrModelVersionEnglish.alocr_en_v2_6": "AlOCR v2.6（旧版）",
      "Optimization.OcrModelVersionChinese.name": "OCR中文模型版本",
      "Optimization.OcrModelVersionChinese.help": "选择简体中文 OCR 模型档位。lite 轻量最快，standard 均衡，pro 精度最高。auto 使用旧版 alocr_cn_v3。alocr_cn_v3 为旧版 AlOCR 专用中文模型，仅 ONNX 后端可用。该项影响 cnocr/中文模型。",
      "Optimization.OcrModelVersionChinese.auto": "自动推荐",
      "Optimization.OcrModelVersionChinese.lite": "Lite 轻量",
      "Optimization.OcrModelVersionChinese.standard": "Standard 标准",
      "Optimization.OcrModelVersionChinese.pro": "Pro 高精度",
      "Optimization.OcrModelVersionChinese.alocr_cn_v3": "AlOCR v3（旧版）",
      "Optimization.OcrModelVersionJapanese.name": "OCR日文模型版本",
      "Optimization.OcrModelVersionJapanese.help": "选择日文 OCR 模型档位。lite 轻量最快但不支持日语，standard 均衡，pro 精度最高。auto 使用 standard。该项影响日文模型。",
      "Optimization.OcrModelVersionJapanese.auto": "自动推荐",
      "Optimization.OcrModelVersionJapanese.lite": "Lite 轻量",
      "Optimization.OcrModelVersionJapanese.standard": "Standard 标准",
      "Optimization.OcrModelVersionJapanese.pro": "Pro 高精度",
      "Optimization.OcrModelVersionTraditionalChinese.name": "OCR繁中模型版本",
      "Optimization.OcrModelVersionTraditionalChinese.help": "选择繁体中文 OCR 模型档位。lite 轻量最快，standard 均衡，pro 精度最高。auto 使用 standard。",
      "Optimization.OcrModelVersionTraditionalChinese.auto": "自动推荐",
      "Optimization.OcrModelVersionTraditionalChinese.lite": "Lite 轻量",
      "Optimization.OcrModelVersionTraditionalChinese.standard": "Standard 标准",
      "Optimization.OcrModelVersionTraditionalChinese.pro": "Pro 高精度",
      "Optimization.ScreenshotInterval.name": "放慢截图速度至 X 秒一张",
      "Optimization.ScreenshotInterval.help": "执行两次截图之间的最小间隔，限制在 0.001 ~ 0.3，对于高配置电脑能降低 CPU 占用",
      "Optimization.CombatScreenshotInterval.name": "战斗中放慢截图速度至 X 秒一张",
      "Optimization.CombatScreenshotInterval.help": "执行两次截图之间的最小间隔，限制在 0.001 ~ 1.0，能降低战斗时的 CPU 占用",
      "Optimization.TaskHoardingDuration.name": "囤积任务 X 分钟",
      "Optimization.TaskHoardingDuration.help": "能在收菜期间降低操作游戏的频率\n任务触发后，等待 X 分钟，再一次性执行囤积的任务",
      "Optimization.CloseEmulatorDuringLongWait.name": "长时间等待时关闭模拟器",
      "Optimization.CloseEmulatorDuringLongWait.help": "当下一个任务超过 3 小时后运行时，等待期间关闭模拟器以节省内存和 CPU。",
      "Optimization.CloseEmulatorDuringLongWait.true": "true",
      "Optimization.CloseEmulatorDuringLongWait.false": "false",
      "Optimization.WhenTaskQueueEmpty.name": "当任务队列清空后",
      "Optimization.WhenTaskQueueEmpty.help": "无任务时关闭游戏，能在收菜期间降低 CPU 占用",
      "Optimization.WhenTaskQueueEmpty.stay_there": "停在原处",
      "Optimization.WhenTaskQueueEmpty.goto_main": "前往主界面",
      "Optimization.WhenTaskQueueEmpty.close_game": "关闭游戏",
      "Optimization.WhenSchedulerStopped.name": "停止调度器后",
      "Optimization.WhenSchedulerStopped.help": "在 WebUI 中停止调度器后执行的操作",
      "Optimization.WhenSchedulerStopped.stay_there": "停在原处",
      "Optimization.WhenSchedulerStopped.goto_main": "前往主界面",
      "Optimization.WhenSchedulerStopped.close_game": "关闭游戏",
      "Optimization.WhenSchedulerStopped.close_emulator": "关闭模拟器",
      "Optimization.WarmupEnable.name": "在任务开始前预热启动模拟器与游戏",
      "Optimization.WarmupEnable.help": "开启后，若在等待期间关闭了模拟器/游戏（长时间等待关闭模拟器，或任务队列清空后关闭游戏），会在任务开始前提前启动模拟器与游戏并登录到主界面，任务到点即可直接执行，不再因冷启动而延误。预热开启时，不足『提前量』的短等待不会再关闭游戏。",
      "Optimization.WarmupEnable.true": "true",
      "Optimization.WarmupEnable.false": "false",
      "Optimization.WarmupMinutes.name": "在任务开始前 X 分钟预热启动模拟器与游戏",
      "Optimization.WarmupMinutes.help": "预热启动相对任务开始时间的提前量，仅用于尚无实测记录的首次预热。每次预热成功后会自动记录本次实际耗时，之后按『上次实测耗时 + 2 分钟』自动提前，使游戏就绪后只需等待约 2 分钟。",
      "DropRecord.SaveFolder.name": "掉落保存目录",
      "DropRecord.SaveFolder.help": "",
      "DropRecord.AzurStatsID.name": "AzurStat ID",
      "DropRecord.AzurStatsID.help": "上传至 https://azur-stats.lyoko.io 时，声明的客户端 ID\n由随机字符组成，可随意修改",
      "DropRecord.API.name": "上传线路",
      "DropRecord.API.help": "如果国内用户无法连接到 AzurStat，可以使用\"国内反向代理\"",
      "DropRecord.API.default": "默认 (Cloudflare)",
      "DropRecord.API.cn_gz_reverse_proxy": "国内反向代理 (广州)",
      "DropRecord.ResearchRecord.name": "科研截图",
      "DropRecord.ResearchRecord.help": "",
      "DropRecord.ResearchRecord.do_not": "无操作",
      "DropRecord.ResearchRecord.save": "保存",
      "DropRecord.ResearchRecord.upload": "上传",
      "DropRecord.ResearchRecord.save_and_upload": "保存并上传",
      "DropRecord.CommissionRecord.name": "委托截图",
      "DropRecord.CommissionRecord.help": "",
      "DropRecord.CommissionRecord.do_not": "无操作",
      "DropRecord.CommissionRecord.save": "保存",
      "DropRecord.CommissionRecord.upload": "上传",
      "DropRecord.CommissionRecord.save_and_upload": "保存并上传",
      "DropRecord.CombatRecord.name": "战斗掉落截图",
      "DropRecord.CombatRecord.help": "启用后会放缓结算时的点击速度\n在自律寻敌下不生效",
      "DropRecord.CombatRecord.do_not": "无操作",
      "DropRecord.CombatRecord.save": "保存",
      "DropRecord.OpsiRecord.name": "大世界掉落截图",
      "DropRecord.OpsiRecord.help": "",
      "DropRecord.OpsiRecord.do_not": "无操作",
      "DropRecord.OpsiRecord.save": "保存",
      "DropRecord.OpsiRecord.upload": "上传",
      "DropRecord.OpsiRecord.save_and_upload": "保存并上传",
      "DropRecord.MeowfficerBuy.name": "指挥喵购买截图",
      "DropRecord.MeowfficerBuy.help": "",
      "DropRecord.MeowfficerBuy.do_not": "无操作",
      "DropRecord.MeowfficerBuy.save": "保存",
      "DropRecord.MeowfficerTalent.name": "指挥喵天赋截图",
      "DropRecord.MeowfficerTalent.help": "",
      "DropRecord.MeowfficerTalent.do_not": "无操作",
      "DropRecord.MeowfficerTalent.save": "保存",
      "DropRecord.MeowfficerTalent.upload": "上传",
      "DropRecord.MeowfficerTalent.save_and_upload": "保存并上传",
      "DropRecord.TelemetryReport.name": "遥测数据上报",
      "DropRecord.TelemetryReport.help": "启用后将定期向服务器匿名上报 CL1 统计数据（战斗次数、明石遇见概率等匿名数据）。ID 生成详见源码，统计信息见 https://alas.nanoda.work/",
      "DropRecord.BugReport.name": "Bug 日志上报",
      "DropRecord.BugReport.help": "启用后将在遇到异常时向服务器匿名上报 Bug 日志以帮助改进。ID 生成详见源码",
      "EmulatorManagement.ScheduledEmulatorRestart.name": "定时重启模拟器",
      "EmulatorManagement.ScheduledEmulatorRestart.help": "每隔一段时间自动重启模拟器，免得跑久了变卡或漏内存。\n注意：默认是等当前任务跑完才重启。",
      "EmulatorManagement.ForceScheduledRestart.name": "强制定时重启（不等任务）",
      "EmulatorManagement.ForceScheduledRestart.help": "开了后，到点就直接重启模拟器，不等当前任务跑完。\n不过如果当前正在跑重要任务（敏感任务），还是会等它跑完再重启。\n得先开上面的「定时重启模拟器」才管用。默认关。",
      "EmulatorManagement.RestartIntervalHours.name": "重启间隔（小时）",
      "EmulatorManagement.RestartIntervalHours.help": "每隔多少小时自动重启一次模拟器。",
      "Storage.Storage.name": "存储空间",
      "Storage.Storage.help": "清除任务内部存储的状态数据"
    }
  },
  "Commission": {
    "task": "Commission",
    "label": "委托",
    "groupLabels": {
      "Scheduler": "任务设置",
      "Commission": "委托",
      "Storage": "任务状态"
    },
    "args": {
      "Scheduler": {
        "Enable": {
          "type": "checkbox",
          "value": true,
          "option": [
            true,
            false
          ]
        },
        "PushNotification": {
          "type": "checkbox",
          "value": false,
          "option": [
            true,
            false
          ]
        },
        "NextRun": {
          "type": "datetime",
          "value": "2020-01-01 00:00:00",
          "validate": "datetime"
        },
        "Command": {
          "type": "input",
          "value": "Commission",
          "display": "hide"
        },
        "SuccessInterval": {
          "type": "input",
          "value": "30-60",
          "display": "hide"
        },
        "FailureInterval": {
          "type": "input",
          "value": "30-60",
          "display": "hide"
        },
        "ServerUpdate": {
          "type": "input",
          "value": "00:00",
          "display": "hide"
        },
        "Sensitive": {
          "type": "checkbox",
          "value": false,
          "option": [
            true,
            false
          ]
        }
      },
      "Commission": {
        "PresetFilter": {
          "type": "select",
          "value": "cube",
          "option": [
            "cube",
            "cube_24h",
            "chip",
            "chip_24h",
            "oil",
            "custom"
          ]
        },
        "DynamicProgramming": {
          "type": "checkbox",
          "value": true
        },
        "TierValueRatio": {
          "type": "input",
          "value": 2
        },
        "DelayHalfLife": {
          "type": "input",
          "value": 100
        },
        "DeadlineFutureHorizon": {
          "type": "input",
          "value": 0.5
        },
        "FilterValueFloor": {
          "type": "input",
          "value": 0.6
        },
        "FilterValueHalfLife": {
          "type": "input",
          "value": 4
        },
        "CustomFilter": {
          "type": "textarea",
          "value": "DailyEvent > Gem-4 > Gem-2 > Gem-8 > ExtraCube-0:30\n> UrgentCube-1:30 > UrgentCube-1:45 > UrgentCube-3\n> ExtraDrill-5:20 > ExtraDrill-2 > ExtraDrill-3:20\n> UrgentCube-2:15 > UrgentCube-4\n> ExtraDrill-1 > UrgentCube-6 > ExtraCube-1:30\n> ExtraDrill-2:40 > ExtraDrill-0:20\n> Major > DailyChip > DailyResource\n> ExtraPart-0:30 > ExtraOil-1 > UrgentBox-6\n> ExtraCube-3 > ExtraPart-1 > UrgentBox-3\n> ExtraCube-4 > ExtraPart-1:30 > ExtraOil-4\n> UrgentBox-1 > ExtraCube-5 > UrgentBox-1\n> ExtraCube-8 > ExtraOil-8\n> UrgentDrill-4 > UrgentDrill-2:40 > UrgentDrill-2\n> UrgentDrill-1 > UrgentDrill-1:30 > UrgentDrill-1:10\n> Extra-0:20 > Extra-0:30 > Extra-1:00 > Extra-1:30 > Extra-2:00\n> shortest"
        },
        "Blacklist": {
          "type": "textarea",
          "value": ""
        },
        "DoMajorCommission": {
          "type": "checkbox",
          "value": false
        },
        "CommissionNotifyReward": {
          "type": "checkbox",
          "value": false
        },
        "CommissionNotifyRewardStatistics": {
          "type": "checkbox",
          "value": true
        },
        "DetectShipDrop": {
          "type": "checkbox",
          "value": false,
          "option": [
            true,
            false
          ]
        },
        "GemNotify": {
          "type": "checkbox",
          "value": true
        },
        "GemStatistics": {
          "type": "checkbox",
          "value": false
        },
        "GemStatisticsPeriod": {
          "type": "select",
          "value": "month",
          "option": [
            "today",
            "week",
            "month"
          ]
        }
      },
      "Storage": {
        "Storage": {
          "type": "storage",
          "value": {},
          "display": "disabled"
        }
      }
    },
    "values": {
      "Scheduler": {
        "Enable": true,
        "PushNotification": false,
        "NextRun": "2020-01-01 00:00:00",
        "Command": "Commission",
        "SuccessInterval": "30-60",
        "FailureInterval": "30-60",
        "ServerUpdate": "00:00",
        "Sensitive": false
      },
      "Commission": {
        "PresetFilter": "cube",
        "DynamicProgramming": true,
        "TierValueRatio": 2,
        "DelayHalfLife": 100,
        "DeadlineFutureHorizon": 0.5,
        "FilterValueFloor": 0.6,
        "FilterValueHalfLife": 4,
        "CustomFilter": "DailyEvent > Gem-4 > Gem-2 > Gem-8 > ExtraCube-0:30\n> UrgentCube-1:30 > UrgentCube-1:45 > UrgentCube-3\n> ExtraDrill-5:20 > ExtraDrill-2 > ExtraDrill-3:20\n> UrgentCube-2:15 > UrgentCube-4\n> ExtraDrill-1 > UrgentCube-6 > ExtraCube-1:30\n> ExtraDrill-2:40 > ExtraDrill-0:20\n> Major > DailyChip > DailyResource\n> ExtraPart-0:30 > ExtraOil-1 > UrgentBox-6\n> ExtraCube-3 > ExtraPart-1 > UrgentBox-3\n> ExtraCube-4 > ExtraPart-1:30 > ExtraOil-4\n> UrgentBox-1 > ExtraCube-5 > UrgentBox-1\n> ExtraCube-8 > ExtraOil-8\n> UrgentDrill-4 > UrgentDrill-2:40 > UrgentDrill-2\n> UrgentDrill-1 > UrgentDrill-1:30 > UrgentDrill-1:10\n> Extra-0:20 > Extra-0:30 > Extra-1:00 > Extra-1:30 > Extra-2:00\n> shortest",
        "Blacklist": "",
        "DoMajorCommission": false,
        "CommissionNotifyReward": false,
        "CommissionNotifyRewardStatistics": true,
        "DetectShipDrop": false,
        "GemNotify": true,
        "GemStatistics": false,
        "GemStatisticsPeriod": "month"
      },
      "Storage": {
        "Storage": {}
      }
    },
    "translations": {
      "Scheduler.Enable.name": "启用该功能",
      "Scheduler.Enable.help": "将这个任务加入调度器",
      "Scheduler.Enable.true": "true",
      "Scheduler.Enable.false": "false",
      "Scheduler.PushNotification.name": "推送通知",
      "Scheduler.PushNotification.help": "启用后，任务完成时会通过 OnePush 推送成功或失败通知",
      "Scheduler.PushNotification.true": "true",
      "Scheduler.PushNotification.false": "false",
      "Scheduler.NextRun.name": "下一次运行时间",
      "Scheduler.NextRun.help": "自动计算的数值，不需要手动修改。清空后将立即运行",
      "Scheduler.Command.name": "内部任务名称",
      "Scheduler.Command.help": "",
      "Scheduler.SuccessInterval.name": "运行成功后，推迟下一次运行 X 分钟",
      "Scheduler.SuccessInterval.help": "",
      "Scheduler.FailureInterval.name": "运行失败后，推迟下一次运行 X 分钟",
      "Scheduler.FailureInterval.help": "",
      "Scheduler.ServerUpdate.name": "服务器刷新时间",
      "Scheduler.ServerUpdate.help": "一些任务运行成功后，将推迟下一次运行至服务器刷新时间\n自动换算时区，一般不需要修改",
      "Scheduler.Sensitive.name": "敏感任务",
      "Scheduler.Sensitive.help": "出错时禁止重启游戏，直接停止 AzurPilot 运行。适用于跨月每日、隐秘海域、深渊坐标等关键时刻任务。",
      "Scheduler.Sensitive.true": "true",
      "Scheduler.Sensitive.false": "false",
      "Commission.PresetFilter.name": "委托过滤器",
      "Commission.PresetFilter.help": "如果对委托的产出和收益没有足够的了解，不建议编写自定义过滤器，建议使用预优化委托过滤器\n如果24小时运行刷紧急委托功能，应当使用（7x24刷委托）的过滤器\n不推荐在运行刷紧急委托功能的同时使用石油优先过滤器",
      "Commission.PresetFilter.cube": "钻石>魔方>石油",
      "Commission.PresetFilter.cube_24h": "钻石>魔方>石油（7x24刷委托）",
      "Commission.PresetFilter.chip": "钻石>心智>魔方",
      "Commission.PresetFilter.chip_24h": "钻石>心智>魔方（7x24刷委托）",
      "Commission.PresetFilter.oil": "钻石>石油>魔方",
      "Commission.PresetFilter.custom": "自定义",
      "Commission.DynamicProgramming.name": "使用全局最优解策略（实验性）",
      "Commission.DynamicProgramming.help": "关闭时使用传统过滤器顺序贪心选择；开启后使用带严格最优性证书的多项式规划，并启用下方五个价值模型参数。\n使用关键字 tier 分隔价值差异较大的委托。\n注意：shortest 关键字的本质是将所有没选的委托按时间顺序帮你填上，且是同一 tier。也就是说 shortest 里所有的委托会看作是差不多的价值。\n如果你 shortest 里的委托里存在价值大于最差的委托的委托，你应该将它们单独写 tier。只有当你认为“前面的委托都没有的话，选个8小时大书也没事”的情况才应该写 shortest。",
      "Commission.TierValueRatio.name": "相邻层级价值倍率",
      "Commission.TierValueRatio.help": "前一 tier 相对后一 tier 的基础价值倍率，必须大于 1。数值越大，越不愿为了低层级委托推迟高层级委托。",
      "Commission.DelayHalfLife.name": "基础等待半衰期（小时）",
      "Commission.DelayHalfLife.help": "数值越小，所有委托的基础等待惩罚越强；必须为正数并支持一位小数。",
      "Commission.DeadlineFutureHorizon.name": "Deadline 折现基准时间（小时）",
      "Commission.DeadlineFutureHorizon.help": "数值越大，相同等待时间和 deadline 下的惩罚越强；必须为正数并支持一位小数。",
      "Commission.FilterValueFloor.name": "层内过滤器价值下限",
      "Commission.FilterValueFloor.help": "同一 tier 内编号非常靠后的规则仍保留的最低价值比例，范围为 0 到 1，不含 0。数值越小，层内顺序影响越强。",
      "Commission.FilterValueHalfLife.name": "层内编号半衰期",
      "Commission.FilterValueHalfLife.help": "同一 tier 内过滤器编号修正向价值下限衰减一半所需的规则数，必须为正数并支持一位小数。数值越小，靠前规则的优势越集中。",
      "Commission.CustomFilter.name": "自定义委托过滤器",
      "Commission.CustomFilter.help": "使用自定义过滤器需将 \"委托过滤器\" 设置为 \"自定义\"。开启实验性动态规划后，可用 tier 分隔价值层级；未填写 tier 时，每条过滤规则分别视为一个层级。规划器按有限层级倍率、层内编号和预计启动等待时间计算折现价值，必要时会放弃低价值委托。传统贪心策略会忽略 tier；shortest 用于补足未匹配委托。",
      "Commission.Blacklist.name": "委托黑名单",
      "Commission.Blacklist.help": "填写要忽略的委托过滤规则，多个规则请使用英文半角逗号（,）分隔，例如 ExtraBook, UrgentOil-8, Major。传统贪心策略和规划算法都会忽略匹配项。",
      "Commission.DoMajorCommission.name": "做主要委托（1200油/1000油委托）",
      "Commission.DoMajorCommission.help": "1200油委托现在已经过时，收益很低，建议关闭",
      "Commission.CommissionNotifyReward.name": "委托奖励推送通知",
      "Commission.CommissionNotifyReward.help": "获得委托奖励时推送通知（特别关注钻石奖励）",
      "Commission.CommissionNotifyRewardStatistics.name": "推送包含统计信息",
      "Commission.CommissionNotifyRewardStatistics.help": "在通知中显示今日/本周/本月累计钻石数量",
      "Commission.DetectShipDrop.name": "检测舰船掉落",
      "Commission.DetectShipDrop.help": "领取委托奖励后检测「获得舰船」画面并关闭。若不做会掉落舰船的委托，可关闭以避免识别错误。",
      "Commission.DetectShipDrop.true": "true",
      "Commission.DetectShipDrop.false": "false",
      "Commission.GemNotify.name": "钻石委托执行通知",
      "Commission.GemNotify.help": "开始新的钻石委托后，推送当前所有正在执行中的钻石委托列表",
      "Commission.GemStatistics.name": "钻石委托统计详情",
      "Commission.GemStatistics.help": "开启后，委托奖励推送附带钻石委托成功率、平均收益等统计信息",
      "Commission.GemStatisticsPeriod.name": "统计周期",
      "Commission.GemStatisticsPeriod.help": "钻石委托统计的时间范围",
      "Commission.GemStatisticsPeriod.today": "今日",
      "Commission.GemStatisticsPeriod.week": "本周",
      "Commission.GemStatisticsPeriod.month": "本月",
      "Storage.Storage.name": "存储空间",
      "Storage.Storage.help": "清除任务内部存储的状态数据"
    }
  },
  "Restart": {
    "task": "Restart",
    "label": "重启设置",
    "groupLabels": {
      "Scheduler": "任务设置",
      "Restart": "重启设置",
      "Storage": "任务状态"
    },
    "args": {
      "Scheduler": {
        "Enable": {
          "type": "state",
          "value": true,
          "option": [
            true
          ]
        },
        "PushNotification": {
          "type": "checkbox",
          "value": false,
          "option": [
            true,
            false
          ]
        },
        "NextRun": {
          "type": "datetime",
          "value": "2020-01-01 00:00:00",
          "validate": "datetime"
        },
        "Command": {
          "type": "input",
          "value": "Restart",
          "display": "hide"
        },
        "SuccessInterval": {
          "type": "input",
          "value": 0,
          "display": "hide"
        },
        "FailureInterval": {
          "type": "input",
          "value": 0,
          "display": "hide"
        },
        "ServerUpdate": {
          "type": "input",
          "value": "00:00",
          "display": "hide"
        },
        "Sensitive": {
          "type": "checkbox",
          "value": false,
          "option": [
            true,
            false
          ]
        }
      },
      "Restart": {
        "RandomDelay": {
          "type": "input",
          "value": "5, 50"
        },
        "ClearCache": {
          "type": "checkbox",
          "value": false,
          "option": [
            true,
            false
          ]
        },
        "LoginWaitTimeout": {
          "type": "input",
          "value": 30,
          "validate": [
            1,
            3600
          ]
        },
        "MoveChannelFloat": {
          "type": "checkbox",
          "value": false,
          "option": [
            true,
            false
          ]
        }
      },
      "Storage": {
        "Storage": {
          "type": "storage",
          "value": {},
          "display": "disabled"
        }
      }
    },
    "values": {
      "Scheduler": {
        "Enable": true,
        "PushNotification": false,
        "NextRun": "2020-01-01 00:00:00",
        "Command": "Restart",
        "SuccessInterval": 0,
        "FailureInterval": 0,
        "ServerUpdate": "00:00",
        "Sensitive": false
      },
      "Restart": {
        "RandomDelay": "5, 50",
        "ClearCache": false,
        "LoginWaitTimeout": 30,
        "MoveChannelFloat": false
      },
      "Storage": {
        "Storage": {}
      }
    },
    "translations": {
      "Scheduler.Enable.name": "启用该功能",
      "Scheduler.Enable.help": "将这个任务加入调度器",
      "Scheduler.Enable.true": "true",
      "Scheduler.PushNotification.name": "推送通知",
      "Scheduler.PushNotification.help": "启用后，任务完成时会通过 OnePush 推送成功或失败通知",
      "Scheduler.PushNotification.true": "true",
      "Scheduler.PushNotification.false": "false",
      "Scheduler.NextRun.name": "下一次运行时间",
      "Scheduler.NextRun.help": "自动计算的数值，不需要手动修改。清空后将立即运行",
      "Scheduler.Command.name": "内部任务名称",
      "Scheduler.Command.help": "",
      "Scheduler.SuccessInterval.name": "运行成功后，推迟下一次运行 X 分钟",
      "Scheduler.SuccessInterval.help": "",
      "Scheduler.FailureInterval.name": "运行失败后，推迟下一次运行 X 分钟",
      "Scheduler.FailureInterval.help": "",
      "Scheduler.ServerUpdate.name": "服务器刷新时间",
      "Scheduler.ServerUpdate.help": "一些任务运行成功后，将推迟下一次运行至服务器刷新时间\n自动换算时区，一般不需要修改",
      "Scheduler.Sensitive.name": "敏感任务",
      "Scheduler.Sensitive.help": "出错时禁止重启游戏，直接停止 AzurPilot 运行。适用于跨月每日、隐秘海域、深渊坐标等关键时刻任务。",
      "Scheduler.Sensitive.true": "true",
      "Scheduler.Sensitive.false": "false",
      "Restart.RandomDelay.name": "每日重启随机延后",
      "Restart.RandomDelay.help": "每天重启客户端时，在服务器刷新时间后随机延后 X 分钟再执行，用于错开多个客户端登录。\n支持单个数字或区间，例如 5, 50；填 0 可关闭。",
      "Restart.ClearCache.name": "重启时同时清理缓存",
      "Restart.ClearCache.help": "重启客户端时，在强行停止应用后删除 /sdcard/Android/data/<包名>/cache/ 下的外部缓存文件。",
      "Restart.ClearCache.true": "true",
      "Restart.ClearCache.false": "false",
      "Restart.LoginWaitTimeout.name": "登录等待宽容时间",
      "Restart.LoginWaitTimeout.help": "游戏重启后，等待登录/启动完成的最大宽容时间（秒）。\n当模拟器在后台运行导致游戏启动较慢时，可适当调大，避免被误判为卡死而反复重启。\n默认 30 秒，仅影响重启后的登录等待阶段。",
      "Restart.MoveChannelFloat.name": "启动时消除渠道服悬浮窗",
      "Restart.MoveChannelFloat.help": "注意：当前仅支持 4399 渠道服。请自行将悬浮球移动至主页面左上角等级与名字中间的位置，当前悬浮球检测范围为上边沿左半范围。\n开启该功能后，登录流程会在应用启动后的数秒内自动完成拖拽与隐藏。\n该功能仍在完善中；若开启后悬浮球未能关闭，请暂时关闭此功能。",
      "Restart.MoveChannelFloat.true": "true",
      "Restart.MoveChannelFloat.false": "false",
      "Storage.Storage.name": "存储空间",
      "Storage.Storage.help": "清除任务内部存储的状态数据"
    }
  },
  "FleetScan": {
    "task": "FleetScan",
    "label": "舰队扫描",
    "groupLabels": {
      "Storage": "任务状态"
    },
    "args": {
      "Storage": {
        "Storage": {
          "type": "storage",
          "value": {},
          "display": "disabled"
        }
      }
    },
    "values": {
      "Storage": {
        "Storage": {}
      }
    },
    "translations": {
      "Storage.Storage.name": "存储空间",
      "Storage.Storage.help": "清除任务内部存储的状态数据"
    }
  }
}
