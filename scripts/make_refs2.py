import os, re, json, sys

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

BANDS = {
    "Cat A":      dict(region=(240,460), district=(460,830), code=(830,1008), name=(1008,1730), location=(1730,2010), gender=(2010,2165), status=(3040,3225), type=(3240,3440)),
    "Cat B":      dict(region=(240,460), district=(460,830), code=(830,1008), name=(1008,1730), location=(1730,2010), gender=(2010,2165), status=(3040,3225), type=(3240,3440)),
    "Cat C":      dict(region=(240,460), district=(460,830), code=(830,1008), name=(1008,1730), location=(1730,2010), gender=(2010,2165), status=(3040,3225), type=(3240,3440)),
    "Appendix 1": dict(region=(240,460), district=(460,670), code=(670,770), name=(700,1110), location=(1110,1310), gender=(1310,1400), status=(3240,3400)),
    "Appendix 2": dict(region=(150,400), name=(400,1550), gender=(1550,1750)),
    "Appendix 3": dict(region=(300,620), district=(620,1360), code=(1360,1550), name=(1550,2340), location=(2340,2730), gender=(2730,2870), status=(2870,3310), type=(3310,3440)),
    "Appendix 4": dict(region=(150,400), district=(400,1000), name=(1000,2390), location=(2390,2870), subject=(2870,3440)),
    "Appendix 5": dict(region=(280,500), district=(500,800), code=(800,950), name=(950,1420), location=(1420,1650), gender=(1650,1900), status=(2900,3170), type=(3170,3440)),
}

REGIONS = ["Western North","Greater Accra","Upper East","Upper West","Bono East","North East","Ahafo","Ashanti","Bono","Central","Eastern","Northern","Oti","Savannah","Volta","Western"]
REGKEY = [(r, re.sub(r"[^a-z]","",r.lower())) for r in REGIONS]
CODE_RE = re.compile(r"(?<!\d)(\d{6,7})(?!\d)")

def norm(s): return re.sub(r"\s+"," ", re.sub(r"[^a-z0-9]+"," ", s.lower())).strip()

def load(p):
    fp = f"data/ocr_boxes/page_{p:03d}.json"
    if not os.path.exists(fp): return []
    try: return json.load(open(fp,encoding="utf-8"))
    except Exception: return []

def cluster_rows(boxes, tol=22):
    if not boxes: return []
    bs = sorted(boxes, key=lambda b: b["y"])
    rows=[]; cur=[]; last=None
    for b in bs:
        if last is None or b["y"]-last <= tol: cur.append(b)
        else: rows.append(cur); cur=[b]
        last=b["y"]
    if cur: rows.append(cur)
    return rows

def pick(boxes, lo, hi):
    return [b for b in boxes if lo<=b["x"]<hi]

def text_of(boxes): return " ".join(b["t"] for b in sorted(boxes, key=lambda b: b["x"])).strip()

def detect_region(t):
    n = re.sub(r"[^a-z]","", t.lower())
    for r,k in REGKEY:
        if k and k in n: return r
    return None

def parse_section(sec, pages):
    bands = BANDS[sec]
    out=[]
    for p in pages:
        for r in cluster_rows(load(p)):
            t = text_of(r)
            m = CODE_RE.search(t)
            code = m.group(1) if m else None
            regiontxt = text_of(pick(r, *bands.get("region",(240,460))))
            reg = detect_region(regiontxt) or detect_region(t)
            namet = text_of(pick(r, *bands.get("name",(1008,1730))))
            if not namet:
                # fallback to longest alpha text box
                cands = [b for b in r if re.search(r"[A-Za-z]", b["t"]) and len(b["t"])>10]
                if cands:
                    namet = max(cands, key=lambda b: len(b["t"]))["t"]
            if not namet: continue
            nn = norm(namet)
            if len(nn) < 3: continue
            # skip header/footer noise by exact match or by content pattern
            headerish = {"s n","region","district","programmes","no of prog","no of programme","list of","ghana education","register","appendix","category","candidates","special","public technical","elective technical","name of school","page of","second cycle","2025","school name","schoolname","status","type","stem schools","sen","hearing","visually","impaired","special education","vocational","institutes and their courses","courses","register of courses","technical and vocational","tvet service","tvets","stem","gender","mixed","boys","girls","day","boarding","day boarding","shs","shts","technical","institute","tsc","tsc technical","st","st.","meth","meth.","presby","academy","college","senior high","tech","no of programmes","no of programs","no","of","prog","programs","no of"}
            if nn in headerish: continue
            # skip footer noise
            if "page of" in nn or "second cycle" in nn or nn.startswith("2025") or "register of courses" in nn: continue
            loc = text_of(pick(r, *bands.get("location",(1730,2010)))) if bands.get("location") else ""
            gen = text_of(pick(r, *bands.get("gender",(2010,2165)))) if bands.get("gender") else ""
            stat = text_of(pick(r, *bands.get("status",(3040,3225)))) if bands.get("status") else ""
            typ = text_of(pick(r, *bands.get("type",(3240,3440)))) if bands.get("type") else ""
            out.append({"code":code,"region":reg,"name":namet,"location":loc,"gender":gen,"status":stat,"type":typ,"page":p})
    return out

if __name__ == "__main__":
    res={}
    for sec,pages in SECTIONS.items():
        recs = parse_section(sec,pages)
        res[sec]=recs
        print(sec, len(recs))
    json.dump(res, open("data/reference_sections_v2.json","w",encoding="utf-8"), ensure_ascii=False, indent=1)
