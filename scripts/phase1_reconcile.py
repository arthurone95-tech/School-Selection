#!/usr/bin/env python3
"""
phase1_reconcile.py - enrich js/school-data.js from the authoritative register.

Source : data/reference_sections_v3.json  (clean extraction; Cat A=93, Cat B=260,
         Cat C=602 - matches the register's ground-truth counts)
Target : js/school-data.js (957 records)

What it does
  1. Builds a register "master" per official SCHOOL CODE by joining section rows
     across Category A/B/C and Appendix 1/3/5 (codes are stable across sections,
     so a code seen in several lists identifies one school).  Code-less rows
     (Appendix 2 = elective-technical / SHTS list, Appendix 4 = SEN, one Cat A row)
     become name-keyed masters.
  2. Conservative matching to dataset records:
        - name similarity on distinguishing tokens (generic words removed),
          with fuzzy token matching for OCR spelling variants (Enyan/Envan,
          Ahmadiyya/Ahmadiiyya);
        - region must agree for code masters (exact name hits may override a
          region that the register/OCRed wrongly; these are reported);
        - school type must be compatible (SHS/SHTS one family; TVET/STEM strict);
        - a tie between two records -> left unresolved and reported.
  3. Applies, only where a match is confident:
        - official `code`
        - `classification` (Category A/B/C + Appendix 1..5, canonical order)
        - fills EMPTY `location` / `status` only (never overwrites existing data)
        - `programs_code: null` (no authoritative source; documented)
  4. Register schools with no dataset match are reported to
     data/unmatched_register_schools.json.  They are NOT auto-added (nothing is
     invented); the file lists them for manual review.

Usage:
  python scripts/phase1_reconcile.py            # dry run (writes data/phase1_reconcile.json)
  python scripts/phase1_reconcile.py --apply    # rewrites js/school-data.js
"""
import os, re, json, sys, collections, difflib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REF = os.path.join(ROOT, "data", "reference_sections_v3.json")
DATAJS = os.path.join(ROOT, "js", "school-data.js")
PLAN = os.path.join(ROOT, "data", "phase1_reconcile.json")
BASELINE = os.path.join(ROOT, "data", "school-data.baseline.json")
UNMATCHED_OUT = os.path.join(ROOT, "data", "unmatched_register_schools.json")

CAT_SECTIONS = ["Cat A", "Cat B", "Cat C"]
APP_SECTIONS = ["Appendix 1", "Appendix 2", "Appendix 3", "Appendix 4", "Appendix 5"]
LABEL = {"Cat A": "Category A", "Cat B": "Category B", "Cat C": "Category C",
         "Appendix 1": "Appendix 1", "Appendix 2": "Appendix 2", "Appendix 3": "Appendix 3",
         "Appendix 4": "Appendix 4", "Appendix 5": "Appendix 5"}
LABEL_ORDER = {l: i for i, l in enumerate(
    ["Category A", "Category B", "Category C", "Appendix 1", "Appendix 2", "Appendix 3",
     "Appendix 4", "Appendix 5"])}
TYPE_MAP = {"SHS": "SHS", "SHTS": "SHTS", "TVET": "TVET", "TVE": "TVET", "STEM": "STEM",
            "STEM/TECH": "STEM", "SHS/TECH": "SHTS", "SHTS/TECH": "SHTS"}
TYPE_FAMILY = {"SHS": {"SHS", "SHTS"}, "SHTS": {"SHS", "SHTS"}, "TVET": {"TVET"}, "STEM": {"STEM"}}

REGIONS = ["Western North", "Greater Accra", "Upper East", "Upper West", "Bono East", "North East",
           "Ahafo", "Ashanti", "Bono", "Central", "Eastern", "Northern", "Oti", "Savannah",
           "Volta", "Western"]
REGKEY = [(r, re.sub(r"[^a-z]", "", r.lower())) for r in REGIONS]

EXPAND = {"snr": "senior", "tech": "technical", "comm": "community", "inst": "institute",
          "voc": "vocational", "sch": "school", "sec": "secondary", "sem": "seminary",
          "st": "saint", "meth": "methodist", "presby": "presbyterian", "ang": "anglican"}
