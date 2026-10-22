// ========================================
// Selection workflow controller (Phase 4)
// ========================================
// Wires together the prototype subset (js/prototype-schools.js), the state
// (js/selection-state.js), the rules (js/validation.js) and search
// (js/school-search.js), and renders selection/index.html.
//
// The page chrome (header/nav/footer) is injected by js/layout.js, which is
// loaded before this module.

import {
    getPrototypeSchools,
    checkPrototypeData,
    FIELD_VERIFICATION
} from './prototype-schools.js';

import {
    MAX_MAIN_CHOICES,
    loadState,
    saveState,
    clearSavedState,
    addChoice,
    removeChoice,
    moveChoice,
    updateChoice,
    replaceChoice,
    clearChoices,
    isSelected,
    selectedIndex
} from './selection-state.js';

import { validateSelection, RULE_REFERENCES } from './validation.js';
import { getFilterOptions, filterSchools } from './school-search.js';

import {
    ALTERNATIVE_SLOTS,
    loadAlternatives,
    saveAlternatives,
    clearSavedAlternatives,
    setAlternative,
    updateAlternative,
    clearAlternative,
    alternativeSlotOf,
    filledCount
} from './alternatives-state.js';

import {
    ALTERNATIVE_RULES,
    alternativeEligibleSchools,
    validateAlternatives
} from './alternatives.js';

import {
    PATHWAY_IDS,
    PATHWAYS,
    getPathway,
    getSelectionPool,
    visibleSchoolsForPathway,
    pathwayCoverage,
    checkPathwayData
} from './pathways.js';

import { loadPathway, savePathway } from './pathway-state.js';

// ---- Small DOM helpers -------------------------------------------------

function el(tag, options = {}) {
    const node = document.createElement(tag);
    if (options.className) node.className = options.className;
    if (options.text !== undefined) node.textContent = options.text;
    if (options.attrs) {
        for (const [name, value] of Object.entries(options.attrs)) {
            if (value !== null && value !== undefined) node.setAttribute(name, value);
        }
    }
    if (options.children) {
        for (const child of options.children) {
            if (child) node.appendChild(child);
        }
    }
    return node;
}

const ICONS = {
    check:
        '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">' +
        '<path d="M5 12l4 4 10-10" fill="none" stroke="currentColor" stroke-width="2" ' +
        'stroke-linecap="round" stroke-linejoin="round"/></svg>',
    alert:
        '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">' +
        '<path d="M12 4l9 16H3L12 4Z" fill="none" stroke="currentColor" stroke-width="2" ' +
        'stroke-linejoin="round"/><path d="M12 10v4" fill="none" stroke="currentColor" ' +
        'stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg>',
    dot:
        '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">' +
        '<circle cx="12" cy="12" r="4" fill="currentColor"/></svg>',
    up:
        '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">' +
        '<path d="M12 19V5M6 11l6-6 6 6" fill="none" stroke="currentColor" stroke-width="2" ' +
        'stroke-linecap="round" stroke-linejoin="round"/></svg>',
    down:
        '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">' +
        '<path d="M12 5v14M6 13l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" ' +
        'stroke-linecap="round" stroke-linejoin="round"/></svg>',
    swap:
        '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">' +
        '<path d="M7 7h11l-3-3M17 17H6l3 3" fill="none" stroke="currentColor" stroke-width="2" ' +
        'stroke-linecap="round" stroke-linejoin="round"/></svg>',
    close:
        '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">' +
        '<path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2" ' +
        'stroke-linecap="round"/></svg>',
    plus:
        '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">' +
        '<path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2" ' +
        'stroke-linecap="round"/></svg>',
    chevron:
        '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">' +
        '<path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" ' +
        'stroke-linecap="round" stroke-linejoin="round"/></svg>'
};

function icon(name, className) {
    const span = el('span', { className: className || 'sel-icon' });
    span.innerHTML = ICONS[name] || '';
    return span;
}

function badgeClassForCategory(category) {
    if (category === 'A') return 'badge badge-category-a';
    if (category === 'B') return 'badge badge-category-b';
    if (category === 'C') return 'badge badge-category-c';
    return 'badge badge-neutral';
}

function categoryLabel(category) {
    return category ? `Category ${category}` : 'Category not recorded';
}

// ---- Data + state ------------------------------------------------------

// The Phase 4/5 prototype subset drives the alternatives (Appendix 3) and the
// general pathway. The Phase 6 pool adds the documented pathway schools so every
// special pathway can be completed from real records.
const baseSchools = getPrototypeSchools();
const pool = getSelectionPool();
const schoolsById = new Map(pool.map((school) => [school.id, school]));
const validIds = new Set(pool.map((school) => school.id));

let pathwayId = loadPathway();
let pathway = getPathway(pathwayId);

let state = loadState(validIds);
let alternatives = loadAlternatives(validIds);
let filters = { query: '', region: '', category: '', type: '', residential: '', programme: '' };
let replaceIndex = null;
// The full school list is tucked behind a drop-down until the user asks for it,
// so the page does not open with all schools dumped on screen at once.
let browseExpanded = false;

/** Schools currently offered for the selected pathway. */
function visibleSchools() {
    return visibleSchoolsForPathway(pathwayId);
}

function setPathway(id) {
    pathwayId = getPathway(id).id;
    pathway = getPathway(pathwayId);
    savePathway(pathwayId);
}

function persist() {
    saveState(state);
}

function persistAlternatives() {
    saveAlternatives(alternatives);
}

function announce(message) {
    const node = document.getElementById('sel-announcer');
    if (node) {
        node.textContent = '';
        // Force a change so repeated identical messages are still announced.
        window.setTimeout(() => {
            node.textContent = message;
        }, 10);
    }
}

// ---- Progress panel ----------------------------------------------------

