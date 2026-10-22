// ========================================
// Validation rules (Phase 4)
// ========================================
// Pure functions. No DOM, no storage, no side effects: given a selection state
// and the normalised school records, they return a structured result.
//
// Rule status legend, following the task requirements:
//   - CONFIRMED  : supported by the supplied official guidelines. Violations are
//                  reported as errors and make the selection INVALID.
//   - PENDING    : cannot be conclusively assessed from the available
//                  authoritative information. Reported as NEEDS VERIFICATION.
//   - INFO       : a standing caveat shown to the user. It never changes the
//                  status of a selection.
//
// The overall status is derived in this order:
//   1. any confirmed error            -> 'invalid'
//   2. any required field still empty -> 'incomplete'
//   3. any pending (unassessable) item-> 'needs-verification'
//   4. otherwise                      -> 'valid'
// "valid" always means "passes the confirmed prototype rules", never an
// official placement.

import { MAX_MAIN_CHOICES } from './selection-state.js';
import { categoryOf, residentialOptionsOf, FIELD_VERIFICATION } from './prototype-schools.js';
import { getPathway } from './pathways.js';

export const REQUIRED_BOARDING = 3;
export const REQUIRED_DAY = 2;

const CATEGORY_LIMITS = { A: 1, B: 2 };

// Official wording quoted from the supplied 2025 guidelines
// (docs/OFFICIAL_GUIDELINES.md). Reused by the UI so the rule text stays in one
// place and is never presented as the app's own writing.
export const RULE_REFERENCES = {
    fiveChoices: {
        id: 'five-choices',
        title: 'Five main schools, ranked',
        official:
            'Candidates are required to select five (5) schools and rank them according to their order of preference.',
        status: 'confirmed'
    },
    programme: {
        id: 'programme',
        title: 'A programme for each school',
        official: 'Candidates must select a programme for each main school choice.',
        status: 'confirmed'
    },
    categoryA: {
        id: 'category-a',
        title: 'At most one Category A school',
        official: 'A candidate cannot select more than one school from Category A.',
        status: 'confirmed'
    },
    categoryB: {
        id: 'category-b',
        title: 'At most two Category B schools',
        official: 'A candidate cannot select more than two schools from Category B.',
        status: 'confirmed'
    },
    residentialSplit: {
        id: 'residential-split',
        title: 'Three Boarding and two Day',
        official:
            'Candidates must select three (3) Boarding schools and two (2) Day schools among their five main choices.',
        status: 'confirmed'
    },
    residentialAvailability: {
        id: 'residential-availability',
        title: 'Only residential options the school offers',
        official:
            'A school that offers only Day must not become selectable as Boarding simply because the candidate needs a Boarding choice.',
        status: 'confirmed'
    },
    categoryResidential: {
        id: 'category-residential-arrangement',
        title: 'Category B/C Day/Boarding',
        official:
            'Candidates may select one Category B school as Boarding and another Category B school as Day. Candidates may select one Category C school as Boarding and another Category C school as Day.',
        status: 'pending'
    }
};

function optionsFor(school) {
    if (school && Array.isArray(school.residentialOptions)) return school.residentialOptions;
    return residentialOptionsOf(school);
}

function categoryFor(school) {
    if (school && (school.category === 'A' || school.category === 'B' || school.category === 'C')) {
        return school.category;
    }
    return categoryOf(school);
}

function labelFor(index) {
    return `Choice ${index + 1}`;
}

function schoolName(school) {
    return school ? school.name : 'Unknown school';
}

/**
 * Count selections by category and residential option.
 */
export function summarise(state) {
    const counts = {
        total: state.choices.length,
        boarding: 0,
        day: 0,
        byCategory: { A: 0, B: 0, C: 0, unknown: 0 }
    };
    for (const choice of state.choices) {
        if (choice.residential === 'Boarding') counts.boarding += 1;
        if (choice.residential === 'Day') counts.day += 1;
    }
    return counts;
}

/**
 * Full validation of a selection.
 *
 * @param {{choices: Array}} state
 * @param {Map<number, object>} schoolsById normalised school records
 * @param {{pathway?: string}} [options] selected pathway id (defaults to general)
 */
