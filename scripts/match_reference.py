import os, re, json, difflib
from collections import Counter

# ---------------------------------------------------------------
# 1. Read dataset schools from school-data.js
# ---------------------------------------------------------------
content = open("js/school-data.js", encoding="utf-8").read()
parts = re.split(r'"([A-Za-z][A-Za-z ]+)":\s*\{', content)
schools = []
region = None
for i, part in enumerate(parts):
    if i % 2 == 1:
        region = part.strip()
    elif i % 2 == 0 and region:
        for m in re.finditer(
            r'id:\s*(\d+),\s*name:\s*"([^"]+)",\s*location:\s*"([^"]*)",\s*gender:\s*"([^"]*)",\s*school_type:\s*"([^"]*)",\s*status:\s*"([^"]*)",\s*programs:\s*\[[^\]]*\]',
            part):
            schools.append({
                "id": int(m.group(1)), "name": m.group(2), "location": m.group(3),
                "gender": m.group(4), "type": m.group(5), "status": m.group(6),
                "region": region,
            })
print("dataset schools parsed:", len(schools))

# ---------------------------------------------------------------
# 2. Section page map
# ---------------------------------------------------------------
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

def norm_words(s):
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9]+", " ", s.lower())).strip()

section_tokens = {}
all_counter = Counter()
for sec, pages in SECTIONS.items():
    text = ""
    for p in pages:
        fp = f"data/ocr_out/page_{p:03d}.txt"
        if os.path.exists(fp):
            text += "\n" + open(fp, encoding="utf-8").read()
    toks = norm_words(text).split()
    section_tokens[sec] = toks
    all_counter.update(set(toks))

STOP = {"senior","high","school","schools","technical","institute","institutes","tech",
        "shs","shts","comm","community","day","boarding","seniorhigh","highschool",
        "voc","vocational","training","register","courses","public","ghana","education",
        "service","appendix","category","mixed","girls","boys"}

# ---------------------------------------------------------------
# 3. Closed-set fuzzy match each school name against each section
# ---------------------------------------------------------------
def best_match(nt, toks, thresh):
    # choose rarest anchor token
    cand = [t for t in nt if len(t) >= 4 and t not in STOP] or [t for t in nt if len(t) >= 3] or nt
    anchor = min(cand, key=lambda t: (all_counter.get(t, 0), -len(t)))
    positions = [i for i, t in enumerate(toks) if t == anchor]
    name_str = " ".join(nt)
    best = 0.0; bestpos = None
    for i in positions:
        for extra in (0, 1, 2, 3):
            for pre in (0, 1, 2):
                s = max(0, i - pre)
                e = min(len(toks), i + len(nt) + extra)
                window = " ".join(toks[s:e])
                r = difflib.SequenceMatcher(None, name_str, window).ratio()
                # token coverage
                cov = sum(1 for t in nt if t in toks[s:e]) / max(1, len(nt))
                score = 0.6 * r + 0.4 * cov
                if score > best:
                    best = score; bestpos = s
    if best >= thresh:
        return best, bestpos
    return best, bestpos

results = {}
for sc in schools:
    nt = norm_words(sc["name"]).split()
    per = {}
    for sec, toks in section_tokens.items():
        score, pos = best_match(nt, toks, 0.0)
        per[sec] = round(score, 3)
    results[sc["id"]] = per

# ---------------------------------------------------------------
# 4. Summary
# ---------------------------------------------------------------
THRESH = 0.80
sec_counts = Counter()
for sc in schools:
    per = results[sc["id"]]
    for sec, s in per.items():
        if s >= THRESH:
            sec_counts[sec] += 1
print("\nMatches per section (score >= %.2f):" % THRESH)
for sec in SECTIONS:
    print(f"  {sec}: {sec_counts[sec]}")

# which category (A/B/C) chosen per school
cat_counts = Counter()
no_cat = []
for sc in schools:
    cats = {k: results[sc["id"]][k] for k in ("Cat A","Cat B","Cat C")}
    best = max(cats, key=cats.get)
    if cats[best] >= THRESH:
        cat_counts[best] += 1
    else:
        no_cat.append(sc)
print("\nCategory coverage:", dict(cat_counts), "no-category:", len(no_cat))

json.dump({"schools": schools, "scores": results}, open("data/match_scores.json","w",encoding="utf-8"), indent=1)

print("\n--- sample ---")
for sc in schools[:6]:
    print(sc["name"], "->", results[sc["id"]])
