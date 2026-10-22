// ========================================
// Phase 6 - special pathway logic tests (headless)
// ========================================
// Exercises the pure pathway modules against real data. Run with:
//   node scripts/phase6_pathway_tests.mjs
//
// These tests assert the classifications documented in docs/PHASE6_REPORT.md:
//   - the Phase 4/5 subset is unchanged;
//   - eligibility for each pathway is data-driven and correct;
//   - the general pathway still uses the confirmed Phase 4 rules;
//   - the special pathways enforce only school eligibility + the five distinct
//     choices, and report the unresolved general-limit interaction as
//     "needs-verification" (never a silent pass).

import {
    getPrototypeSchools,
    checkPrototypeData
} from '../js/prototype-schools.js';
import {
    PATHWAY_IDS,
    DEFAULT_PATHWAY_ID,
    PATHWAY_EXTRA_SCHOOL_IDS,
    PATHWAYS,
    getPathway,
    isPathwayEligible,
    getSelectionPool,
    visibleSchoolsForPathway,
    pathwayCoverage,
    checkPathwayData
} from '../js/pathways.js';
import { validateSelection } from '../js/validation.js';
import { loadPathway } from '../js/pathway-state.js';

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

function programmeFor(id) {
    const school = byId.get(id);
    return school && school.programmes.length ? school.programmes[0] : null;
}

function choice(id, residential) {
    return { schoolId: id, programme: programmeFor(id), residential: residential || null };
}

function stateOf(...choices) {
    return { choices };
}

// ---- Configuration integrity ------------------------------------------

console.log('\n== Pathway configuration ==');
check('Phase 4 subset is unchanged at 27 schools', baseSchools.length === 27, `got ${baseSchools.length}`);
check('checkPrototypeData() still reports no problems', checkPrototypeData().length === 0, JSON.stringify(checkPrototypeData()));
check('checkPathwayData() reports no problems', checkPathwayData().length === 0, JSON.stringify(checkPathwayData()));
check('pathway ids are general/tvet/stem/sen', PATHWAY_IDS.join(',') === 'general,tvet,stem,sen', PATHWAY_IDS.join(','));
check('default pathway is general', DEFAULT_PATHWAY_ID === 'general');
check('pool = base + extras', pool.length === 27 + PATHWAY_EXTRA_SCHOOL_IDS.length, `pool ${pool.length}`);

const coverage = pathwayCoverage();
check('general pathway offers the 27 base schools', coverage.general === 27, String(coverage.general));
// 8 base TVET institutes plus the SEN extra id 420, which is itself a TVET institute.
check('tvet pathway offers 9 TVET institutes', coverage.tvet === 9, String(coverage.tvet));
check('stem pathway offers at least 5 schools', coverage.stem >= 5, String(coverage.stem));
check('sen pathway offers at least 5 schools', coverage.sen >= 5, String(coverage.sen));

const extraIds = new Set();
let extrasUnique = true;
let extrasNotInBase = true;
let extrasEligible = true;
const baseIds = new Set(baseSchools.map((school) => school.id));
for (const entry of PATHWAY_EXTRA_SCHOOL_IDS) {
    if (extraIds.has(entry.id)) extrasUnique = false;
    extraIds.add(entry.id);
    if (baseIds.has(entry.id)) extrasNotInBase = false;
    const record = byId.get(entry.id);
    if (!record || !getPathway(entry.pathway).eligibility(record)) extrasEligible = false;
}
check('extra school ids are unique', extrasUnique);
check('extra school ids are not already in the base subset', extrasNotInBase);
check('every extra school is eligible for its declared pathway', extrasEligible);

// ---- Eligibility + visibility -----------------------------------------

console.log('\n== Eligibility + visibility ==');
const generalVisible = visibleSchoolsForPathway('general');
const tvetVisible = visibleSchoolsForPathway('tvet');
const stemVisible = visibleSchoolsForPathway('stem');
const senVisible = visibleSchoolsForPathway('sen');

check('general shows exactly the base subset', generalVisible.length === 27 && generalVisible.every((s) => baseIds.has(s.id)));
check('tvet shows only TVET institutes', tvetVisible.length > 0 && tvetVisible.every((s) => s.schoolType === 'TVET'));
check('stem shows only Appendix 5 schools', stemVisible.length > 0 && stemVisible.every((s) => s.appendices.includes('Appendix 5')));
check('sen shows only Appendix 4 schools', senVisible.length > 0 && senVisible.every((s) => s.appendices.includes('Appendix 4')));
check('isPathwayEligible(tvet) rejects a non-TVET school', !isPathwayEligible(byId.get(524), 'tvet'));
check('isPathwayEligible(stem) accepts an Appendix 5 school', isPathwayEligible(byId.get(601), 'stem'));
check('isPathwayEligible(sen) rejects a non-SEN school', !isPathwayEligible(byId.get(524), 'sen'));
check('general eligibility follows the base subset (extra rejected)', !isPathwayEligible(byId.get(407), 'general'));

// ---- Validation: general pathway is unchanged -------------------------

console.log('\n== Validation: general pathway (Phase 4 rules) ==');
const generalClean = stateOf(
    choice(524, 'Boarding'),
    choice(225, 'Day'),
    choice(526, 'Day'),
    choice(306, 'Boarding'),
    choice(411, 'Boarding')
);
let v = validateSelection(generalClean, byId);
check('general clean selection is valid', v.overall === 'valid', v.overall);
check('  no pending items', v.pending.length === 0, JSON.stringify(v.pending));
check('  result reports the pathway id', v.pathway === 'general', v.pathway);
const vExplicit = validateSelection(generalClean, byId, { pathway: 'general' });
check('explicit general matches the default', vExplicit.overall === v.overall && vExplicit.checks.length === v.checks.length);
const vUnknown = validateSelection(generalClean, byId, { pathway: 'nonsense' });
check('unknown pathway id falls back to general', vUnknown.overall === 'valid', vUnknown.overall);

