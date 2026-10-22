// ========================================
// Phase 7 - final review model tests (headless)
// ========================================
// Exercises the pure review model (js/review-model.js) against real
// prototype-schools / pathway data. Run with:
//   node scripts/phase7_review_tests.mjs
//
// These tests assert that the review view-model:
//   - maps the five main choices and two alternatives correctly;
//   - shows a programme code only for the official register programme groups
//     and never invents one for a trade/subject programme;
//   - merges the main-choice and alternatives status in the documented order
//     (invalid > incomplete > needs-verification > valid);
//   - flags unknown / ineligible schools rather than dropping them;
//   - keeps a correct special-pathway selection at "needs-verification".

import { getPrototypeSchools, getPrototypeSchoolsById } from '../js/prototype-schools.js';
import { getSelectionPool } from '../js/pathways.js';
import { buildReview, combineStatus, STATUS_ORDER } from '../js/review-model.js';
import { validateSelection } from '../js/validation.js';
import { programmeCodeOf, programmeCodeInfo, PROGRAMME_GROUP_CODES } from '../js/programme-codes.js';

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

const baseSchools = getPrototypeSchools();
const pool = getSelectionPool();
const byId = new Map(pool.map((school) => [school.id, school]));

function pick(id, residential) {
    const school = byId.get(id);
    return {
        schoolId: id,
        programme: school && school.programmes.length ? school.programmes[0] : null,
        residential: residential || null
    };
}

// An alternative slot is stored exactly like a main choice: school + programme +
// Day/Boarding option.
function altSlot(id, residential) {
    const school = byId.get(id);
    return {
        schoolId: id,
        programme: school && school.programmes.length ? school.programmes[0] : null,
        residential:
            residential || (school && school.residentialOptions ? school.residentialOptions[0] : null)
    };
}

function alts(bId, cId) {
    return { b: bId == null ? null : altSlot(bId), c: cId == null ? null : altSlot(cId) };
}

// A general selection that satisfies every confirmed rule:
//   1 Category A (524) + 2 Category B (526, 649) + 2 Category C (16, 26),
//   3 Boarding (524, 526, 649) + 2 Day (16, 26); no same-category Day/Boarding
//   mix, so no pending category-residential caveat.
const validMain = {
    choices: [
        pick(524, 'Boarding'),
        pick(526, 'Boarding'),
        pick(649, 'Boarding'),
        pick(16, 'Day'),
        pick(26, 'Day')
    ]
};

// A correct Appendix 3 pair (B = 225, C = 597) that repeats no main choice.
const validAlts = alts(225, 597);

// A TVET selection: five distinct TVET institutes, each with a programme and a
// Day/Boarding option.
const tvetMain = {
    choices: [
        pick(403, 'Boarding'),
        pick(225, 'Day'),
        pick(649, 'Boarding'),
        pick(632, 'Boarding'),
        pick(697, 'Boarding')
    ]
};

// ---- Sanity: the fixtures really are what they claim --------------------

console.log('\n== Fixture sanity ==');
check('fixture: general main passes confirmed rules', validateSelection(validMain, byId).overall === 'valid', validateSelection(validMain, byId).overall);
check('fixture: every TVET choice is a TVET institute', tvetMain.choices.every((c) => byId.get(c.schoolId).schoolType === 'TVET'));

// ---- combineStatus ordering -------------------------------------------

console.log('\n== Status ordering ==');
check('order: invalid outranks incomplete', combineStatus('invalid', 'incomplete') === 'invalid');
check('order: incomplete outranks needs-verification', combineStatus('incomplete', 'needs-verification') === 'incomplete');
check('order: needs-verification outranks valid', combineStatus('needs-verification', 'valid') === 'needs-verification');
check('order: all valid stays valid', combineStatus('valid', 'valid') === 'valid');
check('order: empty defaults to valid', combineStatus() === 'valid');
check('STATUS_ORDER ranks invalid highest', STATUS_ORDER.invalid > STATUS_ORDER.incomplete && STATUS_ORDER.incomplete > STATUS_ORDER['needs-verification'] && STATUS_ORDER['needs-verification'] > STATUS_ORDER.valid);

