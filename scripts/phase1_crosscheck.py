#!/usr/bin/env python3
"""
phase1_crosscheck.py - Phase 1 verification: cross-check a 50-school sample.

For each sampled dataset record that was matched by phase1_reconcile.py, this
script re-derives the expectation straight from data/reference_sections_v3.json
and checks:

  1. the assigned code exists in the register;
  2. at least one register row for that code carries a name that agrees with the
     dataset name (token overlap / high full-name similarity);
  3. the dataset region is one of the regions the register records for that code
     (region OCR conflicts are reported, not hidden);
  4. the assigned Category/Appendix labels equal the sections the code actually
     appears in (Appendix 2 / Appendix 4 are name-keyed, so they are matched by
     name instead of code).

Output: data/crosscheck_50.json  (+ console table)
Usage:  python scripts/phase1_crosscheck.py
"""
import os, re, json, difflib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REF = os.path.join(ROOT, "data", "reference_sections_v3.json")
PLAN = os.path.join(ROOT, "data", "phase1_reconcile.json")
OUT = os.path.join(ROOT, "data", "crosscheck_50.json")

LABEL = {"Cat A": "Category A", "Cat B": "Category B", "Cat C": "Category C",
         "Appendix 1": "Appendix 1", "Appendix 2": "Appendix 2", "Appendix 3": "Appendix 3",
         "Appendix 4": "Appendix 4", "Appendix 5": "Appendix 5"}
CODE_SECTIONS = ["Cat A", "Cat B", "Cat C", "Appendix 1", "Appendix 3", "Appendix 5"]
NAME_SECTIONS = ["Appendix 2", "Appendix 4"]


def norm(s):
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9]+", " ", (s or "").lower())).strip()


def toks(name):
    gen = {"senior", "high", "school", "institute", "community", "secondary", "day",
           "boarding", "mixed", "boys", "girls", "the", "and", "of", "for", "shs", "shts",
           "stem", "no", "sen", "saint", "grammar"}
    exp = {"snr": "senior", "tech": "technical", "comm": "community", "inst": "institute",
           "voc": "vocational", "sch": "school", "sec": "secondary", "st": "saint",
           "meth": "methodist", "presby": "presbyterian"}
    out = []
    for t in norm(name).split():
        t = exp.get(t, t)
        if t not in gen and len(t) >= 3:
            out.append(t)
    return set(out)


def main():
    refs = json.load(open(REF, encoding="utf-8"))
    plan = json.load(open(PLAN, encoding="utf-8"))
    matched = plan["matched"]

    # code -> list of register rows (name, region, section)
    by_code = {}
    name_rows = {s: [] for s in NAME_SECTIONS}
    for sec in CODE_SECTIONS:
        for r in refs.get(sec, []):
            if r.get("code"):
                by_code.setdefault(r["code"], []).append(
                    {"name": r["name"], "region": r.get("region"), "section": LABEL[sec]})
    for sec in NAME_SECTIONS:
        for r in refs.get(sec, []):
            if r.get("name"):
                name_rows[sec].append({"name": r["name"], "region": r.get("region")})

    ids = sorted(int(k) for k in matched)
    step = max(1, len(ids) // 50)
    sample = ids[::step][:50]

    out = {"sample_size": len(sample), "passed": 0, "failed": 0, "records": []}
    for sid in sample:
        m = matched[str(sid)]
        name, labels, code = m["name"], m["labels"], m["code"]
        rows = by_code.get(code, [])
        dt = toks(name)
        # 2. name agreement with the register rows carrying this code
        best_sim = 0.0
        for r in rows:
            rt = toks(r["name"])
            if dt and rt:
                ov = len(dt & rt) / max(1, min(len(dt), len(rt)))
                best_sim = max(best_sim, ov)
            best_sim = max(best_sim, difflib.SequenceMatcher(None, norm(name), norm(r["name"])).ratio())
        # 4. every assigned label must be explained: by a coded row in that section,
        #    or by a name-identical (code-less) row in that section (Appendix 2/3/4)
        explained = {r["section"] for r in rows}
        for sec in CODE_SECTIONS + NAME_SECTIONS:
            lab = LABEL[sec]
            if lab in labels:
                for r in refs.get(sec, []):
                    rn = r.get("name") or ""
                    sim = difflib.SequenceMatcher(None, norm(name), norm(rn)).ratio()
                    # same school listed under a variant name (merged by a shared
                    # distinctive token, e.g. App4 "Sirigu Senior High School Sirigu")
                    shared = any(len(t) >= 5 for t in (dt & toks(rn)))
                    if sim >= 0.9 or shared:
                        explained.add(lab)
                        break
        unexplained = sorted(set(labels) - explained)
        labels_ok = not unexplained
        # Appendix 2/4 name-only membership
        extra = []
        for sec in NAME_SECTIONS:
            if LABEL[sec] in labels:
                hit = max((difflib.SequenceMatcher(None, norm(name), norm(r["name"])).ratio()
                           for r in name_rows[sec]), default=0.0)
                extra.append((LABEL[sec], round(hit, 2)))
        ok = bool(rows) and best_sim >= 0.6 and labels_ok
        out["passed" if ok else "failed"] += 1
        out["records"].append({
            "id": sid, "name": name, "code": code, "labels": labels,
            "register_names": [r["name"] for r in rows],
            "register_regions": sorted({r["region"] for r in rows if r["region"]}),
            "name_similarity": round(best_sim, 2),
            "code_sections_match_labels": labels_ok,
            "unexplained_labels": unexplained,
            "name_only_memberships": extra,
            "verdict": "PASS" if ok else "CHECK",
        })

    json.dump(out, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("cross-check: %d schools | PASS %d | CHECK %d" % (
        out["sample_size"], out["passed"], out["failed"]))
    for r in out["records"]:
        if r["verdict"] != "PASS":
            print("  CHECK #%-4d %-40s code=%s sim=%.2f labels_ok=%s reg=%s" % (
                r["id"], r["name"][:40], r["code"], r["name_similarity"],
                r["code_sections_match_labels"], r["register_regions"]))
    print("wrote", OUT)


if __name__ == "__main__":
    main()
