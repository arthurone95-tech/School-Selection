import json, re, difflib

def norm(s): return re.sub(r"\s+"," ", re.sub(r"[^a-z0-9]+"," ", s.lower())).strip()

GENERIC = {"senior","high","school","schools","shs","shts",
           "comm","community","day","boarding","mixed",
           "inst","mth","rc","the","of","and","st","poly"}

def dist_toks(name):
    core = name.split(",")[0]
    return [t for t in norm(core).split() if len(t)>=2 and t not in GENERIC]

def loc_toks(loc):
    return [t for t in norm(loc or "").split() if len(t)>=2 and t not in GENERIC]

def fuzzy_in(tok, pool, thr=0.85):
    return any(difflib.SequenceMatcher(None, tok, p).ratio() >= thr for p in pool)

def dist_match_v2(s, ref_name):
    ds_core = dist_toks(s["name"])
    ds_all = ds_core + loc_toks(s.get("location"))
    ref = dist_toks(ref_name)
    if not ds_core or not ref: return False
    for t in ds_core:
        if not fuzzy_in(t, ref): return False
    for t in ref:
        if not fuzzy_in(t, ds_all): return False
    return True

def region_ok(s, r):
    sr = norm(s["region"]) if s.get("region") else None
    rr = norm(r.get("region")) if r.get("region") else None
    if sr and rr: return sr == rr
    return True

def score(s, r):
    # ratio on distinguishing tokens (handles short register names + location suffix)
    ds_core = dist_toks(s["name"]); ref = dist_toks(r["name"])
    ratio = difflib.SequenceMatcher(None, " ".join(ds_core), " ".join(ref)).ratio() if ds_core and ref else 0
    full = difflib.SequenceMatcher(None, norm(s["name"]), norm(r["name"])).ratio()
    sc = 0.6*ratio + 0.4*full
    if s.get("location") and norm(s["location"]) in norm(r["name"]): sc += 0.05
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

    # test on Appendix 5
    app5 = refs["Appendix 5"]
    print("App5 refs:", len(app5))
    matches=[]
    for s in schools:
        best=0; rec=None
        for r in app5:
            if not region_ok(s,r): continue
            if not dist_match_v2(s, r["name"]): continue
            sc=score(s,r)
            if sc>best: best,rec=sc,r
        if rec: matches.append((s["name"], rec["name"], round(best,3), s["region"]))
    print("App5 matched:", len(matches))
    for m in matches:
        print(f"  {m[0][:42]:<42} -> {m[1][:42]:<42} {m[2]} [{m[3]}]")

    # test on the previously-failing Cat B cases
    print("\n=== problem cases ===")
    for t in ["Aduman","Bankoman","Beposo","Dwamena","Bechem Presby","Agogo State","Banka"]:
        ds=[s for s in schools if t.lower() in s["name"].lower()]
        if not ds: continue
        s=ds[0]
        found=False
        for sec in ["Cat B","Cat C"]:
            for r in refs[sec]:
                if region_ok(s,r) and dist_match_v2(s, r["name"]):
                    print(f"  {s['name'][:38]:<38} -> {sec}: {r['name'][:38]!r} score={score(s,r):.2f}")
                    found=True; break
            if found: break
        if not found: print(f"  {s['name'][:38]:<38} -> NO MATCH")
