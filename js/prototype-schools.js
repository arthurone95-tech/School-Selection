// ========================================
// Phase 4 - Prototype school subset
// ========================================
// The Phase 4 workflow runs on a small, deliberately chosen subset of the
// national dataset (js/school-data.js). This file SELECTS existing records; it
// never invents or edits school data, and the national dataset is left
// untouched.
//
// Why a separate file rather than editing school-data.js:
//   - it preserves the Phase 1 single source of truth;
//   - it makes the prototype subset and the reason for each record explicit and
//     reviewable;
//   - the subset can change without disturbing national data.
//
// Data-verification levels
// (see docs/DATA_EXTRACTION.md and docs/SELECTION_RULES_AND_CLASSIFICATION.md):
//   - category / code / classification : derived from the 2025 register in
//     Phase 1 and cross-checked. Treated as verified for this prototype.
//   - residential option (`status`)     : the register's STATUS column. Treated
//     as the best available source; the "exact options beyond the STATUS column"
//     remain unresolved in the project notes.
//   - programmes                        : pre-existing dataset values. The
//     register's per-school programme marks are NOT present in the scan, so
//     programme names are prototype data and their eligibility is NOT verified.
//     `programs_code` is null for every record.
//   - gender                            : pre-existing dataset value, not
//     re-verified against the register.

import { getAllSchools } from './school-data.js';

// ---------------------------------------------------------------
// The chosen records.
// ---------------------------------------------------------------
// Each entry records *why* the record was included so the subset exercises the
// supported functionality and validation cases rather than being arbitrary.
//
// Coverage targets:
//   - all three categories (A, B, C) with enough A and B to trigger the limits;
//   - SHS, SHTS, TVET and STEM school types;
//   - Day-only, Boarding-only and Day/Boarding schools;
//   - boys, girls and mixed schools;
//   - 14 of the 16 regions, including northern and southern schools;
//   - schools with programmes, plus one school with no programme data;
//   - several Appendix 3 schools (relevant to the Phase 5 alternatives work).
export const PROTOTYPE_SCHOOL_IDS = [
    // ---- Category A (4) - enough to trigger the "max one Category A" rule ----
    { id: 524, reason: 'Category A; Greater Accra; SHS; boys; Day/Boarding.' },
    { id: 403, reason: 'Category A; Eastern; TVET; Boarding-only (demonstrates a Boarding-only school).' },
    { id: 909, reason: 'Category A; Western; SHS; girls; Day/Boarding.' },
    { id: 601, reason: 'Category A; North East; STEM school; Day/Boarding.' },

    // ---- Category B (6) - enough to trigger the "max two Category B" rule ----
    { id: 225, reason: 'Category B; Bono; TVET; Day-only (demonstrates a Day-only school).' },
    { id: 526, reason: 'Category B; Greater Accra; SHS; Day/Boarding.' },
    { id: 917, reason: 'Category B; Western; SHTS; Day-only.' },
    { id: 649, reason: 'Category B; Northern; TVET; Day/Boarding; Appendix 3.' },
    { id: 713, reason: 'Category B; Upper East; SHS; Day/Boarding.' },
    { id: 428, reason: 'Category B; Eastern; TVET; Boarding-only; Appendix 3.' },

    // ---- Category C (17) - a broad mix so five Category C choices are possible ----
    { id: 16, reason: 'Category C; Ahafo; SHS; Day-only.' },
    { id: 26, reason: 'Category C; Ashanti; SHS; Day-only.' },
    { id: 306, reason: 'Category C; Central; SHTS; Day/Boarding; large programme list.' },
    { id: 411, reason: 'Category C; Eastern; SHS; Day/Boarding.' },
    { id: 532, reason: 'Category C; Greater Accra; SHTS; Day/Boarding.' },
    { id: 529, reason: 'Category C; Greater Accra; SHS; girls; Day-only.' },
    { id: 597, reason: 'Category C; North East; SHTS; Day/Boarding; Appendix 3.' },
    { id: 622, reason: 'Category C; Northern; SHTS; Day/Boarding.' },
    { id: 632, reason: 'Category C; Northern; TVET; Day/Boarding; Appendix 3.' },
    { id: 664, reason: 'Category C; Oti; SHS; Day/Boarding; Appendix 3.' },
    { id: 697, reason: 'Category C; Savannah; TVET; Day/Boarding; Appendix 3.' },
    { id: 714, reason: 'Category C; Upper East; SHTS; Day/Boarding.' },
    { id: 806, reason: 'Category C; Volta; SHTS; Day/Boarding.' },
    { id: 904, reason: 'Category C; Western; TVET; Day/Boarding; Appendix 3.' },
    { id: 966, reason: 'Category C; Western North; SHTS; Day/Boarding.' },
    { id: 101, reason: 'Category C; Ashanti; STEM; Day/Boarding; no programme data (demonstrates the missing-programme path).' },
    { id: 452, reason: 'Category C; Eastern; TVET; Boarding-only; Appendix 3.' }
];

// Human-readable statement of what the subset is and is not. Rendered in the
// selection page and repeated in docs/PHASE4_REPORT.md.
export const PROTOTYPE_META = {
    label: 'Phase 4 prototype subset',
    note:
        'A small, deliberately chosen subset of the national dataset, selected to ' +
        'exercise the supported selection and validation behaviour. It is not a ' +
        'complete national database.'
};

