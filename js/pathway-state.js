// ========================================
// Pathway state + persistence (Phase 6)
// ========================================
// Holds the chosen pathway (general / TVET / STEM / SEN) and persists it to
// localStorage so the workflow resumes on the same pathway. No DOM, no side
// effects beyond the storage read/write.

import { PATHWAY_IDS, DEFAULT_PATHWAY_ID, getPathway } from './pathways.js';

const STORAGE_KEY = 'ssg.selection.pathway.v1';

/** Load the saved pathway id, falling back to the general pathway. */
export function loadPathway() {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return DEFAULT_PATHWAY_ID;
        const parsed = JSON.parse(raw);
        const id = typeof parsed === 'string' ? parsed : parsed && parsed.pathway;
        return PATHWAY_IDS.includes(id) ? id : DEFAULT_PATHWAY_ID;
    } catch (error) {
        return DEFAULT_PATHWAY_ID;
    }
}

export function savePathway(pathwayId) {
    try {
        window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ pathway: getPathway(pathwayId).id })
        );
    } catch (error) {
        // Private browsing or storage disabled: the pathway simply will not
        // persist. Not worth interrupting the user for.
    }
}

export function clearSavedPathway() {
    try {
        window.localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        // ignore
    }
}

export default {
    STORAGE_KEY,
    loadPathway,
    savePathway,
    clearSavedPathway
};
