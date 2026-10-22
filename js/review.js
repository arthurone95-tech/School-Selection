// ========================================
// Final review controller
// ========================================
// Fills the printable placement form on review/index.html from the persisted
// selection (the five main choices, the two alternatives and the chosen
// pathway), and wires the "Your details" panel that feeds the personal fields.
//
// The heavy lifting (validation, status merging, view-model building) lives in
// js/review-model.js; the personal-details storage lives in
// js/candidate-state.js. This file only turns those into DOM.
//
// What is filled automatically:
//   - the five main choices, in preference order (SN 1-5);
//   - the two alternatives (SN 1-2);
//   - school code, school name, category, programme name, programme code and
//     Day/Boarding.
//
// What the candidate types in the "Your details" panel:
//   - candidate name, index number, JHS, gender (drop-down), district, region
//     (drop-down), location, parent/guardian name and contact, date,
//     headteacher's contact.
//
// What is never filled:
//   - a programme code that has no official source (js/programme-codes.js only
//     resolves the register's programme-group codes, so the cell simply stays
//     blank for a programme outside those groups);
//   - the signature / stamp fields (added by hand on the printed form).
//
// The page chrome (header/nav/footer) is injected by js/layout.js.

import { checkPrototypeData } from './prototype-schools.js';
import { getRegions } from './school-data.js';
import { MAX_MAIN_CHOICES, loadState } from './selection-state.js';
import { ALTERNATIVE_SLOTS, loadAlternatives } from './alternatives-state.js';
import { loadPathway } from './pathway-state.js';
import { getSelectionPool, checkPathwayData } from './pathways.js';
import { buildReview } from './review-model.js';
import { GUIDELINES_YEAR } from './guidelines-data.js';
import { CANDIDATE_FIELDS, loadCandidate, saveCandidate } from './candidate-state.js';

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
        '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">' +
        '<path d="M5 12l4 4 10-10" fill="none" stroke="currentColor" stroke-width="2" ' +
        'stroke-linecap="round" stroke-linejoin="round"/></svg>',
    alert:
        '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">' +
        '<path d="M12 4l9 16H3L12 4Z" fill="none" stroke="currentColor" stroke-width="2" ' +
        'stroke-linejoin="round"/><path d="M12 10v4" fill="none" stroke="currentColor" ' +
        'stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg>',
    dot:
        '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">' +
        '<circle cx="12" cy="12" r="4" fill="currentColor"/></svg>'
};

function icon(name) {
    const span = el('span', { className: 'sel-icon' });
    span.innerHTML = ICONS[name] || ICONS.dot;
    return span;
}

// ---- Status vocabulary -------------------------------------------------

const STATUS_CHIP = {
    invalid: { className: 'sel-chip--fail', icon: 'alert', label: 'Has errors' },
    incomplete: { className: 'sel-chip--pending', icon: 'dot', label: 'Incomplete' },
    'needs-verification': { className: 'sel-chip--verify', icon: 'alert', label: 'Needs verification' },
    valid: { className: 'sel-chip--pass', icon: 'check', label: 'Checks passed' }
};

// ---- Boot data ---------------------------------------------------------

const pool = getSelectionPool();
const schoolsById = new Map(pool.map((school) => [school.id, school]));
const validIds = new Set(pool.map((school) => school.id));

// Drop-down lists for the "Your details" panel. Gender is fixed; Region comes
// from the dataset's own region list, so the panel offers exactly the regions
// the register uses rather than a hand-written list.
const OPTION_SOURCES = {
    regions: getRegions
};

function optionsFor(field) {
    if (Array.isArray(field.options)) return field.options;
    const source = OPTION_SOURCES[field.optionsFrom];
    return source ? source() : [];
}

// ---- Page header meta --------------------------------------------------

function renderMeta(review) {
    const target = document.getElementById('review-meta');
    if (!target) return;
    target.textContent = `${GUIDELINES_YEAR} selection rules \u00b7 ${review.pathway.shortLabel} pathway`;
}

// ---- Status and outstanding issues -------------------------------------

function renderStatus(review) {
    const target = document.getElementById('review-status');
    if (!target) return;
    target.textContent = '';

    const meta = STATUS_CHIP[review.status] || STATUS_CHIP.incomplete;
    target.appendChild(el('span', {
        className: `sel-chip ${meta.className}`,
        children: [icon(meta.icon), el('span', { text: meta.label })]
    }));
    target.appendChild(el('span', {
        className: 'rev-status-counts',
        text:
            `${review.filledMain} of ${MAX_MAIN_CHOICES} main choices \u00b7 ` +
            `${review.filledAlternatives} of ${ALTERNATIVE_SLOTS.length} alternatives \u00b7 ` +
            `${review.pathway.shortLabel} pathway`
    }));
}

function renderIssues(review) {
    const target = document.getElementById('review-issues');
    if (!target) return;
    target.textContent = '';

    const items = [
        ...review.errors.map((error) => error.message),
        ...review.missing.map((item) => item.message)
    ];
    if (!items.length) return;

    const details = el('details', { className: 'rev-toolbar-issues' });
    details.appendChild(el('summary', { text: `What still needs attention (${items.length})` }));
    details.appendChild(el('ul', {
        className: 'rev-issue-list',
        children: items.map((text) => el('li', { text }))
    }));
    target.appendChild(details);
}

