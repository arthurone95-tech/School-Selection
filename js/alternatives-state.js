// ========================================
// Alternative choices state (Phase 5)
// ========================================
// Holds the two alternative choices (one Category B, one Category C) and
// persists them to localStorage alongside the five main choices, so a
// candidate does not lose them during normal navigation (project decision Q3).
// This module has no DOM dependencies and no validation rules: it only manages
// the two slots and guards the structural limits. Rule checking lives in
// js/alternatives.js.
//
// Each alternative carries exactly the same information the official form
// prints for a choice: the school, a programme and a Day/Boarding preference
// (see the register's Appendix 6 "Alternative School Choices" form, whose
// columns are School Code, School Name, Category, Programme Code, Programme
// Name and Day/Boarding - the same columns as the five main choices).
//
// State shape:
//   {
//     b: { schoolId: number, programme: string|null, residential: 'Day'|'Boarding'|null } | null,
//     c: { ... } | null
//   }
//
// The two slots are fixed (one B, one C). The unresolved question about the
// number of Category B alternatives is surfaced as a caveat by js/alternatives.js
// rather than being silently settled here.

export const ALTERNATIVE_SLOTS = [
    { slot: 'b', category: 'B', label: 'Category B alternative' },
    { slot: 'c', category: 'C', label: 'Category C alternative' }
];

export const ALTERNATIVE_COUNT = ALTERNATIVE_SLOTS.length;

const STORAGE_KEY = 'ssg.selection.alternatives.v1';

const SLOT_KEYS = ALTERNATIVE_SLOTS.map((entry) => entry.slot);

// ---------------------------------------------------------------
// Construction / persistence
// ---------------------------------------------------------------

export function createEmptyAlternatives() {
    return { b: null, c: null };
}

function normaliseResidential(value) {
    return value === 'Day' || value === 'Boarding' ? value : null;
}

function normaliseProgramme(value) {
    return typeof value === 'string' && value ? value : null;
}

/**
 * Normalise one stored slot. `validIds` (a Set of school ids) lets restored
 * schools that are no longer part of the prototype subset be dropped rather
 * than shown as broken records. A repeated id can never be restored into both
 * slots.
 */
function normaliseSlot(raw, validIds, used) {
    if (!raw || typeof raw !== 'object') return null;
    const schoolId = Number(raw.schoolId);
    if (!Number.isInteger(schoolId)) return null;
    if (validIds && !validIds.has(schoolId)) return null;
    if (used && used.has(schoolId)) return null;
    return {
        schoolId,
        programme: normaliseProgramme(raw.programme),
        residential: normaliseResidential(raw.residential)
    };
}

export function loadAlternatives(validIds) {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return createEmptyAlternatives();
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return createEmptyAlternatives();
        const used = new Set();
        const result = createEmptyAlternatives();
        for (const key of SLOT_KEYS) {
            const slot = normaliseSlot(parsed[key], validIds, used);
            if (slot) {
                result[key] = slot;
                used.add(slot.schoolId);
            }
        }
        return result;
    } catch (error) {
        return createEmptyAlternatives();
    }
}

export function saveAlternatives(state) {
    const payload = {};
    for (const key of SLOT_KEYS) {
        const slot = state ? state[key] : null;
        payload[key] = slot
            ? { schoolId: slot.schoolId, programme: slot.programme, residential: slot.residential }
            : null;
    }
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
        // Private browsing or storage disabled: alternatives simply will not
        // persist. Not worth interrupting the user.
    }
}

export function clearSavedAlternatives() {
    try {
        window.localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        // ignore
    }
}

// ---------------------------------------------------------------
// Queries
// ---------------------------------------------------------------

/** The stored slot entry ({schoolId, programme, residential}) or null. */
export function alternativeAt(state, slot) {
    if (!SLOT_KEYS.includes(slot)) return null;
    return state && state[slot] ? state[slot] : null;
}

/** School ids currently used by either alternative slot. */
export function alternativeIds(state) {
    return SLOT_KEYS.map((key) => (state[key] ? state[key].schoolId : null)).filter((id) =>
        Number.isInteger(id)
    );
}

export function isAlternative(state, schoolId) {
    return alternativeIds(state).includes(schoolId);
}

/** Returns 'b', 'c', or null. */
export function alternativeSlotOf(state, schoolId) {
    for (const key of SLOT_KEYS) {
        if (state[key] && state[key].schoolId === schoolId) return key;
    }
    return null;
}

export function filledCount(state) {
    return alternativeIds(state).length;
}

// ---------------------------------------------------------------
// Mutations (return { ok, reason, state })
// ---------------------------------------------------------------

export function setAlternative(state, slot, schoolId) {
    if (!SLOT_KEYS.includes(slot)) {
        return { ok: false, reason: 'Unknown alternative slot.', state };
    }
    const id = Number(schoolId);
    if (!Number.isInteger(id)) {
        return { ok: false, reason: 'Choose a school first.', state };
    }
    const other = slot === 'b' ? 'c' : 'b';
    if (state[other] && state[other].schoolId === id) {
        return { ok: false, reason: 'That school is already your other alternative choice.', state };
    }
    // Re-selecting the same school keeps its programme / Day-Boarding choice;
    // a different school starts blank.
    if (state[slot] && state[slot].schoolId === id) {
        return { ok: true, state: { ...state } };
    }
    return { ok: true, state: { ...state, [slot]: { schoolId: id, programme: null, residential: null } } };
}

/** Update the programme or Day/Boarding of a filled slot. */
export function updateAlternative(state, slot, patch = {}) {
    if (!SLOT_KEYS.includes(slot)) {
        return { ok: false, reason: 'Unknown alternative slot.', state };
    }
    if (!state[slot]) {
        return { ok: false, reason: 'Choose a school first.', state };
    }
    const next = { ...state, [slot]: { ...state[slot] } };
    if (Object.prototype.hasOwnProperty.call(patch, 'programme')) {
        next[slot].programme = normaliseProgramme(patch.programme);
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'residential')) {
        next[slot].residential = normaliseResidential(patch.residential);
    }
    return { ok: true, state: next };
}

export function clearAlternative(state, slot) {
    if (!SLOT_KEYS.includes(slot)) {
        return { ok: false, reason: 'Unknown alternative slot.', state };
    }
    if (state[slot] === null) return { ok: true, state };
    return { ok: true, state: { ...state, [slot]: null } };
}

export function clearAlternatives() {
    return { ok: true, state: createEmptyAlternatives() };
}

export default {
    ALTERNATIVE_SLOTS,
    ALTERNATIVE_COUNT,
    createEmptyAlternatives,
    loadAlternatives,
    saveAlternatives,
    clearSavedAlternatives,
    alternativeAt,
    alternativeIds,
    isAlternative,
    alternativeSlotOf,
    filledCount,
    setAlternative,
    updateAlternative,
    clearAlternative,
    clearAlternatives
};
