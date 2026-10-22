# Classification summary — **SUPERSEDED by Phase 1**

> **Status: historical.** This file records the *first* pass that added
> `classification: [...]` to `js/school-data.js`. It has been superseded by the
> authoritative Phase 1 extraction — see **`docs/DATA_EXTRACTION.md`** for the current
> method, counts and verification. The values below are the **pre-Phase-1** state and are
> kept only as a record.

First-pass approach:

- Re-OCR'd PDF pages 5–6 (corrupted) via RapidOCR; extracted reference lists per section
  (Cat A/B/C/Appendix 1–5) using section-specific column bands.
- Matched each of 957 schools with distinguishing-token + region-aware fuzzy matching.

First-pass results (the file's values **before** Phase 1):

- Records: 957; `classification` present on 771 (186 unresolved).
- Counts: Cat A 55, Cat B 150, Cat C 359, Appendix 1 117, Appendix 2 192, Appendix 3 292,
  Appendix 4 7, Appendix 5 25 (28 category ambiguities resolved).

**Corrections to the claims above:**

- ❌ *"node --check: valid"* — **false.** `node --check` does not reliably validate this
  module and reported a false pass. The file is validated for real by an ESM import
  (`node scripts/verify-dataset.mjs`).
- The first pass inserted `classification` after `programs` **without adding the required
  comma**, which made `js/school-data.js` invalid JavaScript. Phase 1 rewrote every record
  with valid syntax.

Current authoritative state: `docs/DATA_EXTRACTION.md`
(957 records; 924 coded; 927 labelled; 30 duplicate rows `[]`; 3 code-less; `programs_code`
`null`; verified by `scripts/phase1_integrity.py` = PASS and `scripts/phase1_crosscheck.py` =
50/50 PASS).

Artifacts from the first pass (kept): `data/classification_report.json`,
`data/classification_report2.json`, `data/reference_sections_v2.json`,
`data/ocr_boxes/page_005.json`, `data/ocr_boxes/page_006.json`.
