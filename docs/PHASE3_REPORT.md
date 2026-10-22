# Phase 3 Report — Guidelines Section

**Product:** School Selection Guide (BECE school-selection guidance prototype)
**Phase:** 3 — Guidelines
**Status:** Complete (prototype for review)
**Date:** 2026-10-16

---

## 1. Objective

Build the **Guidelines** section: present the supplied 2025 BECE school-selection
guidelines clearly, keep **official wording** separate from **plain-language
explanations**, and make the content readable and navigable on phone and desktop.

Explicit boundaries honoured:

- No school-selection engine, alternatives logic, or review workflow (later phases).
- No attempt to perfect every school record or extract the full national register.
- Existing navigation stubs (`selection/`, `review/`) kept for later phases.

---

## 2. Files created / modified

| File | Change | Purpose |
| --- | --- | --- |
| `guidelines/index.html` | Replaced Phase 2 stub | Real Guidelines page: header, two-column shell, section nav, content, verification list, closing CTA |
| `js/guidelines.js` | **New** | Renders guidelines, section nav, summary, verification list; reading progress; section highlight |
| `js/guidelines-data.js` | Extended | Source metadata, section grouping, per-guideline `uncertainty`, linked unresolved questions |
| `css/guidelines.css` | **New** | Section-scoped styles (reuses design tokens) |
| `css/main.css` | +1 line | Imports `guidelines.css` |

Not touched: `selection/`, `review/` stubs, `js/layout.js`, `js/home.js`,
`js/school-data.js`, and all Phase 1/2 data outputs.

---

## 3. Guideline count and how it was verified

**24 guidelines** (ids 1–24), grouped into **7 sections**:

| Section | Guidelines |
| --- | --- |
| 1. Understanding school selection | 2 (1–2) |
| 2. School categories | 3 (3–5) |
| 3. Day and Boarding | 3 (6–8) |
| 4. Alternative choices | 4 (9–12) |
| 5. Special pathways | 2 (13–14) |
| 6. Official appendices | 5 (15–19) |
| 7. The selection form | 5 (20–24) |
| **Total** | **24** |

Verified three ways:

1. **Source extraction** — parsed `docs/OFFICIAL_GUIDELINES.md` and split on the
   `### Official Guideline N:` headings → exactly 24 headings.
2. **Byte-exact comparison** — each rendered `official` string was compared to the
   source document's text: **24 / 24 byte-exact** (after fixing 4 guidelines whose
   bullet/numbered lists had been flattened into prose).
3. **Runtime guard** — `js/guidelines.js` validates the data before rendering
   (exactly 24 items, ids 1–24 present and unique, every section known, every item
   has official + explanation) and renders an error card instead of bad content.

---

## 4. Content model

Each guideline renders three clearly separate blocks:

- **Official wording** — quoted from the supplied document, tinted panel with a
  primary left border, `blockquote` with `cite`. Paragraphs and bullet/numbered
  lists are preserved exactly as in the source (not reshaped into prose).
- **In plain language** — the agent-written explanation, visually distinct (indented,
  secondary colour), never presented as official.
- **What this tool does** — the application's own intended behaviour (design note),
  grey dashed panel.

Where a rule is unclear or its supporting data is unverified, an extra
**needs verification** callout is added, linking to the relevant numbered item in
*Items requiring verification*.

---

## 5. Features

- **Two-column layout**: sticky sidebar (reading progress + section nav) with the
  reading column capped at 860px; stacks to one column ≤ 1024px.
- **Key requirements at a glance**: five confirmed general rules; the *alternative
  schools* tile is flagged because the Appendix 3 list/count is unverified.
- **Reading progress**: "N of 24 guidelines viewed" with an ARIA progress bar,
  persisted locally (`localStorage`, key `ssg.guidelines.viewed.v1`), with a reset
  button. Monotonic "furthest reached" indicator; private/personal only.
- **Section navigation** with live section highlighting (`aria-current`).
- **Items requiring verification**: 8 open questions, each linked to the guidelines
  it affects.