GENERIC = {"senior", "high", "school", "schools", "institute", "institutes",
           "community", "secondary", "day", "boarding", "mixed", "boys", "girls", "the",
           "and", "of", "for", "shs", "shts", "stem", "no", "sen", "saint",
           "grammar"}
HEADERISH = {"ghana education service", "ministry of education", "list of", "appendix",
             "special education need sen schools", "schools register", "page of"}


_CAMEL_EXEMPT = ("GRATiS", "GRATlS", "GRATIS", "TsC")


def norm(s):
    # Split OCR-merged words ("SeniorHigh" -> "Senior High", "TechInst" ->
    # "Tech Inst") so they tokenise like the clean spellings.  A few register
    # names are intentionally mixed-case acronyms (GRATiS, TsC) and must not be
    # split, so protect them first.
    s = s or ""
    hold = {}
    for i, bad in enumerate(_CAMEL_EXEMPT):
        if bad in s:
            ph = "\x00%d\x00" % i
            hold[ph] = bad.lower()
            s = s.replace(bad, ph)
    s = re.sub(r"(?<=[a-z])(?=[A-Z])", " ", s)
    for ph, val in hold.items():
        s = s.replace(ph, val)
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9]+", " ", s.lower())).strip()


def dist_tokens(name, minlen=3):
    toks = norm(name).split()
    merged = []
    i = 0
    while i < len(toks):
        if len(toks[i]) == 1:
            j = i
            while j < len(toks) and len(toks[j]) == 1:
                j += 1
            merged.append("".join(toks[i:j]) if j - i >= 2 else toks[i])
            i = j
        else:
            merged.append(toks[i])
            i += 1
    out = []
    for t in merged:
        t = EXPAND.get(t, t)
        if t in GENERIC or len(t) < minlen:
            continue
        out.append(t)
    return out


def tokens_for(name):
    """Distinguishing tokens; fall back to 2-char tokens for very short names (Wa, Ho, Ko)."""
    t = dist_tokens(name)
    if not t:
        t = dist_tokens(name, 2)
    return t


def detect_region_strict(t):
    n = re.sub(r"[^a-z]", "", (t or "").lower())
    best = None
    for r, k in REGKEY:
        i = n.find(k)
        if i >= 0:
            cand = (i, -len(k), r)
            if best is None or cand < best:
                best = cand
    return best[2] if best else None


def load_dataset(text):
    """Parse SCHOOLS_BY_REGION into records, preserving the surrounding text."""
    anchor = text.index("SCHOOLS_BY_REGION = {")
    ob = text.index("{", anchor)
    depth, i, instr = 0, ob, None
    while i < len(text):
        c = text[i]
        if instr:
            if c == "\\":
                i += 2
                continue
            if c == instr:
                instr = None
        elif c in "\"'":
            instr = c
        elif c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                break
        i += 1
    header, trailer, body = text[:ob + 1], text[i:], text[ob + 1:i]
    region_re = re.compile(r'"([^"]+)"\s*:\s*\{')
    region_bounds = [(m.start(), m.group(1)) for m in region_re.finditer(body)]
    regions_order = []
    for pos, rname in region_bounds:
        if rname not in regions_order:
            regions_order.append(rname)

    rec_re = re.compile(r"\{\s*\n\s*id\s*:\s*(\d+)")
    records = []
    for m in rec_re.finditer(body):
        start = m.start()
        depth, j, instr = 0, start, None
        while j < len(body):
            c = body[j]
            if instr:
                if c == "\\":
                    j += 2
                    continue
                if c == instr:
                    instr = None
            elif c in "\"'":
                instr = c
            elif c == "{":
                depth += 1
            elif c == "}":
                depth -= 1
                if depth == 0:
                    break
            j += 1
        block = body[start:j + 1]
        rec = {"id": int(m.group(1))}
        for k in ("name", "location", "gender", "school_type", "status"):
            mm = re.search(r'\b%s\s*:\s*"((?:[^"\\]|\\.)*)"' % k, block)
            rec[k] = None if not mm else json.loads('"%s"' % mm.group(1))
        mm = re.search(r'\bprograms\s*:\s*\[(.*?)\]', block, re.S)
        rec["programs"] = [] if not mm else [json.loads('"%s"' % x) for x in re.findall(r'"((?:[^"\\]|\\.)*)"', mm.group(1))]
        mm = re.search(r'\bclassification\s*:\s*\[(.*?)\]', block, re.S)
        rec["classification"] = [] if not mm else [json.loads('"%s"' % x) for x in re.findall(r'"((?:[^"\\]|\\.)*)"', mm.group(1))]
        mm = re.search(r'\bprograms_code\s*:\s*(?:"((?:[^"\\]|\\.)*)"|null|\[)', block)
        rec["programs_code"] = (mm.group(1) if (mm and mm.group(1)) else None) if mm else None
        # official register code (added by this script); \b won't match programs_code
        mm = re.search(r'\bcode\s*:\s*(?:"((?:[^"\\]|\\.)*)"|null)', block)
        rec["code"] = (mm.group(1) if (mm and mm.group(1)) else None) if mm else None
        owner = None
        for pos, rname in region_bounds:
            if pos <= start:
                owner = rname
            else:
                break
        rec["region"] = owner
        records.append(rec)
    return regions_order, records, header, trailer


