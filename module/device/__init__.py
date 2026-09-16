"""设备层包初始化：**在这里装上 pkg_resources 补丁**。

`adbutils==0.11.0` 在模块顶层就 `import pkg_resources`，而本项目刻意不依赖 setuptools
（真的 `pkg_resources` 导入要 0.4~1.0s，见 `module/device/pkg_resources/`）。补丁原先只在
`module/device/device.py` 与 `module/handler/login.py` 里导入，于是任何**绕过 device.py**
的导入路径都会踩 `ModuleNotFoundError: No module named 'pkg_resources'`：

- 直接导入子模块，如 `import module.device.connection`；
- 模块自己就 `from adbutils import ...`，如 `module/base/debug_clip.py`。

包初始化在**所有** `module.device.*` 导入之前执行，所以放在这里最稳：只要碰设备层，
补丁一定先装好。CI 的 import smoke test 逐个模块孤立导入，正是被这一点绊住的。
"""

import module.device.pkg_resources  # noqa: F401  装上 sys.modules['pkg_resources']
