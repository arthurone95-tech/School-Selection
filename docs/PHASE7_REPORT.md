# Phase 7 Report: Final Review & Form Preview

**Date:** October 17, 2026  
**Phase:** 7 of 7 (Final Review & Form Preview)  
**Status:** Complete (for prototype purposes)

---

## Objective

Build the form-like review showing all seven choices. Scope (from `docs/phases.txt`):

1. Create `review/index.html`.
2. Create `js/review.js`.
3. Display all 5 main choices ranked with full details.
4. Display 2 alternatives separately.
5. Show validation status (valid / invalid / unverified).
6. Add edit buttons that return to selection.
7. Add official submission disclaimer.
8. Match the structure of the CSSPS form (from screenshots).

Dependencies: Phases 4, 5 and 6. The Phase 4 main-choice flow, the Phase 5 alternatives flow and the Phase 6 pathway flow are unchanged in behaviour (all Phase 4-6 logic tests still pass).

---

## Files Created

- `js/review-model.js` - Pure review model. Given the main state, the alternatives, the pathway id and the normalised school records, `buildReview(...)` runs both validators and returns a structured view-model (ranked main choices, alternatives, merged status, blockers). It also exports `combineStatus(...)` and `STATUS_ORDER`. No DOM, no storage, no side effects.
- `js/review.js` - DOM controller. Loads the persisted state, calls `buildReview`, and renders `review/index.html` (status panel, actions, the two form-style tables, validation details and the disclaimer).
- `css/review.css` - Review-specific styles (shell, blank form fields, tables, disclaimer band). Imported once from `css/main.css`.
- `scripts/phase7_review_tests.mjs` - Headless logic tests (72 checks).
- `docs/PHASE7_REPORT.md` - This report.

**Files Modified**

- `review/index.html` - Replaced the Phase 2 stub with the real review page.
- `selection/index.html` - Added `id="choices"` to the five-main-choices section so the review's "edit" links can deep-link to it.
- `css/main.css` - Added `@import url('review.css');`.
- `index.html` - Updated the prototype-scope bullet: the seven-choice review is now implemented as a preparation preview (not a submission).

**Files Removed**

- The Phase 2 "Planned - Phase 7" placeholder content in `review/index.html`.

---

## Architecture

The phase separates pure logic from rendering, following the same pattern as Phases 4-6:

- **`js/review-model.js`** (pure, testable in Node) owns every decision: it validates the main choices with `validateSelection(state, schoolsById, { pathway })`, validates the alternatives with `validateAlternatives(...)`, maps both to display rows, merges the statuses, and merges the blockers. It never invents data.
- **`js/review.js`** (DOM) only turns that model into elements, wires the edit links and the print button, and announces actions.

Because the model is pure, the whole review logic is covered by headless tests; the browser check only confirms the rendering and the wiring.

---

## Implemented Behaviour

- **Status panel (aside).** Shows the merged status of the seven choices with the same four-tier wording used elsewhere: *Contains validation errors* / *Incomplete* / *Cannot be fully verified* / *Passes all implemented checks*, plus a plain-language description and counts (Main choices x / 5, Alternatives x / 2, Pathway).
- **Actions (aside).** *Edit main choices* (deep-links to `../selection/index.html#choices`), *Edit alternatives* (`#alternatives`), *Change pathway* (`#pathway`), and *Print this preview* (`window.print()`).
- **Candidate information.** Rendered as labelled, deliberately blank rows with a note that the prototype does not collect personal details (see "Privacy" below).
- **Five main choices (table).** One row per preference, Choice 1 first, with: preference number, school name, school code, category badge, programme name, an explicit *"Programme code not available"* sub-label, residence, a per-choice status chip, and an *Edit choice n* link. When fewer than five are chosen, the remaining ranks appear as *"Not chosen yet"* rows with an *Add choice n* link, so all five slots are always visible.
- **Two alternatives (table).** Alternative 1 (Category B) and Alternative 2 (Category C), each with school, code, category, status and an edit link, plus a note explaining the unresolved Appendix 3 questions.
- **Validation details.** The merged blockers grouped as *Confirmed rule problems*, *Still to complete* and *Needs verification*, each item tagged with its source (*Main choices* / *Alternatives*). A collapsed "What was checked" section lists each validator's rule-by-rule checks.
- **Disclaimer band.** The official-submission disclaimer (task 7), reproduced below.

