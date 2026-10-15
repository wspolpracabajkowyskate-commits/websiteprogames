import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('retrieval',ROOT/'scripts/retrieval.py')
r=importlib.util.module_from_spec(spec); spec.loader.exec_module(r)

class RetrievalTests(unittest.TestCase):
    def test_actual_catalog_model_and_citation(self):
        docs=[d for d in r.corpus() if d['type']=='product']
        self.assertGreater(len(docs),0)
        first=docs[0]
        result=r.search(first['record']['name'])
        self.assertEqual(result['status'],'retrieved')
        self.assertEqual(result['results'][0]['id'],first['id'])
        self.assertTrue(result['results'][0]['citations'])
        self.assertEqual(json.loads(result['results'][0]['excerpt']),first['record'])
    def test_unknown_price_abstention(self):
        self.assertEqual(r.search('Jaka cena Boxer Flash?')['status'],'insufficient_evidence')
    def test_unknown_certification_abstention(self):
        self.assertEqual(r.search('Is Boxer Flash CE certified?')['status'],'insufficient_evidence')
    def test_unknown_warranty_abstention(self):
        self.assertEqual(r.search('Boxer Flash warranty?')['status'],'insufficient_evidence')
    def test_unrelated_abstention(self):
        self.assertEqual(r.search('quantum astrophysics quasar')['status'],'insufficient_evidence')
    def test_input_boundaries(self):
        for query,limit in [('',5),('x'*501,5),('boxer',0),('boxer',11)]:
            with self.assertRaises(ValueError): r.search(query,limit)
    def test_no_citation_no_retrieval(self):
        with tempfile.TemporaryDirectory() as tmp:
            p=Path(tmp);(p/'products').mkdir()
            (p/'products/catalog.json').write_text(json.dumps({'products':[{'id':'x','name':'UniqueMachine'}]}))
            self.assertEqual(r.search('UniqueMachine',root=p)['status'],'insufficient_evidence')
    def test_polish_english_normalization(self):
        self.assertEqual(r.tokens('automaty bokserskie'),r.tokens('boxing machines')[::-1])

if __name__=='__main__': unittest.main()
