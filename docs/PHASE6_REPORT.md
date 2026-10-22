# Phase 6 Report: Special Pathways (TVET, STEM, SEN)

**Date:** October 17, 2026  
**Phase:** 6 of 7 (Special Pathways)  
**Status:** Complete (for prototype purposes)

---

## Objective

Add TVET, STEM and SEN pathway support to the selection workflow. Scope (from `docs/phases.txt`):

1. Add pathway selection at the start of the workflow.
2. Implement the TVET pathway (5 TVET institutes from A/B/C).
3. Implement the STEM pathway (5 STEM schools from A/B/C).
4. Implement the SEN pathway (if data available).
5. Give each pathway its own validation rules.

Phase 7 (final review) was **not** started. The Phase 4 main-choice flow and the Phase 5 alternatives flow are unchanged in behaviour (all Phase 4 and Phase 5 logic tests still pass).

---

## Files Created

- `js/pathways.js` - Pure pathway definitions, eligibility predicates, the additional pathway-school list, the school pool, per-pathway coverage, and a data-integrity guard (`checkPathwayData`).
- `js/pathway-state.js` - Pathway persistence (`ssg.selection.pathway.v1`), `loadPathway` / `savePathway` / `clearSavedPathway`.
- `scripts/phase6_pathway_tests.mjs` - Headless logic tests (53 checks).
- `docs/PHASE6_REPORT.md` - This report.

**Files Modified**

- `selection/index.html` - Added the "Choose a pathway" section (`#pathway`, `#sel-pathways`, `#sel-pathway-note`) at the start of the workflow.
- `js/selection.js` - Imports the pathway modules; loads/persists the pathway; renders the pathway selector and its note; filters the browse list and filter options per pathway; passes the pathway to `validateSelection`; makes the progress panel pathway-aware; validates pathway data at boot.
- `js/validation.js` - `validateSelection(state, schoolsById, options)` now accepts `{ pathway }`. Adds a per-choice pathway-eligibility check, makes the category-limit and residential-split rules conditional, adds the pathway pending note, and makes `buildChecks` pathway-aware. The default (`general`) reproduces the Phase 4 behaviour exactly.
- `css/selection.css` - Added `.sel-pathway*` styles for the pathway cards and note.
- `index.html` - Updated the prototype-scope bullets: special pathways are now implemented for school eligibility but their interaction with the general limits is unresolved; the subset description now mentions the pathway schools.

**Files Removed**

- `scripts/_probe6.mjs` and `scripts/_probe6_out.txt` - temporary data-inspection files.

---

## Pathway Data

The national dataset classifies schools as `school_type` TVET (226), SHTS (287), SHS (436) and STEM (8), and carries appendices in `classification`: **Appendix 5** (STEM schools and SHS offering STEM subjects, 22 records) and **Appendix 4** (Special Education Needs schools, 9 records).

The Phase 4 prototype subset (27 schools) already contains **8 TVET institutes**, but only **3 Appendix 5 schools** (101, 526, 601) and **no Appendix 4 schools**. To make every pathway completable from real records - without touching the Phase 4 subset or inventing data - a small, explicitly documented set of additional pathway schools is added in `js/pathways.js` (`PATHWAY_EXTRA_SCHOOL_IDS`), drawn unchanged from the national dataset:

- **STEM (Appendix 5), 5 schools:** 407 Abomosu STEM SHS (A); 471 Methodist Girls SHS, Mamfe (B); 527 Accra STEM Academy (B, Day-only); 236 Koase SHS/Tech. (C); 488 Presby Boys Model SHS (C).
- **SEN (Appendix 4), 6 schools:** 482 Okuapeman SHS (A); 868 Mawuli School, Ho (A); 269 Wenchi Meth. SHS (B); 803 Wa SHS (B); 420 Akuapem Technical Institute (C; also TVET and Appendix 3); 749 Sirigu SHS (C; also Appendix 3).

The selection pool is therefore 27 + 11 = **38 schools**. The general pathway still offers only the original 27.

| Pathway | Eligible schools | Source |
| --- | --- | --- |
| General | 27 | Phase 4 subset (`js/prototype-schools.js`) |
| Pure TVET | 9 | `school_type === 'TVET'` (8 base + 420, which is also TVET) |
| STEM / Science | 8 | Appendix 5 (3 base + 5 added) |
| Special Education Needs | 6 | Appendix 4 (6 added) |

> **Source caveat (unresolved, kept visible):** `js/guidelines-data.js` (rules 13, 14, 18 and unresolved questions 1-3) records that the interaction between each special pathway and the general category/residential limits is **not confirmed**, and that no authoritative SEN selection rules are available. The prototype therefore treats the pathway *school list* as confirmed and never settles the general-limit interaction.

**No data was invented and `js/school-data.js` was not modified.**

---

## Implemented Behaviour

- A **Choose a pathway** section appears first in the workflow, with four radio cards: General selection, Pure TVET, STEM / Science, and Special Education Needs. Each card shows the pathway, a status chip (Confirmed rules / Needs verification), and how many schools it offers.
- Selecting a pathway:
  - filters the browse list (and the filter options) to only eligible schools;
  - updates the search result count ("Showing all 9 TVET pathway schools." etc.);
  - updates the progress-panel title ("Your five TVET choices") and drops the "need/max" framing from the category and residential statistics;
  - re-runs validation with the pathway's rules;
  - is saved in this browser only (`ssg.selection.pathway.v1`) and restored on reload.
- A **pathway note** under the selector shows the pathway's official wording, the unresolved-limits caveat, and the eligibility source. For the general pathway it states the confirmed Phase 4/5 rules instead.
- The two Phase 5 alternatives (Appendix 3) are unchanged by the pathway and continue to use the 27-school base subset.

