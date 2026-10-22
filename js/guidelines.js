// ========================================
// Guidelines page: rendering + interaction
// ========================================
// Renders the structured guideline content (js/guidelines-data.js) into
// guidelines/index.html. Official wording is always kept visually and
// structurally separate from the plain-language explanation and from the
// application's own behaviour notes.
//
// Reading progress is tracked locally in the browser only (localStorage) so a
// candidate can see how far they have read. It is a personal indicator, not an
// official status, and it never leaves the device.

import {
    GUIDELINES,
    GUIDELINE_SECTIONS,
    GUIDELINE_SOURCE
} from './guidelines-data.js';

const STORAGE_KEY = 'ssg.guidelines.viewed.v1';

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
    chevron:
        '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">' +
        '<path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" ' +
        'stroke-linecap="round" stroke-linejoin="round"/></svg>'
};

function icon(name) {
    const span = el('span', { className: 'guide-icon' });
    span.innerHTML = ICONS[name] || '';
    return span;
}

// ---- Content model -----------------------------------------------------

// Key general rules, taken from the confirmed guidance. The tile for
// alternatives is flagged because the Appendix 3 list / count is unverified.
const SUMMARY_TILES = [
    { value: '5', label: 'Main schools', note: 'Ranked from most to least preferred.' },
    { value: '1', label: 'Category A maximum', note: 'Maximum one of the five.' },
    { value: '2', label: 'Category B maximum', note: 'Maximum two of the five.' },
    { value: '3 / 2', label: 'Boarding / Day', note: 'Of the five main choices.' },
    {
        value: '2',
        label: 'Alternative schools',
        note: 'One Category B, one Category C.'
    }
];

function guidelineSlug(id) {
    return `guideline-${id}`;
}

function sectionAnchor(index) {
    return `guide-section-${index + 1}`;
}

// ---- Rendering ---------------------------------------------------------

function renderMeta() {
    const target = document.getElementById('guidelines-meta');
    if (!target) return;
    target.textContent = `${GUIDELINES.length} rules \u00b7 ${GUIDELINE_SOURCE.title}`;
}

function renderSummary() {
    const target = document.getElementById('guidelines-summary');
    if (!target) return;

    const grid = el('ul', { className: 'guide-summary-grid' });
    for (const tile of SUMMARY_TILES) {
        grid.appendChild(el('li', {
            className: 'guide-summary-tile',
            children: [
                el('span', { className: 'guide-summary-value', text: tile.value }),
                el('span', { className: 'guide-summary-label', text: tile.label }),
                el('span', { className: 'guide-summary-note', text: tile.note })
            ]
        }));
    }

    target.append(
        el('h2', { className: 'guide-summary-title', attrs: { id: 'summary-heading' }, text: 'Key requirements at a glance' }),
        el('p', {
            className: 'guide-summary-intro',
            text: 'The main rules for general selection.'
        }),
        grid,
        el('p', {
            className: 'guide-summary-footnote',
            text: `Source: ${GUIDELINE_SOURCE.title}.`
        })
    );
}

function renderNav() {
    const target = document.getElementById('guidelines-nav');
    if (!target) return;

    const list = el('ol', { className: 'guide-nav-list' });
    GUIDELINE_SECTIONS.forEach((section, index) => {
        const count = GUIDELINES.filter((g) => g.section === section.id).length;
        const link = el('a', {
            className: 'guide-nav-link',
            attrs: { href: `#${sectionAnchor(index)}`, 'data-section-anchor': sectionAnchor(index) },
            children: [
                el('span', { className: 'guide-nav-num', text: String(index + 1) }),
                el('span', { className: 'guide-nav-label', text: section.label }),
                el('span', { className: 'guide-nav-count', attrs: { 'aria-hidden': 'true' }, text: String(count) })
            ]
        });
        list.appendChild(el('li', { children: [link] }));
    });

    target.appendChild(el('nav', {
        className: 'guide-nav',
        attrs: { 'aria-label': 'Guideline sections' },
        children: [
            el('h2', { className: 'guide-nav-title', text: 'Sections' }),
            list
        ]
    }));
}

// Render official text while preserving its paragraph and list structure from
// the source document. Bullet and numbered blocks become real lists so the
// wording is never silently reshaped into prose.
function renderOfficialText(text) {
    const nodes = [];
    const blocks = String(text).split(/\n{2,}/);
    for (const raw of blocks) {
        const block = raw.trim();
        if (!block) continue;
        const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
        const isBullet = lines.length > 0 && lines.every((line) => /^[-*]\s+/.test(line));
        const isNumbered = lines.length > 0 && lines.every((line) => /^\d+\.\s+/.test(line));
        if (isBullet || isNumbered) {
            const items = lines.map((line) => el('li', { text: line.replace(/^([-*]|\d+\.)\s+/, '') }));
            nodes.push(el(isNumbered ? 'ol' : 'ul', { className: 'guideline-list', children: items }));
        } else {
            nodes.push(el('p', { text: lines.join(' ') }));
        }
    }
    return nodes;
}

