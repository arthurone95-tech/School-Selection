import os, re, json, difflib
from collections import Counter

SECTIONS = ["Cat A","Cat B","Cat C","Appendix 1","Appendix 2","Appendix 3","Appendix 4","Appendix 5"]

def norm(s): return re.sub(r"\s+"," ", re.sub(r"[^a-z0-9]+"," ", s.lower())).strip()

refs = json.load(open("data/reference_sections.json",encoding="utf-8"))
content = open("js/school-data.js", encoding="utf-8").read()
parts = re.split(r'"([A-Za-z][A-Za-z ]+)":\s*\{', content)
schools=[]
region=None
for i,part in enumerate(parts):
    if i%2==1: region=part.strip()
    elif region:
        for m in re.finditer(r'id:\s*(\d+),\s*name:\s*"([^"]+)",\s*location:\s*"([^"]*)",\s*gender:\s*"([^"]*)",\s*school_type:\s*"([^"]*)",\s*status:\s*"([^"]*)",\s*programs:\s*\[[^\]]*\]', part):
            schools.append({"id":int(m.group(1)),"name":m.group(2),"location":m.group(3),"gender":m.group(4),"type":m.group(5),"status":m.group(6),"region":region})

# build token freq over all refs
tokf = Counter()
for sec,recs in refs.items():
    for r in recs:
        tokf.update(norm(r["name"]).split())

# map: school_type -> likely appendix
stype_to_app = {
    "TVET": ["Appendix 1"],
    "SHTS": ["Appendix 2"],
}

results={s["id"]:{sec:None for sec in SECTIONS} for s in schools}
for s in schools:
    nt=norm(s["name"]).split()
    # find best in each section but be permissive
    for sec in SECTIONS:
        recs=refs[sec]
        best=0; rec=None
        cand=[t for t in nt if len(t)>=4 and t not in {"senior","high","school","schools","technical","institute","tech","shts","shs","college"}]
        if not cand: cand=[t for t in nt if len(t)>=3]
        if not cand: anchor=nt[0] if nt else ""
        else: anchor=min(cand, key=lambda x:(tokf.get(x,9999), -len(x)))
        for r in recs:
            rn=norm(r["name"])
            if anchor not in rn: continue
            ratio=difflib.SequenceMatcher(None," ".join(nt),rn).ratio()
            cov=sum(1 for t in nt if t in rn.split())/max(1,len(nt))
            sc=0.6*ratio+0.4*cov
            if norm(s["region"]) and norm(r.get("region")or"")==norm(s["region"]): sc+=0.05
            if sc>best: best,rec=sc,r
        # lower thresh for app1/app2 if type matches
        thresh=0.82
        st=norm(s["type"])
        if sec=="Appendix 1" and st=="tvet": thresh=0.75
        if sec=="Appendix 2" and st=="shts": thresh=0.75
        if sec=="Appendix 4" or sec=="Appendix 5": thresh=0.80
        if best>=thresh and rec:
            results[s["id"]][sec]=rec

cnt=Counter()
for sid,m in results.items():
    for sec,rec in m.items():
        if rec: cnt[sec]+=1
for sec in SECTIONS: print(sec,cnt[sec])

# write final mapping
mappings=[]
for s in schools:
    m=results[s["id"]]
    cls=[]
    if m["Cat A"]: cls.append("Category A")
    if m["Cat B"]: cls.append("Category B")
    if m["Cat C"]: cls.append("Category C")
    if m["Appendix 1"]: cls.append("Appendix 1")
    if m["Appendix 2"]: cls.append("Appendix 2")
    if m["Appendix 3"]: cls.append("Appendix 3")
    if m["Appendix 4"]: cls.append("Appendix 4")
    if m["Appendix 5"]: cls.append("Appendix 5")
    mappings.append((s["id"], cls))

# apply to school-data.js
path="js/school-data.js"
text=open(path,encoding="utf-8").read()
for sid,cls in mappings:
    # replace programs block to add classification after it
    pattern = rf'(id:\s*{sid},\s*name:[^,]+,[^,]+,[^,]+,[^,]+,[^,]+,programs:[^\]]+\])'
    repl = rf'\1, classification: {json.dumps(cls, ensure_ascii=False)}'
    newtext, n = re.subn(pattern, repl, text, count=1)
    if n==1:
        text=newtext
    else:
        # try looser: add before closing brace of the school object? easier: find id and insert after programs
        pass

open(path,"w",encoding="utf-8").write(text)
print("written", len(mappings))