The layout mirrors the official form structure (task 8): candidate information, the five main choices in preference order, the two alternatives, approvals, and a signature section. Candidate and approval details are shown as form-shaped rows but are **not** collected.

**Privacy (per `docs/PRODUCT_SPECIFICATION.md`, section on data minimisation):** the specification instructs that personal details must not be collected merely to make the interface look like an official form. The candidate and approval rows therefore show *"Not collected"* / *"Signed on the official form"* rather than input fields.

**Persistence & edit round-trip.** The review reads the existing keys only (`ssg.selection.main.v1`, `ssg.selection.alternatives.v1`, `ssg.selection.pathway.v1`) and writes none of its own. Editing navigates back to the selection page on the same origin, so untouched choices are preserved exactly (verified in the browser).

---

## Validation (status accuracy)

The merged status reuses the established precedence:

```
invalid > incomplete > needs-verification > valid
```

- The merged status is the worst of the main-choice result and the alternatives result, computed by `combineStatus(...)`.
- `invalid` outranks everything: an error in either section makes the whole review invalid.
- A complete, otherwise-correct selection is `needs-verification`, never `valid`, because a filled alternatives pair always carries the unresolved Appendix 3 items (and a special pathway always carries its `pathway-limits` note). Only a general-pathway selection with no pending items can be `valid`.
- The model exposes `complete` (true when the status is `valid` or `needs-verification`, i.e. nothing missing and no confirmed error) separately from the raw status, so the UI can say "nothing is missing" without implying official approval.

No programme code is ever printed: every school's `programs_code` is `null`, so the model sets `programmeCode: null` and `programmeCodeAvailable: false` and the table says the code is unavailable. This satisfies "only display codes and classifications that are available and verified".

A school id that is not in the records is kept as a row labelled *"Unknown school"* (never dropped), and choices that are ineligible for the current pathway are flagged with the `pathway-eligibility` error (never dropped).

---

## Tests

**Logic tests** - `node scripts/phase7_review_tests.mjs`

```
72 passed, 0 failed
```

Coverage: status precedence (`combineStatus` / `STATUS_ORDER`); main-choice mapping (ranks, name, code, category, programme, residence) and the guarantee that no programme code is invented; empty-rank generation; alternative mapping (B/C slots, filled state); status merging for valid+filled (needs-verification), valid+empty (incomplete) and empty-everything (incomplete); invalid cases (two Category A schools, wrong-category alternative) with correct source tagging; unknown and pathway-ineligible schools being flagged rather than dropped; special-pathway selections staying `needs-verification` while remaining `complete`; unknown pathway ids falling back to `general`; undefined state not throwing; and module parse checks for `review-model.js` and `review.js`.

**No regression**

- `node scripts/phase4_validation_tests.mjs` - **46 passed, 0 failed**
- `node scripts/phase5_alternatives_tests.mjs` - **54 passed, 0 failed**
- `node scripts/phase6_pathway_tests.mjs` - **53 passed, 0 failed**

**Browser verification** at `http://127.0.0.1:8761/review/index.html` (DOM probes; no console errors):

- **Empty state:** five empty main rows and two empty alternative rows, status *Incomplete*, the four action controls present, and the disclaimer rendered. No console errors.
- **Complete general selection** (524/526/649/16/26 + alternatives 225/597): all **seven** choices displayed with school name, code, category, programme, the "Programme code not available" sub-label, residence, per-choice status and edit links. Merged status *Cannot be fully verified* with the two Appendix 3 pending items tagged *Alternatives*. No console errors.
- **Invalid** (two Category A schools): status *Contains validation errors*; the error was tagged *Main choices*.
- **Incomplete** (three main choices, no alternatives): two empty-rank rows, and a *Still to complete* group with one *Main choices* item and two *Alternatives* items. Two tables rendered; the disclaimer lists five statements.
- **STEM pathway** (extras 407/471/527/236/488): the meta line reads "STEM / Science pathway", all five rows are kept, and the main choices produce no errors of their own (status *Incomplete* only because the alternatives are empty).
- **Same schools under the general pathway:** all five rows retained but flagged (five `pathway-eligibility` errors plus the residential-split error), status *invalid* — ineligible choices are never dropped.
- **Edit round-trip:** clicking *Edit main choices* navigated to `../selection/index.html#choices`, where all five choices, the General pathway and the `#choices` anchor were intact.