- **Accessibility**: 1 `h1`, `h2` per section, `h3` per guideline; no duplicate ids;
  iconography paired with text (no colour-only meaning); skip link and shared
  header/footer from the Phase 2 shell.

---

## 6. Tests and results

| Check | Method | Result |
| --- | --- | --- |
| JS syntax | `node --check` on `guidelines.js`, `guidelines-data.js`, `layout.js` | Pass (exit 0) |
| Data integrity | Node ESM import assertions | 24 guidelines, ids sequential, 7 sections, all links valid |
| Official fidelity | Node: data vs `OFFICIAL_GUIDELINES.md` | **24 / 24 byte-exact** |
| Rendering | Browser DOM assertions | 24 cards, 24 official/explanation/application blocks, 7 sections, 7 nav links, 8 verification items, 5 summary tiles; all internal links resolve |
| Console | Browser console on load | No messages / no errors |
| Navigation | Click section link, click verification link | Hash set correctly; target lands below the 70px header (top = 94px); `#verify-*` links resolve |
| Reading progress | Reload → scroll through page | 0 → 2 → 7 → 12 → 18 → 24; reset returns to 0 and clears storage |
| Responsive | Same-origin probe iframe at 375/480/640/768/1024/1280/1440 | No horizontal overflow at any width; single column ≤1024, sidebar+main above; cards capped at 860px |
| Lighthouse (`guidelines/index.html`) | Browser Lighthouse | **Accessibility 1.00, Best Practices 1.00, SEO 1.00**, 0 failures |
| Lighthouse (regression, `index.html`) | Browser Lighthouse | 1.00 / 1.00 / 1.00, 0 failures |
| Stub pages | `selection/`, `review/` | Render, shared chrome present, no console errors |

One contrast failure was found and fixed (muted grey on light-grey panels ≈ 4.45:1);
the affected labels/footnotes and two page-header elements were darkened to pass AA.

---

## 7. Conflicts, missing or unclear requirements (flagged, not silently resolved)

These are surfaced in the app under **Items requiring verification** (8 items):

1. **Appendix 3 header conflict** — the register PDF header says *"At Most one (1)
   Category B school"* while `OFFICIAL_GUIDELINES.md` says *"one Category B and one
   Category C"*. The rule and the eligible list are both left unenforced/flagged.
2. **Category-rule vs residential interaction** — how the overall *3 Boarding / 2 Day*
   requirement combines with the category-specific residential instructions
   (guidelines 6–8) is unconfirmed.
3. **Pure TVET pathway** — how the general category/residential limits apply (13).
4. **STEM/Science pathway** — same question (14).
5. **SEN rules** — specific selection rules unconfirmed (18).
6. **Programme names/codes per school** — not verified, so programme eligibility is
   not enforced (2, 20).
7. **Day/Boarding options per school** — not fully verified (6–8, 13, 14).
8. **Schools appearing in more than one official list** — how to treat them.

No guideline was found that is unsupportable by the supplied source; every rendered
guideline is either quoted verbatim or clearly labelled as explanation/application
behaviour.

---

## 8. Decisions and notes

- **Data source**: the pre-existing `js/guidelines-data.js` was retained (its text
  matched the source document) and extended rather than rewritten; official strings
  were corrected to preserve list structure.
- **CSS**: a section-scoped `css/guidelines.css` was added and imported from
  `main.css` (consistent with the Phase 2 single-stylesheet design system).
- **Progress mechanism**: a scroll-position approach (mark the furthest guideline
  that has reached the reading area) was chosen over `IntersectionObserver` because
  it is monotonic, reaches 24/24 at the end, and does not depend on animation frames.
- **`docs/RULES_AND_GUIDELINES.md`** could not be read (reported as a binary file);
  it was not used. The content source is `docs/OFFICIAL_GUIDELINES.md`.

---

## 9. Phase boundary

**Phase 4 has not been started.** No selection engine, alternatives logic, or review
workflow was implemented. `selection/index.html` and `review/index.html` remain the
Phase 2 stubs.