// ---- The form ----------------------------------------------------------

/** One value cell. An empty value still reserves the row height. */
function valueCell(value) {
    const td = el('td');
    td.appendChild(el('span', { className: 'pf-cell', text: value ? String(value) : '' }));
    return td;
}

function renderMainRows(review) {
    const tbody = document.getElementById('rev-main-rows');
    if (!tbody) return;
    tbody.textContent = '';

    for (let rank = 1; rank <= MAX_MAIN_CHOICES; rank += 1) {
        const choice = review.mainChoices[rank - 1] || null;
        tbody.appendChild(el('tr', {
            children: [
                el('td', { className: 'pf-sn', text: String(rank) }),
                valueCell(choice ? choice.code : ''),
                valueCell(choice ? choice.name : ''),
                valueCell(choice ? choice.category : ''),
                // Programme code: auto-filled from the register's programme-group
                // code for that programme; blank when the data has no such code.
                valueCell(choice ? choice.programmeCode : ''),
                valueCell(choice ? choice.programme : ''),
                valueCell(choice ? choice.residential : '')
            ]
        }));
    }
}

function renderAltRows(review) {
    const tbody = document.getElementById('rev-alt-rows');
    if (!tbody) return;
    tbody.textContent = '';

    review.alternatives.forEach((entry, index) => {
        const school = entry.school;
        const category = school && school.category ? school.category : entry.category;
        tbody.appendChild(el('tr', {
            children: [
                el('td', { className: 'pf-sn', text: String(index + 1) }),
                valueCell(school ? school.code : ''),
                valueCell(school ? school.name : ''),
                valueCell(school ? category : ''),
                // The official form's alternative section carries the same
                // programme code / programme name / Day-Boarding columns as the
                // main section (register Appendix 6), so they are filled here.
                valueCell(entry.programmeCode),
                valueCell(entry.programme),
                valueCell(entry.residential)
            ]
        }));
    });
}

// ---- "Your details" panel ----------------------------------------------

function setFormValue(key, value) {
    const node = document.getElementById(`pf-${key}`);
    if (node) node.textContent = value || '';
}

function collectDetails() {
    const state = {};
    for (const field of CANDIDATE_FIELDS) {
        const input = document.getElementById(`rev-detail-${field.key}`);
        state[field.key] = input ? input.value : '';
    }
    return state;
}

function renderDetails() {
    const grid = document.getElementById('review-details');
    if (!grid) return;
    grid.textContent = '';

    const state = loadCandidate();

    for (const field of CANDIDATE_FIELDS) {
        const options = optionsFor(field);
        const useSelect = field.type === 'select' && options.length > 0;
        const id = `rev-detail-${field.key}`;
        const saved = state[field.key] || '';

        let control;
        if (useSelect) {
            control = el('select', { className: 'form-select', attrs: { id, name: field.key } });
            control.appendChild(el('option', {
                attrs: { value: '' },
                text: `Select ${field.label.toLowerCase()}\u2026`
            }));
            for (const value of options) {
                control.appendChild(el('option', { attrs: { value }, text: value }));
            }
            // A value saved before the list existed must not vanish silently.
            if (saved && !options.includes(saved)) {
                control.appendChild(el('option', { attrs: { value: saved }, text: saved }));
            }
            control.value = saved;
        } else {
            control = el('input', {
                className: 'form-input',
                attrs: { type: 'text', id, name: field.key, autocomplete: field.autocomplete || 'off' }
            });
            control.value = saved;
        }

        grid.appendChild(el('label', {
            className: field.wide ? 'rev-detail rev-detail--wide' : 'rev-detail',
            attrs: { for: id },
            children: [
                el('span', { className: 'rev-detail-label', text: field.label }),
                control
            ]
        }));

        control.addEventListener(useSelect ? 'change' : 'input', () => {
            setFormValue(field.key, control.value);
            saveCandidate(collectDetails());
        });

        // Show whatever was already saved on the form.
        setFormValue(field.key, control.value);
    }
}

// ---- Controls ----------------------------------------------------------

function wirePrint() {
    const button = document.getElementById('rev-print');
    if (!button) return;
    button.addEventListener('click', () => {
        announce('Opening the print dialog.');
        window.print();
    });
}

function announce(message) {
    const node = document.getElementById('rev-announcer');
    if (!node) return;
    node.textContent = '';
    node.textContent = message;
}

function fatal(message) {
    const target = document.getElementById('review-alert');
    if (!target) return;
    target.appendChild(el('div', {
        className: 'alert alert-error',
        attrs: { role: 'alert' },
        text: message
    }));
}

// ---- Boot --------------------------------------------------------------

function boot() {
    const problems = checkPrototypeData();
    const pathwayProblems = checkPathwayData();
    if (problems.length || pathwayProblems.length) {
        console.error('Review data failed validation:', problems, pathwayProblems);
        fatal(
            'The school data could not be loaded, so the form could not be filled. Please report this.'
        );
    }

    const mainState = loadState(validIds);
    const alternatives = loadAlternatives(validIds);
    const pathwayId = loadPathway();

    const review = buildReview({ mainState, alternatives, pathwayId, schoolsById });

    renderMeta(review);
    renderStatus(review);
    renderIssues(review);
    renderMainRows(review);
    renderAltRows(review);
    renderDetails();
    wirePrint();
}

boot();
