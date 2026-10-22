#!/usr/bin/env python3
"""
make_refs3.py - corrected register extraction (supersedes reference_sections_v2.json).

Why v3 exists
  The register's tables place their columns at different x positions on different
  pages (and the Category A/B/C tables differ from the SHS/TVET tables).  v2 used
  one fixed x-band per section, so on the pages where the columns sit further left
  the "SCHOOL NAME" band missed the name box and the extractor fell back to the
  LOCATION text ("Drobo", "Goaso", "Takoradi", ...), and on other pages it merged
  name+location ("Mim Senior High Mim").

  v3 calibrates the NAME / LOCATION / GENDER bands from the column header row that
  every page repeats, then reads each data row.  It also recovers the code when
  OCR merged it with the district text ("Dormaa Central Municipal|9061001").

Sections re-extracted: Cat A/B/C, Appendix 1, Appendix 2, Appendix 3, Appendix 5.
Appendix 4 is carried over from v2 (its pages have a different header layout that
  v2 already read cleanly).

Output: data/reference_sections_v3.json
Usage:  python scripts/make_refs3.py
"""
import os, re, json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "data", "reference_sections_v2.json")
OUT = os.path.join(ROOT, "data", "reference_sections_v3.json")
BOXDIR = os.path.join(ROOT, "data", "ocr_boxes")

SECTIONS = [
    ("Cat A", [6, 7, 8, 9], "code"),
    ("Cat B", list(range(10, 17)), "code"),
    ("Cat C", list(range(17, 32)), "code"),
    ("Appendix 1", list(range(32, 39)), "code"),
    ("Appendix 2", list(range(39, 46)), "name"),
    ("Appendix 3", list(range(46, 61)), "code"),
    ("Appendix 5", [62], "code"),
]
REGIONS = ["Western North", "Greater Accra", "Upper East", "Upper West", "Bono East", "North East",
           "Ahafo", "Ashanti", "Bono", "Central", "Eastern", "Northern", "Oti", "Savannah",
           "Volta", "Western"]
REGKEY = [(r, re.sub(r"[^a-z]", "", r.lower())) for r in REGIONS]
REGALIAS = {"gaccra": "Greater Accra", "accra": "Greater Accra"}
CODE_RE = re.compile(r"(?<!\d)(\d{6,7})(?!\d)")
STATUS_RE = re.compile(r"(?i)^(day|boarding|day\s*/\s*board(ing)?|board(ing)?\s*/\s*day|day/ boarding)$")
TYPE_RE = re.compile(r"^(SHS|SHTS|TVET|TVE|STEM|STEM/TECH|SHS/TECH|SHTS/TECH|STEM ?TECH)$")
NAME_LABELS = {"SCHOOLNAME", "NAMEOFSCHOOL", "INSTITUTION"}
SCHOOLWORDS = ("senior", "high", "technical", "institute", "school", "stem", "college", "academy",
               "tech", "inst", "shs", "shts", "voc")

HEADERISH = {
    "s n", "region", "district", "programmes", "no of prog", "no of programme", "list of",
    "ghana education", "register", "appendix", "category", "candidates", "special", "public technical",
    "elective technical", "name of school", "page of", "second cycle", "2025", "school name",
    "schoolname", "status", "type", "stem schools", "sen", "hearing", "visually", "impaired",
    "special education", "vocational", "institutes and their courses", "courses",
    "register of courses", "technical and vocational", "tvet service", "tvets", "stem", "gender",
    "mixed", "boys", "girls", "day", "boarding", "day boarding", "shs", "shts", "technical",
    "institute", "tsc", "no", "of", "prog", "programs", "no of programmes", "no of programs",
    "school", "code", "name", "location", "genderagric bus tech", "gender agric bus tech",
    "all senior high tech scho", "all senior high tech schools", "schools",
}


def norm(s):
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9]+", " ", (s or "").lower())).strip()