// ---- View model: main choices -----------------------------------------

console.log('\n== View model: main choices ==');
let review = buildReview({ mainState: validMain, alternatives: validAlts, pathwayId: 'general', schoolsById: byId });

check('seven total choices are accounted for', review.totalChoices === 7, String(review.totalChoices));
check('five main choices mapped', review.mainChoices.length === 5, String(review.mainChoices.length));
check('no empty main ranks when all five are chosen', review.emptyMainRanks.length === 0);
check('ranks are 1..5 in order', review.mainChoices.map((c) => c.rank).join(',') === '1,2,3,4,5');
check('choice 1 is the school id we put first', review.mainChoices[0].schoolId === 524);
check('school name is carried through', review.mainChoices[0].name === byId.get(524).name);
check('school code is carried through', review.mainChoices[0].code === byId.get(524).code);
check('category is carried through', review.mainChoices[0].category === 'A');
check('residential is carried through', review.mainChoices[0].residential === 'Boarding');
check('programme is carried through', review.mainChoices[0].programme === byId.get(524).programmes[0]);
check('an official programme group gets its register code', review.mainChoices[0].programmeCode === '101' && review.mainChoices[0].programmeCodeAvailable === true, `${review.mainChoices[0].programme} -> ${review.mainChoices[0].programmeCode}`);
check('every main programme code is either real or blank (never invented)', review.mainChoices.every((c) => c.programmeCode === null || /^[0-9]{3}$/.test(c.programmeCode)));
check('filled main count is reported', review.filledMain === 5);
check('a clean general selection has no per-choice issues', review.mainChoices.every((c) => c.complete));

// Empty ranks when fewer than five chosen
review = buildReview({ mainState: { choices: [pick(524, 'Boarding'), pick(16, 'Day')] }, alternatives: { b: null, c: null }, pathwayId: 'general', schoolsById: byId });
check('two chosen -> three empty ranks (3,4,5)', review.emptyMainRanks.join(',') === '3,4,5', review.emptyMainRanks.join(','));
check('empty ranks start after the chosen count', review.emptyMainRanks[0] === 3);

// ---- View model: alternatives -----------------------------------------

console.log('\n== View model: alternatives ==');
check('two alternative entries', review.alternatives.length === 2, String(review.alternatives.length));
check('first entry is the Category B slot', review.alternatives[0].slot === 'b' && review.alternatives[0].category === 'B');
check('second entry is the Category C slot', review.alternatives[1].slot === 'c' && review.alternatives[1].category === 'C');
check('empty alternatives are not marked filled', review.alternatives.every((a) => a.filled === false));
check('empty alternatives are not complete', review.alternatives.every((a) => a.complete === false));

review = buildReview({ mainState: validMain, alternatives: validAlts, pathwayId: 'general', schoolsById: byId });
check('filled B slot is marked filled', review.alternatives[0].filled === true && review.alternatives[0].schoolId === 225);
check('filled B slot name carried through', review.alternatives[0].name === byId.get(225).name);
check('filled C slot name carried through', review.alternatives[1].name === byId.get(597).name);
check('alternative programme carried through', review.alternatives[0].programme === byId.get(225).programmes[0]);
check('alternative Day/Boarding carried through', review.alternatives[0].residential === 'Day', String(review.alternatives[0].residential));
check('alternative code column is blank for a trade programme', review.alternatives[0].programmeCode === null && review.alternatives[0].programmeCodeAvailable === false);
check('filled alternatives count is reported', review.filledAlternatives === 2);
check('total filled counts main + alternatives', review.totalFilled === 7, String(review.totalFilled));

// ---- Status merging ----------------------------------------------------

