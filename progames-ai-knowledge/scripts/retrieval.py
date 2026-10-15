#!/usr/bin/env python3
"""Local, deterministic evidence retrieval. Does not generate model answers."""
import argparse
from collections import Counter
from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import math
from pathlib import Path
import re
import unicodedata
from urllib.parse import parse_qs, urlsplit

ROOT = Path(__file__).resolve().parents[1]
STOP = set('a an the is are of in on and or to for what which how does do i can me with czy jakie jaki jaka jak jest sa w z na i o do co gdzie dla sie oraz'.split())
ALIASES = {'bokserskie':'boxing', 'bokserski':'boxing', 'bokserskich':'boxing', 'automat':'machine', 'automaty':'machine', 'automatow':'machine', 'machines':'machine', 'producent':'manufacturer', 'produkuje':'manufacturer', 'firma':'company', 'kolory':'colors', 'kolor':'colors', 'colour':'colors', 'colours':'colors', 'cena':'price', 'ceny':'price', 'kosztuje':'price', 'certyfikaty':'certifications', 'certyfikat':'certifications', 'gwarancja':'warranty'}

def tokens(text):
    text = unicodedata.normalize('NFKD', str(text).lower().replace('ł','l'))
    text = ''.join(c for c in text if not unicodedata.combining(c))
    return [ALIASES.get(w,w) for w in re.findall(r'[a-z0-9]+', text) if len(w)>1 and w not in STOP]

def read_json(path):
    return json.loads(path.read_text(encoding='utf-8'))

def records(value):
    if isinstance(value,list): return value
    if isinstance(value,dict):
        for key in ('products','items','catalog','sources'):
            if isinstance(value.get(key),list): return value[key]
    return []

def urls(value):
    if isinstance(value,dict):
        return sorted(set(u for v in value.values() for u in urls(v)))
    if isinstance(value,list): return sorted(set(u for v in value for u in urls(v)))
    if isinstance(value,str): return re.findall(r'https?://[^\s<>"\]\)]+', value)
    return []

def corpus(root=ROOT):
    root = Path(root)
    registry = root/'sources/source-register.json'
    source_map = {}
    if registry.exists():
        for s in records(read_json(registry)):
            source_map[str(s.get('id',s.get('source_id','')))] = s
    path = root/'products/catalog.json'
    documents = []
    if path.exists():
        for record in records(read_json(path)):
            text = json.dumps(record, ensure_ascii=False, indent=2)
            cites = urls(record)
            # Follow source identifiers without assuming the provenance field's nesting.
            for sid, source in source_map.items():
                if sid and '"'+sid+'"' in text: cites.extend(urls(source))
            documents.append({'id':str(record.get('id',record.get('slug',record.get('name','product')))), 'type':'product', 'text':text, 'citations':sorted(set(cites)), 'record':record, 'path':'products/catalog.json'})
    for path in sorted((root/'company').glob('*.md')):
        text = path.read_text(encoding='utf-8')
        cites = urls(text)
        for sid, source in source_map.items():
            if sid and sid in text: cites.extend(urls(source))
        documents.append({'id':path.stem, 'type':'company', 'text':text, 'citations':sorted(set(cites)), 'path':str(path.relative_to(root))})
    return documents

def search(query, limit=5, root=ROOT):
    if not isinstance(query,str) or not query.strip() or len(query)>500:
        raise ValueError('Query must contain 1–500 characters.')
    if not 1 <= limit <= 10: raise ValueError('Limit must be between 1 and 10.')
    q = set(tokens(query))
    # These high-risk facts have no approved retrieval pathway in this prototype.
    # Fail closed even if a product description makes an unstructured claim.
    restricted = q.intersection({'price','prices','cost','costs','pricing','certifications','certification','certified','ce','warranty','guarantee','gwarancji','cennik','certyfikatow'})
    if restricted:
        return {'status':'insufficient_evidence','query':query,'reason':'No approved structured evidence pathway for price, certification or warranty. Ask the official sales/service contact.','results':[]}
    docs = corpus(root)
    bags = [Counter(tokens(d['text'])) for d in docs]
    scored = []
    for doc, bag in zip(docs,bags):
        overlap = q.intersection(bag)
        if not overlap or not doc['citations']: continue
        score = sum((1+math.log(bag[t]))*math.log(1+len(docs)/(1+sum(t in b for b in bags))) for t in overlap)
        # Prefer exact model names, while retaining citations and source approval status.
        if doc['type']=='product':
            name = doc['record'].get('name',doc['record'].get('official_name',''))
            if isinstance(name,str) and name.lower() in query.lower(): score += 10 + len(tokens(name))
            if isinstance(name,str) and name.strip().lower() == query.strip().lower(): score += 20
        scored.append((score,doc))
    scored.sort(key=lambda item:(-item[0],item[1]['id']))
    results = []
    for score,doc in scored[:limit]:
        results.append({'id':doc['id'],'type':doc['type'],'score':round(score,4),'source_path':doc['path'],'excerpt':doc['text'],'citations':doc['citations']})
    return {'status':'retrieved' if results else 'insufficient_evidence', 'query':query, 'method':'local lexical TF-IDF-style ranking; no LLM or vector embeddings', 'results':results}

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed=urlsplit(self.path)
        try:
            if parsed.path=='/health': body={'status':'ok','documents':len(corpus()),'generative_model':False}
            elif parsed.path=='/products': body={'products':[d['record'] for d in corpus() if d['type']=='product']}
            elif parsed.path=='/search':
                args=parse_qs(parsed.query)
                body=search(args.get('q',[''])[0],int(args.get('limit',['5'])[0]))
            else: self.respond(404,{'error':'Unknown endpoint'}); return
            self.respond(200,body)
        except (ValueError,TypeError) as exc: self.respond(400,{'error':str(exc)})
    def respond(self,status,body):
        data=json.dumps(body,ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type','application/json; charset=utf-8')
        self.send_header('Content-Length',str(len(data)))
        self.send_header('Cache-Control','no-store')
        self.end_headers(); self.wfile.write(data)
    def log_message(self,*args): pass

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('query',nargs='?')
    parser.add_argument('--limit',type=int,default=5)
    parser.add_argument('--serve',action='store_true')
    parser.add_argument('--port',type=int,default=8765)
    args=parser.parse_args()
    if args.serve:
        print(f'Local read-only evidence API: http://127.0.0.1:{args.port}',flush=True)
        HTTPServer(('127.0.0.1',args.port),Handler).serve_forever()
    elif args.query: print(json.dumps(search(args.query,args.limit),ensure_ascii=False,indent=2))
    else: parser.error('Provide a query or --serve.')