def load(p):
    fp = os.path.join(BOXDIR, "page_%03d.json" % p)
    if not os.path.exists(fp):
        return []
    try:
        return json.load(open(fp, encoding="utf-8"))
    except Exception:
        return []


def cluster_rows(boxes, tol=22):
    if not boxes:
        return []
    bs = sorted(boxes, key=lambda b: b["y"])
    rows, cur, last = [], [], None
    for b in bs:
        if last is None or b["y"] - last <= tol:
            cur.append(b)
        else:
            rows.append(cur)
            cur = [b]
        last = b["y"]
    return rows + ([cur] if cur else [])


def text_of(boxes):
    return " ".join(b["t"] for b in sorted(boxes, key=lambda b: b["x"])).strip()


def detect_region(t):
    # OCR frequently reads "Oti" as "0ti" (zero); normalise digit/letter look-alikes
    n = re.sub(r"[^a-z]", "", (t or "").lower().replace("0", "o"))
    best = None
    for r, k in REGKEY:
        i = n.find(k)
        kk = k
        if i < 0 and len(k) >= 10:          # tolerate one truncated char ("western nort")
            i = n.find(k[:-1])
            kk = k[:-1]
        if i >= 0:
            cand = (i, -len(kk), r)
            if best is None or cand < best:
                best = cand
    if best:
        return best[2]
    for alias, r in REGALIAS.items():
        if alias in n:
            return r
    return None


def header_row(rows):
    for r in rows:
        joined = " ".join(b["t"].strip().upper() for b in r)
        toks = set(re.sub(r"[^A-Z]", " ", joined).split())
        has_region = any("REGION" in t for t in toks)
        has_other = ("LOCATION" in toks) or ("GENDER" in toks) or any("GENDER" in t for t in toks) \
            or ("SCHOOLNAME" in toks) or ("SCHOOL" in toks)
        if has_region and has_other:
            return r
    return None


