"""验证 overview.get 透出 Dashboard 的未开箱总行动力（Total）。

手机端把行动力显示成 `148（3,080）`，括号里是未开箱总行动力。这个值一直在配置里
（config/template.json 的 Dashboard.ActionPoint.Total），但资源构造原先只透出
value / limit / record，所以 WebSocket API 拿不到它。这里守住那一行，避免以后
有人整理代码时又把它去掉。
"""
import json
import tempfile
import unittest

from starlette.testclient import TestClient

from module.api.app import create_app
from tests.test_api import fixture


class ResourceTotalTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = fixture(self.temp.name)
        path = self.root / 'config/testpilot.json'
        data = json.loads(path.read_text(encoding='utf-8'))
        data['Dashboard']['ActionPoint']['Value'] = 148
        data['Dashboard']['ActionPoint']['Total'] = 3080
        data['Dashboard']['Oil']['Value'] = 4844
        data['Dashboard']['Oil']['Limit'] = 12200
        data['Dashboard']['Gem']['Record'] = '2020-01-01 00:00:00'
        path.write_text(json.dumps(data, ensure_ascii=False), encoding='utf-8')
        self.client = TestClient(create_app(root=self.root, password='', manage_runtime=False, mount_mcp=False))

    def resources(self):
        with self.client.websocket_connect('/api/v1/ws') as ws:
            ws.receive_json()  # session 事件
            ws.send_json({'v': 1, 'type': 'request', 'id': '1', 'method': 'overview.get',
                          'params': {'instance': 'testpilot'}})
            while True:
                message = ws.receive_json()
                if message.get('id') == '1':
                    self.assertTrue(message['ok'], message)
                    return {item['name']: item for item in message['result']['resources']}

    def test_action_point_exposes_unopened_total(self):
        action_point = self.resources()['ActionPoint']
        self.assertEqual(148, action_point['value'])
        self.assertEqual(3080, action_point['total'])

    def test_resources_without_total_report_none(self):
        oil = self.resources()['Oil']
        self.assertEqual(12200, oil['limit'])
        self.assertIsNone(oil['total'])

    def test_never_collected_resource_keeps_its_sentinel(self):
        # 手机端靠这个哨兵时间显示「未采集」，不能把 0 当成已采集。
        self.assertEqual('2020-01-01 00:00:00', self.resources()['Gem']['record'])


if __name__ == '__main__':
    unittest.main()
