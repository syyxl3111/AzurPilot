"""提供完整前端构建目录，按 User-Agent 分流页面并区分静态资源请求。

手机端入口（`mobile.html`）与 PC 入口（`index.html`）是同一套 Vite 工程的两个
多页入口：只有服务端能在响应前看到 User-Agent，所以分流放在静态资源层。
分流优先级为 URL 覆盖参数 > 选择 Cookie > User-Agent，都判不出来时给 PC 版
（功能最全的那一份）；覆盖参数会写回 Cookie，避免误判后每次都要手改地址。
"""
import mimetypes
import re
from http.cookies import SimpleCookie
from pathlib import Path, PurePosixPath
from urllib.parse import parse_qs

from starlette.exceptions import HTTPException
from starlette.staticfiles import StaticFiles

# 浏览器对 ES module 与样式表做强制 MIME 检查，类型不对就直接拒绝执行，前端整片白屏。
# Windows 上 Python 的 mimetypes 会读注册表的文件关联（而且直接覆盖标准表），
# 系统里 .js 被关联成 text/plain 的机器就会白屏，所以这里写死正确的映射。
WEB_MIME_TYPES = {
    '.js': 'text/javascript',
    '.mjs': 'text/javascript',
    '.css': 'text/css',
}


def ensure_static_mime_types() -> None:
    """把静态资源的 MIME 写进标准映射，覆盖系统注册表里的错误关联。"""
    for ext, media_type in WEB_MIME_TYPES.items():
        mimetypes.add_type(media_type, ext)


ensure_static_mime_types()

SHELL_COOKIE = 'azurpilot.shell'
MOBILE_PAGE = 'mobile.html'
DESKTOP_PAGE = 'index.html'
SHELL_MAX_AGE = 31536000

# 手机端判定。桌面 Chrome / Firefox / Safari 与 Electron 的 UA 都不含这些词：
#   Windows Chrome : Mozilla/5.0 (Windows NT 10.0; Win64; x64) ... Chrome/120 Safari/537.36
#   Electron       : ... AzurPilot/1.0 Chrome/120 Electron/28 Safari/537.36
#   Android WebView: ... (Linux; Android 14; Pixel 7; wv) ... Mobile Safari/537.36
#   iPadOS 13+ 桌面级 UA 靠 "Mobile/" 命中（Macintosh 里不含 Mobile）。
MOBILE_UA = re.compile(
    r'Android|iPhone|iPad|iPod|Windows Phone|IEMobile|Opera Mini|Harmony|Mobile',
    re.I,
)

_QUERY_SHELLS = {'pc': 'desktop', 'mobile': 'mobile'}
_COOKIE_SHELLS = {'pc': 'desktop', 'mobile': 'mobile'}
_SHELL_COOKIES = {'desktop': 'pc', 'mobile': 'mobile'}


def _header(scope, name: bytes) -> str:
    """按小写名取 ASGI scope 里的请求头；缺失返回空串。"""
    for key, value in scope.get('headers') or ():
        if key.lower() == name:
            return value.decode('latin-1')
    return ''


def query_shell(query: str) -> str:
    """解析 `?pc` / `?mobile` 覆盖参数，没有则返回空串。

    只要键出现就生效（`?pc` 与 `?pc=1` 等价），值不参与判断。
    """
    try:
        params = parse_qs(query, keep_blank_values=True)
    except ValueError:
        return ''
    for key, shell in _QUERY_SHELLS.items():
        if key in params:
            return shell
    return ''


def cookie_shell(cookie: str) -> str:
    """解析选择 Cookie；值非法或解析失败时返回空串。"""
    if not cookie:
        return ''
    jar = SimpleCookie()
    try:
        jar.load(cookie)
    except Exception:
        # 浏览器或中间层给出的畸形 Cookie 不应影响页面返回。
        return ''
    morsel = jar.get(SHELL_COOKIE)
    if morsel is None:
        return ''
    return _COOKIE_SHELLS.get(morsel.value.strip().lower(), '')


def requested_shell(query: str = '', cookie: str = '', user_agent: str = '') -> str:
    """返回 'desktop' 或 'mobile'。

    覆盖参数 > Cookie > User-Agent；UA 缺失时按 desktop 处理。
    """
    override = query_shell(query)
    if override:
        return override
    stored = cookie_shell(cookie)
    if stored:
        return stored
    return 'mobile' if MOBILE_UA.search(user_agent or '') else 'desktop'


class FrontendFiles(StaticFiles):
    """保留 SPA 页面回退，同时让缺失资源返回真实的 404。"""

    @staticmethod
    def _query_of(scope) -> str:
        raw = scope.get('query_string') or b''
        return raw.decode('latin-1') if isinstance(raw, bytes) else str(raw)

    def page_for(self, scope) -> str:
        """按分流结果挑页面；`mobile.html` 不存在时回退 PC 页面。"""
        shell = requested_shell(
            self._query_of(scope),
            _header(scope, b'cookie'),
            _header(scope, b'user-agent'),
        )
        if shell == 'mobile' and self._mobile_available():
            return MOBILE_PAGE
        return DESKTOP_PAGE

    def _mobile_available(self) -> bool:
        """旧产物或旧镜像里可能没有手机入口，那就继续给 PC 版。"""
        try:
            return (Path(self.directory) / MOBILE_PAGE).is_file()
        except TypeError:
            # directory 为 None（用 packages 挂载）时不做探测。
            return False

    def _apply_shell_headers(self, response, scope) -> None:
        """页面响应标 Vary，并在带覆盖参数时把选择记进 Cookie。"""
        response.headers['Vary'] = 'User-Agent, Cookie'
        override = query_shell(self._query_of(scope))
        if not override:
            return
        value = _SHELL_COOKIES[override]
        # 不设 Secure（局域网多为 HTTP），不设 HttpOnly（值非机密，便于前端清除）。
        response.headers.append(
            'Set-Cookie',
            f'{SHELL_COOKIE}={value}; Path=/; Max-Age={SHELL_MAX_AGE}; SameSite=Lax',
        )

    async def get_response(self, path, scope):
        # 构建指纹等内部文件不属于公开资源；路径越界仍由 StaticFiles 拦截。
        if any(part.startswith('.') and part not in ('.', '..') for part in PurePosixPath(path).parts):
            raise HTTPException(status_code=404)
        try:
            response = await super().get_response(path, scope)
        except HTTPException as exc:
            # 带后缀的是静态资源，缺失就是真 404，不参与分流也不写 Cookie。
            if exc.status_code != 404 or PurePosixPath(path).suffix:
                raise
            response = await super().get_response(self.page_for(scope), scope)
            self._apply_shell_headers(response, scope)
        # public 资源名称不带内容哈希，更新后必须向服务端重新验证缓存。
        response.headers['Cache-Control'] = 'no-cache'
        return response
