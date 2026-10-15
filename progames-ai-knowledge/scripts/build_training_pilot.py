#!/usr/bin/env python3
"""Deterministic source-grounded pilot. Does not submit training or spend money."""
import json, hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def build():
    catalog=json.loads((ROOT/'products/catalog.json').read_text()); ps={p['id']:p for p in catalog['products']}
    system=(ROOT/'ai-training/system-prompt.md').read_text().split('\n\n',1)[1].strip()
    specifications=[('train','training-height','double-hit','Height'),('train','training-width','boxer-flash','Width'),('train','training-weight','boxer-combat','Weight'),('train','training-length','monster-3in1','Length'),('train','training-missing-price','hammer-2026','price'),('train','training-missing-certification','leader-rank','certifications'),('train','training-distributed-maker','cyberdart','manufacturer'),('train','training-source-status','boxer-kids','approval_status'),('validation','validation-payment-options','kicker','options'),('validation','validation-color-list','double-hit-gift','colors'),('validation','validation-unknown-availability','win-a-toy','availability')]
    records={'train':[],'validation':[]}; maps=[]
    for split,family,pid,field in specifications:
        p=ps[pid]; value=p.get(field,(p['technical_specifications'] or {}).get(field)); url=p['official_url']
        if field=='colors': value=[v['name'] for v in value]
        evidence={'name':p['name'],'field':field,'value':value,'source_ids':p['source_ids'],'url':url,'verified_at':p['verified_at'],'approval_status':p['approval_status']}
        for lang in ['PL','EN']:
            prompts={
                'Height':('Jaką wysokość ma {name}?','How tall is {name}?'),
                'Width':('Ile szerokości potrzebuje {name}?','What is the width of {name}?'),
                'Weight':('Ile waży {name}?','How much does {name} weigh?'),
                'Length':('Jaka jest długość {name}?','What is the length of {name}?'),
                'price':('Podaj dokładną cenę {name}.','Give me the exact selling price of {name}.'),
                'certifications':('Jakie certyfikaty ma {name}?','Which certifications does {name} have?'),
                'manufacturer':('Czy możesz potwierdzić producenta urządzenia {name}?','Can you confirm who manufactures {name}?'),
                'approval_status':('Czy dane {name} zatwierdził już człowiek?','Have the {name} data been approved by a human?'),
                'options':('Jakie dodatki można zamówić do {name}?','Which optional equipment can be ordered for {name}?'),
                'colors':('W jakich kolorach jest przedstawiony {name}?','Which colors are shown for {name}?'),
                'availability':('Czy {name} jest dostępny od ręki?','Is {name} available for immediate delivery?')}
            question=prompts[field][0 if lang=='PL' else 1].format(name=p['name'])
            if value is None:
                answer=(f'W tym rekordzie brak potwierdzonych danych dla pola {field} produktu {p["name"]}. Nie należy ich zgadywać; poproś ProGames o potwierdzenie. Źródło: {url}' if lang=='PL' else f'This record contains no confirmed {field} value for {p["name"]}. Do not infer it; ask ProGames to confirm. Source: {url}')
            else:
                val='; '.join(value) if isinstance(value,list) else str(value)
                answer=(f'Pole {field} dla {p["name"]}: {val}. Dane odczytano z oficjalnego źródła, ale nadal oczekują na zatwierdzenie przez człowieka. Źródło: {url}' if lang=='PL' else f'{p["name"]}, {field}: {val}. This is transcribed from the official source and remains pending human approval. Source: {url}')
            rec={'messages':[{'role':'system','content':system},{'role':'user','content':question+'\nEvidence: '+json.dumps(evidence,ensure_ascii=False)},{'role':'assistant','content':answer}]}
            records[split].append(rec); maps.append({'record_id':family+'-'+lang,'split':split,'line':len(records[split]),'family':family,'language':lang,'product_id':pid,'field':field,'source_ids':p['source_ids'],'official_url':url,'verified_at':p['verified_at'],'approval_status':p['approval_status'],'evidence_sha256':hashlib.sha256(json.dumps(evidence,sort_keys=True).encode()).hexdigest()})
    for split,name in [('train','training'),('validation','validation')]:
        (ROOT/f'ai-training/{name}-dataset.jsonl').write_text(''.join(json.dumps(x,ensure_ascii=False)+'\n' for x in records[split]))
    (ROOT/'ai-training/dataset-source-map.json').write_text(json.dumps({'status':'pilot_human_review_required_not_submitted','records':maps},ensure_ascii=False,indent=2)+'\n')
if __name__=='__main__': build()
