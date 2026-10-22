# Phase 4 Report: Main School Selection Workflow

**Date:** October 16, 2026  
**Phase:** 4 of 7 (School Selection Workflow)  
**Status:** Complete (for prototype purposes)

---

## Objective

Implement the main school selection workflow for the Ghana BECE/CSSPS School Selection Guidance Application prototype. The workflow allows users to choose and rank up to five main schools, assign a programme and Day/Boarding option to each, and validate choices against a well-defined set of rules. Phase 5 (alternatives) and Phase 7 (review finalisation) were not started.

---

## Files Created

- `selection/index.html` - Main selection page with choices panel, search/filters, and live validation. Loads `js/layout.js` then `js/selection.js`.
- `js/prototype-schools.js` - Curated 27-school prototype subset, helpers (`getPrototypeSchools`, `getPrototypeSchoolsById`, `categoryOf`, `residentialOptionsOf`, `checkPrototypeData`, `FIELD_VERIFICATION`, `PROTOTYPE_META`), and documented field provenance.
- `js/selection-state.js` - Pure state management (add/remove/move/replace/update choices), localStorage persistence (`ssg.selection.main.v1`, max 5 choices), and exported constants.
- `js/validation.js` - Pure validation returning `ValidationResult` with `overall`, `errors`, `missingRequired`, `pending`, `info`, `counts`, `perChoice`. Implements confirmed prototype rules, classifies pending items, and builds user-facing summaries/checks.
- `js/school-search.js` - Search/filter helpers (`filterSchools`, `getFilterOptions`, `matchesQuery`).
- `js/selection.js` - UI controller that renders choices, results, filters, progress, validation, handles replace/reorder/remove, programme/residential selection, and live recomputation; persists to localStorage.
- `css/selection.css` - Section-scoped styles (`.sel-*`) following Phase 3 design system. Added import in `css/main.css`.

**Files Modified**
- `css/main.css` - Added `@import url('selection.css');`.
- `index.html` - Updated scope bullet to reflect that the selection workflow now runs on a documented subset of schools and main choices are saved locally (no external submission).

---

## Prototype Schools Selection

A curated subset of 27 schools was created in `js/prototype-schools.js` (separate from the national dataset). Rationale: small, verifiable set with useful variety (Categories A/B/C, SHS/SHTS/TVET/STEM, Day-only/Boarding-only/Day-Boarding, mixed/boys/girls, 14 regions) to exercise all validated states without modifying `js/school-data.js`.

**Selected IDs (27):**  
Categories: A(4)=524,403,909,601; B(6)=225,526,917,649,713,428; C(17)=16,26,306,411,532,529,597,622,632,664,697,714,806,904,966,101,452.

**Verification of the subset:**
- All 27 records present in `js/school-data.js` (verified by ID lookup). 
- All categorised (category A/B/C assigned). No unresolved category duplicates. `checkPrototypeData()` returns an empty array.
- All have a 2025 register code (`code` present, non-empty).
- Residential status normalised: `status` values (Day/Boarding, Day, Boarding) mapped to `residentialOptions` (`['Day','Boarding']`, `['Day']`, or `['Boarding']`).
- `programmes` lists present where available (some schools have multiple programmes; id 101 has no programme data).
- Field provenance recorded: category from classification logic, residential from `status`, codes from register fields; programmes pre-existing in source data (codes null historically) and treated as prototype-disclosed lists where present.

`PROTOTYPE_META` documents counts, regions, and caveats. `FIELD_VERIFICATION` marks each field’s verification status (confirmed vs prototype-checked vs uncertain) to keep uncertainty visible. No school codes, programmes, categories, or residential options were invented.

---

## Implemented Behaviour

**Workflow**
- Rank 1–5 main choices; Choice 1 is most preferred. Empty slots rendered initially; add/remove/replace/reorder supported. 
- Each non-empty choice requires a programme (when the school offers programmes) and a residential option (Day/Boarding) that is offered by the school (from register `status`). 
- Results list searchable by name/region/location/code; filterable by Region, Category, School type, Residential availability, Programme. Filter chip clears available. Empty results handled with accessible message. 
- Replacement mode: when replacing a choice, results clearly indicate “Use for Choice N” and a note/cancel is shown; note disappears after completion. 
- Reordering: Move Up/Down with bounds (first up disabled, last down disabled). 
- Persistence: localStorage key `ssg.selection.main.v1`. Choices restored on reload. "Clear all choices" requires confirmation.