function buildGuidelineCard(guideline) {
    const id = guidelineSlug(guideline.id);
    const titleId = `${id}-title`;

    const header = el('header', {
        className: 'guideline-card-header',
        children: [
            el('span', { className: 'guideline-number', attrs: { 'aria-hidden': 'true' }, text: String(guideline.id) }),
            el('h3', { className: 'guideline-title', attrs: { id: titleId }, text: guideline.title }),
            el('span', {
                className: 'guideline-viewed',
                attrs: { 'data-viewed-for': String(guideline.id) },
                children: [icon('check'), el('span', { text: 'Viewed' })]
            })
        ]
    });

    const officialQuote = el('blockquote', {
        className: 'guideline-quote',
        attrs: { cite: GUIDELINE_SOURCE.document },
        children: renderOfficialText(guideline.official)
    });

    const official = el('div', {
        className: 'guideline-block guideline-official',
        children: [
            el('p', { className: 'guideline-block-label', text: 'Official wording' }),
            officialQuote
        ]
    });

    // The plain-language explanation is optional reading, so it is tucked behind
    // a slim drop-down and closed by default.
    const chevron = el('span', { className: 'guideline-explanation-chevron' });
    chevron.innerHTML = ICONS.chevron;

    const explanation = el('details', {
        className: 'guideline-explanation',
        children: [
            el('summary', {
                children: [
                    el('span', { className: 'guideline-block-label', text: 'In plain language' }),
                    chevron
                ]
            }),
            el('p', { className: 'guideline-explanation-text', text: guideline.explanation })
        ]
    });

    return el('article', {
        className: 'guideline-card',
        attrs: { id, 'data-guideline-id': String(guideline.id), 'aria-labelledby': titleId },
        children: [
            header,
            el('div', { className: 'guideline-blocks', children: [official, explanation] })
        ]
    });
}

function renderContent() {
    const target = document.getElementById('guidelines-content');
    if (!target) return;

    GUIDELINE_SECTIONS.forEach((section, index) => {
        const sectionGuidelines = GUIDELINES.filter((g) => g.section === section.id);
        if (!sectionGuidelines.length) return;

        const titleId = `${sectionAnchor(index)}-title`;
        const cards = el('div', {
            className: 'guide-cards',
            children: sectionGuidelines.map(buildGuidelineCard)
        });

        target.appendChild(el('section', {
            className: 'guide-section',
            attrs: { id: sectionAnchor(index), 'aria-labelledby': titleId },
            children: [
                el('header', {
                    className: 'guide-section-header',
                    children: [
                        el('span', { className: 'guide-section-kicker', text: `Section ${index + 1}` }),
                        el('h2', { className: 'guide-section-title', attrs: { id: titleId }, text: section.label }),
                        el('p', { className: 'guide-section-desc', text: section.description })
                    ]
                }),
                cards
            ]
        }));
    });
}

// ---- Reading progress --------------------------------------------------

function readViewed() {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return new Set(Array.isArray(parsed) ? parsed.filter((n) => Number.isInteger(n)) : []);
    } catch (error) {
        return new Set();
    }
}

function saveViewed(viewed) {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...viewed]));
    } catch (error) {
        // Storage may be unavailable (for example, private browsing). Progress
        // simply will not persist; this is not an error the user needs to see.
    }
}