export function validateSelection(state, schoolsById, options = {}) {
    const pathway = getPathway(options && options.pathway);
    const errors = [];
    const pending = [];
    const info = [];
    const perChoice = [];

    const counts = { total: 0, boarding: 0, day: 0, byCategory: { A: 0, B: 0, C: 0, unknown: 0 } };
    const missingRequired = [];
    const nameCounts = new Map();
    const categoryBuckets = { A: [], B: [], C: [] };

    state.choices.forEach((choice, index) => {
        const school = schoolsById.get(choice.schoolId) || null;
        const category = school ? categoryFor(school) : null;
        const options = school ? optionsFor(school) : null;

        counts.total += 1;
        if (choice.residential === 'Boarding') counts.boarding += 1;
        if (choice.residential === 'Day') counts.day += 1;
        if (category) {
            counts.byCategory[category] += 1;
            categoryBuckets[category].push({ index, choice });
        } else {
            counts.byCategory.unknown += 1;
        }
        if (school) {
            const key = school.id;
            nameCounts.set(key, (nameCounts.get(key) || 0) + 1);
        }

        const choiceIssues = [];

        // --- Pathway eligibility (confirmed for each pathway's school list) ---
        if (school && !pathway.eligibility(school)) {
            errors.push({
                checkId: 'pathway-eligibility',
                message:
                    `${labelFor(index)} (${schoolName(school)}) is not ${pathway.eligibilityLabel}. ` +
                    `It is not available under the ${pathway.label} pathway.`
            });
            choiceIssues.push({
                status: 'fail',
                message: `Not available for the ${pathway.shortLabel} pathway.`
            });
        }

        // --- Programme (confirmed requirement; data may be unverified) ---
        // The requirement applies to the general, TVET and STEM pathways. For SEN
        // the general programme rule is not assumed to apply, so it is optional.
        if (school && school.programmes.length === 0) {
            choiceIssues.push({
                status: 'pending',
                message: 'No programme list is available for this school.'
            });
        } else if (!choice.programme) {
            if (pathway.enforceProgramme) {
                missingRequired.push({
                    index,
                    field: 'programme',
                    message: `${labelFor(index)}: choose a programme.`
                });
                choiceIssues.push({ status: 'incomplete', message: 'No programme selected yet.' });
            }
        } else if (school && !school.programmes.includes(choice.programme)) {
            errors.push({
                checkId: 'programme',
                message: `${labelFor(index)}: the selected programme is not listed for this school.`
            });
            choiceIssues.push({ status: 'fail', message: 'Selected programme is not offered.' });
        }

        // --- Residential selection + availability ---
        // Availability (only offer options the school actually has) is a factual
        // check and always applies. Requiring a selection is a general rule that is
        // not assumed to apply to the SEN pathway.
        if (!choice.residential) {
            if (pathway.enforceResidential) {
                missingRequired.push({
                    index,
                    field: 'residential',
                    message: `${labelFor(index)}: choose Day or Boarding.`
                });
                choiceIssues.push({ status: 'incomplete', message: 'No Day/Boarding option selected yet.' });
            }
        } else if (options === null) {
            choiceIssues.push({
                status: 'pending',
                message: 'Day/Boarding options are not available for this school.'
            });
        } else if (!options.includes(choice.residential)) {
            errors.push({
                checkId: 'residential-availability',
                message:
                    `${labelFor(index)} (${schoolName(school)}): ${choice.residential} is not an ` +
                    `option offered by this school (${options.join(' / ')} only).`
            });
            choiceIssues.push({
                status: 'fail',
                message: `${choice.residential} is not offered here (${options.join(' / ')} only).`
            });
        }

        perChoice.push({ index, issues: choiceIssues });
    });

    // --- Missing number of choices (confirmed requirement) ---
    if (counts.total < MAX_MAIN_CHOICES) {
        const stillNeeded = MAX_MAIN_CHOICES - counts.total;
        missingRequired.push({
            index: null,
            field: 'count',
            message: `Add ${stillNeeded} more main choice${stillNeeded === 1 ? '' : 's'} (${counts.total} of ${MAX_MAIN_CHOICES} chosen).`
        });
    }

    // --- Category limits (confirmed for the general pathway; not assumed for
    //     the special pathways, whose interaction with these limits is unresolved) ---
    if (pathway.enforceCategoryLimits) {
        if (counts.byCategory.A > CATEGORY_LIMITS.A) {
            errors.push({
                checkId: 'category-a',
                message:
                    `You have ${counts.byCategory.A} Category A schools. Only ${CATEGORY_LIMITS.A} ` +
                    'Category A school is allowed among the five main choices.'
            });
        }
        if (counts.byCategory.B > CATEGORY_LIMITS.B) {
            errors.push({
                checkId: 'category-b',
                message:
                    `You have ${counts.byCategory.B} Category B schools. At most ${CATEGORY_LIMITS.B} ` +
                    'Category B schools are allowed among the five main choices.'
            });
        }
        if (counts.byCategory.unknown > 0) {
            pending.push({
                checkId: 'category-data',
                message: 'A selected school has no category in the data, so category limits cannot be fully checked.'
            });
        }
    }

    // --- Duplicate schools ---
    for (const [id, n] of nameCounts) {
        if (n > 1) {
            const school = schoolsById.get(id);
            errors.push({
                checkId: 'distinct',
                message: `${schoolName(school)} appears more than once. Each choice must be a different school.`
            });
        }
    }

    // --- Residential split (confirmed for the general pathway; assessed when
    //     five are chosen) ---
    if (counts.total === MAX_MAIN_CHOICES && pathway.enforceResidentialSplit) {
        if (counts.boarding !== REQUIRED_BOARDING || counts.day !== REQUIRED_DAY) {
            errors.push({
                checkId: 'residential-split',
                message:
                    `Your five choices are ${counts.boarding} Boarding and ${counts.day} Day. ` +
                    `The requirement is ${REQUIRED_BOARDING} Boarding and ${REQUIRED_DAY} Day.`
            });
        }
    }

    // --- Category-specific residential arrangement (pending, general pathway only) ---
    // A same-category pair arranged as one Boarding and one Day matches the
    // pattern described in Guidelines 7 and 8. How that instruction combines
    // with the overall three-Boarding/two-Day rule is not yet verified, so such
    // an arrangement is flagged rather than enforced.
    const categoryResidentialPending = [];
    if (pathway.enforceCategoryLimits && pathway.enforceResidentialSplit) {
        for (const cat of ['B', 'C']) {
            const bucket = categoryBuckets[cat];
            const withRes = bucket.filter((entry) => entry.choice.residential);
            const boardings = withRes.filter((entry) => entry.choice.residential === 'Boarding').length;
            const days = withRes.filter((entry) => entry.choice.residential === 'Day').length;
            if (boardings >= 1 && days >= 1) {
                categoryResidentialPending.push(
                    `your Category ${cat} schools include both a Boarding and a Day selection`
                );
            }
        }
    }
    if (categoryResidentialPending.length) {
        pending.push({
            checkId: 'category-residential-arrangement',
            message:
                'This selection matches the Category residential arrangement in Guidelines 7 and 8 ' +
                `(${categoryResidentialPending.join('; ')}). How that instruction combines with the ` +
                'overall three-Boarding/two-Day requirement is not yet verified, so this arrangement ' +
                'cannot be conclusively assessed.'
        });
    }

    // --- Pathway note (pending) ---
    // Special pathways restrict which schools may be chosen but leave unresolved
    // how the general limits apply, so that uncertainty is always surfaced rather
    // than assumed.
    if (pathway.note) {
        pending.push({ checkId: 'pathway-limits', message: pathway.note });
    }

    // --- Standing caveats (info) ---
    if (!FIELD_VERIFICATION.programmes.verified) {
        info.push({
            id: 'programmes-unverified',
            message:
                FIELD_VERIFICATION.programmes.note +
                ' A selected programme is therefore shown as "prototype data", not a confirmed entitlement.'
        });
    }
    info.push({
        id: 'not-official',
        message:
            'This prototype check is for preparation only. It does not submit anything to CSSPS and ' +
            'does not guarantee placement or official acceptance.'
    });
    info.push({
        id: 'pathways',
        message:
            'Special pathways (pure TVET, STEM/Science and Special Education Needs) restrict which ' +
            'schools may be chosen. How they interact with the general category and residential ' +
            'limits is not yet confirmed.'
    });

    // --- Rule checks, for display ---
    const checks = buildChecks(state, schoolsById, {
        counts,
        errors,
        missingRequired,
        pending,
        pathway
    });

    // --- Overall status ---
    let overall = 'valid';
    if (errors.length) overall = 'invalid';
    else if (missingRequired.length) overall = 'incomplete';
    else if (pending.length) overall = 'needs-verification';

    return {
        overall,
        pathway: pathway.id,
        counts,
        errors,
        pending,
        info,
        missingRequired,
        perChoice,
        checks,
        remaining: Math.max(0, MAX_MAIN_CHOICES - counts.total)
    };
}

