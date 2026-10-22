# Phase 2 Report — Core Application Shell & Design System

**Document:** `PHASE2_REPORT.md`
**Product:** BECE/CSSPS School Selection Guidance Application
**Phase:** 2 — Core Application Shell & Design System
**Status:** Complete (Phase 3 not started)

---

## 1. Summary

Phase 2 delivers a clean, responsive, accessible application shell for the
school-selection product: a welcome page, a shared header/navigation/footer, a
rewritten product stylesheet, and placeholder pages for the planned workflow
sections. The shell uses the existing Phase 1 dataset for live home-page
figures and carries no JOURNA branding or unrelated legacy functionality.

The prototype deliberately stops at the shell. Guidelines, selection, and
review functionality are not implemented in this phase.

---

## 2. Files created or modified

### Created

| File | Purpose |
| --- | --- |
| `index.html` | Welcome page (hero, disclaimer, features, steps, dataset snapshot, scope). |
| `js/layout.js` | Shared header, navigation, mobile menu, and footer injection + interactions. |
| `js/home.js` | Reads live dataset counts for the welcome-page snapshot. |
| `guidelines/index.html` | Navigation stub for the planned Phase 3 section. |
| `selection/index.html` | Navigation stub for the planned Phases 4–6 workflow. |
| `review/index.html` | Navigation stub for the planned Phase 7 review. |
| `docs/PHASE2_REPORT.md` | This report. |

### Modified

| File | Change |
| --- | --- |
| `css/pages.css` | Rewritten for the school-selection product (removed JOURNA career/testimonial/auth/dashboard styles). |
| `css/components.css` | Replaced JOURNA career badge variants with school category/status badges; added `.btn-danger` and disabled-button states. |

### Reused unchanged (inspected first, as required)

- `css/main.css` — already imports all stylesheets in a valid cascade order.
- `css/variables.css`, `css/reset.css`, `css/layout.css`, `css/utilities.css` — design tokens, reset, containers, and utilities retained.
- `js/school-data.js` — the Phase 1 dataset; **not modified in this phase**.
- `js/guidelines-data.js` — Phase 3 material; present but **intentionally not wired up**.

### Left in place (not deleted)

- `js/shs-recommendation.js` — unrelated JOURNA-era module that imports
  non-existent modules (`./config.js`, `./assessment.js`). It is dead code and is
  not referenced by any page. Per `AGENT_BUILD_RULES.md` §15 it was **not deleted
  without approval**; removal is recommended (see §6).

---

## 3. Features implemented

1. **Welcome page** — explains the purpose of the tool, shows the four-step
   workflow, provides primary entry points, and clearly states the prototype
   limits and disclaimers.
2. **Shared shell** — one source of truth for header, primary navigation, mobile
   navigation, and footer, injected on every page so links resolve correctly
   from any directory (`body[data-base]` controls the relative prefix).
3. **Responsive navigation** — desktop link bar; on narrow screens a slide-out
   menu with overlay, close button, Escape-to-close, focus return, and `aria`
   state management.
4. **Product design system** — a coherent identity ("School Selection Guide")
   built on the retained colour, spacing, typography, radius, shadow, and
   transition tokens; no JOURNA identity remains.
5. **Live dataset snapshot** — real counts read from the dataset
   (school records, regions, Categories A/B/C).
6. **Honest states** — nothing is presented as working when it is not: unbuilt
   sections are labelled "Planned", the save/resume feature is declared
   disabled, and the disclaimer states the tool does not submit to CSSPS.

---

## 4. Tests and checks performed

All checks were run against the site served locally over HTTP
(`python -m http.server 8753 --bind 127.0.0.1`).

### 4.1 JavaScript syntax

- `node --check` on copies of `js/layout.js` and `js/home.js` → **passed**.

### 4.2 Dataset API

- Imported `js/school-data.js` in Node → **957 schools, 16 regions, 89 Category A,
  245 Category B, 590 Category C, 73 programmes** (matches the home-page snapshot).

### 4.3 Functional DOM checks (browser)