function setupProgress() {
    const target = document.getElementById('guidelines-progress');
    if (!target) return;

    const total = GUIDELINES.length;
    const cards = Array.from(document.querySelectorAll('.guideline-card[data-guideline-id]'));

    const text = el('p', { className: 'guide-progress-text', attrs: { id: 'guide-progress-text' } });
    const fill = el('span', { className: 'guide-progress-fill', attrs: { id: 'guide-progress-fill' } });
    const track = el('div', {
        className: 'guide-progress-track',
        attrs: {
            id: 'guide-progress-track',
            role: 'progressbar',
            'aria-labelledby': 'guide-progress-heading',
            'aria-valuemin': '0',
            'aria-valuemax': String(total),
            'aria-valuenow': '0'
        },
        children: [fill]
    });
    const reset = el('button', {
        className: 'btn btn-small btn-outline guide-progress-reset',
        attrs: { type: 'button', id: 'guide-progress-reset' },
        text: 'Reset progress'
    });

    target.appendChild(el('div', {
        className: 'guide-progress',
        children: [
            el('h2', { className: 'guide-progress-heading', attrs: { id: 'guide-progress-heading' }, text: 'Reading progress' }),
            text,
            track,
            reset
        ]
    }));

    // Treat the furthest guideline that has reached the reading area as
    // "viewed". This keeps progress monotonic and reaches 24 of 24 when the
    // reader reaches the end, even when scrolling quickly.
    let furthest = 0;
    for (const id of readViewed()) {
        if (id > furthest) furthest = id;
    }

    const apply = () => {
        text.textContent = `${furthest} of ${total} rules viewed`;
        track.setAttribute('aria-valuenow', String(furthest));
        track.setAttribute('aria-valuetext', `${furthest} of ${total} rules viewed`);
        fill.style.width = `${Math.round((furthest / total) * 100)}%`;
        for (const card of cards) {
            const id = Number(card.getAttribute('data-guideline-id'));
            const indicator = card.querySelector(`[data-viewed-for="${id}"]`);
            if (indicator) indicator.classList.toggle('is-visible', id <= furthest);
        }
    };

    const recompute = () => {
        const limit = window.innerHeight * 0.85;
        let maxId = 0;
        for (const card of cards) {
            if (card.getBoundingClientRect().top <= limit) {
                const id = Number(card.getAttribute('data-guideline-id'));
                if (id > maxId) maxId = id;
            }
        }
        if (maxId > furthest) {
            furthest = maxId;
            saveViewed(new Set(cards
                .map((card) => Number(card.getAttribute('data-guideline-id')))
                .filter((id) => id <= furthest)));
            apply();
        }
    };

    // Recompute directly on scroll: cheap here (24 cards) and avoids relying
    // on animation frames, which are not guaranteed in every environment.
    const onScroll = () => recompute();

    reset.addEventListener('click', () => {
        furthest = 0;
        saveViewed(new Set());
        apply();
    });

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    apply();
    recompute();
}

// ---- Section navigation highlight --------------------------------------

function setupSectionSpy() {
    const links = Array.from(document.querySelectorAll('.guide-nav-link[data-section-anchor]'));
    const sections = Array.from(document.querySelectorAll('.guide-section[id]'));
    if (!links.length || !sections.length || !('IntersectionObserver' in window)) return;

    const byAnchor = new Map(links.map((link) => [link.getAttribute('data-section-anchor'), link]));

    const setActive = (anchor) => {
        links.forEach((link) => {
            const isActive = link.getAttribute('data-section-anchor') === anchor;
            link.classList.toggle('is-active', isActive);
            if (isActive) {
                link.setAttribute('aria-current', 'true');
            } else {
                link.removeAttribute('aria-current');
            }
        });
    };

    const observer = new IntersectionObserver((entries) => {
        const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length) {
            const link = byAnchor.get(visible[0].target.id);
            if (link) setActive(visible[0].target.id);
        }
    }, { rootMargin: '-30% 0px -55% 0px', threshold: [0, 0.25, 0.5] });

    sections.forEach((section) => observer.observe(section));
}

// ---- Data integrity guard ----------------------------------------------

function checkData() {
    const problems = [];
    if (!Array.isArray(GUIDELINES) || GUIDELINES.length !== 24) {
        problems.push(`expected 24 guidelines, found ${Array.isArray(GUIDELINES) ? GUIDELINES.length : 0}`);
    }
    const ids = GUIDELINES.map((g) => g.id);
    if (new Set(ids).size !== ids.length) problems.push('duplicate guideline ids');
    for (let i = 1; i <= 24; i += 1) {
        if (!ids.includes(i)) problems.push(`missing guideline id ${i}`);
    }
    const knownSections = new Set(GUIDELINE_SECTIONS.map((s) => s.id));
    for (const g of GUIDELINES) {
        if (!knownSections.has(g.section)) problems.push(`guideline ${g.id} has unknown section`);
        if (!g.official || !g.explanation) problems.push(`guideline ${g.id} is missing content`);
    }
    return problems;
}

// ---- Boot --------------------------------------------------------------

function boot() {
    const problems = checkData();
    const content = document.getElementById('guidelines-content');

    if (problems.length) {
        console.error('Guidelines data failed validation:', problems);
        if (content) {
            content.appendChild(el('div', {
                className: 'alert alert-error',
                attrs: { role: 'alert' },
                text: 'The guideline content could not be validated and was not rendered. Please report this issue.'
            }));
        }
        return;
    }

    renderMeta();
    renderSummary();
    renderNav();
    renderContent();
    setupProgress();
    setupSectionSpy();
}

boot();
