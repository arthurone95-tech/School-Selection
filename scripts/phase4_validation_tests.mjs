// ========================================
// Phase 4 - logic tests (headless)
// ========================================
// Exercises the pure modules (state, validation, search) against real
// prototype-schools data. Run with:
//   node scripts/phase4_validation_tests.mjs
//
// These tests assert the rule classifications documented in
// docs/PHASE4_REPORT.md: confirmed rules fail as expected, and rules or data
// that cannot be assessed produce "needs-verification", never a silent pass.

import {
    getPrototypeSchools,
    getPrototypeSchoolsById,
    checkPrototypeData,
    categoryOf,
    residentialOptionsOf
} from '../js/prototype-schools.js';
import {
    createEmptyState,
    addChoice,
    removeChoice,
    moveChoice,
    updateChoice,
    replaceChoice
} from '../js/selection-state.js';
import { validateSelection } from '../js/validation.js';
import { filterSchools } from '../js/school-search.js';

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

function choice(schoolId, programme, residential) {
    return { schoolId, programme: programme || null, residential: residential || null };
}

function stateOf(...choices) {
    return { choices };
}

const schools = getPrototypeSchools();
const byId = getPrototypeSchoolsById();
const firstProgramme = (id) => byId.get(id).programmes[0];

// ---- Data integrity ----------------------------------------------------

console.log('\n== Data integrity ==');
check('prototype subset has 25-30 schools', schools.length >= 25 && schools.length <= 30, `got ${schools.length}`);
check('checkPrototypeData() reports no problems', checkPrototypeData().length === 0, JSON.stringify(checkPrototypeData()));
check('every prototype school has a category', schools.every((s) => s.category));
check('every prototype school has a 2025 register code', schools.every((s) => typeof s.code === 'string' && s.code.length > 0));
check(
    'category helper matches classification',
    schools.every((s) => categoryOf({ classification: s.classification }) === s.category)
);
check(
    'residential helper matches status',
    schools.every((s) => {
        const expected = s.status === 'Day/Boarding' ? 'Day,Boarding' : s.status;
        return (residentialOptionsOf({ status: s.status }) || []).join(',') === expected;
    })
);

// ---- State management --------------------------------------------------

console.log('\n== State management ==');
let s = createEmptyState();
let r = addChoice(s, 524);
check('addChoice succeeds', r.ok);
s = r.state;
r = addChoice(s, 524);
check('addChoice refuses a duplicate', !r.ok, r.reason);
r = addChoice(s, 225);
s = r.state;
check('second distinct choice added', s.choices.length === 2);
r = moveChoice(s, 0, 1);
s = r.state;
check('moveChoice reorders', s.choices[0].schoolId === 225 && s.choices[1].schoolId === 524);
r = updateChoice(s, 0, { programme: firstProgramme(225), residential: 'Day' });
s = r.state;
check('updateChoice sets fields', s.choices[0].programme === firstProgramme(225) && s.choices[0].residential === 'Day');
r = replaceChoice(s, 1, 526);
s = r.state;
check('replaceChoice swaps the school and clears fields', s.choices[1].schoolId === 526 && s.choices[1].programme === null);
r = removeChoice(s, 0);
s = r.state;
check('removeChoice removes', s.choices.length === 1 && s.choices[0].schoolId === 526);
// Fill to the maximum, then one more.
s = createEmptyState();
for (const id of [524, 225, 526, 306, 411]) {
    r = addChoice(s, id);
    if (r.ok) s = r.state;
}
check('five choices accepted', s.choices.length === 5);
r = addChoice(s, 597);
check('sixth choice refused', !r.ok, r.reason);

// ---- Validation: rule classification -----------------------------------

console.log('\n== Validation: confirmed rules ==');

// Empty -> incomplete
let v = validateSelection(createEmptyState(), byId);
check('empty selection is incomplete', v.overall === 'incomplete', v.overall);

// Two Category A -> invalid
v = validateSelection(
    stateOf(
        choice(524, firstProgramme(524), 'Boarding'),
        choice(909, firstProgramme(909), 'Day')
    ),
    byId
);
check('two Category A schools -> invalid', v.overall === 'invalid', v.overall);
check('  reason is the Category A limit', v.errors.some((e) => e.checkId === 'category-a'));

// Three Category B -> invalid
v = validateSelection(
    stateOf(
        choice(225, firstProgramme(225), 'Day'),
        choice(526, firstProgramme(526), 'Boarding'),
        choice(917, firstProgramme(917), 'Day')
    ),
    byId
);
check('three Category B schools -> invalid', v.overall === 'invalid', v.overall);
check('  reason is the Category B limit', v.errors.some((e) => e.checkId === 'category-b'));

// Four Boarding / one Day with five chosen -> invalid on the split
v = validateSelection(
    stateOf(
        choice(524, firstProgramme(524), 'Boarding'),
        choice(225, firstProgramme(225), 'Day'),
        choice(526, firstProgramme(526), 'Boarding'),
        choice(306, firstProgramme(306), 'Boarding'),
        choice(411, firstProgramme(411), 'Boarding')
    ),
    byId
);
check('4 Boarding / 1 Day -> invalid', v.overall === 'invalid', v.overall);
check('  reason is the residential split', v.errors.some((e) => e.checkId === 'residential-split'));

