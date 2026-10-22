import os, re, json, difflib
from collections import Counter

SECTIONS = ["Cat A","Cat B","Cat C","Appendix 1","Appendix 2","Appendix 3","Appendix 4","Appendix 5"]

def norm(s): return re.sub(r"\s+"," ", re.sub(r"[^a-z0-9]+"," ", s.lower())).strip()

refs = json.load(open("data/reference_sections.json",encoding="utf-8"))
for sec in refs:
    refs[sec] = sorted(refs[sec], key=lambda x:(x.get("code") or "", x["name"]))

content = open("js/school-data.js", encoding="utf-8").read()
parts = re.split(r'"([A-Za-z][A-Za-z ]+)":\s*\{', content)
schools=[]
region=None
for i,part in enumerate(parts):
    if i%2==1: region=part.strip()
    elif region:
        for m in re.finditer(r'id:\s*(\d+),\s*name:\s*"([^"]+)",\s*location:\s*"([^"]*)",\s*gender:\s*"([^"]*)",\s*school_type:\s*"([^"]*)",\s*status:\s*"([^"]*)",\s*programs:\s*\[[^\]]*\]', part):
            schools.append({"id":int(m.group(1)),"name":m.group(2),"location":m.group(3),"gender":m.group(4),"type":m.group(5),"status":m.group(6),"region":region})

tok_counts = Counter()
for sec,recs in refs.items():
    for r in recs:
        tok_counts.update(norm(r["name"]).split())

def best(sc, sec_recs, thresh):
    nt = norm(sc["name"]).split()
    cand = [t for t in nt if len(t)>=4 and t not in {"senior","high","school","schools","technical","institute","tech","shts","shs","college"}]
    if not cand: cand = [t for t in nt if len(t)>=3]
    anchor = min(cand, key=lambda t: (tok_counts.get(t,9999), -len(t))) if cand else (nt[0] if nt else "")
    best=0; rec=None
    for r in sec_recs:
        rn=norm(r["name"])
        if anchor not in rn: continue
        ratio = difflib.SequenceMatcher(None, " ".join(nt), rn).ratio()
        cov = sum(1 for t in nt if t in rn.split())/max(1,len(nt))
        s = 0.6*ratio+0.4*cov
        if norm(sc["region"]) and norm(r.get("region")or"")==norm(sc["region"]): s+=0.05
        if s>best: best,srec=s,r
    if best>=thresh: return best,srec
    return best,None

results={s["id"]:{sec:None for sec in SECTIONS} for s in schools}
for s in schools:
    for sec in SECTIONS:
        if sec=="Appendix 1" or sec=="Appendix 2" or sec=="Appendix 5":
            b,rec=best(s, refs[sec], 0.85)
            if rec: results[s["id"]][sec]=rec
        else:
            b,rec=best(s, refs[sec], 0.83)
            if rec: results[s["id"]][sec]=rec

cnt=Counter()
for sid,m in results.items():
    for sec,rec in m.items():
        if rec: cnt[sec]+=1
for sec in SECTIONS: print(sec,cnt[sec])
