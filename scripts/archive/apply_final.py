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

results={s["id"]:{sec:None for sec in SECTIONS} for s in schools}
for s in schools:
    nt=norm(s["name"]).split()
    cand=[t for t in nt if len(t)>=4 and t not in {"senior","high","school","schools","technical","institute","tech","shts","shs","college"}]
    if not cand: cand=[t for t in nt if len(t)>=3]
    anchor=min(cand, key=lambda x:(tokf.get(x,9999), -len(x))) if cand else (nt[0] if nt else "")
    for sec in SECTIONS:
        recs=refs[sec]
        best=0; rec=None
        for r in recs:
            rn=norm(r["name"])
            if anchor not in rn: continue
            ratio=difflib.SequenceMatcher(None," ".join(nt),rn).ratio()
            cov=sum(1 for t in nt if t in rn.split())/max(1,len(nt))
            sc=0.6*ratio+0.4*cov
            if norm(s["region"]) and norm(r.get("region")or"")==norm(s["region"]): sc+=0.05
            if sc>best: best,rec=sc,r
        thresh=0.82
        st=norm(s["type"])
        if sec=="Appendix 1" and st=="tvet": thresh=0.75
        if sec=="Appendix 2" and st=="shts": thresh=0.75
        if sec=="Appendix 4" or sec=="Appendix 5": thresh=0.80
        if best>=thresh and rec: results[s["id"]][sec]=rec

# now apply line-based
lines = content.split("\n")
id_to_cls = {}
for s in schools:
    m=results[s["id"]]
    cls=[]
    for sec in SECTIONS:
        if m[sec]:
            label = "Category A" if sec=="Cat A" else ("Category B" if sec=="Cat B" else ("Category C" if sec=="Cat C" else sec))
            cls.append(label)
    id_to_cls[s["id"]] = cls

out = []
cur_id = None
for line in lines:
    m = re.search(r'id:\s*(\d+),', line)
    if m: cur_id = int(m.group(1))
    out.append(line)
    if cur_id is not None and line.strip().startswith("programs: ["):
        # find closing bracket
        bracket = line.find("]")
        # could be multiline, but assume single line
        cls = id_to_cls.get(cur_id, [])
        indent = " " * (len(line) - len(line.lstrip()) + 4)
        out.append(f'{indent}classification: {json.dumps(cls, ensure_ascii=False)},')
        cur_id = None

open("js/school-data.js","w",encoding="utf-8").write("\n".join(out))
print("done", len(id_to_cls))
