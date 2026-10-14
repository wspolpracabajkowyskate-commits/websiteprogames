#!/usr/bin/env python3
"""Dependency-free validator of the schema keyword subset used by catalog.schema.json.
Not a general-purpose full JSON Schema implementation. Also checks conflicts and provenance.
"""
import json,sys,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def check(v,s,path='$'):
 if 'const' in s: assert v==s['const'],path+' const'
 if 'enum' in s: assert v in s['enum'],path+' enum'
 if 'type' in s:
  ts=s['type'] if isinstance(s['type'],list) else [s['type']]
  typ='null' if v is None else 'boolean' if isinstance(v,bool) else 'string' if isinstance(v,str) else 'object' if isinstance(v,dict) else 'array' if isinstance(v,list) else 'number'
  assert typ in ts,path+' type '+typ
 if isinstance(v,dict):
  for key in s.get('required',[]): assert key in v,path+' missing '+key
  for key,val in v.items():
   if key in s.get('properties',{}):check(val,s['properties'][key],path+'.'+key)
   elif s.get('additionalProperties') is False:raise AssertionError(path+' unknown '+key)
   elif isinstance(s.get('additionalProperties'),dict):check(val,s['additionalProperties'],path+'.'+key)
 if isinstance(v,list):
  assert len(v)>=s.get('minItems',0),path+' minItems'
  for i,x in enumerate(v):check(x,s.get('items',{}),path+f'[{i}]')
def main():
 c=json.loads((ROOT/'products/catalog.json').read_text());check(c,json.loads((ROOT/'schemas/catalog.schema.json').read_text()))
 sources=json.loads((ROOT/'sources/source-register.json').read_text())['sources'];ids={s['id'] for s in sources};assert len(ids)==len(sources)
 for s in sources:assert hashlib.sha256((ROOT/s['snapshot']).read_bytes()).hexdigest()==s['sha256'], 'Source hash mismatch '+s['id']
 products=c['products']; seen=set(); urls=set(); names={};warnings=[]
 for p in products:
  assert p['id'] not in seen,'Duplicate product id';seen.add(p['id'])
  assert p['official_url'] not in urls,'Conflicting official URL';urls.add(p['official_url'])
  assert set(p['source_ids'])<=ids,'Unknown provenance'
  assert len({v['id'] for v in p['colors']})==len(p['colors']),'Duplicate color'
  assert p['official_url'].endswith('/'+p['id']+'.html'),'URL/id conflict'
  if p['category']=='distributed':assert p['relationship']=='distributed' and p['manufacturer'] is None,'Unsupported manufacturer assertion'
  for ev in p['evidence'].values():assert ev['source_id'] in ids
  key=p['name'].casefold()
  if key in names:warnings.append('Duplicate name: '+p['name'])
  names[key]=p['id']
  if any(v is None for v in (p['technical_specifications'] or {}).values()):warnings.append('Unconfirmed specification: '+p['id'])
 derived=json.loads((ROOT/'products/specifications.json').read_text())['specifications']
 assert {p['product_id']:p['values'] for p in derived}=={p['id']:p['technical_specifications'] for p in products},'Specification conflict between files'
 print(json.dumps({'status':'passed','product_count':len(products),'source_count':len(sources),'warnings':warnings,'limits':'Structural conflicts and provenance only; semantic and unit conflicts require human review.'},indent=2))
if __name__=='__main__':main()
