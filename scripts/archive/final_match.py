import json, re, difflib
from collections import Counter, defaultdict

def norm(s): return re.sub(r"\s+"," ", re.sub(r"[^a-z0-9]+"," ", s.lower())).strip()

GENERIC = {"senior","high","school","schools","technical","institute","institutes","tech","shs","shts",
           "comm","community","day","boarding","mixed","presby","meth","methodist","st",
           "catholic","academy","college","training","vocational","inst","mth","rc","the","of","and"}

def dist_tokens(name):
    core = name.split(",")[0]
    return [t for t in norm(core).split() if len(t)>=2 and t not in GENERIC]

def fuzzy_in(tok, pool, thr=0.85):
    return any(difflib.SequenceMatcher(None, tok, p).ratio() >= thr for p in pool)

def dist_match(a_name, b_name):
    a = dist_tokens(a_name); b = dist_tokens(b_name)
    if not a or not b: return False
    for t in a:
        if not fuzzy_in(t, b): return False
    for t in b:
        if not fuzzy_in(t, a): return False
    return True

def region_ok(s, r):
    sr = norm(s["region"]) if s.get("region") else None
    rr = norm(r.get("region")) if r.get("region") else None
    if sr and rr: return sr == rr
    return True

def score(s, r):
    nt = norm(s["name"]).split()
    rn = norm(r["name"])
    if not nt or not rn: return 0
    ratio = difflib.SequenceMatcher(None, " ".join(nt), rn).ratio()
    sc = ratio
    if s.get("location") and norm(s["location"]) in rn: sc += 0.05
    if s.get("type") and r.get("type") and norm(s["type"])==norm(r["type"]): sc += 0.03
    return sc

refs = json.load(open("data/reference_sections_v2.json",encoding="utf-8"))
SECTIONS = ["Cat A","Cat B","Cat C","Appendix 1","Appendix 2","Appendix 3","Appendix 4","Appendix 5"]
LABEL = {"Cat A":"Category A","Cat B":"Category B","Cat C":"Category C",
         "Appendix 1":"Appendix 1","Appendix 2":"Appendix 2","Appendix 3":"Appendix 3",
         "Appendix 4":"Appendix 4","Appendix 5":"Appendix 5"}

content = open("js/school-data.js", encoding="utf-8").read()
# strip existing classification
content = re.sub(r'\n\s*classification:\s*\[[^\]]*\],?', '', content)
parts = re.split(r'"([A-Za-z][A-Za-z ]+)":\s*\{', content)
schools=[]
region=None
for i,part in enumerate(parts):
    if i%2==1: region=part.strip()
    elif region:
        for m in re.finditer(r'id:\s*(\d+),\s*name:\s*"([^"]+)",\s*location:\s*"([^"]*)",\s*gender:\s*"([^"]*)",\s*school_type:\s*"([^"]*)",\s*status:\s*"([^"]*)",\s*programs:\s*\[[^\]]*\]', part):
            schools.append({"id":int(m.group(1)),"name":m.group(2),"location":m.group(3),"gender":m.group(4),"type":m.group(5),"status":m.group(6),"region":region})

THRESH = 0.72
results={}
cat_ambiguity=[]
for s in schools:
    m={sec:None for sec in SECTIONS}
    for sec in SECTIONS:
        best=0; rec=None
        for r in refs[sec]:
            if not region_ok(s,r): continue
            if not dist_match(s["name"], r["name"]): continue
            sc=score(s,r)
            if sc>best: best,rec=sc,r
        if best>=THRESH and rec: m[sec]=rec
    # check category ambiguity
    cats=[c for c in ("Cat A","Cat B","Cat C") if m[c]]
    if len(cats)>1: cat_ambiguity.append((s["id"], s["name"], [LABEL[c] for c in cats]))
    results[s["id"]]=m

# counts
cnt=Counter()
for sid,m in results.items():
    for sec,rec in m.items():
        if rec: cnt[sec]+=1
print("=== match counts ===")
for sec in SECTIONS: print(f"  {sec}: {cnt[sec]}")
print("category ambiguity:", len(cat_ambiguity))

# build id->classification
id_to_cls={}
unresolved=[]
for s in schools:
    m=results[s["id"]]
    cls=[]
    for sec in SECTIONS:
        if m[sec]: cls.append(LABEL[sec])
    id_to_cls[s["id"]]=cls
    if not cls: unresolved.append(s)

# write
lines = content.split("\n")
out=[]
cur_id=None
for line in lines:
    mm=re.search(r'id:\s*(\d+),', line)
    if mm: cur_id=int(mm.group(1))
    out.append(line)
    if cur_id is not None and line.strip().startswith("programs: ["):
        cls=id_to_cls.get(cur_id,[])
        indent=" "*(len(line)-len(line.lstrip())+4)
        out.append(f'{indent}classification: {json.dumps(cls, ensure_ascii=False)},')
        cur_id=None
open("js/school-data.js","w",encoding="utf-8").write("\n".join(out))

# report
report={"total_schools":len(schools),"matched_with_any":len(schools)-len(unresolved),
        "unresolved_count":len(unresolved),"section_counts":dict(cnt),
        "category_ambiguity":[{"id":a[0],"name":a[1],"cats":a[2]} for a in cat_ambiguity],
        "unresolved":[{"id":s["id"],"name":s["name"],"region":s["region"],"type":s["type"]} for s in unresolved]}
json.dump(report, open("data/classification_report.json","w",encoding="utf-8"), indent=1, ensure_ascii=False)
print("=== done ===")
print("total", len(schools), "unresolved", len(unresolved))