// Boarding chosen at a Day-only school -> invalid
v = validateSelection(stateOf(choice(225, firstProgramme(225), 'Boarding')), byId);
check('Boarding at a Day-only school -> invalid', v.overall === 'invalid', v.overall);
check('  reason is residential availability', v.errors.some((e) => e.checkId === 'residential-availability'));

// Duplicate school in the state -> invalid
v = validateSelection(
    stateOf(
        choice(524, firstProgramme(524), 'Boarding'),
        choice(524, firstProgramme(524), 'Boarding')
    ),
    byId
);
check('duplicate school -> invalid', v.overall === 'invalid', v.overall);
check('  reason is the distinct check', v.errors.some((e) => e.checkId === 'distinct'));

// ---- Validation: incomplete --------------------------------------------

console.log('\n== Validation: incomplete ==');
v = validateSelection(stateOf(choice(524, firstProgramme(524), 'Boarding')), byId);
check('one of five chosen is incomplete', v.overall === 'incomplete', v.overall);
check('  reports remaining choices', v.remaining === 4, String(v.remaining));
v = validateSelection(
    stateOf(
        choice(524, null, 'Boarding'),
        choice(225, firstProgramme(225), 'Day'),
        choice(526, firstProgramme(526), 'Boarding'),
        choice(306, firstProgramme(306), 'Boarding'),
        choice(411, firstProgramme(411), 'Day')
    ),
    byId
);
check('missing programme -> incomplete', v.overall === 'incomplete', v.overall);
check('  missing programme is listed', v.missingRequired.some((m) => m.field === 'programme'));

// ---- Validation: needs verification -------------------------------------

console.log('\n== Validation: needs verification ==');
// Valid split (3 Boarding / 2 Day), but each category pair is mixed -> Guidelines 7/8.
v = validateSelection(
    stateOf(
        choice(524, firstProgramme(524), 'Boarding'),
        choice(428, firstProgramme(428), 'Boarding'), // B boarding-only
        choice(225, firstProgramme(225), 'Day'), // B day-only -> mixed B pair
        choice(306, firstProgramme(306), 'Boarding'),
        choice(411, firstProgramme(411), 'Day') // mixed C pair
    ),
    byId
);
check('valid split but mixed category pairs -> needs-verification', v.overall === 'needs-verification', v.overall);
check(
    '  reason is the category residential arrangement',
    v.pending.some((p) => p.checkId === 'category-residential-arrangement')
);

// A school with no programme data -> programme cannot be confirmed
v = validateSelection(
    stateOf(
        choice(101, null, 'Boarding'),
        choice(225, firstProgramme(225), 'Day'),
        choice(526, firstProgramme(526), 'Boarding'),
        choice(306, firstProgramme(306), 'Boarding'),
        choice(411, firstProgramme(411), 'Day')
    ),
    byId
);
check('school with no programme data does not become invalid', v.overall !== 'invalid', v.overall);
check(
    '  no-programme school is not forced to choose a programme',
    !v.missingRequired.some((m) => m.index === 0 && m.field === 'programme')
);

// ---- Validation: valid --------------------------------------------------

console.log('\n== Validation: valid ==');
// 1x A(boarding), 2x B(day,day), 2x C(boarding,boarding): 3B/2D, no mixed pairs.
v = validateSelection(
    stateOf(
        choice(524, firstProgramme(524), 'Boarding'),
        choice(225, firstProgramme(225), 'Day'),
        choice(526, firstProgramme(526), 'Day'),
        choice(306, firstProgramme(306), 'Boarding'),
        choice(411, firstProgramme(411), 'Boarding')
    ),
    byId
);
check('clean five-school selection -> valid', v.overall === 'valid', v.overall);
check('  no errors', v.errors.length === 0, JSON.stringify(v.errors));
check('  no pending items', v.pending.length === 0, JSON.stringify(v.pending));
check('  counts 3 Boarding / 2 Day', v.counts.boarding === 3 && v.counts.day === 2);
check('  counts 1 A / 2 B / 2 C', v.counts.byCategory.A === 1 && v.counts.byCategory.B === 2 && v.counts.byCategory.C === 2);

// ---- Search -------------------------------------------------------------

console.log('\n== Search ==');
check('empty query returns all', filterSchools(schools, {}).length === schools.length);
check('name search is case-insensitive', filterSchools(schools, { query: 'accra academy' }).some((x) => x.id === 524));
check('code search works', filterSchools(schools, { query: '0010121' }).some((x) => x.id === 524));
check('no-match query returns none', filterSchools(schools, { query: 'zzzz-nothing' }).length === 0);
check('category filter works', filterSchools(schools, { category: 'A' }).every((x) => x.category === 'A'));
check(
    'residential filter respects availability',
    filterSchools(schools, { residential: 'Boarding' }).every((x) => x.residentialOptions.includes('Boarding'))
);
check(
    'programme filter matches offered programme',
    filterSchools(schools, { programme: 'General Science' }).every((x) => x.programmes.includes('General Science'))
);

// ---- Summary ------------------------------------------------------------

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exitCode = 1;
