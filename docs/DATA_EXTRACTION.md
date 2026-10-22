# Phase 1 — Data Extraction & Dataset Augmentation

This document records how the official register was extracted, how its schools were
matched to the dataset, and what was written back into `js/school-data.js`.

> **Authority rule:** every value written is derived from the official register
> (`docs/2025-SECOND-CYCLE-SCHOOLS-REGISTER-NEW-FINAL-160525_for-approval-2 (1).pdf`) or an
> existing dataset value. Nothing is guessed. Anything the register cannot confirm is left
> unresolved (`code: null`, `classification: []`) and listed for manual review.

---

## 1. Source documents

| Role | File |
|---|---|
| Official register (image-only scan, 61 printed pages) | `docs/2025-SECOND-CYCLE-SCHOOLS-REGISTER-NEW-FINAL-160525_for-approval-2 (1).pdf` |
| Clean per-section register extraction (authoritative) | `data/reference_sections_v3.json` |
| Dataset that is augmented in place | `js/school-data.js` |
| Pristine pre-Phase-1 snapshot (data-loss reference) | `data/school-data.baseline.json` |
| Machine-readable output plan | `data/phase1_reconcile.json` |
| Unresolved/duplicate/conflict diagnostics | `data/unmatched_register_schools.json` |
| Rule/classification reference | `docs/SELECTION_RULES_AND_CLASSIFICATION.md` |

The register's reference lists are **image-only**; they are read via OCR box caches
(`data/pdf_pages/`, `data/ocr_boxes/`) and re-derived by `scripts/make_refs3.py`. The OCR
caches are re-derivable and are not part of the dataset.

---

## 2. Register structure and ground truth

Printed columns (Category lists):
`S/N | REGION | DISTRICT | CODE | SCHOOL NAME | LOCATION | GENDER | AGRIC BUS TECH ECON Hom ARTS VIS ARTS GEN GEN SCI STEM LANG | NO. OF PROG | STATUS | SCH TYPE`

Ground-truth section sizes (rows that are real schools):

| Section | Label written | Real schools |
|---|---|---|
| Category A | `Category A` | 93 |
| Category B | `Category B` | 260 |
| Category C | `Category C` | 602 |
| Appendix 1 — Technical Institutes & courses | `Appendix 1` | 232 |
| Appendix 2 — Elective technical subjects | `Appendix 2` | 188 |
| Appendix 3 — Schools with technical programmes | `Appendix 3` | 468 |
| Appendix 4 — Special/Inclusive (SEN) schools | `Appendix 4` | 9 |
| Appendix 5 — ? | `Appendix 5` | 22 |

Appendix 2 and Appendix 4 are **name-only** lists (no codes). Appendix 1, 3, 5 carry codes.

---

## 3. Extraction (`scripts/make_refs3.py`)

- Page-by-page calibration of 6 column bands per section; each row is assembled from OCR boxes.
- **Conservative region fill:** a blank REGION cell inherits its neighbour **only when the
  bordering regions agree** (`prev == next`); at a region boundary the cell is left unset
  rather than guessed. (This is why the Baglo Ridge row, at an Oti/Volta boundary, has no
  region — the code family, location and Appendix 3 membership still place it in Oti.)
- OCR fixes: lowercase `0`→`o` region confusion (register `Oti` → `0ti`), etc.
- Output: `data/reference_sections_v3.json`.

---

## 4. Matching (`scripts/phase1_reconcile.py`)

1. **Masters** are built from the register. Rows that carry a code form a *code master*
   (one per code); name-only rows (Appendix 2/4, and code-less Appendix 3) form *name masters*.
   Category rows are authoritative for a code's name and region.
2. **Name masters are merged into code masters** when the code is unambiguous:
   - pass 1 — exact normalised-name match;
   - pass 2 — distinguishing-token signature match;
   - pass 3 — shares a strong (len ≥ 5) token that identifies exactly one code, the region
     agrees, and any *extra* strong token is a school-type/region word or a spelling variant
     (this stops e.g. "Mampong Akuapem SHS" from merging into "Akuapem Technical Institute").
