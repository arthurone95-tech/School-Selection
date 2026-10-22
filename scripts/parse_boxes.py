import json, os, re, sys

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

# columns bands (x ranges) - register layout
BANDS = {
    "region":   (240, 460),
    "district": (460, 832),
    "code":     (832, 1008),
    "name":     (1008, 1730),
    "location": (1730, 2010),
    "gender":   (2010, 2165),
    "prog":     (2165, 2990),
    "nprog":    (2990, 3040),
    "status":   (3040, 3225),
    "type":     (3240, 3440),
}

REGIONS = ["Western North","Greater Accra","Upper East","Upper West","Bono East",
           "North East","Ahafo","Ashanti","Bono","Central","Eastern","Northern",
           "Oti","Savannah","Volta","Western"]
REGION_KEY = [(r, re.sub(r"[^a-z]", "", r.lower())) for r in REGIONS]

def norm(s):
    return re.sub(r"[^a-z0-9]", "", s.lower())

def load(p):
    fp = f"data/ocr_boxes/page_{p:03d}.json"
    if not os.path.exists(fp):
        return []
    try:
        return json.load(open(fp, encoding="utf-8"))
    except Exception:
        return []

def cluster_rows(boxes, tol=22):
    bs = sorted(boxes, key=lambda b: b["y"])
    rows = []
    cur = []
    last = None
    for b in bs:
        if last is None or (b["y"] - last) <= tol:
            cur.append(b)
        else:
            rows.append(cur); cur = [b]
        last = b["y"]
    if cur:
        rows.append(cur)
    return rows

def pick(boxes, band):
    lo, hi = band
    return [b for b in boxes if lo <= b["x"] < hi]

def text_of(boxes):
    return " ".join(b["t"] for b in sorted(boxes, key=lambda b: b["x"])).strip()

def detect_region(t):
    n = norm(t)
    for r, k in REGION_KEY:
        if k and k in n:
            return r
    return None

CODE_RE = re.compile(r"(?<!\d)(\d{6,7})(?!\d)")

def parse_section(pages, bands=None):
    bands = bands or BANDS
    out = []
    for p in pages:
        boxes = load(p)
        if not boxes:
            continue
        for row in cluster_rows(boxes):
            nametxt = text_of(pick(row, bands["name"]))
            codetxt = text_of(pick(row, bands["code"]))
            regiontxt = text_of(pick(row, bands["region"]))
            disttxt = text_of(pick(row, bands["district"]))
            alltxt = text_of(row)
            m = CODE_RE.search(codetxt) or CODE_RE.search(disttxt) or CODE_RE.search(alltxt)
            code = m.group(1) if m else None
            region = detect_region(regiontxt) or detect_region(alltxt)
            if not nametxt:
                continue
            # skip header-ish lines
            if len(norm(nametxt)) < 4:
                continue
            out.append({
                "page": p, "code": code, "region": region,
                "name": nametxt,
                "location": text_of(pick(row, bands["location"])),
                "gender": text_of(pick(row, bands["gender"])),
                "status": text_of(pick(row, bands["status"])),
                "type": text_of(pick(row, bands["type"])),
            })
    return out

if __name__ == "__main__":
    which = sys.argv[1] if len(sys.argv) > 1 else None
    for sec, pages in SECTIONS.items():
        if which and sec != which:
            continue
        recs = parse_section(pages)
        # filter obvious headers
        recs = [r for r in recs if not re.match(r"^(school|region|district|s/n|programmes|schoolname|no)", norm(r["name"]))]
        print(f"\n=== {sec}: {len(recs)} rows ===")
        for r in recs[:14]:
            print(f"  p{r['page']:>2} {str(r['code']):>8} [{r['region']}] {r['name'][:52]!r} | loc={r['location'][:18]!r} | {r['status'][:12]!r} {r['type'][:8]!r}")