function renderProgress(result) {
    const target = document.getElementById('sel-progress');
    if (!target) return;
    target.textContent = '';

    const { counts, remaining } = result;
    const pct = Math.round((counts.total / MAX_MAIN_CHOICES) * 100);

    const fill = el('span', { className: 'sel-progress-fill' });
    fill.style.width = `${pct}%`;
    const track = el('div', {
        className: 'sel-progress-track',
        attrs: {
            role: 'progressbar',
            'aria-label': 'Main choices filled',
            'aria-valuemin': '0',
            'aria-valuemax': String(MAX_MAIN_CHOICES),
            'aria-valuenow': String(counts.total)
        },
        children: [fill]
    });

    const stat = (label, value, extraClass) =>
        el('li', {
            className: 'sel-stat' + (extraClass ? ` ${extraClass}` : ''),
            children: [
                el('span', { className: 'sel-stat-value', text: value }),
                el('span', { className: 'sel-stat-label', text: label })
            ]
        });

    // The category and residential limits are only enforced for the general
    // pathway, so their "need/max" framing is dropped for the special pathways.
    const resEnforced = pathway.enforceResidentialSplit;
    const catEnforced = pathway.enforceCategoryLimits;
    const stats = [
        stat(resEnforced ? 'Boarding (need 3)' : 'Boarding', resEnforced ? `${counts.boarding} / 3` : String(counts.boarding)),
        stat(resEnforced ? 'Day (need 2)' : 'Day', resEnforced ? `${counts.day} / 2` : String(counts.day)),
        stat(catEnforced ? 'Category A (max 1)' : 'Category A', catEnforced ? `${counts.byCategory.A} / 1` : String(counts.byCategory.A)),
        stat(catEnforced ? 'Category B (max 2)' : 'Category B', catEnforced ? `${counts.byCategory.B} / 2` : String(counts.byCategory.B)),
        stat('Category C', String(counts.byCategory.C))
    ];

    target.appendChild(el('div', {
        className: 'sel-panel sel-progress',
        children: [
            el('h2', { className: 'sel-panel-title', text: `Your five ${pathway.shortLabel} choices` }),
            el('p', {
                className: 'sel-progress-text',
                attrs: { id: 'sel-progress-text' },
                text:
                    remaining === 0
                        ? 'All five choices are filled.'
                        : `${counts.total} of ${MAX_MAIN_CHOICES} chosen \u00b7 ${remaining} still to add.`
            }),
            track,
            el('ul', { className: 'sel-stat-list', children: stats })
        ]
    }));
}

// ---- Pathway selector --------------------------------------------------

function renderPathways() {
    const target = document.getElementById('sel-pathways');
    if (!target) return;
    target.textContent = '';
    const coverage = pathwayCoverage();

    for (const id of PATHWAY_IDS) {
        const config = PATHWAYS[id];
        const inputId = `pathway-${id}`;
        const count = coverage[id];
        const confirmed = config.status === 'confirmed';

        const input = el('input', {
            className: 'sel-pathway-input',
            attrs: { type: 'radio', name: 'pathway', id: inputId, value: id }
        });
        if (id === pathwayId) input.checked = true;
        input.addEventListener('change', () => {
            if (!input.checked || id === pathwayId) return;
            setPathway(id);
            announce(`Pathway set to ${config.label}.`);
            renderPathways();
            renderFilters();
            recompute();
        });

        target.appendChild(el('label', {
            className: 'sel-pathway' + (id === pathwayId ? ' sel-pathway--active' : ''),
            attrs: { for: inputId },
            children: [
                input,
                el('span', {
                    className: 'sel-pathway-body',
                    children: [
                        el('span', {
                            className: 'sel-pathway-head',
                            children: [
                                el('span', { className: 'sel-pathway-label', text: config.label }),
                                el('span', {
                                    className: `sel-chip ${confirmed ? 'sel-chip--pass' : 'sel-chip--verify'}`,
                                    text: confirmed ? 'Confirmed rules' : 'Needs verification'
                                }),
                                el('span', {
                                    className: 'sel-pathway-count',
                                    text: `${count} school${count === 1 ? '' : 's'} available`
                                })
                            ]
                        }),
                        el('span', { className: 'sel-pathway-desc', text: config.description })
                    ]
                })
            ]
        }));
    }
}

function renderPathwayNote() {
    const target = document.getElementById('sel-pathway-note');
    if (!target) return;
    target.textContent = '';

    if (pathwayId === 'general') {
        target.appendChild(el('p', {
            className: 'sel-pathway-note-text',
            text:
                'Five ranked choices: at most one Category A, at most two Category B, and three ' +
                'Boarding / two Day.'
        }));
        return;
    }

    target.appendChild(el('div', {
        className: 'sel-pathway-note',
        attrs: { role: 'note' },
        children: [
            el('blockquote', { className: 'sel-rule-quote', text: pathway.official }),
            el('p', {
                className: 'sel-field-note',
                text: `Eligible for this pathway: ${pathway.eligibilityLabel}.`
            })
        ]
    }));
}

// ---- Validation panel --------------------------------------------------

const OVERALL_META = {
    invalid: {
        label: 'Invalid',
        className: 'sel-overall--invalid',
        description: 'Some rules are broken. Fix the items below.'
    },
    incomplete: {
        label: 'Incomplete',
        className: 'sel-overall--incomplete',
        description: 'Some required choices or details are still missing.'
    },
    'needs-verification': {
        label: 'Needs verification',
        className: 'sel-overall--verify',
        description: 'No rule is broken, but some items still need checking.'
    },
    valid: {
        label: 'Valid',
        className: 'sel-overall--valid',
        description: 'Passes the rules checked here. Not an official approval.'
    }
};

const CHECK_ICON = { pass: 'check', fail: 'alert', pending: 'alert', open: 'dot' };

