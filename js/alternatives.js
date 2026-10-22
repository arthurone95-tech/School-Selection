// ========================================
// Alternative choices rules (Phase 5)
// ========================================
// Pure functions. No DOM, no storage. Given the alternatives state, the five
// main choices and the normalised school records, they return a structured
// result.
//
// Each alternative carries the same three pieces of information as a main
// choice - school, programme and Day/Boarding preference - because the official
// form's "Alternative School Choices" section prints the same columns as the
// main form (School Code, School Name, Category, Programme Code, Programme
// Name, Day/Boarding). See the register's Appendix 6 form and Official
// Guideline 21.
//
// Rule status legend (same as js/validation.js):
//   - CONFIRMED  : supported by the supplied official guidelines. Violations are
//                  reported as errors and make the alternatives INVALID.
//   - PENDING    : cannot be conclusively assessed from the available
//                  authoritative information. Reported as NEEDS VERIFICATION.
//   - INFO       : a standing caveat shown to the user. Never changes status.
//
// Overall status order:
//   1. any confirmed error            -> 'invalid'
//   2. any required slot still empty  -> 'incomplete'
//   3. any pending (unassessable) item-> 'needs-verification'
//   4. otherwise                      -> 'valid'
//
// IMPORTANT - two source questions are deliberately left unresolved and are
// never silently settled:
//   * the authoritative, complete Appendix 3 list of eligible schools has not
//     been verified (guidelines-data.js rule 17: "open-list");
//   * an Appendix 3 header conflict about the number of Category B alternatives
//     is unresolved (guidelines-data.js rule 9: "open-list").
// While either is unresolved a non-empty alternatives selection is reported as
// 'needs-verification' rather than 'valid'.
//
// The three-Boarding/two-Day split applies to the five MAIN choices only; the
// two alternatives are not counted against that split (they only have to be a
// Day/Boarding option the school actually offers).

import { ALTERNATIVE_SLOTS, ALTERNATIVE_COUNT, alternativeAt } from './alternatives-state.js';

export const APPENDIX_3_LABEL = 'Appendix 3';

// Official wording quoted from the supplied 2025 guidelines. Reused by the UI so
// the rule text stays in one place and is never presented as the app's own
// writing. Mirrors guidelines-data.js rules 9, 10, 11 and 17.
export const ALTERNATIVE_RULES = {
    twoFromAppendix3: {
        id: 'alt-two-appendix3',
        title: 'Two alternatives from Appendix 3',
        official:
            'Candidates must select two (2) alternative schools. The alternative schools must be ' +
            'selected from Appendix 3 of the supplied 2025 school-selection guidelines.',
        status: 'confirmed'
    },
    oneBOneC: {
        id: 'alt-one-b-one-c',
        title: 'One Category B and one Category C alternative',
        official:
            'Candidates must select one Category B alternative and one Category C alternative from ' +
            'the eligible schools listed in Appendix 3.',
        status: 'confirmed'
    },
    programmeAndResidence: {
        id: 'alt-programme-residence',
        title: 'Programme and Day/Boarding for each alternative',
        official:
            'Select programmes and residential preferences for each choice of school (3 Boarding ' +
            'and 2 day).',
        status: 'confirmed'
    },
    distinctFromMain: {
        id: 'alt-distinct-from-main',
        title: 'Alternatives must not repeat a main choice',
        official:
            'Candidates cannot repeat a school from their five main choices among their two ' +
            'alternative choices.',
        status: 'confirmed'
    },
    notGuaranteed: {
        id: 'alt-not-guaranteed',
        title: 'Alternatives are a fallback only',
        official:
            'Alternative school placement may occur if a candidate is not placed in any of the ' +
            'five main choices.',
        status: 'confirmed'
    },
    bCountConflict: {
        id: 'alt-b-count-conflict',
        title: 'Number of Category B alternatives',
        official:
            'The rule text states one Category B alternative and one Category C alternative.',
        status: 'pending'
    },
    listUnverified: {
        id: 'alt-list-unverified',
        title: 'Appendix 3 list',
        official:
            'The alternative schools must be selected from Appendix 3 of the supplied 2025 ' +
            'school-selection guidelines.',
        status: 'pending'
    }
};

function labelForSlot(slot) {
    const entry = ALTERNATIVE_SLOTS.find((item) => item.slot === slot);
    return entry ? entry.label : `Category ${slot.toUpperCase()} alternative`;
}

/** True when the record is listed under Appendix 3 in the available data. */
export function isAppendix3Eligible(school) {
    return Boolean(school) && Array.isArray(school.appendices) && school.appendices.includes(APPENDIX_3_LABEL);
}

/**
 * Appendix 3 schools of a given category (eligibility filtering).
 * @param {Array} schools normalised school records
 * @param {'B'|'C'} category
 */
export function alternativeEligibleSchools(schools, category) {
    return schools.filter(
        (school) => school.category === category && isAppendix3Eligible(school)
    );
}

/** Counts of Appendix 3 schools per alternative category. */
export function eligibleCounts(schools) {
    const counts = {};
    for (const entry of ALTERNATIVE_SLOTS) {
        counts[entry.slot] = alternativeEligibleSchools(schools, entry.category).length;
    }
    return counts;
}

