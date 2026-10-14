#!/usr/bin/env python3
"""Public, read-only monitoring. Never posts forms or changes canonical data."""
import argparse,concurrent.futures,datetime,hashlib,json,sys,time,urllib.request,urllib.error,xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]; SITE=ROOT/'progames-redesign'
class Page(HTMLParser):
 def __init__(self):super().__init__();self.canon=[];self.h1=0;self.robots=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='h1':self.h1+=1
  if tag=='link' and a.get('rel')=='canonical':self.canon.append(a.get('href'))
  if tag=='meta' and a.get('name')=='robots':self.robots.append(a.get('content',''))
def fetch(url):
 for attempt in range(2):
  try:
   req=urllib.request.Request(url,headers={'User-Agent':'ProGamesReadOnlyMonitor/1.0'})
   with urllib.request.urlopen(req,timeout=25) as r:return {'status':r.status,'url':url,'final_url':r.url,'headers':dict(r.headers),'body':r.read().decode('utf-8')}
  except (urllib.error.URLError,TimeoutError) as e:
   if attempt==0:time.sleep(.3);continue
   return {'url':url,'status':getattr(e,'code',None),'error':type(e).__name__}
def check_page(url):
 r=fetch(url);p=Page();p.feed(r.pop('body',''));r['canonical']=p.canon;r['h1_count']=p.h1
 robots=','.join(p.robots)+','.join(v for k,v in r.get('headers',{}).items() if k.lower()=='x-robots-tag')
 r['passed']=r.get('status')==200 and p.canon==[url] and p.h1==1 and 'noindex' not in robots.lower();r.pop('headers',None);return r
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--live',action='store_true');ap.add_argument('--out',required=True);a=ap.parse_args()
 now=datetime.datetime.now(datetime.timezone.utc);manifest=json.loads((SITE/'build/pages.json').read_text());urls=['https://www.progamespoland.com'+p['url'] for p in manifest]
 root=ET.fromstring((SITE/'sitemap.xml').read_text());sm=[x.text for x in root.findall('{*}url/{*}loc')]
 result={'checked_at':now.isoformat(),'kind':'live' if a.live else 'local','manifest_count':len(urls),'sitemap_matches_manifest':set(sm)==set(urls),'duplicate_sitemap_urls':len(sm)!=len(set(sm))}
 if a.live:
  result['pages']=list(concurrent.futures.ThreadPoolExecutor(max_workers=6).map(check_page,urls))
  live_sm=fetch('https://www.progamespoland.com/sitemap.xml')
  try:live_urls=[x.text for x in ET.fromstring(live_sm.get('body','')).findall('{*}url/{*}loc')];result['live_sitemap_matches_manifest']=set(live_urls)==set(urls)
  except ET.ParseError:result['live_sitemap_matches_manifest']=False
  products=fetch('https://www.progamespoland.com/products.js');live_hash=hashlib.sha256(products.get('body','').encode()).hexdigest() if products.get('status')==200 else None
 else:
  result['pages']=[]
  for x,u in zip(manifest,urls):
   file=SITE/x['filename'];p=Page()
   if file.exists():p.feed(file.read_text())
   result['pages'].append({'url':u,'passed':file.exists() and p.canon==[u] and p.h1==1 and not any('noindex' in x for x in p.robots)})
  live_hash=hashlib.sha256((SITE/'products.js').read_bytes()).hexdigest()
 sources=json.loads((ROOT/'progames-ai-knowledge/sources/source-register.json').read_text())['sources'];source=next(s for s in sources if s['id']=='official-products-js')
 result['product_source_hash']=live_hash;result['knowledge_source_hash']=source['sha256'];result['knowledge_matches_published_products']=live_hash==source['sha256']
 result['passed']=all(p['passed'] for p in result['pages']) and result['sitemap_matches_manifest'] and not result['duplicate_sitemap_urls'] and result.get('live_sitemap_matches_manifest',True) and result['knowledge_matches_published_products']
 path=Path(a.out);path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(result,ensure_ascii=False,indent=2))
 print(json.dumps({'passed':result['passed'],'pages':len(result['pages']),'failed_pages':[p['url'] for p in result['pages'] if not p['passed']],'knowledge_matches':result['knowledge_matches_published_products']}));return 0 if result['passed'] else 1
if __name__=='__main__':sys.exit(main())
