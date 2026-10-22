#!/usr/bin/env python3
"""
phase1_integrity.py - verify the augmented js/school-data.js against the baseline.

Checks performed:
  * same record ids, same count, no record dropped or duplicated;
  * existing fields (name, gender, school_type, programs) are byte-identical;
  * location / status were only ever FILLED when previously empty (never overwritten);
  * `code` is null or a string that exists in the register; codes are unique;
  * `programs_code` exists on every record (always null - no authoritative source);
  * classification matches the reconciliation plan (and [] where unresolved).

Usage: python scripts/phase1_integrity.py
"""
import os, sys, json, collections

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import phase1_reconcile as P

ROOT = P.ROOT
BASELINE = P.BASELINE
DATAJS = P.DATAJS
PLAN = P.PLAN
REF = P.REF


def main():
    base = {r["id"]: r for r in json.load(open(BASELINE, encoding="utf-8"))}
    refs = json.load(open(REF, encoding="utf-8"))
    plan = json.load(open(PLAN, encoding="utf-8"))
    _, dataset, _, _ = P.load_dataset(open(DATAJS, encoding="utf-8").read())
    new = {r["id"]: r for r in dataset}

    fails = []

    def check(cond, msg):
        if not cond:
            fails.append(msg)

    check(set(base) == set(new), "id sets differ (dropped/added records)")
    check(len(new) == 957, "record count != 957 (got %d)" % len(new))

    changed_immutable = []
    filled_loc = filled_status = overwritten = 0
    for i, b in base.items():
        n = new[i]
        for k in ("name", "gender", "school_type", "programs"):
            if b[k] != n[k]:
                changed_immutable.append((i, k, b[k], n[k]))
        if b["location"] != n["location"]:
            if b["location"] == "":
                filled_loc += 1
            else:
                overwritten += 1
        if b["status"] != n["status"]:
            if b["status"] == "":
                filled_status += 1
            else:
                overwritten += 1
    check(not changed_immutable, "immutable fields changed: %s" % changed_immutable[:5])
    check(overwritten == 0, "existing location/status overwritten: %d" % overwritten)

    # codes
    reg_codes = set()
    for sec, rows in refs.items():
        for r in rows:
            if r.get("code"):
                reg_codes.add(r["code"])
    bad_codes = [i for i, n in new.items() if n["code"] and n["code"] not in reg_codes]
    check(not bad_codes, "codes not found in register: %s" % bad_codes[:5])
    codevals = [n["code"] for n in new.values() if n["code"]]
    dup = [c for c, k in collections.Counter(codevals).items() if k > 1]
    check(not dup, "duplicate codes: %s" % dup[:5])
    check(all("programs_code" in n for n in new.values()), "some records lack programs_code")
    check(all(n["programs_code"] is None for n in new.values()), "programs_code not null")

    # classification vs plan
    mism = []
    for i, n in new.items():
        expect = plan["matched"][str(i)]["labels"] if str(i) in plan["matched"] else []
        if sorted(n["classification"]) != sorted(expect):
            mism.append((i, n["classification"], expect))
    check(not mism, "classification != plan for %d records: %s" % (len(mism), mism[:3]))

    print("records            :", len(new))
    print("immutable changes  :", len(changed_immutable))
    print("overwrites         :", overwritten)
    print("location filled    :", filled_loc)
    print("status filled      :", filled_status)
    print("codes in register  :", len(codevals) - len(bad_codes), "/", len(codevals))
    print("duplicate codes    :", len(dup))
    print("classification mism:", len(mism))
    print("RESULT             :", "PASS" if not fails else "FAIL")
    for f in fails:
        print("  FAIL:", f)
    return 0 if not fails else 1


if __name__ == "__main__":
    sys.exit(main())
