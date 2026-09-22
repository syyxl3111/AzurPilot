"""验证生产服务公开完整构建资源（含正确 MIME），并按 User-Agent 分流 PC / 手机页面。"""
import mimetypes
import tempfile
import unittest

from starlette.testclient import TestClient

from module.api.app import create_app
from module.api.static import (
    MOBILE_PAGE, SHELL_COOKIE, cookie_shell, ensure_static_mime_types, query_shell, requested_shell,
)
from tests.test_api import fixture

ANDROID_UA = ('Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 '
              '(KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36')
ANDROID_WEBVIEW_UA = ('Mozilla/5.0 (Linux; Android 14; Pixel 7; wv) AppleWebKit/537.36 '
                      '(KHTML, like Gecko) Version/4.0 Chrome/120.0.0.0 Mobile Safari/537.36')
IPHONE_UA = ('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 '
             '(KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1')
# iPadOS 13+ 的 Safari 报的是桌面级 UA，只能靠结尾的 Mobile/ 认出来。
IPAD_UA = ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 '
           '(KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1')
CHROME_UA = ('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
             '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
ELECTRON_UA = ('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
               '(KHTML, like Gecko) AzurPilot/1.0 Chrome/120.0.0.0 Electron/28.0.0 Safari/537.36')
SAFARI_UA = ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 '
             '(KHTML, like Gecko) Version/17.0 Safari/605.1.15')
FIREFOX_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0'

PHONE_PAGES = '<html>手机页面</html>'
DESKTOP_PAGES = '<html>前端页面</html>'


def build_client(root, *, with_mobile=True):
    """按需生成 dist；with_mobile=False 用来验证旧产物回退。"""
    dist = root / 'frontend/dist'
    (dist / 'assets').mkdir(parents=True)
    (dist / 'icons').mkdir()
    (dist / 'index.html').write_text(DESKTOP_PAGES, encoding='utf-8')
    if with_mobile:
        (dist / MOBILE_PAGE).write_text(PHONE_PAGES, encoding='utf-8')
    (dist / '.source-fingerprint').write_text('internal')
    (dist / 'oil.webp').write_bytes(b'RIFF-test-image')
    (dist / 'icons/nested.svg').write_text('<svg/>')
    (dist / 'assets/app.css').write_text('body {color: red}')
    return TestClient(create_app(root=root, password='', manage_runtime=False, mount_mcp=False))


class FrontendStaticTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.client = build_client(fixture(temporary.name))

    def test_public_resources_are_files(self):
        response = self.client.get('/oil.webp')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content, b'RIFF-test-image')
        self.assertEqual(response.headers['content-type'], 'image/webp')
        self.assertEqual(response.headers['cache-control'], 'no-cache')
        self.assertEqual(self.client.head('/oil.webp').content, b'')
        self.assertEqual(self.client.get('/icons/nested.svg').text, '<svg/>')
        self.assertIn('text/css', self.client.get('/assets/app.css').headers['content-type'])

    def test_navigation_and_api_keep_their_routes(self):
        # 默认 UA（testclient）按桌面处理，行为与分流前一致。
        for path in ['/', '/some/page']:
            response = self.client.get(path)
            self.assertEqual(response.status_code, 200)
            self.assertIn('前端页面', response.text)
            self.assertEqual(response.headers['cache-control'], 'no-cache')
        self.assertEqual(self.client.get('/healthz').json()['status'], 'ok')

    def test_missing_and_private_resources_are_not_pages(self):
        for path in ['/missing.webp', '/assets/missing.js', '/.source-fingerprint',
                     '/%2e%2e/%2e%2e/config/testpilot.json']:
            with self.subTest(path=path):
                self.assertEqual(self.client.get(path).status_code, 404)


