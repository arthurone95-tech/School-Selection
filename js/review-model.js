// ========================================
// Final review model (Phase 7)
// ========================================
// Pure functions. No DOM, no storage, no side effects. Given the persisted
// selection (main choices + alternatives + pathway) and the normalised school
// records, they produce the structured "form-like" view used by
// review/index.html and js/review.js.
//
// The model never invents data:
//   - a school not found in the records is shown as "Unknown school";
//   - a programme code is only shown when the programme is one of the official
//     register programme groups (see js/programme-codes.js); otherwise
//     programmeCodeAvailable is false and the form's code cell stays blank
//     rather than printing a guessed code;
//   - the completion status merges the main-choice and alternatives validators,
//     so unresolved items (Appendix 3 and pathway questions) are surfaced, never
//     silently cleared.

import { MAX_MAIN_CHOICES } from './selection-state.js';
import { ALTERNATIVE_SLOTS } from './alternatives-state.js';
import { getPathway } from './pathways.js';
import { validateSelection } from './validation.js';
import { validateAlternatives } from './alternatives.js';
import { programmeCodeOf, PROGRAMME_CODE_SOURCE } from './programme-codes.js';

// Same status vocabulary and precedence as Phases 4-6.
export const STATUS_ORDER = {
    invalid: 3,
    incomplete: 2,
    'needs-verification': 1,
    valid: 0
};

/** Worst (highest-precedence) of the supplied statuses. */
export function combineStatus(...statuses) {
    let worst = 'valid';
    for (const status of statuses) {
        if ((STATUS_ORDER[status] || 0) > STATUS_ORDER[worst]) worst = status;
    }
    return worst;
}

function normaliseState(state) {
    if (state && Array.isArray(state.choices)) return state;
    return { choices: [] };
}

function normaliseAlternatives(alternatives) {
    if (alternatives && typeof alternatives === 'object') return alternatives;
    return { b: null, c: null };
}

/**
 * Build the complete review view-model.
 *
 * @param {object} input
 * @param {{choices: Array}} input.mainState
 * @param {{b: (object|null), c: (object|null)}} input.alternatives each slot is
 *        `{schoolId, programme, residential}` or null
 * @param {string} [input.pathwayId]
 * @param {Map<number, object>} input.schoolsById
 */
export function buildReview({ mainState, alternatives, pathwayId, schoolsById }) {
    const state = normaliseState(mainState);
    const alts = normaliseAlternatives(alternatives);
    const pathway = getPathway(pathwayId);

    const main = validateSelection(state, schoolsById, { pathway: pathway.id });
    const alt = validateAlternatives(alts, state, schoolsById);

    const mainChoices = state.choices.map((choice, index) => {
        const school = schoolsById.get(choice.schoolId) || null;
        const perChoice = main.perChoice[index] || { issues: [] };
        const issues = perChoice.issues || [];
        const programme = choice.programme || null;
        const programmeCode = programmeCodeOf(programme);
        return {
            rank: index + 1,
            schoolId: choice.schoolId,
            school,
            name: school ? school.name : 'Unknown school',
            code: school ? school.code : null,
            category: school ? school.category : null,
            region: school ? school.region : null,
            type: school ? school.schoolType : null,
            programme,
            programmeCode,
            programmeCodeAvailable: programmeCode !== null,
            residential: choice.residential || null,
            issues,
            complete: issues.length === 0
        };
    });

    const emptyMainRanks = [];
    for (let rank = state.choices.length + 1; rank <= MAX_MAIN_CHOICES; rank += 1) {
        emptyMainRanks.push(rank);
    }

    const alternativesView = ALTERNATIVE_SLOTS.map((entry) => {
        const slotData = alts[entry.slot];
        const schoolId = slotData && Number.isInteger(slotData.schoolId) ? slotData.schoolId : null;
        const school = schoolId !== null ? schoolsById.get(schoolId) || null : null;
        const perSlot = (alt.perSlot || []).find((item) => item.slot === entry.slot) || { issues: [] };
        const issues = perSlot.issues || [];
        const programme = slotData ? slotData.programme || null : null;
        const programmeCode = programmeCodeOf(programme);
        return {
            slot: entry.slot,
            category: entry.category,
            label: entry.label,
            schoolId,
            school,
            name: school ? school.name : null,
            code: school ? school.code : null,
            region: school ? school.region : null,
            type: school ? school.schoolType : null,
            programme,
            programmeCode,
            programmeCodeAvailable: programmeCode !== null,
            residential: slotData ? slotData.residential || null : null,
            issues,
            filled: school !== null,
            complete: school !== null && issues.length === 0
        };
    });

    const errors = [
        ...main.errors.map((error) => ({ ...error, source: 'main' })),
        ...alt.errors.map((error) => ({ ...error, source: 'alternatives' }))
    ];
    const missing = [
        ...main.missingRequired.map((item) => ({ source: 'main', message: item.message })),
        ...alt.missingRequired.map((item) => ({ source: 'alternatives', message: item.message }))
    ];
    const pending = [
        ...main.pending.map((item) => ({ ...item, source: 'main' })),
        ...alt.pending.map((item) => ({ ...item, source: 'alternatives' }))
    ];

    const status = combineStatus(main.overall, alt.overall);
    const filledMain = state.choices.length;
    const filledAlternatives = alternativesView.filter((entry) => entry.filled).length;

    return {
        pathway: {
            id: pathway.id,
            label: pathway.label,
            shortLabel: pathway.shortLabel,
            status: pathway.status
        },
        mainChoices,
        emptyMainRanks,
        alternatives: alternativesView,
        main,
        alt,
        status,
        // "complete" means nothing is missing and no confirmed rule is broken,
        // but verification caveats may still apply.
        complete: status === 'valid' || status === 'needs-verification',
        hasErrors: errors.length > 0,
        hasMissing: missing.length > 0,
        errors,
        missing,
        pending,
        programmeCodeSource: PROGRAMME_CODE_SOURCE,
        counts: main.counts,
        filledMain,
        filledAlternatives,
        totalFilled: filledMain + filledAlternatives,
        totalChoices: MAX_MAIN_CHOICES + ALTERNATIVE_SLOTS.length
    };
}

export default {
    STATUS_ORDER,
    combineStatus,
    buildReview
};
