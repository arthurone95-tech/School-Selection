import json, re, difflib
from collections import Counter

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

def score(s, r):
    nt = norm(s["name"]).split()
    rn = norm(r["name"])
    rnt = rn.split()
    if not nt or not rnt: return 0
    cov = sum(1 for t in nt if t in rnt)/len(nt)
    cov2 = sum(1 for t in rnt if t in nt)/len(rnt)
    ratio = difflib.SequenceMatcher(None, " ".join(nt), rn).ratio()
    sc = 0.4*ratio + 0.3*cov + 0.3*cov2
    if s["region"] and r.get("region"):
        if norm(s["region"])==norm(r["region"]): sc += 0.08
        else: sc -= 0.06
    if s["location"] and norm(s["location"]) in rn: sc += 0.05
    if s["type"] and r.get("type") and norm(s["type"])==norm(r["type"]): sc += 0.03
    return sc

# Test on Appendix 5 (small, known ~21)
app5 = refs["Appendix 5"]
print("Appendix 5 refs:", len(app5))
matches=[]
for s in schools:
    best=0; rec=None
    for r in app5:
        sc=score(s,r)
        if sc>best: best,rec=sc,r
    if best>=0.85:
        matches.append((s["name"], rec["name"], round(best,3), s["region"], rec.get("region")))
print("matched at 0.85:", len(matches))
for m in matches[:30]:
    print(f"  {m[0][:40]:<40} -> {m[1][:40]:<40} {m[2]} [{m[3]}|{m[4]}]")