class FrontendShellRoutingTests(unittest.TestCase):
    """按 UA / 覆盖参数 / Cookie 决定返回哪份 HTML。"""

    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = fixture(temporary.name)
        self.client = build_client(self.root)

    def test_phone_agents_get_the_mobile_page(self):
        for agent in [ANDROID_UA, ANDROID_WEBVIEW_UA, IPHONE_UA, IPAD_UA]:
            with self.subTest(agent=agent):
                response = self.client.get('/', headers={'user-agent': agent})
                self.assertEqual(response.status_code, 200)
                self.assertIn('手机页面', response.text)

    def test_desktop_agents_get_the_index_page(self):
        # Electron 客户端必须留在 PC 版；UA 缺失同理。
        for agent in [CHROME_UA, ELECTRON_UA, SAFARI_UA, FIREFOX_UA, 'testclient', '']:
            with self.subTest(agent=agent):
                response = self.client.get('/', headers={'user-agent': agent})
                self.assertEqual(response.status_code, 200)
                self.assertIn('前端页面', response.text)

    def test_deep_links_follow_the_same_split(self):
        response = self.client.get('/some/page', headers={'user-agent': ANDROID_UA})
        self.assertIn('手机页面', response.text)

    def test_page_responses_vary_on_agent_and_cookie(self):
        response = self.client.get('/', headers={'user-agent': ANDROID_UA})
        self.assertEqual(response.headers['vary'], 'User-Agent, Cookie')

    def test_query_override_wins_and_is_remembered(self):
        forced_pc = self.client.get('/?pc=1', headers={'user-agent': ANDROID_UA})
        self.assertIn('前端页面', forced_pc.text)
        self.assertIn(f'{SHELL_COOKIE}=pc', forced_pc.headers['set-cookie'])

        forced_mobile = self.client.get('/?mobile=1', headers={'user-agent': CHROME_UA})
        self.assertIn('手机页面', forced_mobile.text)
        self.assertIn(f'{SHELL_COOKIE}=mobile', forced_mobile.headers['set-cookie'])

    def test_cookie_decides_the_next_navigation(self):
        # 手机上选了 PC 版之后，后续导航（不带覆盖参数）也留在 PC 版。
        response = self.client.get('/some/page', headers={
            'user-agent': ANDROID_UA, 'cookie': f'{SHELL_COOKIE}=pc'})
        self.assertIn('前端页面', response.text)
        # 没有覆盖参数时不该反复写 Cookie。
        self.assertNotIn('set-cookie', response.headers)

    def test_junk_cookie_is_ignored(self):
        response = self.client.get('/', headers={
            'user-agent': ANDROID_UA, 'cookie': f'{SHELL_COOKIE}=wat; other=1'})
        self.assertIn('手机页面', response.text)

    def test_static_assets_never_follow_the_switch(self):
        response = self.client.get('/assets/app.css?pc=1', headers={'user-agent': ANDROID_UA})
        self.assertEqual(response.status_code, 200)
        self.assertNotIn('set-cookie', response.headers)
        for path in ['/assets/missing.js', '/missing.webp?mobile=1']:
            with self.subTest(path=path):
                self.assertEqual(self.client.get(path).status_code, 404)

    def test_missing_mobile_page_falls_back_to_desktop(self):
        # 旧产物或旧镜像里没有手机入口时，手机用户仍然拿得到 PC 版。
        with tempfile.TemporaryDirectory() as directory:
            client = build_client(fixture(directory), with_mobile=False)
            response = client.get('/', headers={'user-agent': ANDROID_UA})
            self.assertEqual(response.status_code, 200)
            self.assertIn('前端页面', response.text)


