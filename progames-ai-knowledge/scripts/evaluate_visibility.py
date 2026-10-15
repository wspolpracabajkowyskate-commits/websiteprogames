#!/usr/bin/env python3
"""Import captured model answers; never invoke a provider or infer factual accuracy."""
import argparse, json, re
from pathlib import Path
from collections import defaultdict
ROOT=Path(__file__).resolve().parents[1]
REQUIRED=['question_id','model','model_version','timestamp','mode','answer','citations','run_id','prompt_version']
MODES={'base','system','rag','search','fine_tuned'}
def evaluate(rows,questions):
    qmap={q['id']:q for q in questions}; groups=defaultdict(list); seen=set()
    for row in rows:
        missing=[k for k in REQUIRED if k not in row]
        if missing: raise ValueError('Missing fields: '+','.join(missing))
        if row['question_id'] not in qmap or row['mode'] not in MODES: raise ValueError('Unknown question or mode')
        key=(row['run_id'],row['model'],row['model_version'],row['mode'],row['question_id'])
        if key in seen: raise ValueError('Duplicate observation')
        seen.add(key)
        if not isinstance(row['answer'],str) or not isinstance(row['citations'],list): raise ValueError('Invalid answer/citations')
        for citation in row['citations']:
            if not isinstance(citation,str): raise ValueError('Citations must contain URL strings')
        q=qmap[row['question_id']]; a=row['answer']; review=row.get('human_review',{})
        for field in ('company_correct','offer_correct','has_factual_error','unknowns_handled','citations_support_claims'):
            if field in review and review[field] is not None and not isinstance(review[field],bool): raise ValueError('Human judgements must be boolean or null')
        computed={'brand_string_mentioned':bool(re.search(r'pro\s*games',a,re.I)), 'official_domain_string_present':bool(re.search(r'https?://(?:www\.)?progamespoland\.com(?:[/\s?#]|$)',a,re.I)), 'citation_count':len(row['citations'])}
        row['observations']=computed; row['question']=q['question']; row['language']=q['language']; row['group']=q['group']
        # Group/run/model separation prevents search-assisted runs being counted as base recall.
        groups[(row['run_id'],row['model'],row['model_version'],row['mode'],q['language'],q['group'])].append(row)
    summaries=[]
    for key,rs in sorted(groups.items()):
        s=dict(zip(['run_id','model','model_version','mode','language','group'],key)); s['observations']=len(rs)
        for metric in ('brand_string_mentioned','official_domain_string_present'):
            s[metric+'_rate']=sum(r['observations'][metric] for r in rs)/len(rs)
        s['spontaneous_brand_mention_rate']=s['brand_string_mentioned_rate'] if key[-1]=='A' else None
        for field in ('company_correct','offer_correct','has_factual_error','unknowns_handled','citations_support_claims'):
            reviewed=[r['human_review'][field] for r in rs if r.get('human_review',{}).get(field) is not None]
            s[field+'_rate']=sum(reviewed)/len(reviewed) if reviewed else None; s[field+'_reviewed_n']=len(reviewed)
        summaries.append(s)
    return {'status':'measured_imported_observations' if rows else 'not_run','records':rows,'summary':summaries,'limitations':['String presence is not factual correctness or citation validity.','Judged rates use reviewed records only; report coverage.','No observation means null/empty results, never zero performance.','Compare repeated runs with identical question and prompt versions; base/system/RAG/search remain separate.']}
def main():
    p=argparse.ArgumentParser(); p.add_argument('--input',type=Path); p.add_argument('--output',type=Path,required=True); args=p.parse_args()
    qs=json.loads((ROOT/'ai-training/evaluation-questions.json').read_text())['questions']
    rows=[json.loads(x) for x in args.input.read_text().splitlines() if x.strip()] if args.input else []
    result=evaluate(rows,qs); args.output.parent.mkdir(parents=True,exist_ok=True); args.output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
if __name__=='__main__': main()
