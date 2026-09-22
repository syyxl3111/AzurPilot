# 手机端（UA 分流）

PC 端与手机端共用同一套构建产物，由服务端按 UA 分流加载不同 HTML，不改变 PC 端行为。入口不加载第三方脚本、外部字体与外部壁纸接口（PC 端的 `api.yppp.net` 壁纸不随手机端加载）。

## 入口与分流

| 页面 | 用途 | 源文件 |
| --- | --- | --- |
| `mobile.html` | 手机端正式页面 | `frontend/src/mobile/main.tsx` |
| `mobile-mockup.html` | 演示页 / 视觉验收（内置假数据，不需要后端） | `frontend/src/mobile/mockup/main.tsx` |
| `index.html` | PC 端（未改动） | `frontend/src/main.tsx` |

分流在 `module/api/static.py`：默认按 `User-Agent` 判定，可用 `?shell=mobile|desktop` 或 Cookie `azurpilot.shell` 覆盖；`mobile.html` 缺失时回落 PC 页面。

## 目录

- `MobileShell.tsx`、`app/`：外壳与路由。`app/liveData.tsx` 走真实 `/api/v1/ws`；`mockup/mockDataSource.tsx` 提供演示数据。
- `components/`：卡片、表格、图表等手机端组件；`mockup/mockApp.tsx` 是演示页专用的 `AppContext` 外壳，让 PC 端复用组件（如 `SegmentedControl`）也能在演示页渲染。
- `mobile.css`：手机端样式。主题皮肤由 `applyTheme()` 在入口渲染前注入，令牌选择器限定为 `:root[data-shell='mobile']`，避免被后注入的皮肤覆盖。
- `i18n.ts`、`theme.ts`：手机端文案与主题偏好；`dev/` 为开发用实验页，不参与正式入口。

## 验证

```bash
npm run typecheck --prefix frontend
npm test --prefix frontend
npm run build --prefix frontend
npm run test:e2e:mobile --prefix frontend        # 演示页端到端（mock，无需后端）
npm run test:e2e:mobile:live --prefix frontend   # 真实数据端到端（需运行中的 WebUI）
```

`test:e2e:mobile` 用 `playwright.mockup.config.ts`（构建后自动起 preview）；`test:e2e:mobile:live` 用 `playwright.live.config.ts`。手机端交互改动应至少跑通前四项。

## 分支与更新源（本 fork 维护）

手机端开发在 `syyxl3111/AzurPilot` 的 `mobile-on-dev` 分支上，主仓库更新不再覆盖该分支：

- 更新源取 `config/deploy.yaml` 的 `Deploy.Git.Repository` / `Deploy.Git.Branch`（该文件不入库）。本机已指向 `git@github.com:syyxl3111/AzurPilot.git` 与 `mobile-on-dev`：更新相当于 `git fetch origin mobile-on-dev` 后 `git reset --hard origin/mobile-on-dev`，与本地一致时为空操作，因此主仓库更新不会再清掉手机端改动。注意该命令仍会丢弃未提交的本地修改，更新前先提交。
- 更新走 SSH（本机 HTTPS 连 github.com 不通）。私钥位于 `.git/azurpilot-ssh/id_ed25519`，由仓库级 `core.sshCommand` 显式指定，公钥已作为可写 Deploy key 加到 fork。重新 clone 后按同样方式重建：`ssh-keygen` 生成密钥、公钥加到 fork 的 Deploy keys（勾选 Allow write access）、`git config core.sshCommand '... -i <repo>/.git/azurpilot-ssh/id_ed25519'`。
- 需要跟上游时用 `git fetch upstream dev`（`upstream` 指向 gitcode 镜像）再合并到 `mobile-on-dev`；手机端改动尽量保持“只增不改”，减少与上游的冲突面。
