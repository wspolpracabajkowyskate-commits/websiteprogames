import concurrent.futures,json,urllib.request,urllib.error,datetime,hashlib
from pathlib import Path
BASE=Path(__file__).resolve().parents[1]
urls=['https://www.progamespoland.com/','https://www.progamespoland.com/pl/','https://www.progamespoland.com/robots.txt','https://www.progamespoland.com/sitemap.xml','https://www.progamespoland.com/en/products/boxer-flash.html','https://www.progamespoland.com/pl/produkty/boxer-flash.html','https://www.progames.pl/','https://progames.pl/','https://progamespoland.com/','https://www.progamespoland.com/does-not-exist-audit-20261013']
def fetch(u):
 row={'url':u,'checked_at':datetime.datetime.now(datetime.timezone.utc).isoformat()}
 try:
  with urllib.request.urlopen(u,timeout=25) as r:
   b=r.read();row.update(status=r.status,final_url=r.url,headers=dict(r.headers),bytes=len(b),sha256=hashlib.sha256(b).hexdigest())
   if u.endswith(('robots.txt','sitemap.xml')): (BASE/'sources/raw'/u.rsplit('/',1)[-1]).write_bytes(b)
 except urllib.error.HTTPError as e:row.update(status=e.code,final_url=e.url)
 except Exception as e:row['error']=str(e)
 return row
if __name__=='__main__':
 rows=list(concurrent.futures.ThreadPoolExecutor(max_workers=5).map(fetch,urls))
 (BASE/'seo/live-http-audit.json').write_text(json.dumps(rows,indent=2))
 print(json.dumps([{k:v for k,v in r.items() if k in ('url','status','final_url','error')} for r in rows],indent=2))