def labels_for(rows, hdr):
    y0 = sorted(b["y"] for b in hdr)[len(hdr) // 2]
    L = {}
    for r in rows:
        if abs(r[0]["y"] - y0) > 45:
            continue
        for b in r:
            t = b["t"].strip().upper()
            ts = t.replace(" ", "")
            if ts == "CODE":
                L.setdefault("code", b["x"])
            if ts in NAME_LABELS:
                L.setdefault("name", b["x"])
            if t == "LOCATION":
                L.setdefault("loc", b["x"])
            if "GENDER" in t:
                L.setdefault("gender", b["x"])
            if t == "REGION":
                L.setdefault("region", b["x"])
            if ts == "SCHOOL":
                L.setdefault("schoolhdr", b["x"])
    return L


def bands_for(L):
    """Return x bands, or None when the header could not be calibrated."""
    if "gender" not in L:
        return None
    if "loc" in L:
        code_x = L.get("code") or L.get("schoolhdr") or L.get("name")
        if code_x is None:
            return None
        return {"name_start": code_x + 50, "name_end": L["loc"] - 130,
                "loc_end": L["gender"] - 60, "gender_end": L["gender"] + 110}
    # Appendix 2: region | name | gender, no code and no location column
    if "region" not in L:
        return None
    return {"name_start": L["region"] + 200, "name_end": L["gender"] - 60,
            "loc_end": L["gender"] - 60, "gender_end": L["gender"] + 110}


def row_code_and_box(r):
    for b in sorted(r, key=lambda b: b["x"]):
        m = CODE_RE.search(b["t"])
        if m:
            return m.group(1), b
    return None, None


def extract_pages(pages, kind):
    out = []
    for p in pages:
        rows = cluster_rows(load(p))
        hdr = header_row(rows)
        bands = bands_for(labels_for(rows, hdr)) if hdr else None
        if not bands:
            print("  !! no header calibration on page", p, "- skipping")
            continue
        for r in rows:
            if r is hdr:
                continue
            code, code_box = row_code_and_box(r)
            name = text_of([b for b in r if bands["name_start"] <= b["x"] < bands["name_end"]])
            if not norm(name) and code_box is not None and code_box["x"] < bands["name_start"]:
                # OCR merged the code into the name box ("9030414NewEbuTechnicalInst")
                rest = CODE_RE.sub("", code_box["t"]).strip()
                rest = re.sub(r"(?<=[a-z])(?=[A-Z])", " ", rest)
                if any(w in norm(rest) for w in SCHOOLWORDS):
                    name = rest
            if not norm(name) and bands["loc_end"] == bands["name_end"]:
                # Appendix 2 has no location column; OCR sometimes merges the region
                # cell with the school name ("Western Nort| Sefwi-Wiawso Sen")
                for b in sorted(r, key=lambda b: b["x"]):
                    if b["x"] >= bands["name_start"]:
                        continue
                    t = re.sub(r"^\s*\d+\s*", "", b["t"])
                    low = t.lower()
                    cut = 0
                    for reg in REGIONS:
                        i = low.find(reg.lower())
                        if i >= 0:
                            cut = max(cut, i + len(reg))
                    rem = t[cut:].strip(" |.-")
                    if len(re.findall(r"[A-Za-z]{3,}", rem)) >= 2:
                        name = rem
                        break
            location = text_of([b for b in r if bands["name_end"] <= b["x"] < bands["loc_end"]])
            gender = text_of([b for b in r if bands["loc_end"] <= b["x"] < bands["gender_end"]])
            region_limit = (code_box["x"] if code_box else bands["name_start"]) - 80
            region = detect_region(text_of([b for b in r if b["x"] < region_limit]))
            status = ""
            typ = ""
            for b in r:
                if b["x"] >= bands["gender_end"]:
                    t = b["t"].strip()
                    if STATUS_RE.match(t):
                        status = t
                    elif TYPE_RE.match(t.upper().replace(" ", "")):
                        typ = t
            nn = norm(name)
            if not nn or len(nn) < 3 or nn in HEADERISH or "page of" in nn:
                continue
            schoolish = any(w in nn for w in SCHOOLWORDS)
            if kind == "code":
                looks_real = bool(code) or (region and schoolish)
            else:  # name-only section (Appendix 2)
                looks_real = bool(region) and schoolish and len(nn.split()) >= 2
            if not looks_real:
                continue
            out.append({"code": code, "region": region, "name": name, "location": location,
                        "gender": gender, "status": status, "type": typ, "page": p})
    return out


def main():
    v2 = json.load(open(SRC, encoding="utf-8"))
    v3 = {}
    for sec, pages, kind in SECTIONS:
        rows = extract_pages(pages, kind)
        # rows are grouped by region; a blank region cell inherits the row above,
        # but only when the neighbouring regions agree.  At a region boundary the
        # blank cell is ambiguous (e.g. Cat B row 216 Baglo Ridge sits between the
        # Northern block and the Oti block), so it is left unset rather than guessed.
        for i, r in enumerate(rows):
            if r["region"]:
                continue
            prev = next((rows[j]["region"] for j in range(i - 1, -1, -1) if rows[j]["region"]), None)
            nxt = next((rows[j]["region"] for j in range(i + 1, len(rows)) if rows[j]["region"]), None)
            if prev and prev == nxt:
                r["region"] = prev
        v3[sec] = rows
        coded = [r for r in rows if r["code"]]
        print("%-11s rows=%-4d coded=%-4d regions=%-2d  (v2 rows=%d coded=%d)" % (
            sec, len(rows), len(coded), len({r["region"] for r in rows if r["region"]}),
            len(v2.get(sec, [])), len([r for r in v2.get(sec, []) if r.get("code")])))
        for r in rows[:4]:
            print("      %-8s %-14s %-44s %-16s %-7s %-11s %s" % (
                r["code"] or "-", r["region"] or "?", r["name"][:44], r["location"][:16],
                r["gender"], r["status"], r["type"]))
    v3["Appendix 4"] = v2.get("Appendix 4", [])
    json.dump(v3, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("wrote", OUT)


if __name__ == "__main__":
    main()
