// ========================================
// Phase 5 - alternatives logic tests (headless)
// ========================================
// Exercises the pure alternatives modules (state + rules) against real
// prototype-schools data. Run with:
//   node scripts/phase5_alternatives_tests.mjs
//
// These tests assert the rule classifications documented in
// docs/PHASE5_REPORT.md: confirmed rules fail as expected, eligibility is
// filtered to Appendix 3, duplicates across sections are blocked, and the
// unresolved Appendix 3 questions always produce "needs-verification", never a
// silent pass.

import {
    getPrototypeSchools,
    getPrototypeSchoolsById
} from '../js/prototype-schools.js';

import {
    createEmptyAlternatives,
    setAlternative,
    clearAlternative,
    clearAlternatives,
    isAlternative,
    alternativeSlotOf,
    alternativeIds,
    filledCount
} from '../js/alternatives-state.js';

import {
    isAppendix3Eligible,
    alternativeEligibleSchools,
    eligibleCounts,
    validateAlternatives
} from '../js/alternatives.js';

let passed = 0;
let failed = 0;

function check(name, condition, detail = '') {
    if (condition) {
        passed += 1;
        console.log(`PASS  ${name}`);
    } else {
        failed += 1;
        console.log(`FAIL  ${name}${detail ? ` -> ${detail}` : ''}`);
    }
}

const schools = getPrototypeSchools();
const byId = getPrototypeSchoolsById();

const appendix3 = schools.filter((s) => s.appendices.includes('Appendix 3'));
const bSchools = appendix3.filter((s) => s.category === 'B');
const cSchools = appendix3.filter((s) => s.category === 'C');
const bAlt = bSchools[0].id;                 // an Appendix 3 Category B school
const cAlt = cSchools[0].id;                 // an Appendix 3 Category C school
const cAlt2 = cSchools[1].id;                // a second Appendix 3 Category C school
const nonAppendixB = schools.find((s) => s.category === 'B' && !s.appendices.includes('Appendix 3')).id;

function mainOf(...ids) {
    return { choices: ids.map((schoolId) => ({ schoolId, programme: null, residential: null })) };
}

// An alternative slot as it is stored: the school plus a programme and a
// Day/Boarding option the school actually offers. Used to build fixtures that
// reach the "confirmed rules" stage instead of stopping at "incomplete".
function slotFor(schoolId) {
    const school = byId.get(schoolId);
    return {
        schoolId,
        programme: school && school.programmes.length ? school.programmes[0] : null,
        residential: school && school.residentialOptions ? school.residentialOptions[0] : null
    };
}

function alts(bId, cId) {
    return { b: bId == null ? null : slotFor(bId), c: cId == null ? null : slotFor(cId) };
}

// ---- Eligibility filtering --------------------------------------------

console.log('\n== Appendix 3 eligibility ==');

check('isAppendix3Eligible true for an Appendix 3 school', isAppendix3Eligible(byId.get(bAlt)) === true);
check('isAppendix3Eligible false for a non-Appendix-3 school', isAppendix3Eligible(byId.get(nonAppendixB)) === false);
check('isAppendix3Eligible false for null', isAppendix3Eligible(null) === false);

const eligB = alternativeEligibleSchools(schools, 'B');
const eligC = alternativeEligibleSchools(schools, 'C');
check(
    'eligible B list only contains Appendix 3 Category B schools',
    eligB.length > 0 && eligB.every((s) => s.category === 'B' && s.appendices.includes('Appendix 3')),
    `got ${eligB.length}`
);
check(
    'eligible C list only contains Appendix 3 Category C schools',
    eligC.length > 0 && eligC.every((s) => s.category === 'C' && s.appendices.includes('Appendix 3')),
    `got ${eligC.length}`
);
check('eligible B count matches prototype data', eligB.length === bSchools.length, `got ${eligB.length}`);
check('eligible C count matches prototype data', eligC.length === cSchools.length, `got ${eligC.length}`);
check('no non-Appendix-3 school leaks into the eligible list', eligB.length + eligC.length === appendix3.length);

const counts = eligibleCounts(schools);
check('eligibleCounts reports b and c', counts.b === eligB.length && counts.c === eligC.length, JSON.stringify(counts));

// ---- State module ------------------------------------------------------

console.log('\n== Alternatives state ==');

let st = createEmptyAlternatives();
check('empty alternatives start with null slots', st.b === null && st.c === null);

let res = setAlternative(st, 'b', bAlt);
check('setAlternative fills the B slot', res.ok && res.state.b.schoolId === bAlt);
st = res.state;

res = setAlternative(st, 'c', bAlt);
check('setAlternative refuses a school already used in the other slot', res.ok === false, res.reason);