**Persistence**

- The pathway is saved under `ssg.selection.pathway.v1` as `{"pathway":"<id>"}` and restored on reload. Unknown/missing values fall back to `general`.
- Main choices and alternatives are unchanged (`ssg.selection.main.v1`, `ssg.selection.alternatives.v1`). A choice that is not eligible for the current pathway (for example a carried-over STEM school after switching to General) is kept and flagged as a confirmed error, never silently dropped.

**Accessibility & UX**

- The selector is a labelled `role="radiogroup"` of real radio inputs (label-wrapped), so it is keyboard operable; the validation panel remains `aria-live="polite"`; announcements reuse `#sel-announcer`.
- Layout is responsive (cards flow to a single column) and reuses the existing design system.

---

## Validation (rule classification)

The overall status uses the same four-tier outcome as Phases 4/5: `invalid` (confirmed error) > `incomplete` (missing required detail) > `needs-verification` (pending/uncertain) > `valid`.

**CONFIRMED (enforced):** identical for every pathway

1. Five (5) main choices, ranked.
2. Every choice must be eligible for the selected pathway (an **error** when not).
3. Every choice must be a different school.
4. Only residential options the school actually offers may be chosen.

Applied to the general, TVET and STEM pathways only:

5. A programme must be chosen for each school.
6. A Day/Boarding option must be chosen for each school.

Applied to the general pathway only (the confirmed Phase 4 rules):

7. At most one Category A school (two or more is an **error**).
8. At most two Category B schools (three or more is an **error**).
9. Three Boarding and two Day among the five choices (otherwise an **error**).

**PENDING (needs verification; not enforced):**

1. How the general category and residential limits apply to the **pure TVET** pathway. For TVET, rules 7-9 above are **not enforced**; the category and residential-split checks show as *pending ("Not enforced for this pathway")* and a single pending item (`pathway-limits`) states the uncertainty.
2. The same interaction for the **STEM/Science** pathway.
3. The specific rules for **Special Education Needs** selections. For SEN, rules 5-9 are **not enforced** (programme and Day/Boarding are optional), because the general rules are not assumed to apply.

Because the unresolved interaction always applies to a special pathway, a complete, otherwise-correct special-pathway selection is reported as **needs verification**, never `valid`. Only the general pathway can reach `valid`. This is deliberate: it keeps the unresolved questions visible and never silently settles them.

**INFO (standing caveats; never change status):**

- Programmes are prototype data.
- The check is for preparation only and does not guarantee placement.
- Special pathways restrict which schools may be chosen; their interaction with the general limits is not yet confirmed.

---

## Tests

**Logic tests** - `node scripts/phase6_pathway_tests.mjs`

```
53 passed, 0 failed
```

Coverage: configuration integrity (Phase 4 subset unchanged at 27; `checkPathwayData()` clean; unique, non-base, correctly-eligible extras; per-pathway coverage); eligibility and visibility per pathway; the general pathway reproducing the Phase 4 rules and rejecting a pathway-extra school; complete TVET/STEM/SEN selections producing no errors and `needs-verification`; TVET not failing the general residential split; non-eligible schools producing `pathway-eligibility` errors; SEN not requiring programme/Day-Boarding; unknown pathway ids falling back to general; and `loadPathway()` falling back to `general` without storage.

**No regression**

- `node scripts/phase4_validation_tests.mjs` - **46 passed, 0 failed**
- `node scripts/phase5_alternatives_tests.mjs` - **54 passed, 0 failed**

**Browser verification** at `http://127.0.0.1:8761/selection/index.html` (DOM probes; no console errors):

- Boot renders four pathway cards with the correct counts and status chips: General 27 (Confirmed rules); Pure TVET 9; STEM/Science 8; Special Education Needs 6 (all Needs verification). General is selected by default and the browse list shows all 27 prototype schools.
- Switching to **Pure TVET**: the list shows exactly 9 schools, all of type TVET; the progress panel becomes "Your five TVET choices" with the "need/max" framing removed; the note shows the official TVET wording. Adding 5 TVET schools gives **no errors**; the eligibility check passes, the Category A/B and residential-split checks show *pending*, and the overall status is *Incomplete* only because programme/Day-Boarding are still open, with the pathway-limits item under *Needs verification*.
- Switching to **SEN**: the list shows exactly 6 Appendix 4 schools; adding 5 gives **no errors and no missing items** (programme and Day/Boarding are optional), and the overall status is **Needs verification**.
- Switching to **STEM**: the list shows 8 schools spanning STEM/SHTS/SHS types; adding 5 gives no errors.
- **Persistence**: after selecting STEM, storage holds `{"pathway":"stem"}` and a reload restores the STEM pathway and its schools. Switching back to General shows 27 schools and flags the carried-over STEM-extra choices with the pathway-eligibility error (invalid) rather than silently dropping them.

---

## Known Limitations and Unresolved Questions

- How the general category and residential limits apply to the TVET and STEM pathways is unresolved; those limits are not enforced and the uncertainty is always surfaced.
- No authoritative SEN selection rules are available, so no SEN-specific validation is implemented; only the Appendix 4 school requirement and the five distinct choices are checked.
- The authoritative Appendix 3 list and the Appendix 3 Category B header conflict (Phase 5) remain unresolved and still apply to the alternatives section.
- Pathway eligibility is limited to the documented subset only; the national register is not loaded into the browser.
- The combined seven-choice (5 main + 2 alternative) review is left to Phase 7.

---

## Phase Boundary

Phase 6 is complete. Phase 7 (Final Review & Form Preview) is **not** started. The `review/` page remains the Phase 2 stub ("Planned - Phase 7"), and `js/school-data.js` was not modified. The Phase 4 prototype subset and the Phase 5 alternatives behaviour are unchanged.