console.log('\n== Status merging ==');
review = buildReview({ mainState: validMain, alternatives: validAlts, pathwayId: 'general', schoolsById: byId });
check('valid main + correct alternatives -> needs-verification', review.status === 'needs-verification', review.status);
check('a correct alternatives pair contributes no error', review.errors.length === 0, JSON.stringify(review.errors));
check('a correct alternatives pair contributes no missing item', review.missing.length === 0);
check('correct alternatives still contributes pending items', review.pending.length > 0);
check('selection is "complete" without errors or missing fields', review.complete === true);
check('hasErrors false', review.hasErrors === false);
check('hasMissing false', review.hasMissing === false);

review = buildReview({ mainState: validMain, alternatives: { b: null, c: null }, pathwayId: 'general', schoolsById: byId });
check('valid main + empty alternatives -> incomplete', review.status === 'incomplete', review.status);
check('empty alternatives add two missing items', review.missing.filter((m) => m.source === 'alternatives').length === 2, String(review.missing.length));
check('incomplete selection is not "complete"', review.complete === false);

review = buildReview({ mainState: { choices: [] }, alternatives: { b: null, c: null }, pathwayId: 'general', schoolsById: byId });
check('empty selection -> incomplete', review.status === 'incomplete', review.status);
check('empty selection still lists five empty ranks', review.emptyMainRanks.join(',') === '1,2,3,4,5');

// ---- Invalid cases -----------------------------------------------------

console.log('\n== Invalid cases ==');
const twoCategoryA = { choices: [pick(524, 'Boarding'), pick(403, 'Boarding'), pick(649, 'Boarding'), pick(16, 'Day'), pick(26, 'Day')] };
review = buildReview({ mainState: twoCategoryA, alternatives: validAlts, pathwayId: 'general', schoolsById: byId });
check('two Category A schools -> invalid', review.status === 'invalid', review.status);
check('category error is tagged as a main-choice error', review.errors.some((e) => e.checkId === 'category-a' && e.source === 'main'));
check('invalid outranks the alternatives needs-verification', review.errors.length > 0 && review.status === 'invalid');

// Wrong category in the B alternative slot (a Category C school in slot B)
review = buildReview({ mainState: validMain, alternatives: alts(597, 16), pathwayId: 'general', schoolsById: byId });
check('wrong category alternative -> invalid overall', review.status === 'invalid', review.status);
check('alternative error is tagged as an alternatives error', review.errors.some((e) => e.source === 'alternatives'));

// ---- Unknown + ineligible schools are flagged, never dropped -----------

console.log('\n== Unknown + ineligible schools ==');
const unknownMain = { choices: [pick(524, 'Boarding'), { schoolId: 999999, programme: null, residential: null }] };
review = buildReview({ mainState: unknownMain, alternatives: { b: null, c: null }, pathwayId: 'general', schoolsById: byId });
check('unknown school is kept as a row', review.mainChoices.length === 2);
check('unknown school is labelled, not blank', review.mainChoices[1].name === 'Unknown school', review.mainChoices[1].name);
check('unknown school has no code', review.mainChoices[1].code === null);

// A non-TVET school in a TVET pathway
review = buildReview({ mainState: validMain, alternatives: { b: null, c: null }, pathwayId: 'tvet', schoolsById: byId });
const expectedIneligible = validMain.choices.filter((c) => byId.get(c.schoolId).schoolType !== 'TVET').length;
check(
    'general schools under TVET pathway -> pathway-eligibility errors',
    review.errors.filter((e) => e.checkId === 'pathway-eligibility').length === expectedIneligible,
    JSON.stringify(review.errors.map((e) => e.checkId))
);
check('ineligible-for-pathway selection is invalid', review.status === 'invalid', review.status);
check('ineligible choices are not dropped', review.mainChoices.length === 5);

// ---- Special pathways can never be "valid" -----------------------------

