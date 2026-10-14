#!/usr/bin/env python3
"""Deterministic extraction from archived official website data. No network or credentials."""
import json, hashlib, re, subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
DATE='2026-10-13'
def write(path,data):
 p=ROOT/path;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
# Node evaluates only the archived, reviewed first-party JS in a timeout-limited context.
# Do not execute arbitrary newly fetched scripts without reviewing changes.
node_code="const fs=require('fs'),vm=require('vm');const x={window:{}};vm.runInNewContext(fs.readFileSync(process.argv[1],'utf8'),x,{timeout:2000});process.stdout.write(JSON.stringify(x.window.PRODUCTS));"
raw=json.loads(subprocess.check_output(['node','-e',node_code,str(ROOT/'sources/snapshots/products.js')],timeout=5))
write('sources/snapshots/products-resolved.json',raw)
products=[]
for slug,p in raw.items():
 specs={k: (None if re.search(r'to be confirmed|on request|not available',v,re.I) else v) for k,v in p.get('spec',[])}
 record={'id':slug,'name':p['name'],'category':p['category'],'relationship':'distributed' if p['category']=='distributed' else 'manufacturer_site_catalogue','manufacturer':None,'short_description':p.get('desc') or None,'applications':None,'features':p.get('features') or None,'options':p.get('options') or None,'colors':[{'id':v['id'],'name':v.get('name'),'image':v.get('image')} for v in p.get('variants',[])],'technical_specifications':specs or None,'official_url':f'https://www.progamespoland.com/en/products/{slug}.html','polish_url':f'https://www.progamespoland.com/pl/produkty/{slug}.html','source_ids':['official-products-js'],'verified_at':DATE,'approval_status':'source_verified_human_pending','confidence':'high_for_source_transcription_not_independent_product_certification','evidence':{k:{'source_id':'official-products-js','locator':f'window.PRODUCTS[{slug!r}].{v}'} for k,v in {'name':'name','category':'category','short_description':'desc','features':'features','options':'options','colors':'variants','technical_specifications':'spec'}.items()},'legacy_source_url_unverified':p.get('source'),'source_copy_status_unverified':p.get('sourceCopyStatus'),'availability':None,'price':None,'certifications':None}
 products.append(record)
write('products/catalog.json',{'schema_version':'1.0','as_of':DATE,'scope':'46 records resolved from public products.js; not independent manufacturer validation','products':products})
write('products/specifications.json',{'as_of':DATE,'specifications':[{'product_id':p['id'],'values':p['technical_specifications'],'source_ids':p['source_ids'],'approval_status':p['approval_status']} for p in products]})
html=(ROOT/'sources/snapshots/home.html').read_text()
org=next(json.loads(x) for x in re.findall(r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>',html,re.S) if json.loads(x).get('@type')=='Organization')
write('company/profile.json',{'name':org['name'],'legal_name':org.get('legalName'),'description':org.get('description'),'url':org['url'],'address':org['address'],'tax_id':org['taxID'],'regon':org['identifier']['value'],'sales':{'email':org['email'],'phone':org['telephone']},'contacts':org['contactPoint'],'social_profiles':org['sameAs'],'source_ids':['official-home'],'verified_at':DATE,'approval_status':'source_verified_human_pending','confidence':'official_first_party_statement_not_registry_verified'})
sources=[]
for sid,url,path in [('official-products-js','https://www.progamespoland.com/products.js','sources/snapshots/products.js'),('official-home','https://www.progamespoland.com/','sources/snapshots/home.html')]:
 sources.append({'id':sid,'url':url,'retrieved_at':DATE,'type':'official_first_party','http_status':200,'snapshot':path,'sha256':hashlib.sha256((ROOT/path).read_bytes()).hexdigest(),'confidence':'high_source_authenticity_factual_claims_not_independently_certified','limitations':'Generated or legacy copied text may contain inaccuracies. Human review pending.'})
write('sources/source-register.json',{'as_of':DATE,'sources':sources})
print(f'Extracted {len(products)} products; {sum(p["relationship"]=="distributed" for p in products)} distributed.')
