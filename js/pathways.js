// ========================================
// Special pathways (Phase 6)
// ========================================
// Pure data + predicates. No DOM, no storage, no side effects.
//
// Phase 6 adds a pathway choice at the start of the selection workflow:
//   - general : the standard five main choices (the confirmed Phase 4/5 flow);
//   - tvet    : five main choices that must be TVET institutes;
//   - stem    : five main choices that must be STEM schools / schools offering
//               STEM subjects (Appendix 5);
//   - sen     : five main choices that must be Special Education Needs schools
//               (Appendix 4).
//
// What is CONFIRMED here is only the eligibility of a school for a pathway
// (which school belongs to which pathway) plus the pathway's own school list.
// How each special pathway interacts with the general category and residential
// limits is NOT yet confirmed (see js/guidelines-data.js rules 13/14/18 and
// UNRESOLVED_QUESTIONS 1-3). Those general limits are therefore NOT enforced for
// the special pathways; the uncertainty is surfaced instead of being assumed.
//
// The Phase 4 prototype subset (js/prototype-schools.js) is left untouched. To
// make every pathway completable from real, existing records, a small, explicitly
// documented set of additional pathway schools is added here. They are drawn
// unchanged from the national dataset (no values are invented).

import { getAllSchools } from './school-data.js';
import { getPrototypeSchools, normaliseSchool } from './prototype-schools.js';

export const PATHWAY_IDS = ['general', 'tvet', 'stem', 'sen'];

export const DEFAULT_PATHWAY_ID = 'general';

// ---------------------------------------------------------------
// Additional pathway schools
// ---------------------------------------------------------------
// The Phase 4 subset contains 8 TVET institutes (enough for a TVET pathway) but
// only 3 Appendix 5 schools and no Appendix 4 schools. These additions are
// existing national records, chosen so each special pathway has at least five
// eligible schools and a spread across Categories A/B/C.
export const PATHWAY_EXTRA_SCHOOL_IDS = [
    // ---- STEM pathway (Appendix 5) ----
    { id: 407, pathway: 'stem', reason: 'Category A; Eastern; STEM school; Appendix 5.' },
    { id: 471, pathway: 'stem', reason: 'Category B; Eastern; SHS offering STEM subjects; Appendix 5.' },
    { id: 527, pathway: 'stem', reason: 'Category B; Greater Accra; STEM school; Day-only; Appendix 5.' },
    { id: 236, pathway: 'stem', reason: 'Category C; Bono; SHTS offering STEM subjects; Appendix 2, Appendix 5.' },
    { id: 488, pathway: 'stem', reason: 'Category C; Eastern; SHTS offering STEM subjects; Appendix 3, Appendix 5.' },

    // ---- Special Education Needs pathway (Appendix 4) ----
    { id: 482, pathway: 'sen', reason: 'Category A; Eastern; SHS; Appendix 4 (SEN).' },
    { id: 868, pathway: 'sen', reason: 'Category A; Volta; SHTS; Appendix 2, Appendix 4 (SEN).' },
    { id: 269, pathway: 'sen', reason: 'Category B; Bono; SHS; Appendix 4 (SEN).' },
    { id: 803, pathway: 'sen', reason: 'Category B; Upper West; SHS; Appendix 4 (SEN).' },
    { id: 420, pathway: 'sen', reason: 'Category C; Eastern; TVET; Appendix 1, Appendix 3, Appendix 4 (SEN).' },
    { id: 749, pathway: 'sen', reason: 'Category C; Upper East; SHS; Appendix 3, Appendix 4 (SEN).' }
];

const BASE_IDS = new Set(getPrototypeSchools().map((school) => school.id));

function inBase(school) {
    return Boolean(school) && BASE_IDS.has(school.id);
}

function hasAppendix(school, label) {
    return (
        Boolean(school) &&
        Array.isArray(school.appendices) &&
        school.appendices.includes(label)
    );
}