/**
 * Full validation of the two alternative choices.
 *
 * @param {{b: object|null, c: object|null}} state each slot is
 *        `{schoolId, programme, residential}` or null
 * @param {{choices: Array}} mainState the five main choices
 * @param {Map<number, object>} schoolsById normalised school records
 */
export function validateAlternatives(state = {}, mainState = { choices: [] }, schoolsById = new Map()) {
    const errors = [];
    const pending = [];
    const info = [];
    const missingRequired = [];
    const perSlot = [];

    const mainIds = new Set((mainState.choices || []).map((choice) => choice.schoolId));
    let selected = 0;
    let categoryOk = true;
    let appendixOk = true;
    let programmeMissing = false;
    let programmeError = false;
    let residentialMissing = false;
    let residentialError = false;

    for (const entry of ALTERNATIVE_SLOTS) {
        const slotLabel = labelForSlot(entry.slot);
        const raw = alternativeAt(state, entry.slot);
        const issues = [];

        if (!raw) {
            missingRequired.push({
                slot: entry.slot,
                message: `Choose a ${slotLabel}.`
            });
            issues.push({ status: 'incomplete', message: `No ${slotLabel} selected yet.` });
            perSlot.push({ slot: entry.slot, schoolId: null, programme: null, residential: null, issues });
            continue;
        }

        selected += 1;
        const id = raw.schoolId;
        const programme = raw.programme || null;
        const residential = raw.residential || null;
        const school = schoolsById.get(id) || null;

        if (!school) {
            errors.push({
                checkId: 'alt-known',
                message: `The ${slotLabel} is not in the school data, so it could not be checked.`
            });
            issues.push({ status: 'fail', message: 'School not found in the data.' });
            perSlot.push({ slot: entry.slot, schoolId: id, programme, residential, issues });
            continue;
        }

        // --- Appendix 3 eligibility (confirmed rule; best-available data) ---
        if (!isAppendix3Eligible(school)) {
            appendixOk = false;
            errors.push({
                checkId: 'alt-appendix3',
                message: `${school.name} is not on the Appendix 3 list.`
            });
            issues.push({ status: 'fail', message: 'Not on the Appendix 3 list.' });
        }

        // --- Category matches the slot (confirmed) ---
        if (school.category !== entry.category) {
            categoryOk = false;
            errors.push({
                checkId: `alt-category-${entry.slot}`,
                message:
                    `${school.name} is Category ${school.category || 'unclassified'}, so it cannot fill ` +
                    `the Category ${entry.category} slot.`
            });
            issues.push({ status: 'fail', message: `Not a Category ${entry.category} school.` });
        }

        // --- Not a repeat of a main choice (confirmed) ---
        if (mainIds.has(id)) {
            errors.push({
                checkId: 'alt-distinct-from-main',
                message: `${school.name} is already one of your main choices.`
            });
            issues.push({ status: 'fail', message: 'Already one of your main choices.' });
        }

        // --- Programme (confirmed requirement; data may be unverified) ---
        // Mirrors the main-choice rule: a programme is required when the school
        // has a programme list, and it must be one the school offers.
        if (school.programmes.length === 0) {
            issues.push({
                status: 'pending',
                message: 'No programme list is available for this school.'
            });
        } else if (!programme) {
            missingRequired.push({
                slot: entry.slot,
                field: 'programme',
                message: `${slotLabel}: choose a programme.`
            });
            issues.push({ status: 'incomplete', message: 'No programme selected yet.' });
            programmeMissing = true;
        } else if (!school.programmes.includes(programme)) {
            programmeError = true;
            errors.push({
                checkId: 'alt-programme',
                message: `The ${slotLabel}: the selected programme is not offered by this school.`
            });
            issues.push({ status: 'fail', message: 'Selected programme is not offered.' });
        }

        // --- Day/Boarding (confirmed requirement; availability is factual) ---
        const options = school.residentialOptions;
        if (!residential) {
            missingRequired.push({
                slot: entry.slot,
                field: 'residential',
                message: `${slotLabel}: choose Day or Boarding.`
            });
            issues.push({ status: 'incomplete', message: 'No Day/Boarding option selected yet.' });
            residentialMissing = true;
        } else if (options === null) {
            issues.push({
                status: 'pending',
                message: 'Day/Boarding options are not available for this school.'
            });
        } else if (!options.includes(residential)) {
            residentialError = true;
            errors.push({
                checkId: 'alt-residential',
                message:
                    `The ${slotLabel}: ${residential} is not offered by this school ` +
                    `(${options.join(' / ')} only).`
            });
            issues.push({
                status: 'fail',
                message: `${residential} is not offered here (${options.join(' / ')} only).`
            });
        }

        perSlot.push({ slot: entry.slot, schoolId: id, programme, residential, issues });
    }

    // --- The two alternatives must be different schools (confirmed) ---
    if (state.b && state.c && state.b.schoolId === state.c.schoolId) {
        errors.push({
            checkId: 'alt-distinct',
            message: 'An alternative must be different from all main choices and from the other alternative.'
        });
    }

    // --- Unresolved interpretation (pending, once alternatives are in use) ---
    if (selected > 0) {
        pending.push({
            checkId: 'alt-b-count-conflict',
            message:
                'The number of Category B alternatives is still being confirmed. This prototype applies one Category B and one Category C.'
        });
        pending.push({
            checkId: 'alt-list-unverified',
            message:
                'The Appendix 3 list is still being checked, so eligibility uses the best available data.'
        });
    }

    // --- Standing caveats (info) ---
    info.push({
        id: 'alt-not-guaranteed',
        message: 'Alternatives are a fallback if you are not placed in your five main choices. They do not guarantee placement.'
    });
    info.push({
        id: 'alt-subset',
        message:
            'Only the prototype subset of Appendix 3 schools is offered here; the full list is still being checked.'
    });

    const checks = buildChecks({
        selected,
        categoryOk,
        appendixOk,
        programmeMissing,
        programmeError,
        residentialMissing,
        residentialError,
        errors,
        pending,
        missingRequired
    });

    let overall = 'valid';
    if (errors.length) overall = 'invalid';
    else if (missingRequired.length) overall = 'incomplete';
    else if (pending.length) overall = 'needs-verification';

    return {
        overall,
        counts: {
            total: selected,
            required: ALTERNATIVE_COUNT,
            b: state.b ? 1 : 0,
            c: state.c ? 1 : 0
        },
        errors,
        pending,
        info,
        missingRequired,
        perSlot,
        checks
    };
}