def build_masters(refs):
    code_masters = {}
    name_masters = []
    for sec in CAT_SECTIONS + APP_SECTIONS:
        label = LABEL[sec]
        for r in refs.get(sec, []):
            nm = (r.get("name") or "").strip()
            n = norm(nm)
            if not n or len(n) < 3 or n in HEADERISH or "page of" in n or "schools register" in n:
                continue
            if n.startswith("list of") or n.startswith("appendix") or "register of" in n:
                continue
            region = r.get("region")
            if "|" in nm:                       # merged "Region | Name" row
                a, b = nm.split("|", 1)
                reg = detect_region_strict(a)
                if reg:
                    region, nm = reg, b.strip()
            if region is None:
                region = detect_region_strict(nm)
            # OCR glues a truncated region word onto some names ("Nort| Bia ...",
            # "Nortl Bibiani ..."); drop the noise prefix so they match cleanly.
            nm = re.sub(r"^nort[l\|]?\s+", "", nm, flags=re.I).strip() or nm
            code = r.get("code")
            if not region and not code:
                continue
            if code:
                m = code_masters.setdefault(code, {
                    "code": code, "names": [], "region": None, "regions": set(), "cat": False,
                    "location": "", "gender": "", "status": "", "type": "", "sections": set()})
                m["sections"].add(label)
                if sec in CAT_SECTIONS:
                    m["cat"] = True
                # Category rows are authoritative for a code's name/region; appendix rows
                # only contribute a name when the code never appears in a category list
                # (this neutralises OCR code-swaps such as Appendix 3 "0081101 Nakpanduri")
                if sec in CAT_SECTIONS or not m["cat"]:
                    m["names"].append(nm)
                    if region and m["region"] is None:
                        m["region"] = region
                    if region:
                        m["regions"].add(region)
                    if r.get("location") and not m["location"]:
                        m["location"] = r["location"]
                    g = (r.get("gender") or "").strip()
                    if g in ("Mixed", "Boys", "Girls") and not m["gender"]:
                        m["gender"] = g
                    st = (r.get("status") or "").strip()
                    if re.sub(r"[^a-z/]", "", st.lower()) in ("day", "boarding", "day/boarding") and not m["status"]:
                        m["status"] = st
                    ty = (r.get("type") or "").strip().upper()
                    if ty in TYPE_MAP and not m["type"]:
                        m["type"] = TYPE_MAP[ty]
            else:
                name_masters.append({"code": None, "names": [nm], "region": region, "regions": {region},
                                     "location": r.get("location") or "", "gender": (r.get("gender") or "").strip(),
                                     "status": "", "type": "", "sections": {label}})
    merged, byname, bykey = [], {}, {}
    for code, m in code_masters.items():
        for nm in m["names"]:
            byname.setdefault(norm(nm), []).append(code)
            sig = frozenset(tokens_for(nm))
            if sig:
                bykey.setdefault(sig, []).append(code)
    for m in name_masters:
        # pass 1: exact-normalised-name match; pass 2: distinguishing-token
        # signature match.  Only merge when the code is unambiguous.
        hit = byname.get(norm(m["names"][0]))
        if not (hit and len(set(hit)) == 1):
            hit = bykey.get(frozenset(tokens_for(m["names"][0])))
        if hit and len(set(hit)) == 1:
            cm = code_masters[hit[0]]
            cm["names"].extend(m["names"])
            cm["sections"] |= m["sections"]
        else:
            merged.append(m)

    # pass 3: a surviving code-less master is the same school as a coded one when
    # it shares a strong (len>=5) token that identifies exactly one code, and the
    # region agrees.  Handles variant listings, e.g. Appendix 2
    # "Nkrankwanta Comm Senior High" vs Category B "Nkrankwanta Senior High/Tech".
    # Guard: any *extra* strong token on the code-less side must be a school-type /
    # region word or a spelling variant, otherwise the names describe different
    # schools (e.g. "Mampong Akuapem SHS" vs "Akuapem Technical Institute").
    IGNORE_EXTRA = {
        "technical", "vocational", "institute", "community", "comm", "senior", "high",
        "school", "college", "academy", "business", "agric", "agricultural", "science",
        "arts", "home", "economics", "visual", "general", "language", "grammar",
        "north", "south", "east", "west", "central", "upper", "lower", "greater",
        "nortl", "nort", "sout", "bono", "oti", "volta", "ahafo", "ashanti",
        "savannah", "western", "eastern", "northern", "southern", "regional",
    }
    tok_codes = {}
    for code, cm in code_masters.items():
        for nm in cm["names"]:
            for t in set(tokens_for(nm)):
                if len(t) >= 5:
                    tok_codes.setdefault(t, set()).add(code)
    leftover = []
    for m in merged:
        cands = set()
        for t in set(tokens_for(m["names"][0])):
            cs = tok_codes.get(t)
            if cs and len(cs) == 1:
                cands |= cs
        if len(cands) == 1:
            cm = code_masters[next(iter(cands))]
            cm_toks = set()
            for nm in cm["names"]:
                cm_toks |= set(tokens_for(nm))
            extra_ok = all(
                t in IGNORE_EXTRA or t in cm_toks
                or any(difflib.SequenceMatcher(None, t, c).ratio() >= 0.8 for c in cm_toks)
                for t in set(tokens_for(m["names"][0])) if len(t) >= 5)
            regions_ok = not m["regions"] or not cm["regions"] or (m["regions"] & cm["regions"])
            if extra_ok and regions_ok:
                cm["names"].extend(m["names"])
                cm["sections"] |= m["sections"]
                cm["regions"] |= m["regions"]
                if cm["region"] is None and m.get("region"):
                    cm["region"] = m["region"]
                continue
        leftover.append(m)
    merged = leftover
    masters = []
    for code, m in code_masters.items():
        m["name"] = max(m["names"], key=lambda x: (len(x.split()), len(x)))
        masters.append(m)
    for m in merged:
        m["name"] = m["names"][0]
    masters.extend(merged)
    return masters