class PreferredShellUnitTests(unittest.TestCase):
    """纯函数直测，不经 HTTP。"""

    def test_user_agent_fallback(self):
        cases = {
            ANDROID_UA: 'mobile',
            ANDROID_WEBVIEW_UA: 'mobile',
            IPHONE_UA: 'mobile',
            IPAD_UA: 'mobile',
            'Mozilla/5.0 (Linux; Android 14; SM-X910) AppleWebKit/537.36 Chrome/120 Safari/537.36': 'mobile',
            'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36 OPR/60': 'mobile',
            'Mozilla/5.0 (Phone; OpenHarmony 5.0) AppleWebKit/537.36 ArkWeb/4.1 Mobile': 'mobile',
            CHROME_UA: 'desktop',
            ELECTRON_UA: 'desktop',
            SAFARI_UA: 'desktop',
            FIREFOX_UA: 'desktop',
            '': 'desktop',
        }
        for agent, expected in cases.items():
            with self.subTest(agent=agent):
                self.assertEqual(requested_shell('', '', agent), expected)

    def test_override_beats_cookie_and_user_agent(self):
        self.assertEqual(requested_shell('pc=1', f'{SHELL_COOKIE}=mobile', ANDROID_UA), 'desktop')
        self.assertEqual(requested_shell('mobile=1', f'{SHELL_COOKIE}=pc', CHROME_UA), 'mobile')
        # 只要键出现就生效，值不参与判断。
        self.assertEqual(requested_shell('pc', '', ANDROID_UA), 'desktop')
        self.assertEqual(requested_shell('foo=1&pc=0', '', CHROME_UA), 'desktop')

    def test_query_shell_ignores_unrelated_parameters(self):
        self.assertEqual(query_shell(''), '')
        self.assertEqual(query_shell('instance=alas'), '')
        self.assertEqual(query_shell('mobile=1'), 'mobile')
        self.assertEqual(query_shell('mobile'), 'mobile')

    def test_cookie_shell_tolerates_malformed_input(self):
        self.assertEqual(cookie_shell(''), '')
        self.assertEqual(cookie_shell('other=1'), '')
        self.assertEqual(cookie_shell(f'{SHELL_COOKIE}= MOBILE '), 'mobile')
        self.assertEqual(cookie_shell(f'{SHELL_COOKIE}=wat'), '')
        self.assertEqual(cookie_shell('=;;;'), '')


class StaticMimeTypeTests(unittest.TestCase):
    """系统把 .js 关联成 text/plain 时，服务端必须自己写回标准 MIME。

    浏览器对 ES module 的 MIME 检查是强制的：资源带 text/plain 就直接拒绝执行，
    前端一个字节都跑不起来，界面整片空白（2026-09-20 实机白屏即此因）。
    Windows 上 Python 的 mimetypes 会读注册表的文件关联，而且是直接覆盖标准表，
    所以映射不能交给系统决定。
    """

    def setUp(self):
        self.addCleanup(self._restore_js_mapping)
        self.original = mimetypes.guess_type('probe.js')[0]

    def _restore_js_mapping(self):
        """还原测试前的映射，避免污染同一进程里后续的其他测试。"""
        if self.original:
            mimetypes.add_type(self.original, '.js')

    def test_polluted_system_mapping_is_overridden(self):
        # 模拟被改坏的注册表项：read_windows_registry 正是这样写进标准表的
        mimetypes.add_type('text/plain', '.js')
        self.assertEqual(mimetypes.guess_type('probe.js')[0], 'text/plain')

        ensure_static_mime_types()

        self.assertEqual(mimetypes.guess_type('probe.js')[0], 'text/javascript')

    def test_served_assets_keep_executable_mime(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        root = fixture(temporary.name)
        dist = root / 'frontend/dist'
        (dist / 'assets').mkdir(parents=True)
        (dist / 'index.html').write_text('<html>前端页面</html>', encoding='utf-8')
        (dist / 'assets/index.js').write_text('export const ok = 1')
        (dist / 'assets/app.css').write_text('body {color: red}')
        mimetypes.add_type('text/plain', '.js')
        ensure_static_mime_types()
        client = TestClient(create_app(root=root, password='', manage_runtime=False, mount_mcp=False))

        self.assertIn('text/javascript', client.get('/assets/index.js').headers['content-type'])
        self.assertIn('text/css', client.get('/assets/app.css').headers['content-type'])


if __name__ == '__main__':
    unittest.main()