res = setAlternative(st, 'c', cAlt);
check('setAlternative fills the C slot', res.ok && res.state.c.schoolId === cAlt);
st = res.state;

check('isAlternative true for a used school', isAlternative(st, bAlt) === true);
check('isAlternative false for an unused school', isAlternative(st, cAlt2) === false);
check('alternativeSlotOf returns the correct slot', alternativeSlotOf(st, bAlt) === 'b' && alternativeSlotOf(st, cAlt) === 'c');
check('alternativeSlotOf returns null when unused', alternativeSlotOf(st, cAlt2) === null);
check('alternativeIds returns both ids', alternativeIds(st).length === 2);
check('filledCount counts filled slots', filledCount(st) === 2);

res = setAlternative(st, 'z', bAlt);
check('setAlternative rejects an unknown slot', res.ok === false);
res = setAlternative(st, 'b', 'not-a-number');
check('setAlternative rejects a non-integer id', res.ok === false);

res = clearAlternative(st, 'b');
check('clearAlternative empties the slot', res.ok && res.state.b === null);
st = res.state;
res = clearAlternative(st, 'b');
check('clearAlternative on an empty slot is a no-op success', res.ok && res.state.b === null);

res = clearAlternatives();
check('clearAlternatives returns empty state', res.state.b === null && res.state.c === null);

// ---- Validation: completeness -----------------------------------------

console.log('\n== Validation: completeness ==');

let v = validateAlternatives(createEmptyAlternatives(), mainOf(), byId);
check('empty alternatives are incomplete', v.overall === 'incomplete', v.overall);
check('empty alternatives report two missing slots', v.missingRequired.length === 2, String(v.missingRequired.length));
check('empty alternatives have no confirmed errors', v.errors.length === 0);

v = validateAlternatives(alts(bAlt, null), mainOf(), byId);
check('one alternative chosen is still incomplete', v.overall === 'incomplete', v.overall);
check('one missing slot reported', v.missingRequired.length === 1);

// ---- Validation: complete + confirmed rules ---------------------------

console.log('\n== Validation: confirmed rules ==');

v = validateAlternatives(alts(bAlt, cAlt), mainOf(), byId);
check('a correct B + C pair has no errors', v.errors.length === 0, JSON.stringify(v.errors));
check('a correct pair is not reported valid (unresolved Appendix 3 questions)', v.overall === 'needs-verification', v.overall);
check('a correct pair raises the B-count conflict as needs-verification', v.pending.some((p) => p.checkId === 'alt-b-count-conflict'));
check('a correct pair raises the unverified list as needs-verification', v.pending.some((p) => p.checkId === 'alt-list-unverified'));
check('counts report two selected', v.counts.total === 2, String(v.counts.total));

// Category mismatch
v = validateAlternatives(alts(cAlt, cAlt2), mainOf(), byId);
check('a Category C school in the B slot is an error', v.errors.some((e) => e.checkId === 'alt-category-b'), JSON.stringify(v.errors));
check('category mismatch makes the alternatives invalid', v.overall === 'invalid', v.overall);

// Non-Appendix-3 school
v = validateAlternatives(alts(nonAppendixB, cAlt), mainOf(), byId);
check('a non-Appendix-3 school is rejected', v.errors.some((e) => e.checkId === 'alt-appendix3'), JSON.stringify(v.errors));
check('non-Appendix-3 selection is invalid', v.overall === 'invalid', v.overall);

// Duplicate vs main choices
v = validateAlternatives(alts(bAlt, cAlt), mainOf(bAlt), byId);
check('an alternative equal to a main choice is an error', v.errors.some((e) => e.checkId === 'alt-distinct-from-main'), JSON.stringify(v.errors));
check('duplicate across sections is invalid', v.overall === 'invalid', v.overall);

// Unknown id
v = validateAlternatives(alts(999999, cAlt), mainOf(), byId);
check('an unknown school id is reported', v.errors.some((e) => e.checkId === 'alt-known'), JSON.stringify(v.errors));

// Same school in both slots
v = validateAlternatives(alts(cAlt, cAlt), mainOf(), byId);
check('the two alternatives must differ', v.errors.some((e) => e.checkId === 'alt-distinct'), JSON.stringify(v.errors));

// Info is always present
v = validateAlternatives(alts(bAlt, cAlt), mainOf(), byId);
check('info explains alternatives are not guaranteed', v.info.some((i) => i.id === 'alt-not-guaranteed'));
check('info explains the prototype subset', v.info.some((i) => i.id === 'alt-subset'));

