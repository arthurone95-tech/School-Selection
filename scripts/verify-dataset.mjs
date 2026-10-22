// Phase 1 verification: load js/school-data.js as a real ES module and sanity-check it.
// Usage: node scripts/verify-dataset.mjs
import { SCHOOLS_BY_REGION, getAllSchools, getRegions, getAllPrograms } from "../js/school-data.js";

const all = getAllSchools();
const regions = getRegions();

const uniqueIds = new Set(all.map(s => s.id));
const withCode = all.filter(s => s.code);
const noCode = all.filter(s => !s.code);
const withClassification = all.filter(s => Array.isArray(s.classification) && s.classification.length);
const withProgramsCodeField = all.filter(s => "programs_code" in s);
const labels = {};
for (const s of all) for (const l of (s.classification || [])) labels[l] = (labels[l] || 0) + 1;
const regionsCount = {};
for (const s of all) regionsCount[s.region] = (regionsCount[s.region] || 0) + 1;

const codeCount = {};
for (const s of withCode) codeCount[s.code] = (codeCount[s.code] || 0) + 1;
const dupCodes = Object.entries(codeCount).filter(([, n]) => n > 1);

console.log("=== ESM import OK ===");
console.log("regions          :", regions.length);
console.log("total records    :", all.length);
console.log("unique ids       :", uniqueIds.size);
console.log("with code        :", withCode.length);
console.log("without code     :", noCode.length);
console.log("with classif.    :", withClassification.length);
console.log("has programs_code:", withProgramsCodeField.length);
console.log("distinct programs:", getAllPrograms().length);
console.log("duplicate codes  :", dupCodes.length, JSON.stringify(dupCodes.slice(0, 10)));
console.log("labels           :", JSON.stringify(labels));
console.log("per-region       :", JSON.stringify(regionsCount));
