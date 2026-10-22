// ========================================
// Selection state (Phase 4)
// ========================================
// Holds the five ranked main choices and persists them to localStorage so a
// candidate does not lose their work during normal navigation (project decision
// Q3). This module has no DOM dependencies and no validation rules: it only
// manages structure (order, add/remove/move/replace) and guards the structural
// limits. Rule checking lives in js/validation.js.
//
// State shape:
//   {
//     choices: [
//       { schoolId: number, programme: string|null, residential: 'Day'|'Boarding'|null },
//       ...                       // index 0 is Choice 1 (most preferred)
//     ]
//   }

export const MAX_MAIN_CHOICES = 5;

const STORAGE_KEY = 'ssg.selection.main.v1';

// ---------------------------------------------------------------
// Construction / persistence
// ---------------------------------------------------------------

export function createEmptyState() {
    return { choices: [] };
}

function normaliseChoice(raw, validIds) {
    if (!raw || typeof raw !== 'object') return null;
    const schoolId = Number(raw.schoolId);
    if (!Number.isInteger(schoolId)) return null;
    if (validIds && !validIds.has(schoolId)) return null;
    const programme = typeof raw.programme === 'string' && raw.programme ? raw.programme : null;
    const residential =
        raw.residential === 'Day' || raw.residential === 'Boarding' ? raw.residential : null;
    return { schoolId, programme, residential };
}

/**
 * Load a saved state. `validIds` (a Set of school ids) lets restored choices
 * that are no longer part of the prototype subset be dropped rather than shown
 * as broken records.
 */
export function loadState(validIds) {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return createEmptyState();
        const parsed = JSON.parse(raw);
        if (!parsed || !Array.isArray(parsed.choices)) return createEmptyState();
        const choices = parsed.choices
            .map((choice) => normaliseChoice(choice, validIds))
            .filter(Boolean)
            .slice(0, MAX_MAIN_CHOICES);
        return { choices };
    } catch (error) {
        return createEmptyState();
    }
}

export function saveState(state) {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ choices: state.choices }));
    } catch (error) {
        // Private browsing or storage disabled: the selection simply will not
        // persist. This is not a problem the user needs to be interrupted for.
    }
}

export function clearSavedState() {
    try {
        window.localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        // ignore
    }
}

// ---------------------------------------------------------------
// Queries
// ---------------------------------------------------------------

export function isSelected(state, schoolId) {
    return state.choices.some((choice) => choice.schoolId === schoolId);
}

export function selectedIndex(state, schoolId) {
    return state.choices.findIndex((choice) => choice.schoolId === schoolId);
}

export function choiceAt(state, index) {
    return state.choices[index] || null;
}

// ---------------------------------------------------------------
// Mutations (return { ok, reason, state })
// ---------------------------------------------------------------

function clone(state) {
    return { choices: state.choices.map((choice) => ({ ...choice })) };
}

export function addChoice(state, schoolId) {
    if (state.choices.length >= MAX_MAIN_CHOICES) {
        return { ok: false, reason: 'All five main choices are already filled.', state };
    }
    if (isSelected(state, schoolId)) {
        return { ok: false, reason: 'That school is already one of your choices.', state };
    }
    const next = clone(state);
    next.choices.push({ schoolId, programme: null, residential: null });
    return { ok: true, state: next };
}

export function removeChoice(state, index) {
    if (index < 0 || index >= state.choices.length) {
        return { ok: false, reason: 'That choice no longer exists.', state };
    }
    const next = clone(state);
    next.choices.splice(index, 1);
    return { ok: true, state: next };
}

export function moveChoice(state, from, to) {
    if (from < 0 || from >= state.choices.length) {
        return { ok: false, reason: 'That choice no longer exists.', state };
    }
    if (to < 0 || to >= state.choices.length) {
        return { ok: false, reason: 'Cannot move the choice there.', state };
    }
    if (from === to) return { ok: true, state };
    const next = clone(state);
    const [moved] = next.choices.splice(from, 1);
    next.choices.splice(to, 0, moved);
    return { ok: true, state: next };
}

export function updateChoice(state, index, patch) {
    if (index < 0 || index >= state.choices.length) {
        return { ok: false, reason: 'That choice no longer exists.', state };
    }
    const next = clone(state);
    const choice = next.choices[index];
    if (Object.prototype.hasOwnProperty.call(patch, 'programme')) {
        choice.programme = patch.programme || null;
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'residential')) {
        choice.residential =
            patch.residential === 'Day' || patch.residential === 'Boarding' ? patch.residential : null;
    }
    return { ok: true, state: next };
}

/**
 * Replace the school at `index` with a different school, keeping the slot's
 * rank. Field values that no longer apply are cleared.
 */
export function replaceChoice(state, index, schoolId) {
    if (index < 0 || index >= state.choices.length) {
        return { ok: false, reason: 'That choice no longer exists.', state };
    }
    const existing = selectedIndex(state, schoolId);
    if (existing !== -1 && existing !== index) {
        return { ok: false, reason: 'That school is already one of your choices.', state };
    }
    const next = clone(state);
    next.choices[index] = { schoolId, programme: null, residential: null };
    return { ok: true, state: next };
}

export function clearChoices(state) {
    return { ok: true, state: createEmptyState() };
}

export default {
    MAX_MAIN_CHOICES,
    createEmptyState,
    loadState,
    saveState,
    clearSavedState,
    isSelected,
    selectedIndex,
    choiceAt,
    addChoice,
    removeChoice,
    moveChoice,
    updateChoice,
    replaceChoice,
    clearChoices
};