function renderValidation(result) {
    const target = document.getElementById('sel-validation');
    if (!target) return;
    target.textContent = '';

    const meta = OVERALL_META[result.overall] || OVERALL_META.incomplete;

    const panel = el('div', {
        className: 'sel-panel sel-validation',
        attrs: { 'aria-live': 'polite' },
        children: [
            el('h2', { className: 'sel-panel-title', text: 'Checks' }),
            el('p', {
                className: `sel-overall ${meta.className}`,
                children: [
                    icon(result.overall === 'invalid' ? 'alert' : result.overall === 'valid' ? 'check' : 'dot', 'sel-overall-icon'),
                    el('span', { className: 'sel-overall-label', text: meta.label })
                ]
            }),
            el('p', { className: 'sel-overall-desc', text: meta.description })
        ]
    });

    // Confirmed errors
    if (result.errors.length) {
        const list = el('ul', { className: 'sel-issue-list sel-issue-list--error' });
        for (const error of result.errors) {
            list.appendChild(el('li', { children: [icon('alert'), el('span', { text: error.message })] }));
        }
        panel.appendChild(el('div', {
            className: 'sel-issue-group',
            children: [el('h3', { className: 'sel-issue-heading', text: 'Problems' }), list]
        }));
    }

    // Missing required details
    if (result.missingRequired.length) {
        const list = el('ul', { className: 'sel-issue-list sel-issue-list--incomplete' });
        for (const item of result.missingRequired) {
            list.appendChild(el('li', { children: [icon('dot'), el('span', { text: item.message })] }));
        }
        panel.appendChild(el('div', {
            className: 'sel-issue-group',
            children: [el('h3', { className: 'sel-issue-heading', text: 'To complete' }), list]
        }));
    }

    // Needs-verification items
    if (result.pending.length) {
        const list = el('ul', { className: 'sel-issue-list sel-issue-list--verify' });
        for (const item of result.pending) {
            list.appendChild(el('li', { children: [icon('alert'), el('span', { text: item.message })] }));
        }
        panel.appendChild(el('div', {
            className: 'sel-issue-group',
            children: [
                el('h3', { className: 'sel-issue-heading', text: 'Needs verification' }),
                list
            ]
        }));
    }

    // Rule-by-rule checks
    const checkList = el('ul', { className: 'sel-check-list' });
    for (const check of result.checks) {
        checkList.appendChild(el('li', {
            className: `sel-check sel-check--${check.status}`,
            children: [
                icon(CHECK_ICON[check.status] || 'dot'),
                el('span', { className: 'sel-check-label', text: check.label }),
                el('span', { className: 'sel-check-detail', text: check.detail })
            ]
        }));
    }
    panel.appendChild(el('details', {
        className: 'sel-rules',
        children: [
            el('summary', { text: `Rule checks (${result.checks.length})` }),
            checkList
        ]
    }));

    // Official wording disclosure (kept separate from explanations)
    const details = el('details', { className: 'sel-rules' });
    details.appendChild(el('summary', { text: 'Rules used' }));
    const ruleList = el('ul', { className: 'sel-rule-list' });
    for (const rule of Object.values(RULE_REFERENCES)) {
        ruleList.appendChild(el('li', {
            className: `sel-rule sel-rule--${rule.status}`,
            children: [
                el('p', { className: 'sel-rule-title', text: rule.title }),
                el('blockquote', { className: 'sel-rule-quote', text: rule.official })
            ]
        }));
    }
    details.appendChild(ruleList);
    panel.appendChild(details);

    panel.appendChild(el('p', {
        className: 'sel-validate-link',
        children: [
            el('a', { attrs: { href: '../guidelines/index.html' }, text: 'Full guidelines' })
        ]
    }));

    target.appendChild(panel);
}

// ---- Tools panel -------------------------------------------------------

function renderTools(result) {
    const target = document.getElementById('sel-tools');
    if (!target) return;
    target.textContent = '';

    const clearBtn = el('button', {
        className: 'btn btn-small btn-outline sel-clear',
        attrs: { type: 'button' },
        text: 'Clear all choices'
    });
    clearBtn.disabled = result.counts.total === 0;
    clearBtn.addEventListener('click', () => {
        if (result.counts.total === 0) return;
        if (window.confirm('Remove all selected schools? This cannot be undone.')) {
            const res = clearChoices(state);
            state = res.state;
            clearSavedState();
            replaceIndex = null;
            persist();
            recompute();
            announce('All choices cleared.');
        }
    });

    target.appendChild(el('div', {
        className: 'sel-panel sel-tools',
        children: [
            el('h2', { className: 'sel-panel-title', text: 'Saved locally' }),
            el('p', {
                className: 'sel-tools-note',
                text: 'Saved in this browser only. Nothing is sent anywhere.'
            }),
            clearBtn
        ]
    }));
}

// ---- Alternative choices (Appendix 3) ----------------------------------

