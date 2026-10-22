import json, re, difflib
from collections import Counter

SECTIONS = ["Cat A","Cat B","Cat C","Appendix 1","Appendix 2","Appendix 3","Appendix 4","Appendix 5"]

def norm(s): return re.sub(r"\s+"," ", re.sub(r"[^a-z0-9]+"," ", s.lower())).strip()

refs = json.load(open("data/reference_sections_v2.json",encoding="utf-8"))
content = open("js/school-data.js", encoding="utf-8").read()
parts = re.split(r'"([A-Za-z][A-Za-z ]+)":\s*\{', content)
schools=[]
region=None
for i,part in enumerate(parts):
    if i%2==1: region=part.strip()
    elif region:
        for m in re.finditer(r'id:\s*(\d+),\s*name:\s*"([^"]+)",\s*location:\s*"([^"]*)",\s*gender:\s*"([^"]*)",\s*school_type:\s*"([^"]*)",\s*status:\s*"([^"]*)",\s*programs:\s*\[[^\]]*\]', part):
            schools.append({"id":int(m.group(1)),"name":m.group(2),"location":m.group(3),"gender":m.group(4),"type":m.group(5),"status":m.group(6),"region":region})

tokf = Counter()
for sec,recs in refs.items():
    for r in recs:
        tokf.update(norm(r["name"]).split())

STOP = {"senior","high","school","schools","technical","institute","institutes","tech","shts","shs","college","academy","training","vocational","community","comm","day","boarding","mixed","girls","boys","presby","meth","methodist","st","st.","catholic","municipal","muni"}

def score_school(sc_item, r):
    nt = norm(sc_item["name"]).split()
    rn = norm(r["name"])
    rnt = rn.split()
    if not nt or not rnt: return 0
    cov = sum(1 for t in nt if t in rnt) / len(nt)
    cov2 = sum(1 for t in rnt if t in nt) / len(rnt)
    ratio = difflib.SequenceMatcher(None, " ".join(nt), rn).ratio()
    score = 0.4*ratio + 0.3*cov + 0.3*cov2
    if sc_item["region"] and r.get("region"):
        if norm(sc_item["region"]) == norm(r["region"]): score += 0.08
        else: score -= 0.05
    if sc_item["location"] and norm(sc_item["location"]) in rn: score += 0.04
    if sc_item["type"] and r.get("type") and norm(sc_item["type"])==norm(r["type"]): score += 0.03
    return score

results={s["id"]:{sec:None for sec in SECTIONS} for s in schools}
for s in schools:
    for sec in SECTIONS:
        recs=refs[sec]
        best=0; rec=None
        # try anchor-based first (fast)
        nt = norm(s["name"]).split()
        cand=[t for t in nt if len(t)>=4 and t not in STOP]
        if not cand: cand=[t for t in nt if len(t)>=3]
        anchor=min(cand, key=lambda x:(tokf.get(x,9999), -len(x))) if cand else (nt[0] if nt else "")
        # anchor pass
        for r in recs:
            rn=norm(r["name"])
            if anchor and anchor not in rn: continue
            sc=score_school(s,r)
            if sc>best: best,rec=sc,r
        thresh=0.82
        if sec=="Appendix 1" and norm(s["type"])=="tvet": thresh=0.78
        if sec=="Appendix 2" and norm(s["type"])=="shts": thresh=0.78
        if sec in ("Appendix 4","Appendix 5"): thresh=0.80
        if best>=thresh and rec: results[s["id"]][sec]=rec

# counts
cnt=Counter()
for sid,m in results.items():
    for sec,rec in m.items():
        if rec: cnt[sec]+=1
for sec in SECTIONS: print(sec,cnt[sec])

# write to school-data.js
id_to_cls={}
for s in schools:
    m=results[s["id"]]
    cls=[]
    for sec in SECTIONS:
        if m[sec]:
            label = "Category A" if sec=="Cat A" else ("Category B" if sec=="Cat B" else ("Category C" if sec=="Cat C" else sec))
            cls.append(label)
    id_to_cls[s["id"]]=cls

lines = content.split("\n")
out=[]
cur_id=None
for line in lines:
    m=re.search(r'id:\s*(\d+),', line)
    if m: cur_id=int(m.group(1))
    out.append(line)
    if cur_id is not None and line.strip().startswith("programs: ["):
        cls=id_to_cls.get(cur_id,[])
        indent=" "*(len(line)-len(line.lstrip())+4)
        out.append(f'{indent}classification: {json.dumps(cls, ensure_ascii=False)},')
        cur_id=None

open("js/school-data.js","w",encoding="utf-8").write("\n".join(out))
print("done", len(id_to_cls))
