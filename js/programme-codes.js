// ========================================
// Programme codes (official programme-group codes)
// ========================================
// The placement form has a "Programme Code" column. The code shown for a
// programme is the school's programme-group code, taken from the 2025 register.
//
// Source (authoritative): the register prints the programme-group codes as the
// column headers of the SHS/SHTS school lists (register pages 6-31). They are
// reproduced verbatim in:
//   - docs/DATA_EXTRACTION.md, section 6
//   - docs/SELECTION_RULES_AND_CLASSIFICATION.md, section 4
//
//   101 Agriculture      401 Home Economics   502 General Science
//   201 Business         402 Visual Arts       503 STEM
//   301 Technical        501 General Arts      504 Language
//
// Important limitation (see docs/DATA_EXTRACTION.md section 6): the register
// shows which programmes a school offers with a mark in the relevant column,
// and those per-school marks are NOT present in the supplied scan. This module
// therefore only maps the *programme-group* codes above. It does not invent a
// code for a programme that is not one of those official group names.
//
// Technical Institution (Appendix 1) trade programmes (e.g. "Welding &
// Fabrication Technology") and Senior High Technical School (Appendix 2)
// elective technical subjects (e.g. "Woodwork") have their own trade codes in
// the register's Appendix 1 header, but those codes are printed as vertical
// column headings that the scan's OCR could not read, so no authoritative
// per-trade code is available. Those programmes resolve to `null` (the form's
// code cell stays blank) rather than a guessed code.

// Canonical official programme-group names and their register codes.
export const PROGRAMME_GROUP_CODES = {
    Agriculture: '101',
    Business: '201',
    Technical: '301',
    'Home Economics': '401',
    'Visual Arts': '402',
    'General Arts': '501',
    'General Science': '502',
    STEM: '503',
    Language: '504'
};

// Documented spelling variants of an official group name. Each entry is an
// alias of an official group; it is never a guess at a different code.
const ALIASES = {
    Languages: 'Language' // the register header uses both spellings
};

export const PROGRAMME_CODE_SOURCE =
    '2025 register programme-group codes (column headers, register pages 6-31).';

/** Normalise a programme name for matching (trim + collapse internal spaces). */
function normalise(name) {
    return typeof name === 'string' ? name.trim().replace(/\s+/g, ' ') : '';
}

/**
 * The official programme-group code for a programme name, or `null` when the
 * name is not one of the official programme groups (no code is invented).
 *
 * Matching is case-insensitive and ignores surrounding/inner extra whitespace.
 */
export function programmeCodeOf(name) {
    const key = normalise(name);
    if (!key) return null;
    const lower = key.toLowerCase();
    for (const [group, code] of Object.entries(PROGRAMME_GROUP_CODES)) {
        if (group.toLowerCase() === lower) return code;
    }
    for (const [alias, group] of Object.entries(ALIASES)) {
        if (alias.toLowerCase() === lower) return PROGRAMME_GROUP_CODES[group];
    }
    return null;
}

/** The official group name a code belongs to, or `null`. */
export function programmeGroupOf(code) {
    if (!code) return null;
    for (const [group, value] of Object.entries(PROGRAMME_GROUP_CODES)) {
        if (value === String(code)) return group;
    }
    return null;
}

/**
 * A small description of where a programme's code comes from, for UI notes.
 * `available` is false when the programme is not an official programme group
 * (for example a Technical Institute trade), so the caller can stay honest
 * about why the code cell is empty.
 */
export function programmeCodeInfo(name) {
    const code = programmeCodeOf(name);
    return {
        code,
        group: programmeGroupOf(code),
        available: code !== null,
        source: PROGRAMME_CODE_SOURCE
    };
}

export default {
    PROGRAMME_GROUP_CODES,
    PROGRAMME_CODE_SOURCE,
    programmeCodeOf,
    programmeGroupOf,
    programmeCodeInfo
};