function renderAlternativeSlot(slotEntry, result) {
    const { slot, category, label } = slotEntry;
    const slotData = alternatives[slot];
    const schoolId = slotData && Number.isInteger(slotData.schoolId) ? slotData.schoolId : null;
    const school = schoolId !== null ? schoolsById.get(schoolId) || null : null;
    const programme = slotData ? slotData.programme || null : null;
    const residential = slotData ? slotData.residential || null : null;
    const perSlot = result.perSlot.find((entry) => entry.slot === slot) || { issues: [] };
    const titleId = `alt-${slot}-title`;

    const selectId = `alt-${slot}-select`;
    const select = el('select', {
        className: 'form-select sel-select',
        attrs: { id: selectId, 'data-slot': slot, 'aria-label': `Choose a ${label}` }
    });
    select.appendChild(el('option', { attrs: { value: '' }, text: `Choose a ${label}\u2026` }));

    const otherSlot = slot === 'b' ? 'c' : 'b';
    const otherId = alternatives[otherSlot] ? alternatives[otherSlot].schoolId : null;
    for (const candidate of alternativeEligibleSchools(baseSchools, category)) {
        const option = el('option', { attrs: { value: String(candidate.id) } });
        let suffix = '';
        if (otherId === candidate.id) {
            option.disabled = true;
            suffix = ' (used as your other alternative)';
        } else if (state.choices.some((choice) => choice.schoolId === candidate.id)) {
            option.disabled = true;
            suffix = ' (already a main choice)';
        }
        option.textContent = candidate.name + (candidate.region ? ` \u2014 ${candidate.region}` : '') + suffix;
        select.appendChild(option);
    }
    select.value = schoolId !== null ? String(schoolId) : '';
    select.addEventListener('change', () => {
        if (!select.value) {
            const res = clearAlternative(alternatives, slot);
            if (res.ok) {
                alternatives = res.state;
                persistAlternatives();
                recompute();
                announce(`${label} cleared.`);
            }
            return;
        }
        const res = setAlternative(alternatives, slot, select.value);
        if (res.ok) {
            alternatives = res.state;
            persistAlternatives();
            recompute();
            const chosen = schoolsById.get(Number(select.value));
            announce(`${chosen ? chosen.name : 'School'} set as the ${label.toLowerCase()}.`);
        } else {
            announce(res.reason);
        }
    });

    const children = [
        el('div', {
            className: 'sel-alt-head',
            children: [
                el('span', { className: badgeClassForCategory(category), text: `Category ${category}` }),
                el('h3', { className: 'sel-alt-title', attrs: { id: titleId }, text: label })
            ]
        }),
        el('div', {
            className: 'form-group sel-field',
            children: [
                el('label', { className: 'form-label', attrs: { for: selectId }, text: label }),
                select
            ]
        })
    ];

    if (school) {
        const offered = school.residentialOptions
            ? school.residentialOptions.join(' / ')
            : 'Not stated';
        children.push(el('dl', {
            className: 'sel-details',
            children: [
                detailItem('Region', school.region),
                detailItem('School code', school.code),
                detailItem('Type', school.schoolType),
                detailItem('Day / Boarding offered', offered),
                detailItem('Also listed in', school.appendices.length ? school.appendices.join(', ') : 'None')
            ]
        }));

        // The official form's "Alternative School Choices" section prints the
        // same columns as the main form - programme code, programme name and
        // Day/Boarding - so each alternative carries a programme and a
        // Day/Boarding preference, exactly like a main choice.
        const programmeSelect = el('select', {
            className: 'form-select sel-select',
            attrs: { id: `alt-${slot}-programme`, 'data-field': 'programme', 'data-slot': slot }
        });
        programmeSelect.appendChild(el('option', { attrs: { value: '' }, text: 'Select a programme\u2026' }));
        let programmeNote = null;
        if (school.programmes.length === 0) {
            programmeSelect.disabled = true;
            programmeSelect.textContent = '';
            programmeSelect.appendChild(el('option', { attrs: { value: '' }, text: 'Programme data not available' }));
            programmeNote = el('p', {
                className: 'sel-field-note',
                text: 'No programme list is available for this school.'
            });
        } else {
            for (const item of school.programmes) {
                programmeSelect.appendChild(el('option', { attrs: { value: item }, text: item }));
            }
            programmeSelect.value = programme || '';
            programmeSelect.addEventListener('change', () => {
                const res = updateAlternative(alternatives, slot, { programme: programmeSelect.value });
                if (res.ok) {
                    alternatives = res.state;
                    persistAlternatives();
                    recompute();
                }
            });
        }

        const programmeField = el('div', {
            className: 'form-group sel-field',
            children: [
                el('label', {
                    className: 'form-label',
                    attrs: { for: `alt-${slot}-programme` },
                    text: 'Programme'
                }),
                programmeSelect,
                programmeNote
            ]
        });

        const residentialSelect = el('select', {
            className: 'form-select sel-select',
            attrs: { id: `alt-${slot}-residential`, 'data-field': 'residential', 'data-slot': slot }
        });
        residentialSelect.appendChild(el('option', { attrs: { value: '' }, text: 'Select Day or Boarding\u2026' }));
        const options = school.residentialOptions;
        for (const value of options || ['Day', 'Boarding']) {
            residentialSelect.appendChild(el('option', { attrs: { value }, text: value }));
        }
        residentialSelect.value = residential || '';
        residentialSelect.addEventListener('change', () => {
            const res = updateAlternative(alternatives, slot, { residential: residentialSelect.value });
            if (res.ok) {
                alternatives = res.state;
                persistAlternatives();
                recompute();
            }
        });

        let residentialNote = null;
        if (!options) {
            residentialNote = el('p', {
                className: 'sel-field-note',
                text: 'Day/Boarding options are not available for this school.'
            });
        } else if (options.length === 1) {
            residentialNote = el('p', {
                className: 'sel-field-note',
                text: `This school offers ${options[0]} only.`
            });
        }

        const residentialField = el('div', {
            className: 'form-group sel-field',
            children: [
                el('label', {
                    className: 'form-label',
                    attrs: { for: `alt-${slot}-residential` },
                    text: 'Day or Boarding'
                }),
                residentialSelect,
                residentialNote
            ]
        });

        children.push(el('div', { className: 'sel-choice-fields', children: [programmeField, residentialField] }));
    } else {
        children.push(el('p', {
            className: 'sel-alt-empty',
            text: `No ${label.toLowerCase()} selected yet.`
        }));
    }

    const statusRow = el('div', { className: 'sel-choice-status' });
    if (perSlot.issues.length === 0 && school) {
        statusRow.appendChild(stateChip('pass', 'Alternative selected'));
    } else {
        for (const issue of perSlot.issues) {
            statusRow.appendChild(stateChip(issue.status, issue.message));
        }
    }
    children.push(statusRow);

    return el('article', {
        className: 'sel-alt-slot' + (school ? '' : ' sel-alt-slot--empty'),
        attrs: { 'aria-labelledby': titleId },
        children
    });
}

function renderAlternatives(result) {
    const target = document.getElementById('sel-alternatives');
    if (!target) return;
    target.textContent = '';
    for (const entry of ALTERNATIVE_SLOTS) {
        target.appendChild(renderAlternativeSlot(entry, result));
    }
}