// A STEM extra chosen under the general pathway is not in the documented subset.
v = validateSelection(stateOf(choice(407, 'Boarding')), byId);
check('a pathway-extra school is invalid under general', v.overall === 'invalid', v.overall);
check('  reason is pathway eligibility', v.errors.some((e) => e.checkId === 'pathway-eligibility'));

// ---- Validation: TVET pathway -----------------------------------------

console.log('\n== Validation: TVET pathway ==');
// Category A, Boarding-only.
const tvetClean = stateOf(
    choice(403, 'Boarding'),
    choice(225, 'Day'),
    choice(632, 'Boarding'),
    choice(697, 'Day'),
    choice(904, 'Boarding')
);
v = validateSelection(tvetClean, byId, { pathway: 'tvet' });
check('complete TVET selection has no errors', v.errors.length === 0, JSON.stringify(v.errors));
check('complete TVET selection has no missing fields', v.missingRequired.length === 0, JSON.stringify(v.missingRequired));
check('complete TVET selection is needs-verification', v.overall === 'needs-verification', v.overall);
check('  reason is the pathway limits note', v.pending.some((p) => p.checkId === 'pathway-limits'));
check('  category checks are pending (not enforced)', v.checks.find((c) => c.id === 'category-a').status === 'pending');
check('  residential split is pending (not enforced)', v.checks.find((c) => c.id === 'residential-split').status === 'pending');
check('  pathway eligibility check passes', v.checks.find((c) => c.id === 'pathway-eligibility').status === 'pass');

// Residential split is not enforced for TVET: 4 Boarding / 1 Day is not invalid.
v = validateSelection(
    stateOf(
        choice(403, 'Boarding'),
        choice(225, 'Day'),
        choice(632, 'Boarding'),
        choice(697, 'Boarding'),
        choice(904, 'Boarding')
    ),
    byId,
    { pathway: 'tvet' }
);
check('TVET does not fail the general residential split', !v.errors.some((e) => e.checkId === 'residential-split'), JSON.stringify(v.errors));

// A non-TVET school makes the TVET selection invalid.
v = validateSelection(stateOf(choice(524, 'Boarding')), byId, { pathway: 'tvet' });
check('non-TVET school is invalid for the TVET pathway', v.overall === 'invalid', v.overall);
check('  reason is pathway eligibility', v.errors.some((e) => e.checkId === 'pathway-eligibility'));

// ---- Validation: STEM pathway -----------------------------------------

console.log('\n== Validation: STEM pathway ==');
const stemClean = stateOf(
    choice(601, 'Boarding'),
    choice(526, 'Day'),
    choice(527, 'Day'),
    choice(236, 'Boarding'),
    choice(488, 'Boarding')
);
v = validateSelection(stemClean, byId, { pathway: 'stem' });
check('complete STEM selection has no errors', v.errors.length === 0, JSON.stringify(v.errors));
check('complete STEM selection is needs-verification', v.overall === 'needs-verification', v.overall);
check('  reason is the pathway limits note', v.pending.some((p) => p.checkId === 'pathway-limits'));
v = validateSelection(stateOf(choice(524, 'Boarding')), byId, { pathway: 'stem' });
check('non-Appendix-5 school is invalid for the STEM pathway', v.overall === 'invalid', v.overall);
check('  reason is pathway eligibility', v.errors.some((e) => e.checkId === 'pathway-eligibility'));

// ---- Validation: SEN pathway ------------------------------------------

console.log('\n== Validation: SEN pathway ==');
const senClean = stateOf(
    choice(482),
    choice(269),
    choice(420),
    choice(749),
    choice(868)
);
v = validateSelection(senClean, byId, { pathway: 'sen' });
check('complete SEN selection has no errors', v.errors.length === 0, JSON.stringify(v.errors));
check('SEN does not require a programme or residential choice', v.missingRequired.length === 0, JSON.stringify(v.missingRequired));
check('complete SEN selection is needs-verification', v.overall === 'needs-verification', v.overall);
check('  programme check is pending (not enforced)', v.checks.find((c) => c.id === 'programme').status === 'pending');
v = validateSelection(stateOf(choice(524, 'Boarding')), byId, { pathway: 'sen' });
check('non-Appendix-4 school is invalid for the SEN pathway', v.overall === 'invalid', v.overall);
check('  reason is pathway eligibility', v.errors.some((e) => e.checkId === 'pathway-eligibility'));

// ---- Persistence helper -----------------------------------------------

console.log('\n== Pathway persistence helper ==');
check('loadPathway falls back to general without storage', loadPathway() === 'general', loadPathway());

// ---- Rule metadata -----------------------------------------------------

console.log('\n== Pathway metadata ==');
check('general pathway is marked confirmed', PATHWAYS.general.status === 'confirmed');
check(
    'special pathways are marked needs-verification',
    ['tvet', 'stem', 'sen'].every((id) => PATHWAYS[id].status === 'needs-verification')
);
check(
    'special pathways carry an official quote and a note',
    ['tvet', 'stem', 'sen'].every((id) => PATHWAYS[id].official && PATHWAYS[id].note)
);

// ---- Summary -----------------------------------------------------------

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exitCode = 1;