**Accessibility & UX**
- Live regions: `#sel-announcer` (polite) announces key state changes; validation panel `aria-live="polite"`. 
- Semantic headings/labels; selects have explicit `data-field`/`data-index`. 
- Responsive: two-column layout (aside 320px) stacks below 1024px; mobile-first affordances. 
- Reduced motion respected via `prefers-reduced-motion: reduce`.

**Validation (rule classification)**
The implementation uses a four-tier outcome: `invalid` (confirmed error) > `incomplete` (missing required field/count) > `needs-verification` (pending/uncertain) > `valid`. A selection is `valid` only if it passes all confirmed prototype rules and has no pending items; this does **not** imply official CSSPS approval.

**CONFIRMED (enforced, errors):**
1. Five ranked main choices required (partial state → `incomplete`; less than 5 with complete fields → `incomplete`).  
2. Programme required per choice **unless** the school has no programme data (id 101) — in that case the field is not forced as an error; instead surfaced as a `pending/info` caveat.  
3. Residential option required per choice and must be offered by the school (matches `residentialOptions` from `status`). Boarding chosen for a Day-only school → `residential-availability` error.  
4. Category limit: **max 1 Category A** → `category-a`.  
5. Category limit: **max 2 Category B** → `category-b`.  
6. Residential split (at five choices): exactly **3 Boarding and 2 Day** → `residential-split`.  
7. No duplicate schools → `distinct`.

**PENDING (needs-verification, not enforced as errors):**
- Guidelines 7/8 interaction (same-category mix of one Boarding/one Day): `category-residential-arrangement`. The exact authoritative interaction is marked uncertain; it never blocks `valid`.  
- School with no programme data (id 101) produces a non-blocking caveat about programme eligibility being unconfirmed (not an error).  
- Unknown category/residential edge cases, multi-list/pathway nuances, and cases where authoritative Appendix 3 text conflicts are recorded as `pending/info` and surfaced in the UI; they do not automatically flip a `valid` selection to `invalid`.

**INFO (disclosed caveats):** programme eligibility cannot be authoritatively constrained from available data (no per-school programme codes); prototype uses disclosed programme lists only; not an official CSSPS submission; TVET/STEM/SEN pathways out of scope.

---

## Tests Actually Executed

### 1. Node headless logic tests (`scripts/phase4_validation_tests.mjs`)
All tests executed in Node v24. Results: **46 passed, 0 failed**.

Covered cases:
- **Data integrity:** 27-school subset, `checkPrototypeData()` empty, categories/codes present, helpers consistent with `classification`/`status`.
- **State management:** add succeeds/refuses duplicate, reorders (move), updates fields, replaces (swaps school, clears fields), removes, enforces max 5 (5 accepted, 6th refused).
- **Confirmed rules:** empty → `incomplete`; 2 A → `invalid` (category-a); 3 B → `invalid` (category-b); 4 Boarding/1 Day → `invalid` (residential-split); Boarding at Day-only → `invalid` (residential-availability); duplicate → `invalid` (distinct). Fixed rollup to mark <5 choices as `incomplete`.
- **Incomplete:** 1 of 5 complete → `incomplete` with `remaining=4`; missing programme → `incomplete` with `missingRequired` listing `programme`.
- **Needs-verification:** valid split (3B/2D) but mixed category pairs (B mixed, C mixed) → `needs-verification` with `category-residential-arrangement`; school with no programme data (101) does not force error and does not force choosing a programme.
- **Valid:** clean scenario (A boarding + B day,day + C boarding,boarding; 3B/2D; no mixed pairs) → `valid`, no errors, no pending, correct counts (1A/2B/2C, 3 Boarding/2 Day).
- **Search:** empty query returns all, case-insensitive name search, code search works, no-match returns none, category filter, residential availability filter, programme filter.

### 2. Browser UI verification (Chrome/Chromium via browser tools)
Page loaded at `http://127.0.0.1:8761/selection/index.html`. Console: **no warnings/errors** after fixing an extra brace in `js/selection.js` (parse verified). DOM state:
- 5 choice cards, 27 results, 5 filters, 27 add buttons, `meta` shows prototype subset details, overall `Incomplete`, progress `0 of 5 chosen · 5 still to add.`, results count correct.

Interaction tests:
- Add first school → choice populated, progress updates, added school’s result button becomes disabled/“Already Choice 1” (duplicate prevention).  
- Reorder: Move Down swaps order (aria-labels correct; up disabled at top).  
- Replace: entering replace mode shows note and “Use for Choice N”; after clicking, note clears.  
- Search: typing query filters results; empty query restores; filter by Category A shows 4; Clear filters restores 27.  
- Filters by Region/Category/Type/Residential/Programme render and clear correctly.  
- Persistence: added 2 choices with fields, reloaded → restored.  
- Confirmed rules surfaced: category-a/b, residential-split, residential-availability, distinct detected in validation panel.  
- Pending/uncertain items (programme availability, category residential arrangement) appear as non-blocking pending/info in UI.  
- “Clear all choices” shows confirm dialog.