function buildChecks({
    selected,
    categoryOk,
    appendixOk,
    programmeMissing,
    programmeError,
    residentialMissing,
    residentialError,
    errors,
    pending,
    missingRequired
}) {
    const hasError = (id) => errors.some((item) => item.checkId === id);
    const hasPending = (id) => pending.some((item) => item.checkId === id);

    const checks = [];

    checks.push({
        id: 'alt-count',
        label: 'Two alternative choices selected',
        status: selected === ALTERNATIVE_COUNT ? 'pass' : 'open',
        detail: `${selected} of ${ALTERNATIVE_COUNT} chosen.`
    });

    checks.push({
        id: 'alt-category',
        label: 'One Category B and one Category C alternative',
        status:
            hasError('alt-category-b') || hasError('alt-category-c')
                ? 'fail'
                : selected < ALTERNATIVE_COUNT
                    ? 'open'
                    : categoryOk
                        ? 'pass'
                        : 'fail',
        detail: 'Each slot needs its own category.'
    });

    checks.push({
        id: 'alt-appendix3',
        label: 'Both alternatives are Appendix 3 schools',
        status: hasError('alt-appendix3') ? 'fail' : selected === 0 ? 'open' : appendixOk ? 'pass' : 'fail',
        detail: 'Uses the best available Appendix 3 list.'
    });

    checks.push({
        id: 'alt-programme',
        label: 'Each alternative has an offered programme',
        status: programmeError
            ? 'fail'
            : programmeMissing || selected === 0
                ? 'open'
                : 'pass',
        detail: programmeError
            ? 'A selected programme is not offered by its school.'
            : programmeMissing
                ? 'A programme still has to be chosen.'
                : 'A programme is required for each alternative when the school lists programmes.'
    });

    checks.push({
        id: 'alt-residential',
        label: 'Each alternative has an available Day/Boarding option',
        status: residentialError
            ? 'fail'
            : residentialMissing || selected === 0
                ? 'open'
                : 'pass',
        detail: residentialError
            ? 'A selected Day/Boarding option is not offered by its school.'
            : residentialMissing
                ? 'A Day/Boarding option still has to be chosen.'
                : 'Day/Boarding must be a single option the school actually offers.'
    });

    checks.push({
        id: 'alt-distinct',
        label: 'Alternatives differ from the main choices and each other',
        status:
            hasError('alt-distinct') || hasError('alt-distinct-from-main')
                ? 'fail'
                : selected < ALTERNATIVE_COUNT
                    ? 'open'
                    : 'pass',
        detail: hasError('alt-distinct') || hasError('alt-distinct-from-main')
            ? 'A school is repeated across sections.'
            : 'No school is repeated across sections.'
    });

    checks.push({
        id: 'alt-b-count-conflict',
        label: 'Number of Category B alternatives',
        status: hasPending('alt-b-count-conflict') ? 'pending' : 'open',
        detail: hasPending('alt-b-count-conflict')
            ? 'Still being confirmed.'
            : 'Not assessed until an alternative is selected.'
    });

    checks.push({
        id: 'alt-list-unverified',
        label: 'Appendix 3 eligibility list',
        status: hasPending('alt-list-unverified') ? 'pending' : 'open',
        detail: hasPending('alt-list-unverified')
            ? 'Uses the best available list.'
            : 'Not assessed until an alternative is selected.'
    });

    return checks;
}

export default {
    APPENDIX_3_LABEL,
    ALTERNATIVE_RULES,
    isAppendix3Eligible,
    alternativeEligibleSchools,
    eligibleCounts,
    validateAlternatives
};