def compat_type(ds_type, m_types):
    if not m_types:
        return True
    return TYPE_FAMILY.get(ds_type or "", set()) & m_types != set()


def tmatch(a, b):
    if a == b:
        return True
    if len(a) >= 3 and len(b) >= 3 and (a.startswith(b) or b.startswith(a)):
        return True
    if len(a) >= 5 and len(b) >= 5:
        return difflib.SequenceMatcher(None, a, b).ratio() >= 0.8
    return False


def fuzzy_counts(dtok, rtok):
    ca = sum(1 for a in dtok if any(tmatch(a, b) for b in rtok))
    cb = sum(1 for b in rtok if any(tmatch(a, b) for a in dtok))
    return ca, cb


def js(s):
    return json.dumps(s if s is not None else "", ensure_ascii=False)


def render(dataset, regions_order, header, trailer, final):
    by_region = collections.OrderedDict((r, []) for r in regions_order)
    for rec in dataset:
        by_region.setdefault(rec["region"], []).append(rec)
    out = [header.rstrip("\n")]
    for ri, rname in enumerate(regions_order):
        out.append("    // ========================================")
        out.append("    // %s REGION" % rname.upper())
        out.append("    // ========================================")
        out.append('    "%s": {' % rname)
        out.append("        public: [")
        for rec in by_region[rname]:
            f = final[rec["id"]]
            out.append("            {")
            out.append("                id: %d," % rec["id"])
            out.append("                name: %s," % js(rec["name"]))
            out.append("                location: %s," % js(f["location"]))
            out.append("                gender: %s," % js(rec["gender"]))
            out.append("                school_type: %s," % js(rec["school_type"]))
            out.append("                status: %s," % js(f["status"]))
            out.append("                code: %s," % (js(f["code"]) if f["code"] else "null"))
            out.append("                programs: %s," % json.dumps(rec["programs"], ensure_ascii=False))
            out.append("                programs_code: null,")
            out.append("                classification: %s," % json.dumps(f["labels"], ensure_ascii=False))
            out.append("            },")
        out.append("        ],")
        out.append("        private: []")
        out.append("    }," if ri < len(regions_order) - 1 else "    }")
        if ri < len(regions_order) - 1:
            out.append("")
    out.append(trailer)
    return "\n".join(out) + "\n"