---

## Disclaimer Text

The disclaimer band states:

- Nothing here has been sent to CSSPS or to any school; no placement is reserved.
- School Selection Guide is an independent prototype, not affiliated with or endorsed by the Ghana Education Service or the CSSPS.
- School codes and categories come from the 2025 register, but programme lists are prototype data and the authoritative Appendix 3 list has not been verified.
- Passing the checks means only that the confirmed prototype rules were not broken; it does not guarantee placement or official acceptance.
- Your formal choices are completed and signed on the official form through your school.

---

## Known Limitations and Unresolved Questions

- The review is a preparation preview only; it is not a submission and does not guarantee placement.
- The unresolved Appendix 3 questions (authoritative list, Category B count conflict) and the special-pathway/general-limit interactions still apply, so the merged status is usually `needs-verification` rather than `valid`.
- Programme codes remain unavailable for every school, so programme eligibility is still shown as prototype data.
- Candidate and approval details are intentionally not collected; the review cannot fill them in.
- Responsive and accessibility auditing, and the broader edge-case matrix, are Phase 8 (Testing & Polish), which is **not** started.

---

## Phase Boundary

Phase 7 is complete for prototype purposes. Phase 8 (Testing & Polish) is **not** started. `js/school-data.js` was not modified, and the Phase 4 subset (27 schools), the Phase 5 alternatives behaviour and the Phase 6 pathway behaviour are unchanged. A Phase 2 stub no longer exists under `review/`; the page is now the implemented review.

---

## Addendum: Review page rebuilt as the placement form

**Date:** October 17, 2026 (post-Phase-7 polish)

The review page was rebuilt so that it *is* the placement form, in the layout of the
supplied "Five Main Choice and Two Alternatives" sheet (A4, `review/placement-form.html`),
rather than a separate summary that resembled a form.

**What changed**

- `review/index.html` — now renders the placement form itself: the candidate header
  fields, the five main choices, the two alternatives, the sign-off block and the
  closing note, inside the normal site chrome.
- `js/review.js` — rewritten to fill that form. It reads the same persisted state
  (main choices, alternatives, pathway) via `buildReview(...)`, and writes school code,
  name, category, programme name and Day/Boarding into the matching cells. The form is
  output only: values are displayed, not typed into directly.
- An empty choice still shows as an empty cell, so unfilled rows print as blank lines —
  exactly as an uncompleted official form.

**Candidate details**

The parts of the form that cannot be derived from the selection (candidate name, BECE
index number, JHS, gender, district, region, location, parent/guardian name and contact,
date, headteacher's contact) are typed in a small collapsible **"Your details"** panel on
the review page, above the form. They update the form as you type and are stored only in
this browser (`ssg.review.candidate.v1`; see `js/candidate-state.js`). Entering them on the
review page keeps the selection page focused on choosing schools and lets the candidate
see the form complete before printing.

**Deliberately not collected**

The programme code column stays blank (no programme codes exist for any school), and the
signature and school-stamp fields stay blank and cannot be typed into: a typed value must
never stand in for a real signature or validation (Official Guidelines 22-24).

**Printing**

`css/placement-form.css` scopes the sheet under `.pf-*` classes so it cannot collide with
the application styles. On screen the chrome, toolbar and details panel are visible; in
print they are hidden, so the printout is the form only (`@page A4`, 10 mm margin). The
layout of the form is unchanged.

**Status and editing**

The toolbar keeps the merged completion status chip and counts, and the *Edit main
choices* / *Edit alternatives* links (spec 12.3), plus a short, screen-only
"What still needs attention" list when something is wrong (spec 12.4). The disclaimer is
now a single line in the toolbar (spec 12.5).

**Verification**

The form was filled and checked in the browser for the empty, invalid and complete
general states, plus live typing into the details panel (no console errors); all 225
Phase 4-7 logic tests still pass. `review/placement-form.html` was kept, unchanged, as a
blank standalone copy of the sheet.