3. **Scoring** per dataset record: distinguishing tokens (generic words stripped) plus region
   agreement, with a last-resort `difflib` fuzzy fallback. The best name variant of a master
   is scored.
4. **Multi-listing union:** a school printed under more than one code (e.g. a TVET institute
   listed under Category A and Appendix 1) receives the union of the section labels of all
   register rows that describe it.
5. **Tie-break:** higher full-name similarity wins; remaining ties are identical-token
   duplicates, resolved to the lowest id and the losers flagged as duplicate rows.
6. **Region conflicts** (register region vs dataset region) are reported, not hidden; 4 were
   accepted after inspection (see §7).

`norm()` also splits OCR-merged words ("SeniorHigh" → "Senior High"), while protecting the
mixed-case acronyms `GRATiS` / `GRATlS` / `TsC`, and strips OCR region-prefix noise
("Nort| Bia …" → "Bia …").

---

## 5. What was written into `js/school-data.js`

Per record (all 957), preserving every pre-existing value:

| Field | Action |
|---|---|
| `name`, `gender`, `school_type`, `programs` | **unchanged** (verified against the baseline) |
| `location`, `status` | **filled only when empty**, from the matched register row; never overwritten (15 locations, 22 statuses filled) |
| `classification` | **replaced** with register-derived labels (Category A/B/C + Appendix 1–5), canonical order; `[]` when unresolved |
| `code` | **added** — the official register CODE string, or `null` when unmatched |
| `programs_code` | **added** — `null` for every record (see §6) |

Order of the new fields in each record: `id, name, location, gender, school_type, status,
code, programs, programs_code, classification`.

---

## 6. Programme codes — `programs_code: null`

The register's programme-group codes appear **only as column headers**:

| Code | Programme group | | Code | Programme group |
|---|---|---|---|---|
| 101 | Agriculture | | 501 | General Arts |
| 201 | Business | | 502 | General Science |
| 301 | Technical | | 503 | STEM |
| 401 | Home Economics | | 504 | Languages |
| 402 | Visual Arts | | | |

Per-school membership is meant to be shown by a mark in the relevant column. In this scan
**no per-school marks are present** (0 non-empty boxes under those columns; no `X`/`✓`
token anywhere), and no other project file carries per-school programme codes. There is
therefore **no authoritative per-school programme-code source**, so `programs_code` is
`null` for every record. (Trade codes `601–626`, `701–709`, `802–810`, `901–903` exist for
Appendix 1 technical institutes but likewise are not marked per school.)

---

## 7. Results

| Metric | Value |
|---|---|
| Dataset records | **957** (16 regions, 957 unique ids) |
| Records matched to a register code master | **927** |
| &nbsp;&nbsp;— with an official `code` | **924** |
| &nbsp;&nbsp;— code-less (register lists them name-only) | **3** (`#113` Kofi Agyei, `#130` Maabang, `#242` Methodist SHTS — all Appendix 2-only / ambiguous) |
| Records unresolved (`classification: []`) | **30** — every one a **duplicate** of another record (0 genuine misses) |
| Exactly-identical duplicate rows (strict signature) | **9** |
| Distinct codes assigned | **924** (0 duplicates) |
| Register masters total | 961 (955 coded) |
| Register masters with no dataset record | **34** = **31 coded schools absent from the dataset** + 3 name-only rows |
| Ambiguous masters | 0 |
| Category / code / post-union conflicts | 0 / 0 / 0 |
| Region-mismatch accepts (inspected) | 4 |
| Fuzzy-rescued matches | 12 |

Final label counts vs ground truth (all ≤ register):

| Label | Dataset | Register |
|---|---|---|
| Category A | 89 | 93 |
| Category B | 245 | 260 |
| Category C | 590 | 602 |
| Appendix 1 | 223 | 232 |
| Appendix 2 | 181 | 188 |
| Appendix 3 | 452 | 468 |
| Appendix 4 | 9 | 9 |
| Appendix 5 | 22 | 22 |

