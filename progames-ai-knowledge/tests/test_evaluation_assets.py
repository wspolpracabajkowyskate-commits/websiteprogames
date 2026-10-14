import json,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; sys.path.insert(0,str(ROOT/'scripts'))
from evaluate_visibility import evaluate
qs=json.loads((ROOT/'ai-training/evaluation-questions.json').read_text())['questions']
assert len(qs)==60 and len({q['id'] for q in qs})==60
assert len({q['question'] for q in qs})==60
for lang in ['PL','EN']:
 for group in 'ABC': assert sum(q['language']==lang and q['group']==group for q in qs)==10
assert all('progames' not in q['question'].lower() for q in qs if q['group']=='A')
source_map=json.loads((ROOT/'ai-training/dataset-source-map.json').read_text())['records']
train={r['family'] for r in source_map if r['split']=='train'}; validation={r['family'] for r in source_map if r['split']=='validation'}
assert not train & validation
assert not (train|validation)&{q['family'] for q in qs}
for split,file,count in [('train','training',16),('validation','validation',6)]:
 rows=[json.loads(x) for x in (ROOT/f'ai-training/{file}-dataset.jsonl').read_text().splitlines()]
 assert len(rows)==count
 for i,r in enumerate(rows,1):
  assert set(r)=={'messages'} and [m['role'] for m in r['messages']]==['system','user','assistant']
  mapping=next(m for m in source_map if m['split']==split and m['line']==i)
  assert mapping['official_url'] in r['messages'][-1]['content']
assert evaluate([],qs)['status']=='not_run'
# Synthetic input tests the parser; it is not a model response and is never saved as a benchmark.
fake={'question_id':'PL-A-01','model':'synthetic-fixture','model_version':'test','timestamp':'2026-10-13T00:00:00Z','mode':'base','answer':'ProGames https://www.progamespoland.com/','citations':[],'run_id':'unit-test','prompt_version':'fixture'}
r=evaluate([fake],qs); s=r['summary'][0]
assert s['brand_string_mentioned_rate']==1 and s['company_correct_rate'] is None and s['has_factual_error_rate'] is None
try: evaluate([fake,dict(fake)],qs); raise AssertionError('Duplicate accepted')
except ValueError: pass
result={'status':'passed','kind':'structural_and_synthetic_unit_tests_not_model_benchmark','question_count':60,'training_records':16,'validation_records':6,'checks':['balanced PL/EN groups','unique IDs/questions','unbranded A prompts','family split','conversation envelope','provenance URL','null unreviewed accuracy','duplicate rejection']}
(ROOT/'reports/evaluation-asset-tests.json').write_text(json.dumps(result,indent=2)+'\n'); print(json.dumps(result))
