// ========================================
// Home page: live dataset snapshot
// ========================================
// Counts are read from the project dataset (Phase 1 output) so the
// welcome page never hard-codes figures that could drift.

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = Number(value).toLocaleString();
    }
}

async function renderSnapshot() {
    const note = document.getElementById('snapshot-note');
    try {
        const { getAllSchools, getRegions } = await import('./school-data.js');
        const schools = getAllSchools();
        const regions = getRegions();
        const hasLabel = (school, label) =>
            Array.isArray(school.classification) && school.classification.includes(label);

        setText('stat-schools', schools.length);
        setText('stat-regions', regions.length);
        setText('stat-cat-a', schools.filter((s) => hasLabel(s, 'Category A')).length);
        setText('stat-cat-b', schools.filter((s) => hasLabel(s, 'Category B')).length);
        setText('stat-cat-c', schools.filter((s) => hasLabel(s, 'Category C')).length);
    } catch (error) {
        if (note) {
            note.textContent =
                'Live dataset counts could not be loaded. Serve this site over HTTP ' +
                '(for example, a local static server) so the data module can load.';
            note.classList.add('snapshot-note-error');
        }
        console.error('Failed to load the school dataset for the home page snapshot.', error);
    }
}

renderSnapshot();