// ---------------------------------------------------------------
// Pathway definitions
// ---------------------------------------------------------------
// `enforce*` flags say which of the *general* Phase 4 rules are applied to the
// pathway. Everything else (eligibility, the five distinct schools, and the
// factual Day/Boarding availability) still applies to every pathway.
export const PATHWAYS = {
    general: {
        id: 'general',
        label: 'General selection',
        shortLabel: 'General',
        description:
            'The standard five main choices.',
        eligibilityLabel: 'a school in the prototype subset',
        eligibilitySource: 'The prototype subset of schools.',
        eligibility: (school) => inBase(school),
        enforceCategoryLimits: true,
        enforceResidentialSplit: true,
        enforceProgramme: true,
        enforceResidential: true,
        official:
            'Candidates are required to select five (5) schools and rank them according to their ' +
            'order of preference.',
        note: null,
        status: 'confirmed'
    },
    tvet: {
        id: 'tvet',
        label: 'Pure TVET',
        shortLabel: 'TVET',
        description: 'Your five main choices must be TVET institutes.',
        eligibilityLabel: 'a TVET institute',
        eligibilitySource: 'TVET institutes in the 2025 register.',
        eligibility: (school) => Boolean(school) && school.schoolType === 'TVET',
        enforceCategoryLimits: false,
        enforceResidentialSplit: false,
        enforceProgramme: true,
        enforceResidential: true,
        official:
            'Candidates selecting pure TVET programmes are instructed to select all five TVET ' +
            'institutes from Categories A, B, and C as Day or Boarding, following the stated ' +
            'selection criteria.',
        note:
            'The general category and Day/Boarding limits are still being confirmed for TVET, so ' +
            'only the TVET-institute requirement and five different choices are checked.',
        status: 'needs-verification'
    },
    stem: {
        id: 'stem',
        label: 'STEM / Science',
        shortLabel: 'STEM',
        description:
            'Your five main choices must be STEM schools or schools offering STEM subjects ' +
            '(Appendix 5).',
        eligibilityLabel: 'a STEM school or a school offering STEM subjects (Appendix 5)',
        eligibilitySource: 'Appendix 5 (STEM schools and Senior High Schools offering STEM subjects).',
        eligibility: (school) => hasAppendix(school, 'Appendix 5'),
        enforceCategoryLimits: false,
        enforceResidentialSplit: false,
        enforceProgramme: true,
        enforceResidential: true,
        official:
            'Candidates interested in a STEM or Science career are instructed to select ' +
            'STEM/Science subjects in all five choices from Categories A, B, and C as Day or ' +
            'Boarding.',
        note:
            'The general category and Day/Boarding limits are still being confirmed for STEM, so ' +
            'only Appendix 5 eligibility and five different choices are checked.',
        status: 'needs-verification'
    },
    sen: {
        id: 'sen',
        label: 'Special Education Needs',
        shortLabel: 'SEN',
        description:
            'Your five main choices must be Special Education Needs schools (Appendix 4).',
        eligibilityLabel: 'a Special Education Needs school (Appendix 4)',
        eligibilitySource: 'Appendix 4 (Special Education Needs schools).',
        eligibility: (school) => hasAppendix(school, 'Appendix 4'),
        enforceCategoryLimits: false,
        enforceResidentialSplit: false,
        enforceProgramme: false,
        enforceResidential: false,
        official: 'Appendix 4 contains Special Education Needs (SEN) schools.',
        note:
            'The selection rules for Special Education Needs schools are still being confirmed. ' +
            'Only Appendix 4 eligibility and five different choices are checked.',
        status: 'needs-verification'
    }
};

/** Look up a pathway definition, falling back to the general pathway. */
export function getPathway(id) {
    return PATHWAYS[id] || PATHWAYS.general;
}

