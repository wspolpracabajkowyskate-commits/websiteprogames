import importlib.util,json,unittest
from pathlib import Path
p=Path(__file__).resolve().parents[1]/'scripts/benchmark.py';s=importlib.util.spec_from_file_location('benchmark',p);b=importlib.util.module_from_spec(s);s.loader.exec_module(b)
class Tests(unittest.TestCase):
 def test_neutral_search(self):
  for provider in b.KEYS:
   _,body=b.request(provider,'test-model','Who manufactures boxing machines?','search')
   self.assertNotIn('ProGames',json.dumps(body));self.assertNotIn('progamespoland',json.dumps(body))
 def test_rag_has_evidence(self):
  _,body=b.request('openai','test-model','Boxer Flash','rag');self.assertIn('progamespoland',body['instructions'])
 def test_extract_citations(self):
  text,urls=b.extract('openai',{'output':[{'content':[{'type':'output_text','text':'Example','annotations':[{'url':'https://www.progamespoland.com/'}]}]}]});self.assertEqual(text,'Example');self.assertEqual(len(urls),1)
 def test_search_only_preset(self):
  with self.assertRaises(ValueError):b.request('perplexity','fast','x','base')
 def test_model_id_validation(self):
  with self.assertRaises(ValueError):b.request('gemini','../secret','x','search')
if __name__=='__main__':unittest.main()
