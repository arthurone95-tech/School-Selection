# Phase 5 Report: Alternative Choices (Appendix 3)

**Date:** October 17, 2026  
**Phase:** 5 of 7 (Alternative Choices)  
**Status:** Complete (for prototype purposes)

---

## Objective

Add the two alternative-school choices to the selection workflow on top of the Phase 4 main choices: one Category B and one Category C alternative, drawn from Appendix 3. Scope (from `docs/phases.txt`):

1. Extend `selection/index.html` with an alternatives section.
2. Implement Appendix 3 eligibility filtering.
3. Implement duplicate-school prevention (alternatives vs. main choices).
4. Add validation for alternatives.

Phase 6 (special pathways) and Phase 7 (final review) were **not** started. The Phase 4 main-choice workflow is unchanged in behaviour (all Phase 4 logic tests still pass).

---

## Files Created

- `js/alternatives-state.js` - Pure state for the two fixed slots (`{ b, c }`), localStorage persistence (`ssg.selection.alternatives.v1`), and structural guards (`setAlternative`, `clearAlternative`, `clearAlternatives`, `isAlternative`, `alternativeSlotOf`, `filledCount`, `alternativeIds`).
- `js/alternatives.js` - Pure eligibility + validation (`isAppendix3Eligible`, `alternativeEligibleSchools`, `eligibleCounts`, `validateAlternatives`) plus `ALTERNATIVE_RULES` (official wording + status, mirroring `guidelines-data.js` rules 9, 10, 11 and 17).
- `scripts/phase5_alternatives_tests.mjs` - Headless logic tests (54 checks).
- `docs/PHASE5_REPORT.md` - This report.

**Files Modified**
- `selection/index.html` - Added the "Alternative choices (Appendix 3)" section (`#alternatives`) with caveat, slot container (`#sel-alternatives`) and validation container (`#sel-alternatives-validation`).
- `js/selection.js` - Imports the alternatives modules; loads/persists alternatives state; renders the caveat, the two slot cards and the alternatives validation panel; blocks adding a school that is already an alternative; recomputes alternatives alongside main validation.
- `css/selection.css` - Added `.sel-alt-*` styles (caveat, slot cards, headings) and a responsive padding tweak.
- `index.html` - Updated the prototype-scope bullet to state that the two alternative choices are also saved in the browser only.

**Files Removed**
- `alternatives/index.html` - a placeholder page created earlier this session. The phase explicitly requires extending `selection/index.html`, and the nav never linked the placeholder, so it was removed to avoid a stray half-page. No references to it remain.
- `scripts/_probe.mjs` - temporary data-inspection script.

---

## Appendix 3 Data and Eligibility

Appendix 3 membership is read from each school's `classification` array (via `appendicesOf` in `js/prototype-schools.js`) - the Phase 1 register classification. **No data was invented and `js/school-data.js` was not modified.**

Of the 27-school Phase 4 prototype subset, **12 are listed under Appendix 3**:

- **Category B (3):** 225 Don Bosco Voc./Tech. Inst.; 649 St. Joseph's Tech. Inst., Saboba; 428 Anum Presbyterian Technical Institute.
- **Category C (9):** 16 Terchire SHS; 26 Adobewora Comm. SHS; 597 Chereponi SHS/Tech.; 632 Kofi Annan Technical Institute; 664 Akpafu SHS/Tech.; 697 Buipe Technical Institute; 904 Abura Technical Institute; 101 J.A. Kufour STEM Technical School; 452 J.G. Kno Technical Institute.

Eligibility filtering (`alternativeEligibleSchools`) returns only Appendix 3 schools of the slot's category, so the Category B picker offers 3 schools and the Category C picker offers 9. A school that is a Category B/C school but **not** in Appendix 3 is never offered as an alternative.

> **Source caveat (unresolved, kept visible):** `js/guidelines-data.js` (rules 9 and 17) records two open questions about Appendix 3: (a) the authoritative, complete Appendix 3 list has not been verified; (b) an Appendix 3 **header conflict about the number of Category B alternatives** is unresolved. The prototype therefore treats register classification as the *best available* source and never presents alternatives as a settled, official determination.

---

## Implemented Behaviour

- A dedicated **Alternative choices (Appendix 3)** section appears after the main-choices browse section. It contains one **Category B** slot and one **Category C** slot.
- Each slot is a labelled `<select>` restricted to eligible Appendix 3 schools of that category, followed (once filled) by the school's details (region, code, type, Day/Boarding offered, appendices) and a status chip.
- A caveat panel above the slots states how many Appendix 3 schools the subset contains and why a completed selection is reported as *needs verification*.
- An **alternatives check** panel shows the overall alternatives status, confirmed-rule problems, still-to-complete items, needs-verification items, a rule-by-rule check list, standing caveats, and a "Rules applied (official wording)" disclosure. A **Clear alternative choices** button appears when either slot is filled.
- Empty/partial selections feed the same overall status vocabulary as Phase 4 (`invalid` > `incomplete` > `needs-verification` > `valid`).

