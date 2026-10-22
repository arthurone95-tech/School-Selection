import json, re, difflib

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

if __name__ == "__main__":
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

    app5 = refs["Appendix 5"]
    print("App5 refs:", len(app5))
    matches=[]
    for s in schools:
        best=0; rec=None
        for r in app5:
            if not region_ok(s,r): continue
            if not dist_match(s["name"], r["name"]): continue
            sc=score(s,r)
            if sc>best: best,rec=sc,r
        if best>=0.70:
            matches.append((s["name"], rec["name"], round(best,3), s["region"]))
    print("matched:", len(matches))
    for m in matches:
        print(f"  {m[0][:42]:<42} -> {m[1][:42]:<42} {m[2]} [{m[3]}]")