| Check | Result |
| --- | --- |
| Page title / `h1` | `School Selection Guide — prepare your BECE school choices` / `Prepare your school choices with confidence` |
| Header, footer, skip link, banner injected | all present |
| Primary navigation links | Home, Guidelines, Select schools, Review → correct `href`s |
| Active link highlighting (home, guidelines, selection, review) | correct on each page |
| Home stats rendered from dataset | 957 / 16 / 89 / 245 / 590 |
| Footer year | 2026 |
| Mobile menu: open, close button, Escape | all three transitions verified in the DOM |
| Console warnings/errors on all pages | none |
| Horizontal overflow | none at any tested width |

### 4.4 Responsive checks

Because no device-emulation tool is available, the pages were loaded in a
same-origin iframe at fixed widths (media queries apply to the iframe viewport)
and the resulting layout was measured:

| Width | Nav links | Menu toggle | Features | Steps | Snapshot | Hero | Overflow |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 375 | hidden | shown | 1 col | 1 col | 1 col | 1 col | none |
| 480 | hidden | shown | 1 col | 1 col | 1 col | 1 col | none |
| 640 | hidden | shown | 1 col | 1 col | 2 col | 1 col | none |
| 768 | hidden | shown | 1 col | 1 col | 2 col | 1 col | none |
| 1024 | shown | hidden | 2 col | 2 col | 3 col | 1 col | none |
| 1280 | shown | hidden | 4 col | 4 col | 5 col | 2 col | none |

### 4.5 Lighthouse (browser audit)

| Page | Accessibility | Best Practices | SEO | Failures |
| --- | --- | --- | --- | --- |
| `index.html` | 1.00 | 1.00 | 1.00 | none |
| `guidelines/index.html` | 1.00 | 1.00 | 1.00 | none |

The first audit scored Accessibility 0.89; four issues were found and fixed
(`snapshot-label` contrast, footer `h4` heading order, footer `<ul>` list
structure, and the logo link accessible-name/text mismatch). The audits above
are the results after the fixes.

### 4.6 Branding check

- `grep` for `JOURNA` across `*.html` and `*.css` → **no matches**.

---

## 5. Remaining issues or limitations

1. **Sections are stubs.** Guidelines, selection, and review pages contain only
   a labelled placeholder. They exist so navigation resolves correctly; they
   implement no later-phase functionality.
2. **Server required.** The app uses ES modules, so it must be served over HTTP
   (opening `index.html` directly via `file://` will not load the data module).
3. **Legacy dead code.** `js/shs-recommendation.js` remains and is unreachable.
4. **Fonts via CDN.** Inter/Poppins load from Google Fonts; the system font stack
   is used as a fallback if offline.
5. **Products of later phases.** Programme data, Day/Boarding availability,
   Appendix 3 eligibility, and pathway rules are not present or enforced yet.
6. **Screenshots.** Visual screenshots could not be captured because the browser
   desktop window was not visible during the session; verification was done via
   DOM inspection, layout measurement, and Lighthouse instead.

---

## 6. Recommendations

1. Approve removal of `js/shs-recommendation.js` (dead JOURNA code).
2. Proceed to Phase 3 (Guidelines) and wire the existing `js/guidelines-data.js`
   into a `guidelines` implementation.
3. Decide the curated, manually verified school subset to drive the prototype
   workflow (Phase 4).

---

## 7. Unresolved official-rule / data questions (inherited, unchanged)

These remain open and are not enforced as official rules:

1. Interaction of general category/residential limits with the pure TVET pathway.
2. The same for the STEM/Science pathway.
3. Rules for Special Education Needs selections (Appendix 4).
4. The authoritative Appendix 3 alternative-school list.
5. Programme availability and programme codes per school.
6. Officially permitted Day/Boarding options per school and pathway.
7. Treatment of schools appearing in more than one official list.

---

## 8. Confirmation

**Phase 3 has not been started.** Guidelines content rendering, selection logic,
validation, pathways, and review remain unimplemented. The work in this phase is
limited to the shell and design system described in `docs/phases.txt` Phase 2.
