import os, re, json, glob

OCR = "data/ocr_out"

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

REGION_VARIANTS = [
    ("Western North", ["westernnorth"]),
    ("Greater Accra", ["greateraccra","gaccra"]),
    ("Upper East",    ["uppereast"]),
    ("Upper West",    ["upperwest"]),
    ("Bono East",     ["bonoeast"]),
    ("North East",    ["northeast"]),
    ("Ahafo",         ["ahafo"]),
    ("Ashanti",       ["ashanti"]),
    ("Bono",          ["bono"]),
    ("Central",       ["central"]),
    ("Eastern",       ["eastern"]),
    ("Northern",      ["northern"]),
    ("Oti",           ["oti"]),
    ("Savannah",      ["savannah","savana"]),
    ("Volta",         ["volta"]),
    ("Western",       ["western"]),
]

def detect_region(pretext):
    s = re.sub(r"[^a-z0-9]", "", pretext.lower())
    best = None; bestlen = 0
    for region, variants in REGION_VARIANTS:
        for v in variants:
            if v in s and len(v) > bestlen:
                best = region; bestlen = len(v)
    return best

STOP = re.compile(r"\b(Mixed|Girls|Boys|Female|Male|Girl|Boy)\b")
STOP2 = re.compile(r"(Refer\s+to|Check\s+detailed|\bDay\b|\bBoarding\b|\bDay/Boarding\b)")

def clean_phrase(after):
    # cut at gender marker first (name location then gender)
    m = STOP.search(after)
    if m:
        after = after[:m.start()]
    else:
        m = STOP2.search(after)
        if m:
            after = after[:m.start()]
    after = re.sub(r"[|_]+", " ", after)
    after = re.sub(r"[^A-Za-z0-9/&'.,()\- ]", " ", after)
    after = re.sub(r"\s+", " ", after).strip(" .,-|")
    return after

records = {}
for section, pages in SECTIONS.items():
    recs = []
    for p in pages:
        path = os.path.join(OCR, f"page_{p:03d}.txt")
        if not os.path.exists(path): continue
        for raw in open(path, encoding="utf-8"):
            line = raw.rstrip("\n")
            # find codes
            for cm in re.finditer(r"(?<!\d)(\d{6,7})(?!\d)", line):
                code = cm.group(1)
                pretext = line[:cm.start()]
                after = line[cm.end():]
                phrase = clean_phrase(after)
                if len(phrase) < 3:
                    continue
                region = detect_region(pretext)
                recs.append({"code": code, "region": region, "phrase": phrase})
    # dedup by code (keep first)
    seen = {}
    for r in recs:
        c = r["code"]
        if c not in seen or len(r["phrase"]) > len(seen[c]["phrase"]):
            seen[c] = r
    recs = list(seen.values())
    records[section] = recs
    print(f"{section}: {len(recs)} records")

with open("data/reference_extracted.json", "w", encoding="utf-8") as f:
    json.dump(records, f, indent=1, ensure_ascii=False)

print("\n--- SAMPLES ---")
for section in records:
    print(f"\n### {section} (first 12)")
    for r in records[section][:12]:
        print(f"  {r['code']}  [{r['region']}]  {r['phrase']}")
