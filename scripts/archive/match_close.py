import os, re, json, difflib
from collections import Counter

def norm(s): return re.sub(r"\s+"," ", re.sub(r"[^a-z0-9]+"," ", s.lower())).strip()
def nsmall(s): return re.sub(r"[^a-z0-9 ]"," ", s.lower()).strip()

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
for k,v in refs.items():
    refs[k] = v
print("refs", {k:len(v) for k in refs})

tok_counts = Counter()
for sec,recs in refs.items():
    for r in recs:
        tok_counts.update(norm(r["name"]).split())

def best_for_school(sc, sec_recs, thresh=0.85):
    nt = norm(sc["name"]).split()
    cand = [t for t in nt if len(t)>=4 and t not in {"senior","high","school","schools","technical","institute","tech","shs","shts","day","boarding","mixed","girls","boys"}]
    if not cand: cand = [t for t in nt if len(t)>=3]
    anchor = min(cand, key=lambda t: (tok_counts.get(t,1e9), -len(t))) if cand else (nt[0] if nt else "")
    best=0; bestrec=None
    sc_rn = norm(sc["region"]); sc_t=norm(sc["type"]); sc_s=norm(sc["status"]); sc_g=norm(sc["gender"]); sc_lc=norm(sc["location"])
    for r in sec_recs:
        rn = norm(r["region"] or ""); rt = norm(r["type"] or ""); rs = norm(r["status"] or ""); rg = norm(r["gender"] or ""); rnm = norm(r["name"])
        if anchor and anchor not in rnm: continue
        score = difflib.SequenceMatcher(None, " ".join(nt), rnm).ratio()
        cov = sum(1 for t in nt if t in rnm.split()) / max(1,len(nt))
        score = 0.5*score + 0.5*cov
        if rn and sc_rn and rn==sc_rn: score += 0.05
        if sc_t and rt and sc_t==rt: score += 0.05
        if sc_s and rs and sc_s==rs: score += 0.05
        if sc_g and rg and sc_g==rg: score += 0.03
        if sc_lc and sc_lc in rnm: score += 0.02
        if score > best:
            best = score; bestrec = r
    if best >= thresh: return best, bestrec
    return best, None

results = {sid: {"Cat A":[],"Cat B":[],"Cat C":[],"Appendix 1":[],"Appendix 2":[],"Appendix 3":[],"Appendix 4":[],"Appendix 5":[]} for sid in [s["id"] for s in schools]}
THRESH=0.82

for s in schools:
    sid = s["id"]
    for sec in ["Cat A","Cat B","Cat C","Appendix 1","Appendix 2","Appendix 3","Appendix 4","Appendix 5"]:
        b,rec = best_for_school(s, refs[sec], thresh=THRESH)
        if rec:
            results[sid][sec].append(rec)

json.dump({"schools":schools[:10],"sample":results[list(results.keys())[:3]]}, open("match_sample.json","w",encoding="utf-8"), indent=1)
print("done sample")

# counts
counts = Counter()
for sid,m in results.items():
    for sec,recs in m.items():
        if recs: counts[sec]+=1
for sec in ["Cat A","Cat B","Cat C","Appendix 1","Appendix 2","Appendix 3","Appendix 4","Appendix 5"]: print(sec, counts.get(sec,0))
