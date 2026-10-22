import os, re, json, difflib
from collections import Counter

SECTIONS = {
    "Cat A":      [6,7,8,9],
    "Cat B":      [10,11,12,13,14,15,16],
    "Cat C":      [17,18,19,20,21,22,23,24,25,26,27,28,29,30,31],
    "Appendix 1": [32,33,34,35,36,37,38],
    "Appendix 2": [39,40,41,42,43,44,45],
    "Appendix 3": [46,47,48,49,50,51,52,53,54,55,56,57,58,59,60],
    "Appendix 4": [61],
    "Appendix 5": [62],
}

def norm(s): return re.sub(r"\s+"," ", re.sub(r"[^a-z0-9]+"," ", s.lower())).strip()

content = open("js/school-data.js", encoding="utf-8").read()
parts = re.split(r'"([A-Za-z][A-Za-z ]+)":\s*\{', content)
schools=[]
region=None
for i,part in enumerate(parts):
    if i%2==1:
        region=part.strip()
    elif region:
        for m in re.finditer(r'id:\s*(\d+),\s*name:\s*"([^"]+)",\s*location:\s*"([^"]*)",\s*gender:\s*"([^"]*)",\s*school_type:\s*"([^"]*)",\s*status:\s*"([^"]*)",\s*programs:\s*\[[^\]]*\]', part):
            schools.append({"id":int(m.group(1)),"name":m.group(2),"location":m.group(3),"gender":m.group(4),"type":m.group(5),"status":m.group(6),"region":region})
print("schools", len(schools))

refs = json.load(open("data/reference_sections.json", encoding="utf-8"))
tok_counts = Counter()
for sec,recs in refs.items():
    for r in recs:
        tok_counts.update(norm(r["name"]).split())

def best_for_school(sc, sec_recs, thresh=0.82):
    nt = norm(sc["name"]).split()
    cand = [t for t in nt if len(t)>=4 and t not in {"senior","high","school","schools","technical","institute","tech","shs","shts","day","boarding","mixed","girls","boys"}]
    if not cand: cand = [t for t in nt if len(t)>=3]
    anchor = min(cand, key=lambda t: (tok_counts.get(t,1e9), -len(t))) if cand else (nt[0] if nt else "")
    best=0; bestrec=None
    sc_rn = norm(sc["region"]); sc_t=norm(sc["type"]); sc_s=norm(sc["status"]); sc_g=norm(sc["gender"]); sc_lc=norm(sc["location"])
    for r in sec_recs:
        rn = norm(r["region"] or ""); rt = norm(r["type"] or ""); rs = norm(r["status"] or ""); rg = norm(r["gender"] or ""); rnm = norm(r["name"])
        if anchor and anchor not in rnm: continue
        score = 0.5*difflib.SequenceMatcher(None, " ".join(nt), rnm).ratio() + 0.5*(sum(1 for t in nt if t in rnm.split())/max(1,len(nt)))
        if rn and sc_rn and rn==sc_rn: score += 0.05
        if sc_t and rt and sc_t==rt: score += 0.05
        if sc_s and rs and sc_s==rs: score += 0.05
        if sc_g and rg and sc_g==rg: score += 0.03
        if sc_lc and sc_lc in rnm: score += 0.02
        if score > best: best, bestrec = score, r
    if best>=thresh: return best,bestrec
    return best,None

results = {}
for s in schools:
    sid = s["id"]; m={sec:[] for sec in SECTIONS}
    for sec in SECTIONS:
        b,rec = best_for_school(s, refs[sec], 0.82)
        if rec: m[sec].append(rec)
    results[sid]=m

counts={}
for sec in SECTIONS: counts[sec]=0
for sid,m in results.items():
    for sec,recs in m.items():
        if recs: counts[sec]+=1
for sec in SECTIONS: print(sec, counts[sec])