The shortfall equals schools that are in the register but not in the dataset (§8), plus
duplicate rows.

**Region-mismatch accepts (register region vs dataset region):** #574 Pilot (901…→Greater
Accra), #570 Odorgonno (001…→Greater Accra), #964 Awaso STEM (0040706→Western North),
#666 Baglo Ridge (0071105; blank boundary region cell → left unset; Oti confirmed by code
family, location Jasikan and Appendix 3).

---

## 8. Duplicates and unresolved (no record was deleted)

- **30 duplicate records** share a school with another record (e.g. #219/#220 Bandaman,
  #96/#97 Gyaama Pensan, #181/#182 Spiritan, #245/#246 Nkrankwanta, #372/#373 Moree,
  #614/#615 Yagaba, #864/#865 Kpeve, #791/#792 St. Augustine Saan). The register lists each
  school once, so one record receives the code/labels and the other is left `[]` for manual
  review. They are listed in `data/unmatched_register_schools.json` → `unmatched_dataset`
  and `dataset_duplicates`.
- **3 records are legitimately code-less** (register lists them name-only).
- **31 coded register schools are absent from the dataset** and are listed in
  `data/unmatched_register_schools.json` → `unmatched_masters` for possible addition:
  St. Mary's Tech. Inst. Asamankese (9020500), St. Rose's SHS Akwatia (0021103),
  St. Peter's SHS Nkwatia (0021003), St. Joseph's Tech. Inst. (9022001), Suhum Technical
  Institute (9020701), Mim SHS (0061301), Kukuom Agric SHS (0061303), Sankore SHS (0061304),
  Acherensua SHS (0061202), Hwidiem SHS (0061203), Yamfo Anglican SHS (0060208),
  Bomaa Comm. SHS (0060205), Derma Comm. Day School (0060207), Samuel Otu Presby SHS
  (0060202), St. Francis SHS/Tech (0020603), W.B.M. Zion SHS Old Tafo (0021301),
  Suhum SHS/Tech (0020201), Takrowase Technical Institute (9022600), St. Mary's Voc./Tech.
  Inst. (9020902), TSC Technical Institute Donkorkrom (9020903), TSC Technical Institute
  Asamankese (9020501), Tutu Methodist Technical Institute (9021603), St. Fidelis SHS/Tech
  (0020902), Takrowase Comm. SHS (0021105), St. Stephen's Presby Snr. High/Tech Asiakwa
  (0021304), St. Paul's SHS Asakraka Kwahu (0021007), St. Thomas SHS/Tech (0020502),
  Yilo Krobo SHS/Com (0021401), St. Paul's Tech. Inst. (9021301), St. Michael's SHS Akoase
  Nkawkaw (0020704), St. Martin's SHS Nsawam (0020303).

Register schools were **not auto-added** to the dataset; adding them is an open decision.

---

## 9. Verification

| Check | Script | Result |
|---|---|---|
| Real ESM import + field/id/code counts | `node scripts/verify-dataset.mjs` | 16 regions, 957 records, 957 unique ids, 924 coded, 0 duplicate codes, `programs_code` on all 957 |
| No data loss vs pristine baseline | `python scripts/phase1_integrity.py` | **PASS** — 0 immutable changes, 0 overwrites, 924/924 codes valid, 0 classification mismatches |
| 50-school cross-check against the register | `python scripts/phase1_crosscheck.py` | **50 / 50 PASS** (`data/crosscheck_50.json`) |

> `node --check js/school-data.js` is **not** a trustworthy test for this file; always use
> the real ESM import (`scripts/verify-dataset.mjs`).

---

## 10. Scripts

| Script | Purpose |
|---|---|
| `scripts/make_refs3.py` | Extract the register into `data/reference_sections_v3.json` |
| `scripts/phase1_reconcile.py` | Match + plan + `--apply` (writes `js/school-data.js`) |
| `scripts/phase1_integrity.py` | Baseline-vs-applied data-loss check |
| `scripts/phase1_crosscheck.py` | 50-school register cross-check |
| `scripts/verify-dataset.mjs` | Real ESM import verification |