// Checks list
const checkIds = v.checks.map((c) => c.id);
check(
    'checks include count, category, appendix3, programme, residential, distinct and the two pending items',
    ['alt-count', 'alt-category', 'alt-appendix3', 'alt-programme', 'alt-residential', 'alt-distinct', 'alt-b-count-conflict', 'alt-list-unverified']
        .every((id) => checkIds.includes(id)),
    checkIds.join(',')
);
check('the count check passes when both are chosen', v.checks.find((c) => c.id === 'alt-count').status === 'pass');
check('the appendix3 check passes for eligible schools', v.checks.find((c) => c.id === 'alt-appendix3').status === 'pass');
check('the programme check passes when both have a programme', v.checks.find((c) => c.id === 'alt-programme').status === 'pass');
check('the residential check passes when both have Day/Boarding', v.checks.find((c) => c.id === 'alt-residential').status === 'pass');

// ---- Validation: programme and Day/Boarding on alternatives -----------

console.log('\n== Validation: programme + Day/Boarding ==');

// Missing programme / Day-Boarding keeps the pair incomplete (not invalid).
const bNoFields = { schoolId: bAlt, programme: null, residential: null };
v = validateAlternatives({ b: bNoFields, c: slotFor(cAlt) }, mainOf(), byId);
check('a missing alternative programme is incomplete', v.overall === 'incomplete', v.overall);
check('a missing alternative programme is reported', v.missingRequired.some((m) => m.field === 'programme'), JSON.stringify(v.missingRequired));
check('a missing alternative programme is not a confirmed error', !v.errors.some((e) => e.checkId === 'alt-programme'));
check('the programme check is open, not failed, when nothing is chosen', v.checks.find((c) => c.id === 'alt-programme').status === 'open');

v = validateAlternatives(
    { b: { schoolId: bAlt, programme: byId.get(bAlt).programmes[0], residential: null }, c: slotFor(cAlt) },
    mainOf(),
    byId
);
check('a missing alternative Day/Boarding is incomplete', v.overall === 'incomplete', v.overall);
check('a missing alternative Day/Boarding is reported', v.missingRequired.some((m) => m.field === 'residential'));

// A programme the school does not offer is a confirmed error.
v = validateAlternatives(
    { b: { schoolId: bAlt, programme: 'Astrophysics', residential: 'Day' }, c: slotFor(cAlt) },
    mainOf(),
    byId
);
check('an unoffered alternative programme is an error', v.errors.some((e) => e.checkId === 'alt-programme'), JSON.stringify(v.errors));
check('an unoffered alternative programme is invalid', v.overall === 'invalid', v.overall);

// A Day/Boarding option the school does not offer is a confirmed error.
// (School 225 - the first Category B alternative - offers Day only.)
check('the fixture B school really is Day-only', JSON.stringify(byId.get(bAlt).residentialOptions) === '["Day"]', JSON.stringify(byId.get(bAlt).residentialOptions));
v = validateAlternatives(
    { b: { schoolId: bAlt, programme: byId.get(bAlt).programmes[0], residential: 'Boarding' }, c: slotFor(cAlt) },
    mainOf(),
    byId
);
check('an unoffered alternative Day/Boarding is an error', v.errors.some((e) => e.checkId === 'alt-residential'), JSON.stringify(v.errors));
check('an unoffered alternative Day/Boarding is invalid', v.overall === 'invalid', v.overall);

// The three-Boarding/two-Day split is a main-choice rule only: two Day
// alternatives are valid (a B + C pair both Day reaches the pending stage).
const dayPair = {
    b: { schoolId: bAlt, programme: byId.get(bAlt).programmes[0], residential: 'Day' },
    c: { schoolId: cAlt, programme: byId.get(cAlt).programmes[0], residential: 'Day' }
};
v = validateAlternatives(dayPair, mainOf(), byId);
check('two Day alternatives are allowed (no main-choice 3/2 split)', v.errors.length === 0, JSON.stringify(v.errors));

// ---- Parse check -------------------------------------------------------

console.log('\n== Module parse check ==');

async function parses(path) {
    try {
        await import(new URL(path, import.meta.url));
        return true;
    } catch (error) {
        // selection.js touches window/document at import time in Node.
        if (error && error.name === 'ReferenceError') return true;
        console.error(`  ${path}: ${error && error.name}: ${error && error.message}`);
        return false;
    }
}

for (const file of [
    '../js/alternatives-state.js',
    '../js/alternatives.js',
    '../js/selection-state.js',
    '../js/validation.js',
    '../js/school-search.js',
    '../js/prototype-schools.js',
    '../js/selection.js'
]) {
    check(`parses: ${file}`, await parses(file));
}

// ---- Summary -----------------------------------------------------------

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exitCode = 1;