**Duplicate-school prevention (alternatives vs. main choices)**
- In the alternatives pickers, any school that is already one of the five main choices is disabled and labelled "(already a main choice)".
- In the main-choices results list, any school used as an alternative shows a disabled "Used as an alternative" button instead of "Add"/"Use for Choice N".
- The two alternative slots are also guarded from holding the same school (`setAlternative` rejects it; validation flags `alt-distinct`).

**Persistence**
- Alternatives are saved under `ssg.selection.alternatives.v1` and restored on reload. Restored ids not in the prototype subset, or a repeated id, are dropped rather than shown as broken records.

**Accessibility & UX**
- Slots use labelled selects (`aria-label`, `for`/`id`), the validation panel is `aria-live="polite"`, and slot cards use `aria-labelledby`. Announcements reuse the existing `#sel-announcer` region.
- Layout is responsive (slot cards flow to a single column on narrow screens) and reuses the Phase 3 design system (`.sel-panel`, `.badge-*`, `.sel-details`, etc.).

---

## Validation (rule classification)

The alternatives use the same four-tier outcome as Phase 4: `invalid` (confirmed error) > `incomplete` (missing required slot) > `needs-verification` (pending/uncertain) > `valid`.

**CONFIRMED (enforced, errors):**
1. Two alternatives must be selected (empty/partial → `incomplete`).
2. Both alternatives must come from Appendix 3 (per best-available data).
3. One Category B and one Category C: each slot must hold a school of its own category.
4. An alternative must not repeat a school already among the five main choices.
5. The two alternatives must be different schools.

**PENDING (needs verification; not enforced):**
1. The number of Category B alternatives - rule text says one B + one C, but an Appendix 3 header conflict is unresolved.
2. The authoritative Appendix 3 list is unverified; eligibility uses register classification.

Because the two pending items always apply once an alternative is selected, a complete, otherwise-correct alternatives selection is reported as **needs verification**, never `valid`. This is deliberate: it keeps the unresolved Appendix 3 questions visible and never silently settles them.

**INFO (standing caveats; never change status):**
- Alternatives are a fallback used only if the candidate is not placed in any main choice, and selecting them does **not** guarantee placement.
- Only the documented prototype subset of Appendix 3 schools is offered; the full list is not loaded.

---

## Tests

**Logic tests** - `node scripts/phase5_alternatives_tests.mjs`

```
54 passed, 0 failed
```

Coverage: eligibility filtering (only Appendix 3 Category B/C schools; non-Appendix-3 excluded), state module behaviour (set/clear/guards/distinct slots), validation completeness, confirmed rules (category match, Appendix 3 membership, cross-section duplicate, same-school), unknown-id handling, and the two unresolved questions always producing `needs-verification`. The suite also parse-checks all relevant ES modules via dynamic `import()` (`selection.js` throws the expected `ReferenceError` in Node because it touches `window`/`document`).

**No regression** - `node scripts/phase4_validation_tests.mjs`

```
46 passed, 0 failed
```

**Browser verification** at `http://127.0.0.1:8761/selection/index.html` (DOM probes; no console errors):

- Alternatives section renders with 2 slots; B picker has 3 eligible schools + placeholder, C picker has 9 + placeholder; caveat text correct.
- Adding Don Bosco (225) as a main choice disables it in the B picker with "(already a main choice)".
- Selecting B = 649 and C = 16 → overall **Needs verification**, no errors, no missing items; confirmed checks pass and both unresolved questions show as pending; state persisted (`{"b":649,"c":16}`).
- After reload: slots restored, and both chosen alternatives show a disabled "Used as an alternative" button in the main list.
- Injected violations render correctly: alternative equal to a main choice → **Invalid** with the duplicate error; non-Appendix-3 school → **Invalid** with the Appendix 3 error (and that school is not in the picker).
- "Clear alternative choices" empties both slots, returns to **Incomplete**, and clears the stored value.

---

## Known Limitations and Unresolved Questions

- The authoritative, complete Appendix 3 list is not verified; the prototype uses register-classification membership in the documented subset only.
- The number of Category B alternatives (one vs. an "at most one B" header) remains unresolved and is surfaced as needs-verification.
- Alternatives eligibility is limited to the 12 Appendix 3 schools inside the 27-school prototype subset; the national register is not loaded.
- Alternatives are independent of the five main choices for completeness; the combined seven-choice review is left to Phase 7.
- Special pathways (TVET/STEM/SEN) remain unimplemented (Phase 6).

---

## Phase Boundary

Phase 5 is complete. Phase 6 (Special Pathways) and Phase 7 (Final Review) are **not** started. The `review/` page remains the Phase 2 stub, and `js/school-data.js` was not modified.