function altIssueGroup(title, listClass, iconName, messages) {
    const list = el('ul', { className: `sel-issue-list ${listClass}` });
    for (const message of messages) {
        list.appendChild(el('li', { children: [icon(iconName), el('span', { text: message })] }));
    }
    return el('div', {
        className: 'sel-issue-group',
        children: [el('h3', { className: 'sel-issue-heading', text: title }), list]
    });
}

function renderAlternativesValidation(result) {
    const target = document.getElementById('sel-alternatives-validation');
    if (!target) return;
    target.textContent = '';

    const meta = OVERALL_META[result.overall] || OVERALL_META.incomplete;

    const panel = el('div', {
        className: 'sel-panel sel-validation sel-alt-validation',
        attrs: { 'aria-live': 'polite' },
        children: [
            el('h2', { className: 'sel-panel-title', text: 'Alternatives check' }),
            el('p', {
                className: `sel-overall ${meta.className}`,
                children: [
                    icon(result.overall === 'invalid' ? 'alert' : result.overall === 'valid' ? 'check' : 'dot', 'sel-overall-icon'),
                    el('span', { className: 'sel-overall-label', text: meta.label })
                ]
            }),
            el('p', { className: 'sel-overall-desc', text: meta.description })
        ]
    });

    if (result.errors.length) {
        panel.appendChild(altIssueGroup(
            'Problems',
            'sel-issue-list--error',
            'alert',
            result.errors.map((item) => item.message)
        ));
    }
    if (result.missingRequired.length) {
        panel.appendChild(altIssueGroup(
            'To complete',
            'sel-issue-list--incomplete',
            'dot',
            result.missingRequired.map((item) => item.message)
        ));
    }
    if (result.pending.length) {
        panel.appendChild(altIssueGroup(
            'Needs verification',
            'sel-issue-list--verify',
            'alert',
            result.pending.map((item) => item.message)
        ));
    }

    const checkList = el('ul', { className: 'sel-check-list' });
    for (const check of result.checks) {
        checkList.appendChild(el('li', {
            className: `sel-check sel-check--${check.status}`,
            children: [
                icon(CHECK_ICON[check.status] || 'dot'),
                el('span', { className: 'sel-check-label', text: check.label }),
                el('span', { className: 'sel-check-detail', text: check.detail })
            ]
        }));
    }
    panel.appendChild(el('details', {
        className: 'sel-rules',
        children: [
            el('summary', { text: `Rule checks (${result.checks.length})` }),
            checkList
        ]
    }));

    const details = el('details', { className: 'sel-rules' });
    details.appendChild(el('summary', { text: 'Rules used' }));
    const ruleList = el('ul', { className: 'sel-rule-list' });
    for (const rule of Object.values(ALTERNATIVE_RULES)) {
        ruleList.appendChild(el('li', {
            className: `sel-rule sel-rule--${rule.status}`,
            children: [
                el('p', { className: 'sel-rule-title', text: rule.title }),
                el('blockquote', { className: 'sel-rule-quote', text: rule.official })
            ]
        }));
    }
    details.appendChild(ruleList);
    panel.appendChild(details);

    if (filledCount(alternatives) > 0) {
        const clearBtn = el('button', {
            className: 'btn btn-small btn-outline sel-clear',
            attrs: { type: 'button' },
            text: 'Clear alternatives'
        });
        clearBtn.addEventListener('click', () => {
            alternatives = { b: null, c: null };
            clearSavedAlternatives();
            persistAlternatives();
            recompute();
            announce('Alternatives cleared.');
        });
        panel.appendChild(el('div', {
            className: 'sel-issue-group',
            children: [clearBtn]
        }));
    }

    target.appendChild(panel);
}

// ---- Choices -----------------------------------------------------------

function stateChip(status, label) {
    return el('span', {
        className: `sel-chip sel-chip--${status}`,
        children: [icon(status === 'incomplete' ? 'dot' : status === 'fail' ? 'alert' : 'alert'), el('span', { text: label })]
    });
}

function detailItem(term, value) {
    return el('div', {
        className: 'sel-detail',
        children: [
            el('dt', { className: 'sel-detail-term', text: term }),
            el('dd', { className: 'sel-detail-value', text: value || 'Not stated' })
        ]
    });
}

