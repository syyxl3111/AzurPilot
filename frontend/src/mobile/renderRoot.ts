/**
 * React 19 兼容垫片：让 antd-mobile 的命令式弹层真正渲染出来。
 *
 * 不装这个垫片的表现是**静默失效**，没有任何报错 —— 踩过一次，记在这里：
 *
 *   antd-mobile 的 Dialog.alert/confirm/show、Toast.show、ActionSheet.show、
 *   ImageViewer.show 都走 utils/render-imperatively → utils/render-to-body →
 *   utils/unstable-render 里的默认渲染器，而那个默认渲染器转调 rc-util 的
 *   lib/React/render。rc-util 判断 React 主版本 >= 18 时用 createRoot，
 *   否则退回 ReactDOM.render：
 *
 *     var fullClone = { ...ReactDOM };
 *     if (mainVersion >= 18) createRoot = fullClone.createRoot;
 *     ...
 *     function render(node, container) { createRoot ? modernRender(...) : legacyRender(...) }
 *     function legacyRender(node, container) { reactRender?.(node, container) }
 *
 *   但 React 19 把 createRoot / render / unmountComponentAtNode 全从
 *   `react-dom` 移到了 `react-dom/client`：
 *
 *     require('react-dom').createRoot              // undefined
 *     require('react-dom').render                  // undefined
 *     require('react-dom').unmountComponentAtNode  // undefined
 *     require('react-dom/client').createRoot       // function
 *
 *   于是 createRoot 取不到 → 走 legacyRender → reactRender 也是 undefined →
 *   可选链直接短路，什么也不做。而 antd-mobile 那句「v5 只支持 React 16~18」
 *   的警告包在 `process.env.NODE_ENV !== 'production'` 里，生产构建下连警告
 *   都没有，所以表现为「点了没反应、控制台干净」。
 *
 * 修法就是官方留的口子 unstableSetRender()，换成 react-dom/client 的 createRoot。
 * 必须在渲染任何东西之前调用一次。
 */
import { unstableSetRender } from 'antd-mobile'
import { createRoot, type Root } from 'react-dom/client'

/** 挂在容器元素上的 Root 引用，复用同一个 root 避免重复 createRoot 警告。 */
const ROOT_KEY = '__azurpilotMobileRoot__'

type RootHost = Element & {[ROOT_KEY]?: Root}

let installed = false

export function installImperativeRenderer(): void {
  if (installed) return
  installed = true
  unstableSetRender((node, container) => {
    const host = container as RootHost
    if (!host[ROOT_KEY]) host[ROOT_KEY] = createRoot(container)
    const root = host[ROOT_KEY]
    root.render(node)
    return async () => {
      /* 让关闭动画先跑完：官方示例同样等一个宏任务，直接 unmount 会把动画截断。 */
      await new Promise(resolve => setTimeout(resolve, 0))
      root.unmount()
      delete host[ROOT_KEY]
    }
  })
}