console.log('\n== Special pathways ==');
// A TVET-eligible Appendix 3 pair that repeats no TVET main choice
// (B = 428, C = 597; the main choices hold 225 and 649).
review = buildReview({ mainState: tvetMain, alternatives: alts(428, 597), pathwayId: 'tvet', schoolsById: byId });
check('review reports the TVET pathway id', review.pathway.id === 'tvet');
check('review reports the TVET pathway label', review.pathway.shortLabel === 'TVET');
check('a correct TVET selection has no errors', review.errors.length === 0, JSON.stringify(review.errors));
check('a correct TVET selection stays needs-verification', review.status === 'needs-verification', review.status);
check('a correct TVET selection is "complete"', review.complete === true);
check('special pathway surfaces the unresolved path as pending', review.pending.some((p) => p.source === 'main'));

// A general pathway review of the same data would enforce the general limits
review = buildReview({ mainState: validMain, alternatives: { b: null, c: null }, pathwayId: 'general', schoolsById: byId });
check('general pathway review reports general id', review.pathway.id === 'general');
check('general pathway review of a valid selection has no errors', review.errors.length === 0);

// Unknown pathway id falls back to general (same as the validators)
review = buildReview({ mainState: validMain, alternatives: { b: null, c: null }, pathwayId: 'nonsense', schoolsById: byId });
check('unknown pathway id falls back to general', review.pathway.id === 'general');

// ---- Robustness --------------------------------------------------------

console.log('\n== Robustness ==');
review = buildReview({ mainState: undefined, alternatives: undefined, pathwayId: 'general', schoolsById: byId });
check('undefined state does not throw and yields incomplete', review.status === 'incomplete', review.status);
check('undefined state yields five empty ranks', review.emptyMainRanks.length === 5);

// ---- Programme codes ----------------------------------------------------

console.log('\n== Programme codes ==');
// The register prints the programme-group codes as the column headers of the
// SHS/SHTS school lists; those are the only programme codes the data supports.
check('Agriculture -> 101', programmeCodeOf('Agriculture') === '101');
check('Business -> 201', programmeCodeOf('Business') === '201');
check('Technical -> 301', programmeCodeOf('Technical') === '301');
check('Home Economics -> 401', programmeCodeOf('Home Economics') === '401');
check('Visual Arts -> 402', programmeCodeOf('Visual Arts') === '402');
check('General Arts -> 501', programmeCodeOf('General Arts') === '501');
check('General Science -> 502', programmeCodeOf('General Science') === '502');
check('STEM -> 503', programmeCodeOf('STEM') === '503');
check('Languages alias -> 504', programmeCodeOf('Languages') === '504');
check('matching ignores case and extra spaces', programmeCodeOf('  general   science ') === '502');
check('every official group has a three-digit code', Object.values(PROGRAMME_GROUP_CODES).every((c) => /^[0-9]{3}$/.test(c)));
check('a trade programme has no invented code', programmeCodeOf('Welding & Fabrication Technology') === null);
check('a technical subject has no invented code', programmeCodeOf('Woodwork') === null);
check('an empty programme has no code', programmeCodeOf('') === null && programmeCodeOf(null) === null);
check('code info reports availability honestly', programmeCodeInfo('General Science').available === true && programmeCodeInfo('Woodwork').available === false);

// ---- Parse check -------------------------------------------------------

console.log('\n== Module parse check ==');

async function parses(path) {
    try {
        await import(new URL(path, import.meta.url));
        return true;
    } catch (error) {
        // review.js touches window/document at import time in Node.
        if (error && error.name === 'ReferenceError') return true;
        console.error(`  ${path}: ${error && error.name}: ${error && error.message}`);
        return false;
    }
}

for (const file of [
    '../js/review-model.js',
    '../js/review.js',
    '../js/pathways.js',
    '../js/validation.js',
    '../js/programme-codes.js',
    '../js/candidate-state.js'
]) {
    check(`parses: ${file}`, await parses(file));
}

// ---- Summary -----------------------------------------------------------

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exitCode = 1;