function renderChoiceCard(choice, index, result) {
    const school = schoolsById.get(choice.schoolId);
    const titleId = `choice-${index}-title`;
    const perChoice = result.perChoice[index] || { issues: [] };

    // Header
    const actions = el('div', { className: 'sel-choice-actions' });

    const upBtn = el('button', {
        className: 'btn btn-small btn-outline sel-action',
        attrs: { type: 'button', 'aria-label': `Move ${school.name} up one place` },
        children: [icon('up'), el('span', { className: 'sel-action-text', text: 'Up' })]
    });
    upBtn.disabled = index === 0;
    upBtn.addEventListener('click', () => {
        const res = moveChoice(state, index, index - 1);
        if (res.ok) {
            state = res.state;
            persist();
            recompute();
            announce(`${school.name} moved to choice ${index}.`);
        }
    });

    const downBtn = el('button', {
        className: 'btn btn-small btn-outline sel-action',
        attrs: { type: 'button', 'aria-label': `Move ${school.name} down one place` },
        children: [icon('down'), el('span', { className: 'sel-action-text', text: 'Down' })]
    });
    downBtn.disabled = index === state.choices.length - 1;
    downBtn.addEventListener('click', () => {
        const res = moveChoice(state, index, index + 1);
        if (res.ok) {
            state = res.state;
            persist();
            recompute();
            announce(`${school.name} moved to choice ${index + 2}.`);
        }
    });

    const replaceBtn = el('button', {
        className: 'btn btn-small btn-outline sel-action',
        attrs: { type: 'button', 'aria-label': `Replace ${school.name}` },
        children: [icon('swap'), el('span', { className: 'sel-action-text', text: 'Replace' })]
    });
    replaceBtn.addEventListener('click', () => {
        replaceIndex = index;
        renderReplaceNote();
        renderResults();
        const browse = document.getElementById('browse');
        if (browse) browse.scrollIntoView({ behavior: 'smooth', block: 'start' });
        announce(`Choosing a replacement for choice ${index + 1}.`);
    });

    const removeBtn = el('button', {
        className: 'btn btn-small btn-outline sel-action sel-action--danger',
        attrs: { type: 'button', 'aria-label': `Remove ${school.name}` },
        children: [icon('close'), el('span', { className: 'sel-action-text', text: 'Remove' })]
    });
    removeBtn.addEventListener('click', () => {
        const res = removeChoice(state, index);
        if (res.ok) {
            state = res.state;
            if (replaceIndex === index) replaceIndex = null;
            else if (replaceIndex !== null && replaceIndex > index) replaceIndex -= 1;
            persist();
            recompute();
            announce(`${school.name} removed.`);
        }
    });

    actions.append(upBtn, downBtn, replaceBtn, removeBtn);

    const header = el('header', {
        className: 'sel-choice-head',
        children: [
            el('span', { className: 'sel-choice-rank', text: `Choice ${index + 1}` }),
            el('span', { className: badgeClassForCategory(school.category), text: categoryLabel(school.category) }),
            el('h3', { className: 'sel-choice-name', attrs: { id: titleId }, text: school.name }),
            actions
        ]
    });

    // Details
    const offered = school.residentialOptions
        ? school.residentialOptions.join(' / ')
        : 'Not established';
    const details = el('dl', {
        className: 'sel-details',
        children: [
            detailItem('Region', school.region),
            detailItem('Location', school.location),
            detailItem('School code', school.code),
            detailItem('Type', school.schoolType),
            detailItem('Gender', school.gender),
            detailItem('Day / Boarding offered', offered),
            detailItem('Also listed in', school.appendices.length ? school.appendices.join(', ') : 'None')
        ]
    });

    // Programme select
    const programmeSelect = el('select', {
        className: 'form-select sel-select',
        attrs: { id: `choice-${index}-programme`, 'data-field': 'programme', 'data-index': String(index) }
    });
    programmeSelect.appendChild(el('option', { attrs: { value: '' }, text: 'Select a programme\u2026' }));
    let programmeNote = null;
    if (school.programmes.length === 0) {
        programmeSelect.disabled = true;
        programmeSelect.textContent = '';
        programmeSelect.appendChild(el('option', { attrs: { value: '' }, text: 'Programme data not available' }));
        programmeNote = el('p', {
            className: 'sel-field-note',
            text: 'No programme list is available for this school.'
        });
    } else {
        for (const programme of school.programmes) {
            programmeSelect.appendChild(el('option', { attrs: { value: programme }, text: programme }));
        }
        programmeSelect.value = choice.programme || '';
        programmeSelect.addEventListener('change', () => {
            const res = updateChoice(state, index, { programme: programmeSelect.value });
            if (res.ok) {
                state = res.state;
                persist();
                recompute();
            }
        });
    }

    const programmeField = el('div', {
        className: 'form-group sel-field',
        children: [
            el('label', {
                className: 'form-label',
                attrs: { for: `choice-${index}-programme` },
                text: 'Programme'
            }),
            programmeSelect,
            programmeNote
        ]
    });

    // Residential select
    const residentialSelect = el('select', {
        className: 'form-select sel-select',
        attrs: { id: `choice-${index}-residential`, 'data-field': 'residential', 'data-index': String(index) }
    });
    residentialSelect.appendChild(el('option', { attrs: { value: '' }, text: 'Select Day or Boarding\u2026' }));
    const options = school.residentialOptions;
    const optionValues = options || ['Day', 'Boarding'];
    for (const value of optionValues) {
        residentialSelect.appendChild(el('option', { attrs: { value }, text: value }));
    }
    residentialSelect.value = choice.residential || '';
    residentialSelect.addEventListener('change', () => {
        const res = updateChoice(state, index, { residential: residentialSelect.value });
        if (res.ok) {
            state = res.state;
            persist();
            recompute();
        }
    });

    let residentialNote = null;
    if (!options) {
        residentialNote = el('p', {
            className: 'sel-field-note',
            text: 'Day/Boarding options are not available for this school.'
        });
    } else if (options.length === 1) {
        residentialNote = el('p', {
            className: 'sel-field-note',
            text: `This school offers ${options[0]} only.`
        });
    }

    const residentialField = el('div', {
        className: 'form-group sel-field',
        children: [
            el('label', {
                className: 'form-label',
                attrs: { for: `choice-${index}-residential` },
                text: 'Day or Boarding'
            }),
            residentialSelect,
            residentialNote
        ]
    });

    const fields = el('div', { className: 'sel-choice-fields', children: [programmeField, residentialField] });

    // Status chips
    const statusRow = el('div', { className: 'sel-choice-status' });
    if (perChoice.issues.length === 0) {
        statusRow.appendChild(stateChip('pass', 'Choice complete'));
    } else {
        for (const issue of perChoice.issues) {
            statusRow.appendChild(stateChip(issue.status, issue.message));
        }
    }

    return el('article', {
        className: 'sel-choice' + (replaceIndex === index ? ' sel-choice--replacing' : ''),
        attrs: { 'aria-labelledby': titleId },
        children: [header, details, fields, statusRow]
    });
}

function renderEmptySlot(index) {
    const addBtn = el('button', {
        className: 'btn btn-small btn-outline',
        attrs: { type: 'button' },
        text: 'Choose a school'
    });
    addBtn.addEventListener('click', () => {
        const browse = document.getElementById('browse');
        if (browse) browse.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const query = document.getElementById('sel-query');
        if (query) query.focus();
    });
    return el('article', {
        className: 'sel-choice sel-choice--empty',
        children: [
            el('div', {
                className: 'sel-empty-inner',
                children: [
                    el('span', { className: 'sel-choice-rank', text: `Choice ${index + 1}` }),
                    el('p', { className: 'sel-empty-text', text: 'Empty \u2014 no school selected yet.' }),
                    addBtn
                ]
            })
        ]
    });
}

