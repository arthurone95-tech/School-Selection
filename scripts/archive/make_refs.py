import json, os, re, sys, difflib

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

REGIONS = ["Western North","Greater Accra","Upper East","Upper West","Bono East","North East","Ahafo","Ashanti","Bono","Central","Eastern","Northern","Oti","Savannah","Volta","Western"]
REGKEY = [(r, re.sub(r"[^a-z]","",r.lower())) for r in REGIONS]

CODE_RE = re.compile(r"(?<!\d)(\d{6,7})(?!\d)")

def norm(s): return re.sub(r"\s+"," ", re.sub(r"[^a-z0-9]+"," ", s.lower())).strip()
def nsmall(s): return re.sub(r"[^a-z0-9 ]"," ", s.lower()).strip()

def load(p):
    fp = f"data/ocr_boxes/page_{p:03d}.json"
    if not os.path.exists(fp): return []
    try:
        return json.load(open(fp,encoding="utf-8"))
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
    out=[]
    for p in pages:
        for r in cluster_rows(load(p)):
            t = text_of(r)
            m = CODE_RE.search(t)
            code = m.group(1) if m else None
            reg = detect_region(text_of(pick(r,240,460)) or t)
            namet = text_of(pick(r,1008,1730))
            loc = text_of(pick(r,1730,2010))
            gen = text_of(pick(r,2010,2165))
            stat = text_of(pick(r,3040,3225))
            typ = text_of(pick(r,3240,3440))
            if not namet: continue
            nn = norm(namet)
            if len(nn) < 3: continue
            if re.match(r"^(school|region|district|s/n|programmes|schoolname|no\. of prog|list of|ghana education|register)", nn): continue
            out.append({"code":code,"region":reg,"name":namet,"location":loc,"gender":gen,"status":stat,"type":typ,"page":p})
    return out

if __name__ == "__main__":
    res={}
    for sec,pages in SECTIONS.items():
        recs = parse_section(sec,pages)
        res[sec]=recs
        print(sec, len(recs))
    json.dump(res, open("data/reference_sections.json","w",encoding="utf-8"), ensure_ascii=False, indent=1)
