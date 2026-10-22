// ========================================
// School search and filtering (Phase 4)
// ========================================
// Pure helpers for finding a school in the prototype subset. Filtering helps a
// candidate discover options; it does not by itself prove a choice is valid —
// that is decided by js/validation.js.
//
// Products Specification section 9: filtering must reflect actual data and must
// not replace validation.

function textIncludes(haystack, needle) {
    return String(haystack || '').toLowerCase().includes(needle);
}

/** True when a school matches a free-text query. */
export function matchesQuery(school, query) {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return true;
    return (
        textIncludes(school.name, q) ||
        textIncludes(school.region, q) ||
        textIncludes(school.location, q) ||
        textIncludes(school.code, q)
    );
}

/** Build the option lists used by the filter controls. */
export function getFilterOptions(schools) {
    const regions = new Set();
    const types = new Set();
    const programmes = new Set();
    for (const school of schools) {
        if (school.region) regions.add(school.region);
        if (school.schoolType) types.add(school.schoolType);
        for (const programme of school.programmes) programmes.add(programme);
    }
    const sort = (set) => [...set].sort((a, b) => a.localeCompare(b));
    return {
        regions: sort(regions),
        types: sort(types),
        categories: [
            { value: 'A', label: 'Category A' },
            { value: 'B', label: 'Category B' },
            { value: 'C', label: 'Category C' }
        ],
        residential: [
            { value: 'Day', label: 'Offers Day' },
            { value: 'Boarding', label: 'Offers Boarding' }
        ],
        programmes: sort(programmes)
    };
}

/**
 * Apply a filter set to a list of schools.
 *
 * @param {Array} schools
 * @param {{query?:string, region?:string, category?:string, type?:string,
 *          residential?:string, programme?:string}} filters
 */
export function filterSchools(schools, filters = {}) {
    const { query = '', region = '', category = '', type = '', residential = '', programme = '' } = filters;
    const filtered = schools.filter((school) => {
        if (!matchesQuery(school, query)) return false;
        if (region && school.region !== region) return false;
        if (category && school.category !== category) return false;
        if (type && school.schoolType !== type) return false;
        if (residential) {
            const options = school.residentialOptions || [];
            if (!options.includes(residential)) return false;
        }
        if (programme && !school.programmes.includes(programme)) return false;
        return true;
    });
    return filtered.sort((a, b) => {
        if (a.region !== b.region) return a.region.localeCompare(b.region);
        return a.name.localeCompare(b.name);
    });
}

export default { matchesQuery, getFilterOptions, filterSchools };