// Which fields are verified, and at what level. The selection UI and the
// validation messages read this so the app never presents prototype data as if
// it were officially confirmed.
export const FIELD_VERIFICATION = {
    category: {
        verified: true,
        source: '2025 register (Phase 1 extraction, cross-checked).',
        label: 'Category',
        note: 'From the official register list the school is printed under.'
    },
    residential: {
        verified: true,
        source: '2025 register STATUS column (Phase 1 extraction).',
        label: 'Day / Boarding availability',
        note:
            'Taken from the register STATUS column. The register itself is the best ' +
            'available source for a school\'s Day/Boarding options.'
    },
    code: {
        verified: true,
        source: '2025 register (Phase 1 extraction).',
        label: 'School code',
        note: 'Read from the register where a match was found.'
    },
    programmes: {
        verified: false,
        source: 'Pre-existing project dataset (not re-checked against the register).',
        label: 'Programmes',
        note:
            'The register\'s per-school programme marks are not in the scan, so the ' +
            'programme lists are prototype data. Programme codes are not available ' +
            'for any school, so a selected programme cannot be confirmed as officially ' +
            'offered.'
    }
};

// ---------------------------------------------------------------
// Derived helpers
// ---------------------------------------------------------------

/**
 * Read the category letter (A, B or C) from a record's classification labels.
 * Returns null when the record carries no Category label.
 */
export function categoryOf(school) {
    if (!school || !Array.isArray(school.classification)) return null;
    for (const label of school.classification) {
        const match = /^Category ([ABC])$/.exec(label);
        if (match) return match[1];
    }
    return null;
}

/**
 * Day/Boarding options implied by the register STATUS column.
 * Returns an array, or null when the status is unknown/blank.
 */
export function residentialOptionsOf(school) {
    const status = school && school.status ? String(school.status).trim() : '';
    if (status === 'Day/Boarding') return ['Day', 'Boarding'];
    if (status === 'Day') return ['Day'];
    if (status === 'Boarding') return ['Boarding'];
    return null;
}

/** Appendix labels carried by a record (e.g. Appendix 3). */
export function appendicesOf(school) {
    if (!school || !Array.isArray(school.classification)) return [];
    return school.classification.filter((label) => /^Appendix/.test(label));
}

/**
 * Normalise one source record into the shape the selection workflow uses.
 * Original values are preserved; nothing is invented.
 */
export function normaliseSchool(school) {
    const residentialOptions = residentialOptionsOf(school);
    return {
        id: school.id,
        name: school.name,
        region: school.region,
        location: school.location || '',
        code: school.code || null,
        gender: school.gender || '',
        schoolType: school.school_type || '',
        status: school.status || '',
        classification: Array.isArray(school.classification) ? [...school.classification] : [],
        category: categoryOf(school),
        residentialOptions,
        programmes: Array.isArray(school.programs) ? [...school.programs] : [],
        programmesVerified: FIELD_VERIFICATION.programmes.verified,
        appendices: appendicesOf(school)
    };
}

/**
 * Return the prototype subset as normalised records, in the documented order.
 * Records that cannot be found in the national dataset are reported rather than
 * silently dropped.
 */
export function getPrototypeSchools() {
    const all = getAllSchools();
    const byId = new Map(all.map((school) => [school.id, school]));
    const result = [];
    for (const entry of PROTOTYPE_SCHOOL_IDS) {
        const source = byId.get(entry.id);
        if (!source) continue;
        result.push(normaliseSchool(source));
    }
    return result;
}

/** Map of prototype schools keyed by id, for quick lookups. */
export function getPrototypeSchoolsById() {
    const map = new Map();
    for (const school of getPrototypeSchools()) {
        map.set(school.id, school);
    }
    return map;
}

/**
 * Data-integrity guard for the subset. Returns an array of human-readable
 * problems (empty when the subset is sound).
 */
export function checkPrototypeData() {
    const problems = [];
    const all = getAllSchools();
    const byId = new Map(all.map((school) => [school.id, school]));

    if (!PROTOTYPE_SCHOOL_IDS.length) problems.push('no prototype schools are configured');

    const seen = new Set();
    for (const entry of PROTOTYPE_SCHOOL_IDS) {
        if (seen.has(entry.id)) problems.push(`duplicate prototype id ${entry.id}`);
        seen.add(entry.id);

        const source = byId.get(entry.id);
        if (!source) {
            problems.push(`prototype id ${entry.id} is not in the national dataset`);
            continue;
        }
        if (!categoryOf(source)) {
            problems.push(`prototype id ${entry.id} (${source.name}) has no Category label`);
        }
        if (!residentialOptionsOf(source)) {
            // Not fatal: it becomes a "needs verification" case in the UI.
            // Reported here so it is visible to the developer.
            problems.push(`prototype id ${entry.id} (${source.name}) has an unknown Day/Boarding status`);
        }
    }
    return problems;
}

export default {
    PROTOTYPE_SCHOOL_IDS,
    PROTOTYPE_META,
    FIELD_VERIFICATION,
    categoryOf,
    residentialOptionsOf,
    appendicesOf,
    normaliseSchool,
    getPrototypeSchools,
    getPrototypeSchoolsById,
    checkPrototypeData
};