def main():
    apply = "--apply" in sys.argv
    refs = json.load(open(REF, encoding="utf-8"))
    text = open(DATAJS, encoding="utf-8").read()
    regions_order, dataset, header, trailer = load_dataset(text)

    # Snapshot the pristine dataset exactly once (never clobber an existing
    # snapshot): the baseline is the pre-Phase-1 reference for data-loss checks.
    if apply and not os.path.exists(BASELINE):
        json.dump([{k: r[k] for k in ("id", "name", "location", "gender", "school_type",
                                      "status", "programs", "classification")}
                   for r in dataset],
                  open(BASELINE, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    masters = build_masters(refs)
    print("masters:", len(masters), "| with code:", sum(1 for m in masters if m["code"]))

    ds_tokens = [(r, set(tokens_for(r["name"]))) for r in dataset]

    assign = collections.defaultdict(lambda: {"labels": set(), "codes": set(), "hits": [],
                                              "loc": "", "status": ""})
    master_best = {}
    for m in masters:
        rtok_list = []
        for v in m["names"]:
            rt = set(tokens_for(v))
            if rt:
                rtok_list.append(rt)
        if not rtok_list:
            continue
        have_region = bool(m["regions"])
        mtypes = {m["type"]} if m["type"] else set()

        def consider(use_fuzzy):
            cands = []
            for rec, dtok in ds_tokens:
                if not dtok:
                    continue
                best_pair = None
                for rtok in rtok_list:
                    if use_fuzzy:
                        ca, cb = fuzzy_counts(dtok, rtok)
                    else:
                        ca = len(dtok & rtok)
                        cb = ca
                    if not ca:
                        continue
                    cov_ds = ca / len(dtok)
                    cov_reg = cb / len(rtok)
                    if best_pair is None or min(cov_ds, cov_reg) > best_pair[0]:
                        best_pair = (min(cov_ds, cov_reg), cov_ds, cov_reg)
                if best_pair is None:
                    continue
                _, cov_ds, cov_reg = best_pair
                exact = (not use_fuzzy) and cov_ds >= 0.99 and cov_reg >= 0.99
                if not (cov_ds >= 0.99 or cov_reg >= 0.99 or (cov_ds >= 0.6 and cov_reg >= 0.6)):
                    continue
                if not compat_type(rec["school_type"], mtypes):
                    continue
                rec_region_ok = have_region and rec["region"] in m["regions"]
                if have_region and not rec_region_ok and not exact:
                    continue
                if not have_region and not exact:
                    continue
                score = min(cov_ds, cov_reg) + (0.2 if cov_ds >= 0.99 else 0) + (0.1 if rec_region_ok else 0)
                nsim = difflib.SequenceMatcher(None, norm(rec["name"]), norm(m["name"])).ratio()
                cands.append((score, rec, cov_ds, cov_reg, rec_region_ok, nsim))
            return cands

        cands = consider(False)
        used_fuzzy = False
        if not cands:
            cands = consider(True)              # OCR spelling variants, only as a fallback
            used_fuzzy = bool(cands)
        if not cands:
            master_best[m["code"] or m["names"][0]] = (m, None)
            continue
        cands.sort(key=lambda x: (-x[0], -x[5]))
        top = cands[0]
        tie = [c for c in cands[1:]
               if abs(c[0] - top[0]) < 0.05 and abs(c[5] - top[5]) < 0.05 and c[1]["id"] != top[1]["id"]]
        key = m["code"] or m["names"][0]
        if tie:
            group = [top] + tie
            sigs = {frozenset(tokens_for(c[1]["name"])) for c in group}
            if len(sigs) == 1:
                # indistinguishable names -> dataset holds duplicate rows for one school;
                # give the code to the lowest id and flag the rest as duplicates
                group.sort(key=lambda c: c[1]["id"])
                master_best[key] = (m, ("dupe", group[0], group[1:]))
            else:
                master_best[key] = (m, ("ambiguous", top, tie[0]))
        else:
            master_best[key] = (m, ("ok", top, used_fuzzy))

    ambiguous, unmatched, region_over, fuzzy_ok, rec_conflicts, duplicates = [], [], [], [], [], []
    claims = collections.defaultdict(list)
    for key, (m, res) in master_best.items():
        if res is None:
            unmatched.append(m)
        elif res[0] == "ambiguous":
            ambiguous.append({"master": m["code"] or m["names"][0], "name": m["name"],
                              "region": m["region"],
                              "a": res[1][1]["name"], "b": res[2][1]["name"]})
        elif res[0] == "dupe":
            duplicates.append({"master": m["name"], "code": m["code"],
                               "kept": res[1][1]["id"], "kept_name": res[1][1]["name"],
                               "duplicate_of": [{"id": c[1]["id"], "name": c[1]["name"]} for c in res[2]]})
            claims[res[1][1]["id"]].append((res[1][0], key, m, res[1], False))
        else:
            claims[res[1][1]["id"]].append((res[1][0], key, m, res[1], res[2]))

    # one register master per dataset record: highest score wins; a tie is unresolved
    matched_ids = collections.defaultdict(list)
    winners = {}
    for rid, lst in claims.items():
        lst.sort(key=lambda x: -x[0])
        best = lst[0]
        tiegroup = [c for c in lst if abs(c[0] - best[0]) < 0.05]
        coded = [c for c in tiegroup if c[2]["code"]]
        chosen = None
        if len(tiegroup) == 1:
            chosen = tiegroup[0]
        elif len(coded) == 1:
            # same school: one row (appendix) omits the code - keep the coded row
            # and fold in the appendix memberships carried by the code-less row(s)
            chosen = coded[0]
            for c in tiegroup:
                if c[1] != chosen[1]:
                    chosen[2]["sections"] |= c[2]["sections"]
        else:
            rec_conflicts.append({"id": rid, "name": best[3][1]["name"],
                                  "candidates": [{"master": c[2]["name"], "code": c[2]["code"],
                                                  "region": c[2]["region"], "score": round(c[0], 2)}
                                                 for c in tiegroup]})
        if chosen:
            for c in lst:
                if c[1] != chosen[1] and c[3][3] > 0.5:
                    # same school listed with an extra token (e.g. a location):
                    # fold the appendix memberships of the losing row into the winner
                    chosen[2]["sections"] |= c[2]["sections"]
            winners[chosen[1]] = (chosen[2], chosen[3], chosen[4])
        for c in lst:
            if not chosen or c[1] != chosen[1]:
                unmatched.append(c[2])

    for key, (m, top, used_fuzzy) in winners.items():
        rec = top[1]
        a = assign[rec["id"]]
        if used_fuzzy:
            fuzzy_ok.append({"id": rec["id"], "dataset": rec["name"], "master": m["name"],
                             "code": m["code"], "region": m["region"]})
        a["labels"] |= m["sections"]
        if m["code"]:
            a["codes"].add(m["code"])
        a["hits"].append((m["code"] or "-", m["name"], round(top[2], 2), round(top[3], 2)))
        matched_ids[rec["id"]].append(m["code"] or m["name"])
        if m.get("location") and not a["loc"] and "|" not in m["location"]:
            a["loc"] = m["location"].strip()
        if m.get("status") and not a["status"]:
            a["status"] = m["status"].strip()
        if not top[4]:
            region_over.append({"id": rec["id"], "dataset": rec["name"], "dataset_region": rec["region"],
                                "master": m["name"], "code": m["code"], "master_region": sorted(m["regions"])})

    conflicts = rec_conflicts

    code_conflicts = [{"id": r["id"], "name": r["name"], "codes": sorted(assign[r["id"]]["codes"])}
                      for r in dataset if len(assign[r["id"]]["codes"]) > 1]

    cat_conflicts = [{"id": r["id"], "name": r["name"],
                      "categories": sorted(l for l in assign[r["id"]]["labels"] if l.startswith("Category"))}
                     for r in dataset if len([l for l in assign[r["id"]]["labels"] if l.startswith("Category")]) > 1]

    # per-record final values (only fill empty location/status; never overwrite)
    final = {}
    for rec in dataset:
        a = assign[rec["id"]]
        code = sorted(a["codes"])[0] if len(a["codes"]) == 1 else None
        # matched -> register-defined labels; unresolved -> [] for manual review
        # (the register cannot confirm them; old values are kept in the artifact/baseline)
        labels = sorted(a["labels"], key=lambda l: LABEL_ORDER[l]) if a["labels"] else []
        final[rec["id"]] = {
            "code": code,
            "labels": labels,
            "location": rec["location"] or a["loc"],
            "status": rec["status"] or a["status"],
        }

    # diagnostic: for each unmatched record, find its closest register master and
    # whether that master was assigned to a different record (i.e. a duplicate row)
    winner_key = {(m["code"] or m["names"][0]): top[1]["id"] for key, (m, top, uf) in winners.items()}
    unmatched_diag = []
    for rec in dataset:
        if assign[rec["id"]]["labels"]:
            continue
        dtok = set(tokens_for(rec["name"]))
        best = None
        for m in masters:
            rtok = set()
            for v in m["names"]:
                rtok |= set(tokens_for(v))
            if not rtok or not dtok:
                continue
            ca = len(dtok & rtok)
            cb = ca
            if not ca:
                ca, cb = fuzzy_counts(dtok, rtok)
            if not ca:
                continue
            cov_ds, cov_reg = ca / len(dtok), cb / len(rtok)
            exact = cov_ds >= 0.99 and cov_reg >= 0.99
            if not (cov_ds >= 0.99 or cov_reg >= 0.99 or (cov_ds >= 0.6 and cov_reg >= 0.6)):
                continue
            if not compat_type(rec["school_type"], {m["type"]} if m["type"] else set()):
                continue
            have_region = bool(m["regions"])
            if have_region and rec["region"] not in m["regions"] and not exact:
                continue
            if not have_region and not exact:
                continue
            sc = min(cov_ds, cov_reg) + (0.2 if cov_ds >= 0.99 else 0) \
                + (0.1 if (have_region and rec["region"] in m["regions"]) else 0)
            if best is None or sc > best[0]:
                best = (sc, m)
        if best:
            assigned = winner_key.get(best[1]["code"] or best[1]["names"][0])
            unmatched_diag.append({"id": rec["id"], "name": rec["name"], "region": rec["region"],
                                   "type": rec["school_type"], "best_master": best[1]["name"],
                                   "best_code": best[1]["code"], "master_assigned_to": assigned,
                                   "old_classification": rec["classification"]})
        else:
            unmatched_diag.append({"id": rec["id"], "name": rec["name"], "region": rec["region"],
                                   "type": rec["school_type"], "best_master": None,
                                   "old_classification": rec["classification"]})

    dup_like = sum(1 for u in unmatched_diag if u.get("master_assigned_to"))
    print("  of which duplicate-like:", dup_like, "| genuine misses:", len(unmatched_diag) - dup_like)

    print("dataset records matched :", sum(1 for r in dataset if assign[r["id"]]["labels"]))
    print("dataset records unmatched:", sum(1 for r in dataset if not assign[r["id"]]["labels"]))
    print("masters unmatched        :", len(unmatched))
    print("masters ambiguous        :", len(ambiguous))
    print("dataset duplicate rows   :", sum(len(d["duplicate_of"]) for d in duplicates))
    print("category conflicts       :", len(conflicts))
    print("code conflicts           :", len(code_conflicts))
    print("post-union cat conflicts :", len(cat_conflicts))
    print("region-mismatch accepts  :", len(region_over))
    print("fuzzy-rescued matches    :", len(fuzzy_ok))
    print("labels added (codes)     :", sum(1 for r in dataset if final[r["id"]]["code"]))

    # unmatched-register artifact
    conf_absent = []
    for m in unmatched:
        mt = set()
        for v in m["names"]:
            mt |= set(dist_tokens(v))
        shared = False
        for rec, dtok in ds_tokens:
            if mt & dtok and len(max(mt & dtok, key=len)) >= 4:
                shared = True
                break
        conf_absent.append({"code": m["code"], "name": m["name"], "region": m["region"],
                            "type": m["type"], "sections": sorted(m["sections"], key=lambda l: LABEL_ORDER[l]),
                            "shares_token_with_dataset": shared})
    json.dump({"unmatched_masters": conf_absent,
               "unmatched_dataset": unmatched_diag,
               "ambiguous": ambiguous,
               "dataset_duplicates": duplicates,
               "category_conflicts": conflicts,
               "post_union_category_conflicts": cat_conflicts,
               "code_conflicts": code_conflicts,
               "region_mismatch_accepts": region_over},
              open(UNMATCHED_OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    plan = {
        "matched": {str(r["id"]): {"name": r["name"], "code": final[r["id"]]["code"],
                                   "labels": final[r["id"]]["labels"], "hits": assign[r["id"]]["hits"]}
                    for r in dataset if assign[r["id"]]["labels"]},
        "counts": {"total": len(dataset),
                   "matched": sum(1 for r in dataset if assign[r["id"]]["labels"]),
                   "unmatched": sum(1 for r in dataset if not assign[r["id"]]["labels"]),
                   "with_code": sum(1 for r in dataset if final[r["id"]]["code"]),
                   "unmatched_masters": len(unmatched), "ambiguous": len(ambiguous),
                   "category_conflicts": len(conflicts), "code_conflicts": len(code_conflicts)},
    }
    json.dump(plan, open(PLAN, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("\nplan ->", PLAN)
    print("unmatched ->", UNMATCHED_OUT)

    print("\n== sample assignments ==")
    n = 0
    for rec in dataset:
        if assign[rec["id"]]["labels"]:
            print("  #%-4d %-42s -> %-42s code=%s" % (
                rec["id"], (rec["name"] or "")[:42],
                ",".join(final[rec["id"]]["labels"]), final[rec["id"]]["code"] or "-"))
            n += 1
            if n >= 12:
                break

    if apply:
        new = render(dataset, regions_order, header, trailer, final)
        open(DATAJS, "w", encoding="utf-8", newline="\n").write(new)
        print("\nAPPLIED -> js/school-data.js  (%d bytes)" % len(new))
        print("baseline ->", BASELINE)


if __name__ == "__main__":
    main()