function renderChoices(result) {
    const target = document.getElementById('sel-choices');
    if (!target) return;
    target.textContent = '';

    for (let index = 0; index < MAX_MAIN_CHOICES; index += 1) {
        const choice = state.choices[index];
        if (choice) {
            target.appendChild(renderChoiceCard(choice, index, result));
        } else {
            target.appendChild(renderEmptySlot(index));
        }
    }
}

// ---- Replacement note --------------------------------------------------

function renderReplaceNote() {
    const target = document.getElementById('sel-replace-note');
    if (!target) return;
    target.textContent = '';
    if (replaceIndex === null) return;

    const cancel = el('button', {
        className: 'btn btn-small btn-outline',
        attrs: { type: 'button' },
        text: 'Cancel'
    });
    cancel.addEventListener('click', () => {
        replaceIndex = null;
        renderReplaceNote();
        renderResults();
        announce('Replacement cancelled.');
    });

    target.appendChild(el('div', {
        className: 'sel-replace-note',
        attrs: { role: 'status' },
        children: [
            el('span', {
                className: 'sel-replace-text',
                text: `Choose a replacement for Choice ${replaceIndex + 1}. Pick a school below.`
            }),
            cancel
        ]
    }));
}

// ---- Results -----------------------------------------------------------

// True when the user has typed a query or chosen any filter option.
function hasActiveFilters() {
    return Object.values(filters).some((value) => value !== '' && value !== null && value !== undefined);
}

// The drop-down that reveals the full school list. It is shown only while the
// user is simply browsing (no active filter and not replacing a choice), so
// that filtered results can appear straight away without an extra click.
function renderBrowseToggle(visibleCount) {
    const btn = el('button', {
        className: 'sel-browse-toggle',
        attrs: {
            type: 'button',
            'aria-expanded': String(browseExpanded),
            'aria-controls': 'sel-results'
        }
    });
    btn.appendChild(el('span', {
        className: 'sel-browse-toggle-text',
        text: browseExpanded
            ? 'Hide school list'
            : `Show all ${visibleCount} school${visibleCount === 1 ? '' : 's'}`
    }));
    const chevron = el('span', { className: 'sel-browse-toggle-icon' });
    chevron.innerHTML = ICONS.chevron;
    btn.appendChild(chevron);

    btn.addEventListener('click', () => {
        browseExpanded = !browseExpanded;
        renderResults();
        announce(browseExpanded ? 'School list shown.' : 'School list hidden.');
    });
    return btn;
}

function renderResults() {
    const target = document.getElementById('sel-results');
    const countTarget = document.getElementById('sel-results-count');
    if (!target) return;
    target.textContent = '';

    const visible = visibleSchools();
    const filtered = filterSchools(visible, filters);
    const filtering = hasActiveFilters();
    // Searching, filtering, or picking a replacement should always reveal the
    // list immediately; only a plain browse is hidden behind the drop-down.
    const forceShow = filtering || replaceIndex !== null;
    const showList = forceShow || browseExpanded;
    const scope = pathwayId === 'general' ? '' : ` ${pathway.shortLabel}`;

    if (countTarget) {
        if (filtering) {
            countTarget.textContent = `Showing ${filtered.length} of ${visible.length}${scope} schools.`;
        } else if (showList) {
            countTarget.textContent = `Showing all ${visible.length}${scope} schools.`;
        } else {
            countTarget.textContent =
                `${visible.length}${scope} schools available. Use the button below to show them.`;
        }
    }

    if (!filtered.length) {
        target.appendChild(el('p', {
            className: 'sel-empty-results',
            children: [
                icon('alert'),
                el('span', {
                    text: 'No schools match these filters. Try a different search or clear the filters.'
                })
            ]
        }));
        return;
    }

    if (showList) {
        if (!forceShow) target.appendChild(renderBrowseToggle(visible.length));
        for (const school of filtered) {
            target.appendChild(renderResultCard(school));
        }
    } else {
        target.appendChild(renderBrowseToggle(visible.length));
    }
}