function buildChecks(state, schoolsById, { counts, errors, missingRequired, pending, pathway }) {
    const hasError = (id) => errors.some((e) => e.checkId === id);
    const hasPending = (id) => pending.some((p) => p.checkId === id);
    const missingField = (field) => missingRequired.some((m) => m.field === field);

    const checks = [];

    checks.push({
        id: 'pathway-eligibility',
        label: `Every choice is eligible for the ${pathway.label} pathway`,
        status:
            counts.total === 0
                ? 'open'
                : hasError('pathway-eligibility')
                    ? 'fail'
                    : 'pass',
        detail:
            counts.total === 0
                ? `Eligible here: ${pathway.eligibilityLabel}.`
                : hasError('pathway-eligibility')
                    ? `One or more choices are not ${pathway.eligibilityLabel}.`
                    : `All choices are ${pathway.eligibilityLabel}.`
    });

    checks.push({
        id: 'five-choices',
        label: 'Five main choices selected',
        status: counts.total === MAX_MAIN_CHOICES ? 'pass' : 'open',
        detail: `${counts.total} of ${MAX_MAIN_CHOICES} chosen.`
    });

    checks.push({
        id: 'category-a',
        label: 'No more than one Category A school',
        status: !pathway.enforceCategoryLimits
            ? 'pending'
            : hasError('category-a')
                ? 'fail'
                : counts.byCategory.unknown
                    ? 'pending'
                    : 'pass',
        detail: !pathway.enforceCategoryLimits
            ? 'Not enforced for this pathway.'
            : `${counts.byCategory.A} Category A selected.`
    });

    checks.push({
        id: 'category-b',
        label: 'No more than two Category B schools',
        status: !pathway.enforceCategoryLimits
            ? 'pending'
            : hasError('category-b')
                ? 'fail'
                : counts.byCategory.unknown
                    ? 'pending'
                    : 'pass',
        detail: !pathway.enforceCategoryLimits
            ? 'Not enforced for this pathway.'
            : `${counts.byCategory.B} Category B selected.`
    });

    checks.push({
        id: 'distinct',
        label: 'Every choice is a different school',
        status: hasError('distinct') ? 'fail' : 'pass',
        detail: hasError('distinct') ? 'A school is repeated.' : 'No duplicates.'
    });

    checks.push({
        id: 'residential-split',
        label: 'Three Boarding and two Day',
        status: !pathway.enforceResidentialSplit
            ? 'pending'
            : counts.total < MAX_MAIN_CHOICES
                ? 'open'
                : hasError('residential-split')
                    ? 'fail'
                    : 'pass',
        detail: !pathway.enforceResidentialSplit
            ? 'Not enforced for this pathway.'
            : `${counts.boarding} Boarding, ${counts.day} Day.`
    });

    checks.push({
        id: 'residential-availability',
        label: 'Day/Boarding matches each school',
        status: hasError('residential-availability')
            ? 'fail'
            : !pathway.enforceResidential
                ? 'pending'
                : missingField('residential')
                    ? 'open'
                    : 'pass',
        detail: hasError('residential-availability')
            ? 'A selected option is not offered by its school.'
            : !pathway.enforceResidential
                ? 'Not required or checked for this pathway.'
                : 'All selected options are offered by their schools.'
    });

    checks.push({
        id: 'programme',
        label: 'A programme chosen for each school',
        status: !pathway.enforceProgramme
            ? 'pending'
            : hasError('programme') || missingField('programme')
                ? hasError('programme')
                    ? 'fail'
                    : 'open'
                : pending.some((p) => p.checkId === 'programme') ||
                    state.choices.some((choice) => {
                        const school = schoolsById.get(choice.schoolId);
                        return school && school.programmes.length === 0;
                    })
                    ? 'pending'
                    : 'pass',
        detail: !pathway.enforceProgramme
            ? 'Not enforced for this pathway.'
            : 'Uses each school\'s programme list.'
    });

    checks.push({
        id: 'category-residential-arrangement',
        label: 'Category B/C Day/Boarding arrangement',
        status: hasPending('category-residential-arrangement') ? 'pending' : 'pass',
        detail: hasPending('category-residential-arrangement')
            ? 'Still being confirmed.'
            : 'Not triggered by the current selection.'
    });

    if (pathway.note) {
        checks.push({
            id: 'pathway-limits',
            label: `${pathway.label} general limits`,
            status: 'pending',
            detail: 'Still being confirmed.'
        });
    }

    return checks;
}

export default {
    REQUIRED_BOARDING,
    REQUIRED_DAY,
    RULE_REFERENCES,
    summarise,
    validateSelection
};
