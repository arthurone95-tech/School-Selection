// ========================================
// Candidate details state (review form)
// ========================================
// The review page reproduces the official placement form. The school-related
// parts of the form are filled automatically from the saved selection (the five
// main choices plus the two alternatives). The candidate-specific fields cannot
// be derived from the selection, so the candidate types them once in the review
// page's "Your details" panel and they appear on the form.
//
// Privacy (docs/PRODUCT_SPECIFICATION.md, section 15):
//   - what: candidate name, BECE index number, JHS name, gender, district,
//     region, residential location, parent/guardian name and contact, date and
//     the headteacher's contact;
//   - why: only to fill the printable placement form;
//   - where: this browser's localStorage (key ssg.review.candidate.v1); nothing
//     is sent anywhere;
//   - who: only this browser/profile can read it;
//   - how to delete: clear the fields in the review page, or clear the site's
//     data in the browser.
//
// Signature and stamp fields are deliberately NOT part of this state. A typed
// value must never stand in for a real signature, stamp or validation
// (Official Guidelines 22-24; docs/OFFICIAL_GUIDELINES.md).

const STORAGE_KEY = 'ssg.review.candidate.v1';

const MAX_LENGTH = 120;

// The fields the candidate fills in. `key` is also the id used by the matching
// value on the form (pf-<key>). The order here is the order in the panel.
//
// `type: 'select'` renders a drop-down instead of a text box, so the candidate
// picks from a list rather than typing free text (Region and Gender are
// drop-downs). Gender's list is fixed; Region's list comes from the dataset's
// own region list (js/school-data.js getRegions()), which js/review.js injects.
export const CANDIDATE_FIELDS = [
    { key: 'candidate', label: "Candidate's name", autocomplete: 'name', wide: true },
    { key: 'index', label: 'BECE index number', autocomplete: 'off' },
    { key: 'jhs', label: 'Name of JHS', autocomplete: 'off' },
    { key: 'gender', label: 'Gender', autocomplete: 'sex', type: 'select', options: ['Male', 'Female'] },
    { key: 'district', label: 'District', autocomplete: 'address-level2' },
    { key: 'region', label: 'Region', autocomplete: 'address-level1', type: 'select', optionsFrom: 'regions' },
    {
        key: 'location',
        label: 'Residential location (suburb / town / village)',
        autocomplete: 'address-level3',
        wide: true
    },
    { key: 'parent', label: 'Name of parent / guardian', autocomplete: 'off' },
    { key: 'contact', label: 'Parent / guardian contact', autocomplete: 'tel' },
    { key: 'date', label: 'Date', autocomplete: 'off' },
    { key: 'hcontact', label: "Headteacher's contact", autocomplete: 'off' }
];

const KEYS = CANDIDATE_FIELDS.map((field) => field.key);

export function createEmptyCandidate() {
    const empty = {};
    for (const key of KEYS) empty[key] = '';
    return empty;
}

function clamp(value) {
    return typeof value === 'string' ? value.slice(0, MAX_LENGTH) : '';
}

/** Load the saved details, ignoring anything that is not a known text field. */
export function loadCandidate() {
    const result = createEmptyCandidate();
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return result;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return result;
        for (const key of KEYS) {
            result[key] = clamp(parsed[key]);
        }
    } catch (error) {
        // Corrupt or unavailable storage: start from empty rather than fail.
        return createEmptyCandidate();
    }
    return result;
}

export function saveCandidate(state) {
    const payload = {};
    for (const key of KEYS) payload[key] = clamp(state ? state[key] : '');
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
        // Private browsing or storage disabled: the details simply will not
        // persist. Not worth interrupting the user.
    }
}

export function clearCandidate() {
    try {
        window.localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        // ignore
    }
}

export default {
    CANDIDATE_FIELDS,
    createEmptyCandidate,
    loadCandidate,
    saveCandidate,
    clearCandidate
};
