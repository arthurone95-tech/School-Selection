# 2025 Second Cycle School Selection — Rules & Classification Reference

Source of truth: `docs/2025-SECOND-CYCLE-SCHOOLS-REGISTER-NEW-FINAL-160525_for-approval-2 (1).pdf`
(the official *2025 Second Cycle Public Schools Register*, 61 printed pages), plus the
governing project docs in `docs/`.

> This file records **only** what the official register and guidelines state. Anything not
> supported by that source is marked **[UNRESOLVED]** and must not be coded as a rule.

---

## 1. Document map (verified from the PDF, 300 DPI OCR)

| Printed pages | PDF pages | Content |
|---|---|---|
| — | 1–2 | Cover |
| — | 3 | Table of content |
| 1 (of 1) | 4 | Grouping of schools + appendix index |
| 2 (of 2) | 5 | Selection guidelines (the actual rules) |
| 3–6 | 6–9 | **List of Category A schools** (93 schools) |
| 7–13 | 10–16 | **List of Category B schools** (260 schools) |
| 14–28 | 17–31 | **List of Category C schools** |
| 29–35 | 32–38 | **Appendix 1** — Public Technical Institutes and their courses |
| 36–42 | 39–45 | **Appendix 2** — Elective technical subjects of SHTS |
| 43–57 | 46–60 | **Appendix 3** — Schools approved for alternative selection |
| 58 | 61 | **Appendix 4** — Special Education Need (SEN) schools (9 schools) |
| 59 | 62 | **Appendix 5** — STEM schools & SHSs offering STEM subjects |
| 60–61 | 63–64 | **Appendix 6** — the Alternative-School-Choices *form* (not a school list) |

Counts above that are firm (A = 93 rows, B = 260 rows, SEN = 9 rows) were confirmed from
the register's own S/N numbering and footers. Category C and Appendix 3 counts are
established by the extractor (see `data/reference_extracted.json` and the report files in `data/`), not guessed.

---

## 2. Grouping of schools (page 4, verbatim intent)

All Second Cycle Institutions are grouped as:

- **Categories A, B and C** — the three public second-cycle groups.
- **Appendix 1** — detailed Technical Institution (TI) programmes.
- **Appendix 2** — detailed subjects of the technical programmes offered in
  Senior High Technical Schools (SHTS).
- **Appendix 3** — Alternative School choice. Each candidate selects **two** schools
  (1 Category B and 1 Category C) from this list. These are Category B/C schools a
  candidate may comfortably accept as alternatives.
- **Appendix 4** — Special Education Need (SEN) schools.
- **Appendix 5** — STEM Schools & SHSs offering STEM subjects.

> Appendix 6 is **not** a school list. It is the blank *Alternative School Choices* form
> (fields: SN, School Code, School Name, Category, Programme Code, Programme Name,
> Day/Boarding, plus parent/guardian and headteacher validation sections).

---

## 3. Selection rules (page 5, verbatim intent)

1. Select **seven (7) schools in total**: **five (5) main** + **two (2) alternative**.
   - The five main schools are **ranked in order of preference** (1st = most preferred).
   - The two alternatives are chosen **from Appendix 3**, for use if the candidate is not
     placed in any of the five main choices.
2. Select **programmes and residential preferences** for each choice:
   **3 Boarding and 2 Day**.
3. A candidate **may select one (1) Category B school as Boarding and another Category B
   school as Day**.
4. A candidate **may select one (1) Category C school as Boarding and another Category C
   school as Day**.
5. A candidate placed in any of their choices **will NOT be changed**.

Additional notes (also page 5):

6. A candidate **cannot choose more than one (1) school from Category A**.
7. A candidate **cannot select more than two (2) schools from Category B**.
8. A candidate **may select all five (5) schools from Category C** (3 Boarding and 2 Day).
9. Candidates who wish to offer **purely TVET programmes** must select all five (5) TVET
   Institutes **from Categories A, B and C** (using the same selection criteria above),
   as Day or Boarding.
10. Candidates pursuing **STEM/Science** careers must select STEM/Science subjects in
    **all five** choices **from Categories A, B and C**, as Day or Boarding.

Appendix 3 instruction (page 46):
> "Candidates must select 2 schools from Appendix 3 (At Most one (1) Category B School)."
> "Candidates must not repeat a school from the initial five (5) choices on this cluster form."

This is consistent with the page-4 grouping text (1 Category B + 1 Category C), because
Appendix 3 contains only Category B and Category C schools.

---

## 4. Derived, code-verifiable facts

- **Category is encoded in the school code's leading digits** as published:
  - Category A codes begin `001…`, `003…`, `004…`, `005…`, `006…`, `009…`, `010…`,
    and TVET institutes in Category A begin `90…`.
  - Category B likewise uses `90…` and `00…` ranges.
  - Category C likewise.
  (Category is *not* a single numeric prefix; it is the list the school is printed under.)

- **SHS/SHTS programme columns** carry these official 3-digit **subject-group codes**
  (register header, pages 6–31):

  | Code | Programme group |
  |---|---|
  | 101 | Agriculture |
  | 201 | Business |
  | 301 | Technical |
  | 401 | Home Economics |
  | 402 | Visual Arts |
  | 501 | General Arts |
  | 502 | General Science |
  | 503 | STEM |
  | 504 | Language |

- **Appendix 1 (TI) trade columns** carry trade codes in the ranges `601–626`, `701–709`,
  `802–810`, `901–903` (header printed vertically; individual trade names require manual
  reading of page 32).

---

## 5. Known gaps / unresolved

- **[RESOLVED — no source]** Programme **codes** per school: the register prints the
  programme-group codes (101/201/301/401/402/501/502/503/504) **only as column headers**;
  the per-school membership marks are **not present in the scan** and no other project file
  carries them. There is therefore **no authoritative per-school programme-code source**, and
  `programs_code` is `null` for every record in `js/school-data.js` (see
  `docs/DATA_EXTRACTION.md` §6).
- **[UNRESOLVED]** Exact Day/Boarding options per school beyond the register's STATUS column.
- **[UNRESOLVED]** SEN-specific selection rules (Appendix 4 lists schools only).
- **[UNRESOLVED]** How the general A/B limits + 3-Boarding/2-Day requirement interact with
  the pure-TVET and STEM pathways.
- **Data-source limitation:** the register PDF is an image-only scan. Reference lists are
  produced by OCR (`data/ocr_boxes/`) and matched to the existing dataset with high-confidence
  fuzzy matching. Anything below the confidence threshold is left unclassified and written
  to the review list — never guessed.
