import importlib.util,unittest
from pathlib import Path
from unittest.mock import patch
p=Path(__file__).resolve().parents[1]/'scripts/monitor.py';s=importlib.util.spec_from_file_location('monitor',p);m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
class Tests(unittest.TestCase):
 def test_header_noindex_is_case_insensitive(self):
  u='https://example.com/'
  with patch.object(m,'fetch',return_value={'status':200,'headers':{'X-Robots-Tag':'noindex'},'body':'<h1>x</h1><link rel="canonical" href="'+u+'">'}):self.assertFalse(m.check_page(u)['passed'])
 def test_missing_canonical_fails(self):
  with patch.object(m,'fetch',return_value={'status':200,'headers':{},'body':'<h1>x</h1>'}):self.assertFalse(m.check_page('https://example.com/')['passed'])
