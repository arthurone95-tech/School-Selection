import json
import re
import difflib

def norm(s): return re.sub(r'\s+', ' ', re.sub(r'[^a-z0-9]+', ' ', s.lower())).strip()

GENERIC = {"senior","high","school","schools","shs","shts","comm","community","day","boarding","mixed","inst","mth","rc","the","of","and","st","poly"}

def dist_toks(name):
    core = (name or '').split(',')[0]
    return [t for t in norm(core).split() if len(t)>=2 and t not in GENERIC]

def loc_toks(loc):
    return [t for t in norm(loc or '').split() if len(t)>=2 and t not in GENERIC]

def fuzzy_in(tok, pool, thr=0.85):
    return any(difflib.SequenceMatcher(None, tok, p).ratio() >= thr for p in pool)

def dist_match_v2(s, ref_name):
    ds_core = dist_toks(s['name'])
    ds_all = ds_core + loc_toks(s.get('location'))
    ref = dist_toks(ref_name)
    if not ds_core or not ref: return False
    for t in ds_core:
        if not fuzzy_in(t, ref): return False
    for t in ref:
        if not fuzzy_in(t, ds_all): return False
    return True

def region_ok(s, r):
    sr = norm(s['region']) if s.get('region') else None
    rr = norm(r.get('region')) if r.get('region') else None
    if sr and rr: return sr == rr
    return True

def score(s, r):
    ds_core = dist_toks(s['name']); ref = dist_toks(r['name'])
    ratio = difflib.SequenceMatcher(None, ' '.join(ds_core), ' '.join(ref)).ratio() if ds_core and ref else 0
    full = difflib.SequenceMatcher(None, norm(s['name']), norm(r['name'])).ratio()
    sc = 0.6*ratio + 0.4*full
    if s.get('location') and norm(s['location']) in norm(r['name']): sc += 0.05
    if s.get('type') and r.get('type') and norm(s['type'])==norm(r['type']): sc += 0.03
    return sc

# priorities: if it's TVET/Technical Institute context, prefer Category A (technical institutes in A) over B/C; if clearly SHS, prefer B/C
def is_tvet_like(s):
    n = norm(s['name'])
    return any(k in n for k in ['technical institute', 'tech inst', 'tvet', 'poly'])

if __name__ == '__main__':
    refs = json.load(open('data/reference_sections_v2.json', encoding='utf-8'))
    SECTIONS = ["Cat A","Cat B","Cat C","Appendix 1","Appendix 2","Appendix 3","Appendix 4","Appendix 5"]
    LABEL = {"Cat A":"Category A","Cat B":"Category B","Cat C":"Category C","Appendix 1":"Appendix 1","Appendix 2":"Appendix 2","Appendix 3":"Appendix 3","Appendix 4":"Appendix 4","Appendix 5":"Appendix 5"}
    
    content = open('js/school-data.js', encoding='utf-8').read()
    content = re.sub(r'\n\s*classification:\s*\[[^\]]*\],?', '', content)
    parts = re.split(r'"([A-Za-z][A-Za-z ]+)":\s*\{', content)
    schools = []
    region = None
    for i,part in enumerate(parts):
        if i%2==1: region=part.strip()
        elif region:
            for m in re.finditer(r'id:\s*(\d+),\s*name:\s*"([^"]+)",\s*location:\s*"([^"]*)",\s*gender:\s*"([^"]*)",\s*school_type:\s*"([^"]*)",\s*status:\s*"([^"]*)",\s*programs:\s*\[[^\]]*\]', part):
                schools.append({'id':int(m.group(1)),'name':m.group(2),'location':m.group(3),'gender':m.group(4),'type':m.group(5),'status':m.group(6),'region':region})
    
    results = {}
    for s in schools:
        m = {sec:None for sec in SECTIONS}
        # find matches in each section
        for sec in SECTIONS:
            best = 0; rec = None
            for r in refs[sec]:
                if not region_ok(s,r): continue
                if not dist_match_v2(s, r['name']): continue
                sc = score(s,r)
                if sc > best: best,rec = sc,r
            if rec and best>=0.55: m[sec]=rec
        results[s['id']] = m
    
    # fix ambiguities: prefer A for TVET-like; prefer single category
    for s in schools:
        m = results[s['id']]
        cats = [c for c in ("Cat A","Cat B","Cat C") if m[c]]
        if len(cats) > 1:
            tvet = is_tvet_like(s) or norm(s['type']) in ('tvet','technical','technical institute')
            if tvet and 'Cat A' in cats:
                # drop B,C if A present
                for c in ['Cat B','Cat C']:
                    if c in cats: m[c]=None
            else:
                # prefer B/C mutually exclusive? pick best-scoring of those remaining
                best_c = None; best_sc = 0
                for c in cats:
                    if c in ['Cat B','Cat C'] and len(cats)==3 and tvet==False: pass
                # simpler: if TVET pick A; else if multiple SHS categories, pick the one with highest score of that category group
                best_c=None; best_sc=-1
                for c in cats:
                    r = m[c]
                    sc = score(s,r)
                    if sc > best_sc: best_sc, best_c = sc, c
                for c in ['Cat A','Cat B','Cat C']:
                    if c != best_c: m[c]=None
        results[s['id']] = m
    
    # counts
    cnt = Counter()
    for sid,m in results.items():
        for sec,rec in m.items():
            if rec: cnt[sec]+=1
    print('=== counts ===')
    for sec in SECTIONS: print(sec,cnt[sec])
    
    # unresolved
    id_to_cls={}
    unresolved=[]
    for s in schools:
        m = results[s['id']]
        cls = [LABEL[sec] for sec in SECTIONS if m[sec]]
        id_to_cls[s['id']] = cls
        if not cls: unresolved.append(s)
    print('total', len(schools), 'unresolved', len(unresolved))
    
    # write
    lines = content.split('\n'); out=[]; cur_id=None
    for line in lines:
        mm = re.search(r'id:\s*(\d+),', line)
        if mm: cur_id=int(mm.group(1))
        out.append(line)
        if cur_id is not None and line.strip().startswith('programs: ['):
            cls = id_to_cls.get(cur_id,[])
            indent=' '*(len(line)-len(line.lstrip())+4)
            out.append(f'{indent}classification: {json.dumps(cls, ensure_ascii=False)},')
            cur_id=None
    open('js/school-data.js','w',encoding='utf-8').write('\n'.join(out))
    
    rep = {'total':len(schools),'matched':len(schools)-len(unresolved),'unresolved_count':len(unresolved),
           'section_counts':dict(cnt),
           'unresolved':[{'id':s['id'],'name':s['name'],'region':s['region'],'type':s['type']} for s in unresolved]}
    json.dump(rep, open('data/classification_report2.json','w',encoding='utf-8'), indent=1, ensure_ascii=False)
    print('done')
