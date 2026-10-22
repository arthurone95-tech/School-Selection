# Phase 1 — Data Foundation & Category Extraction — Completion Report

**Status: COMPLETE.** All Phase 1 tasks and verification items are done. Phase 2 has **not**
been started.

---

## 1. What was done

| Phase 1 task | Result |
|---|---|
| 1. Extract categories A/B/C | Done — 93 / 260 / 602 schools (register ground truth) |
| 2. Extract school codes and programme codes | School **codes** extracted and assigned (924). **Programme codes: no authoritative per-school source exists** → `programs_code: null` (documented) |
| 3. Extract Appendix 3, 4, 5 | Done — Appendix 1 232, App 2 188, App 3 468, App 4 9, App 5 22 |
| 4. Augment `js/school-data.js` with `id, name, location, gender, school_type, status, programs, programs_code, classification` (+ `code`) | Done, in place |
| 5. Write data-extraction documentation | `docs/DATA_EXTRACTION.md` (new); corrections to `docs/CLASSIFICATION_SUMMARY.md`; `docs/SELECTION_RULES_AND_CLASSIFICATION.md` §5 updated; Q4 decision recorded in `docs/phases.txt` |

**Verification items**

| Item | Result |
|---|---|
| Cross-check 50 schools against the register | **50 / 50 PASS** (`data/crosscheck_50.json`) |
| All 16 regions present | ✅ 16 regions |
| Category distribution reasonable | ✅ every label ≤ register ground truth |

---

## 2. What changed

### Files modified / created

- **`js/school-data.js`** — augmented in place (single source of truth). Every record now has,
  in canonical order:
  `id, name, location, gender, school_type, status, code, programs, programs_code, classification`.
  - `name / gender / school_type / programs` — **unchanged**.
  - `location` — filled **only where empty** (15 filled); never overwritten.
  - `status` — filled **only where empty** (22 filled); never overwritten.
  - `classification` — replaced with register-derived labels; `[]` when unresolved.
  - `code` — **added** (official CODE string or `null`).
  - `programs_code` — **added** (`null` on all 957).
- **`data/school-data.baseline.json`** — pristine pre-Phase-1 snapshot, rebuilt from git
  `HEAD` (which holds the original name/location/status/programs; 33 empty locations / 39
  empty statuses). `--apply` now snapshots **once** and never clobbers it.
- **`data/phase1_reconcile.json`** — per-record output plan.
- **`data/unmatched_register_schools.json`** — duplicates, unresolved, absent register
  schools, region mismatches, conflict metrics.
- **`data/crosscheck_50.json`** — 50-school verification evidence.
- **`docs/DATA_EXTRACTION.md`** — new method + results doc.
- **`docs/CLASSIFICATION_SUMMARY.md`** — corrected (see §5) and marked superseded.
- **`docs/SELECTION_RULES_AND_CLASSIFICATION.md`** — §5 programme-code gap resolved.
- **`docs/phases.txt`** — Q4 decision recorded (augment in place).
- **`scripts/phase1_reconcile.py`**, **`scripts/phase1_integrity.py`**,
  **`scripts/phase1_crosscheck.py`**, **`scripts/verify-dataset.mjs`** — matching +
  verification tooling.

### Final dataset numbers

| Metric | Value |
|---|---|
| Records / regions / unique ids | 957 / 16 / 957 |
| Records with `code` | **924** |
| Records with labels | 927 |
| Unresolved (`classification: []`) | **30 — all duplicates** (0 genuine misses) |
| Duplicate codes | 0 |
| `programs_code` present | 957 (all `null`) |
| Labels | Cat A 89, Cat B 245, Cat C 590, App 1 223, App 2 181, App 3 452, App 4 9, App 5 22 |
| Category / code / post-union conflicts | 0 / 0 / 0 |
| Region-mismatch accepts | 4 (inspected) |
| Fuzzy-rescued matches | 12 |

---

## 3. What happened (notable findings)

- **The dataset was invalid JavaScript** before this work: `classification` had been inserted
  after `programs` without the required comma. `node --check` reported a **false pass**; a real
  ESM import failed. The file is now valid and import-verified. (`docs/CLASSIFICATION_SUMMARY.md`
  corrected.)
- **Programme codes are not recoverable**: the register prints programme-group codes
  (101…504) only as column headers; no per-school marks exist in the scan and no other file
  carries them. `programs_code: null` everywhere.
- **The dataset contains real duplicates** — 30 records repeat a school listed once in the
  register (e.g. #219/#220 Bandaman, #96/#97 Gyaama Pensan, #245/#246 Nkrankwanta,
  #791/#792 St. Augustine Saan). Matching assigns the code to one record and leaves the
  duplicate `[]` for manual review. The merge passes also **recovered** several records that
  would otherwise have been code-less (e.g. Bia 0040802, Bibiani 0040701, Nkrankwanta 0061004,
  Daboase 0041101).
- **31 coded register schools are absent from the dataset** (listed in
  `data/unmatched_register_schools.json`; also enumerated in `docs/DATA_EXTRACTION.md` §8).
  They were **not** auto-added.
- **Region OCR conflicts** (4) were inspected and accepted (Pilot, Odorgonno, Awaso STEM,
  Baglo Ridge); the Baglo Ridge blank boundary cell is left unset rather than guessed.
- **Baseline integrity**: the pristine baseline had been overwritten by re-applying; it was
  rebuilt from git `HEAD` and the script fixed to snapshot once.

---

## 4. Verification (evidence)

| Check | Command | Result |
|---|---|---|
| Real ESM import + field/count checks | `node scripts/verify-dataset.mjs` | OK — 16 regions, 957 records, 957 unique ids, 924 coded, 0 duplicate codes, `programs_code` ×957 |
| Data-loss vs pristine baseline | `python scripts/phase1_integrity.py` | **PASS** — 0 immutable changes, 0 overwrites, 924/924 codes valid, 0 classification mismatches |
| 50-school cross-check | `python scripts/phase1_crosscheck.py` | **50 / 50 PASS** |

> Always verify `js/school-data.js` with a real ESM import; `node --check` is unreliable here.

---

## 5. What's left / open (for manual decision — not blocking)

1. **Add the 31 coded register schools** that are missing from the dataset (list in
   `data/unmatched_register_schools.json` → `unmatched_masters`, and `docs/DATA_EXTRACTION.md`
   §8). Left as an artifact for manual addition.
2. **Review/remove the 30 duplicate records** (`unmatched_dataset` / `dataset_duplicates`).
3. **3 legitimately code-less records** (#113 Kofi Agyei, #130 Maabang, #242 Methodist SHTS) —
   confirmed name-only in the register.
4. **Insert `programs_code` values** if a per-school programme-code source ever appears.
5. **Phase 2** (application shell, design system) — not started (per instruction to stop).

---

## 6. Blocked / resolved

- ~~Per-school programme codes~~ → **resolved as unresolvable** (no source). `null`, documented.
- ~~`yes`/no on separate enhanced file (Q4)~~ → **resolved**: augment `js/school-data.js` in place.