function renderResultCard(school) {
    const offered = school.residentialOptions ? school.residentialOptions.join(' / ') : 'Not established';
    const already = selectedIndex(state, school.id);

    const actions = el('div', { className: 'sel-result-actions' });
    if (alternativeSlotOf(alternatives, school.id) !== null) {
        const btn = el('button', {
            className: 'btn btn-small btn-outline',
            attrs: { type: 'button', disabled: '', 'aria-disabled': 'true' },
            text: 'Used as an alternative'
        });
        actions.appendChild(btn);
    } else if (replaceIndex !== null) {
        const btn = el('button', {
            className: 'btn btn-small btn-primary',
            attrs: { type: 'button' },
            text: `Use for Choice ${replaceIndex + 1}`
        });
        btn.addEventListener('click', () => {
            const res = replaceChoice(state, replaceIndex, school.id);
            if (res.ok) {
                const target = replaceIndex;
                state = res.state;
                replaceIndex = null;
                persist();
                recompute();
                announce(`${school.name} set as choice ${target + 1}.`);
                focusChoiceField(target, 'programme');
            } else {
                announce(res.reason);
            }
        });
        actions.appendChild(btn);
    } else if (already !== -1) {
        const btn = el('button', {
            className: 'btn btn-small btn-outline',
            attrs: { type: 'button', disabled: '', 'aria-disabled': 'true' },
            text: `Already Choice ${already + 1}`
        });
        actions.appendChild(btn);
    } else if (state.choices.length >= MAX_MAIN_CHOICES) {
        const btn = el('button', {
            className: 'btn btn-small btn-outline',
            attrs: { type: 'button', disabled: '', 'aria-disabled': 'true' },
            text: 'All five filled'
        });
        actions.appendChild(btn);
    } else {
        const btn = el('button', {
            className: 'btn btn-small btn-primary',
            attrs: { type: 'button' },
            text: `Add as Choice ${state.choices.length + 1}`
        });
        btn.addEventListener('click', () => {
            const res = addChoice(state, school.id);
            if (res.ok) {
                const newIndex = state.choices.length;
                state = res.state;
                persist();
                recompute();
                announce(`${school.name} added as choice ${newIndex + 1}.`);
                focusChoiceField(newIndex, 'programme');
            } else {
                announce(res.reason);
            }
        });
        actions.appendChild(btn);
    }

    return el('article', {
        className: 'sel-result' + (already !== -1 ? ' sel-result--selected' : ''),
        children: [
            el('div', {
                className: 'sel-result-main',
                children: [
                    el('div', {
                        className: 'sel-result-badges',
                        children: [
                            el('span', { className: badgeClassForCategory(school.category), text: categoryLabel(school.category) }),
                            el('span', { className: 'badge badge-neutral', text: school.schoolType || 'Type not stated' }),
                            el('span', { className: 'badge badge-neutral', text: school.region })
                        ]
                    }),
                    el('h4', { className: 'sel-result-name', text: school.name }),
                    el('p', {
                        className: 'sel-result-meta',
                        text: `${school.location || 'Location not stated'} \u00b7 Code ${school.code || 'not stated'} \u00b7 ${school.gender || 'Gender not stated'} \u00b7 Offers ${offered} \u00b7 ${school.programmes.length} programme${school.programmes.length === 1 ? '' : 's'}`
                    })
                ]
            }),
            actions
        ]
    });
}

function focusChoiceField(index, field) {
    const node = document.getElementById(`choice-${index}-${field}`);
    if (node && !node.disabled) node.focus();
}

// ---- Filters -----------------------------------------------------------

function selectField(labelText, id, options, onChange) {
    const select = el('select', {
        className: 'form-select sel-filter',
        attrs: { id }
    });
    select.appendChild(el('option', { attrs: { value: '' }, text: 'All' }));
    for (const option of options) {
        const value = typeof option === 'string' ? option : option.value;
        const label = typeof option === 'string' ? option : option.label;
        select.appendChild(el('option', { attrs: { value }, text: label }));
    }
    select.addEventListener('change', () => onChange(select.value));
    return el('div', {
        className: 'form-group sel-filter-group',
        children: [el('label', { className: 'form-label', attrs: { for: id }, text: labelText }), select]
    });
}

function renderFilters() {
    const target = document.getElementById('sel-filters');
    if (!target) return;
    target.textContent = '';
    const options = getFilterOptions(visibleSchools());

    target.append(
        selectField('Region', 'filter-region', options.regions, (value) => {
            filters.region = value;
            renderResults();
        }),
        selectField('Category', 'filter-category', options.categories, (value) => {
            filters.category = value;
            renderResults();
        }),
        selectField('School type', 'filter-type', options.types, (value) => {
            filters.type = value;
            renderResults();
        }),
        selectField('Residential', 'filter-residential', options.residential, (value) => {
            filters.residential = value;
            renderResults();
        }),
        selectField('Programme', 'filter-programme', options.programmes, (value) => {
            filters.programme = value;
            renderResults();
        })
    );
}

function setupSearch() {
    const form = document.getElementById('sel-search');
    const query = document.getElementById('sel-query');
    const clear = document.getElementById('sel-filters-clear');

    if (form) {
        form.addEventListener('submit', (event) => event.preventDefault());
    }
    if (query) {
        query.addEventListener('input', () => {
            filters.query = query.value;
            renderResults();
        });
    }
    if (clear) {
        clear.addEventListener('click', () => {
            filters = { query: '', region: '', category: '', type: '', residential: '', programme: '' };
            if (query) query.value = '';
            for (const id of ['filter-region', 'filter-category', 'filter-type', 'filter-residential', 'filter-programme']) {
                const node = document.getElementById(id);
                if (node) node.value = '';
            }
            renderResults();
            announce('Filters cleared.');
        });
    }
}

// ---- Meta --------------------------------------------------------------

function renderMeta() {
    const target = document.getElementById('selection-meta');
    if (!target) return;
    const regions = new Set(baseSchools.map((school) => school.region));
    target.textContent = `${baseSchools.length} schools across ${regions.size} regions.`;
}

// ---- Recompute + boot --------------------------------------------------

function recompute() {
    const result = validateSelection(state, schoolsById, { pathway: pathwayId });
    const altResult = validateAlternatives(alternatives, state, schoolsById);
    renderPathwayNote();
    renderProgress(result);
    renderChoices(result);
    renderValidation(result);
    renderTools(result);
    renderAlternatives(altResult);
    renderAlternativesValidation(altResult);
    renderResults();
    renderReplaceNote();
}

function fatal(message) {
    const choices = document.getElementById('sel-choices');
    if (choices) {
        choices.appendChild(el('div', {
            className: 'alert alert-error',
            attrs: { role: 'alert' },
            text: message
        }));
    }
}

function boot() {
    const problems = checkPrototypeData();
    if (problems.length) {
        console.error('Prototype school data failed validation:', problems);
        fatal(
            'The prototype school data could not be validated, so the selection workflow was not ' +
            'started. This is a data problem, not something you did. Please report it.'
        );
        return;
    }

    const pathwayProblems = checkPathwayData();
    if (pathwayProblems.length) {
        console.error('Pathway configuration failed validation:', pathwayProblems);
        fatal(
            'The special pathway configuration could not be validated, so the selection workflow ' +
            'was not started. This is a data problem, not something you did. Please report it.'
        );
        return;
    }

    renderMeta();
    renderPathways();
    renderPathwayNote();
    renderFilters();
    setupSearch();
    recompute();
}

boot();