Syntax verification: all modules parsed as ESM; `node --check` gave a false pass on one file, so parse was verified via dynamic `import()` (`PARSE-OK` for pure modules, `ReferenceError` expected for DOM-dependent modules due to `document` at import time). This is noted as the authoritative parse method.

---

## Official Rules Implemented vs Still Needing Verification

**Implemented (confirmed/enforced):**
- Maximum of 5 main schools, ranked (required count enforced; partial → incomplete).  
- Programme required when school has programmes; not forced when none available.  
- Residential option must be chosen and must be offered by the school (availability enforced).  
- Max 1 Category A school.  
- Max 2 Category B schools.  
- 3 Boarding / 2 Day across 5 choices.  
- No duplicate schools.

**Still needing verification (documented as pending, not enforced):**
- Interaction of Guidelines 7 and 8 (pattern “one Boarding, one Day” within the same category B or C) — flagged in `RULE_REFERENCES` and surfaced as `category-residential-arrangement` (needs-verification). Authority unclear (Guidelines state categories and limits separately; interaction not explicitly resolved in source text).  
- Authoritative Appendix 3 list contents (source mentions Appendix 3; exact list not incorporated; classification uses derived rules and prototype subset).  
- Per-school programme codes / official programme eligibility (codes are `null` across records; no authoritative mapping to CSSPS codes). Treated as disclosed-only, never authoritative.  
- Per-school Day/Boarding beyond `status` field (multi-list schools, split lists, or special cases not verifiable from available fields).  
- Multi-list/TVET/STEM/SEN pathway limits or exceptions — out of scope for prototype; marked as caveats.  
- Category rule vs residential split interaction in edge cases — recorded in `UNRESOLVED_QUESTIONS`.

---

## Known Limitations

- **Prototype-only:** Does not submit to CSSPS; provides guidance only. No guarantees of placement/acceptance.
- **Limited dataset:** Uses 27 curated schools (documented subset), not the full national register (957). The subset is sufficient to exercise all confirmed states and pending cases.
- **Data provenance:** Programme lists are pre-existing where present; programme codes unavailable → eligibility treated as unconfirmed. `status` may be blank in source for some records (not present in subset). Residential availability inferred from normalised `status`.
- **Unresolved official details:** Guidelines 7/8 interaction marked uncertain and unenforced. Appendix 3 authoritative content not embedded. These are surfaced as pending/info, never silently resolved.
- **Persistence:** Browser localStorage only; device-specific. No backend. Clearing browser storage removes saved choices.
- **No Phase 5/7:** Alternatives workflow and final review submission/outputs (Phase 7 beyond stub) not implemented. `js/shs-recommendation.js` untouched as instructed.
- **Test coverage:** Browser UI tests covered core flows, confirmed rules, search/filters, persistence, replace/reorder/remove. Comprehensive end-to-end of every UI edge case was not exhaustively re-run after disconnection, but logic is fully covered by 46 passing headless tests and targeted UI checks. `node --check` proved unreliable for ESM; authoritative parse via dynamic `import()` used.

---

## Confirmations

- **Phase 5 not started.** No files for alternatives (`alternatives/`, `js/alternatives*`) created; `phases.txt` boundaries respected. 
- **Phase 7 not started.** Only review stub exists (`review/index.html`) as before; no final submission logic added. 
- **`js/shs-recommendation.js` untouched.** No modifications made. 
- **National dataset preserved.** `js/school-data.js` not modified; prototype subset in separate file. 
- **Existing uncommitted work preserved.** Changes limited to Phase 4 scope (new selection/js/css + small edits to `css/main.css` and `index.html` scope bullet). 
- **Verification discipline:** Confirmed vs prototype-checked vs uncertain distinct throughout; uncertainties labelled and unenforced. 
- **All new JS modules syntax-checked via dynamic import** (parse OK); logic validated by 46 passing tests.

---

## Files Modified Summary

**Created (8):** `selection/index.html`, `css/selection.css`, `js/prototype-schools.js`, `js/selection-state.js`, `js/validation.js`, `js/school-search.js`, `js/selection.js`, `scripts/phase4_validation_tests.mjs`.  
**Modified (2):** `css/main.css`, `index.html`.  
**Other new artifacts (docs/data/scripts outside Phase 4 code):** Phase 1–3 supporting docs/data/scripts retained; Phase 4 code changes limited as above.
