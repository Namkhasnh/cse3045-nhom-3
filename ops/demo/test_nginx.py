import importlib.util
from pathlib import Path
import unittest
spec = importlib.util.spec_from_file_location('switch', Path(__file__).with_name('switch-nginx.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class SwitchTest(unittest.TestCase):
    def test_preserves_other_hosts_and_quoted_braces(self):
        text = 'server {listen 80; server_name other.example;}\nserver {listen 80;server_name "sv26.bcse-vju.com";location / {set $x "}";}}'
        blocks = module.matching_blocks(text)
        self.assertEqual(len(blocks), 1)
        start, end = blocks[0]
        replaced = text[:start] + module.render('/opt/demo/frontend') + text[end:]
        self.assertTrue(replaced.startswith('server {listen 80; server_name other.example;}'))
        self.assertEqual(replaced.count('server_name sv26.bcse-vju.com;'), 1)

    def test_refuses_local_tls_replacement(self):
        with self.assertRaises(ValueError):
            module.matching_blocks('server {listen 443 ssl;server_name sv26.bcse-vju.com;}')

    def test_default_not_selected_and_comments_ignored(self):
        self.assertEqual(module.matching_blocks('server {listen 80;server_name _; # server_name sv26.bcse-vju.com;\n}'), [])

if __name__ == '__main__':
    unittest.main()
