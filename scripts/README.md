# scripts/

Python tooling used to extract, verify, and maintain the school data.

All scripts resolve paths relative to the **project root** — run them from there,
for example: `python scripts/make_refs2.py`.

## Active pipeline (reproducible)

1. `rapid_all.py` / `rapid_pages.py` — OCR the register PDF (`docs/2025-SECOND-CYCLE-...pdf`) with RapidOCR → `data/ocr_boxes/`
2. `make_refs2.py` — parse the per-section reference lists (Category A/B/C, Appendix 1–5) from the OCR boxes → `data/reference_sections_v2.json`
3. `final_match_fix2.py` — fuzzy-match those reference lists against `js/school-data.js` and write the `classification` field → `data/classification_report2.json`
   - `strip_class.py` removes existing `classification` lines from `js/school-data.js` before a full re-run
4. `verify_schools.py` / `check_num.py` — integrity checks of `js/school-data.js`
5. `show_report2.py` / `show_unresolved.py` — view `data/classification_report.json` / unresolved entries

Inspection helpers: `parse_boxes.py`, `inspect_page.py`, `inspect_rows.py`

Earlier Tesseract phase, kept because its outputs are preserved in `data/`:

- `ocr_all.py` → `data/ocr_out/`
- `extract_reference.py` → `data/reference_extracted.json`
- `match_reference.py` → `data/match_scores.json`

## archive/

Superseded matcher/apply iterations, calibration experiments, and one-off OCR
tests kept for provenance only. They are not part of the current pipeline, but
their path references were kept up to date with the current folder layout.