/** True when a school is eligible for a pathway (by pathway id). */
export function isPathwayEligible(school, pathwayId) {
    return getPathway(pathwayId).eligibility(school);
}

// ---------------------------------------------------------------
// School pool
// ---------------------------------------------------------------

let extraCache = null;

/**
 * The additional pathway schools, as normalised records in the documented order.
 * Records missing from the national dataset are skipped (and reported by
 * checkPathwayData()).
 */
export function getPathwayExtras() {
    if (extraCache) return extraCache;
    const byId = new Map(getAllSchools().map((school) => [school.id, school]));
    extraCache = PATHWAY_EXTRA_SCHOOL_IDS.map((entry) => {
        const source = byId.get(entry.id);
        return source ? normaliseSchool(source) : null;
    }).filter(Boolean);
    return extraCache;
}

let poolCache = null;

/**
 * The full school pool: the Phase 4 prototype subset plus the additional
 * pathway schools. Used for id lookups and for building each pathway's list.
 */
export function getSelectionPool() {
    if (poolCache) return poolCache;
    const base = getPrototypeSchools();
    const baseIds = new Set(base.map((school) => school.id));
    const extras = getPathwayExtras().filter((school) => !baseIds.has(school.id));
    poolCache = [...base, ...extras];
    return poolCache;
}

/** Schools offered for a pathway, in pool order. */
export function visibleSchoolsForPathway(pathwayId) {
    const config = getPathway(pathwayId);
    return getSelectionPool().filter((school) => config.eligibility(school));
}

/** How many schools each pathway offers. */
export function pathwayCoverage() {
    const pool = getSelectionPool();
    const coverage = {};
    for (const id of PATHWAY_IDS) {
        coverage[id] = pool.filter((school) => PATHWAYS[id].eligibility(school)).length;
    }
    return coverage;
}

/**
 * Data-integrity guard for the pathway configuration. Returns an array of
 * human-readable problems (empty when the configuration is sound).
 */
export function checkPathwayData() {
    const problems = [];
    const all = getAllSchools();
    const byId = new Map(all.map((school) => [school.id, school]));
    const baseIds = new Set(getPrototypeSchools().map((school) => school.id));

    const seen = new Set(PATHWAY_EXTRA_SCHOOL_IDS.map((entry) => entry.id));
    if (seen.size !== PATHWAY_EXTRA_SCHOOL_IDS.length) {
        problems.push('pathway extra school ids contain duplicates');
    }

    for (const entry of PATHWAY_EXTRA_SCHOOL_IDS) {
        if (!PATHWAY_IDS.includes(entry.pathway)) {
            problems.push(`pathway extra ${entry.id} names an unknown pathway "${entry.pathway}"`);
        }
        if (baseIds.has(entry.id)) {
            problems.push(`pathway extra ${entry.id} is already in the Phase 4 prototype subset`);
        }
        const source = byId.get(entry.id);
        if (!source) {
            problems.push(`pathway extra ${entry.id} is not in the national dataset`);
            continue;
        }
        const record = normaliseSchool(source);
        if (!getPathway(entry.pathway).eligibility(record)) {
            problems.push(
                `pathway extra ${entry.id} (${source.name}) is not eligible for the ` +
                `"${entry.pathway}" pathway it is listed under`
            );
        }
    }

    const coverage = pathwayCoverage();
    for (const id of PATHWAY_IDS) {
        if (coverage[id] < 5) {
            problems.push(
                `the "${id}" pathway offers only ${coverage[id]} school(s); five are needed to ` +
                'complete a selection'
            );
        }
    }
    return problems;
}

export default {
    PATHWAY_IDS,
    DEFAULT_PATHWAY_ID,
    PATHWAY_EXTRA_SCHOOL_IDS,
    PATHWAYS,
    getPathway,
    isPathwayEligible,
    getPathwayExtras,
    getSelectionPool,
    visibleSchoolsForPathway,
    pathwayCoverage,
    checkPathwayData
};
