// ========================================
// Application chrome: header, navigation, footer
// ========================================
// Shared by every page so navigation stays consistent and links
// resolve correctly from nested pages.
//
// Page contract:
//   <body data-page="home">            (root page)
//   <body data-page="guidelines" data-base="../">   (nested page)
//   <div id="site-header"></div>  ... <div id="site-footer"></div>

const base = document.body.dataset.base || '';
const currentPage = document.body.dataset.page || '';

const NAV_ITEMS = [
    { key: 'home',       href: 'index.html',            label: 'Home' },
    { key: 'guidelines', href: 'guidelines/index.html', label: 'Guidelines' },
    { key: 'selection',  href: 'selection/index.html',  label: 'Select schools' },
    { key: 'review',     href: 'review/index.html',     label: 'Review' }
];

const LOGO_MARK = `<svg class="logo-mark" viewBox="0 0 32 32" width="30" height="30" aria-hidden="true" focusable="false">
    <path d="M4 6.5C7.5 5 12 5 16 7.5 20 5 24.5 5 28 6.5V25c-3.5-1.5-8-1.5-12 1-4-2.5-8.5-2.5-12-1V6.5Z"
        fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
    <path d="M16 7.5V26" fill="none" stroke="currentColor" stroke-width="2"/>
</svg>`;

function navLink(item, className) {
    const isActive = item.key === currentPage;
    const classes = isActive ? `${className} active` : className;
    const current = isActive ? ' aria-current="page"' : '';
    return `<a class="${classes}" href="${base}${item.href}"${current}>${item.label}</a>`;
}

const desktopNav = NAV_ITEMS.map((item) => navLink(item, 'nav-link')).join('');
const mobileNav = NAV_ITEMS.map((item) => navLink(item, 'mobile-nav-link')).join('');
const footerNav = NAV_ITEMS.map((item) => `<li>${navLink(item, 'footer-link')}</li>`).join('');

const headerTarget = document.getElementById('site-header');
if (headerTarget) {
    headerTarget.innerHTML = `
        <a class="skip-link" href="#main">Skip to main content</a>
        <p class="demo-banner" role="note">
            Prototype &middot; guidance only. Nothing is submitted to CSSPS.
        </p>
        <header class="navbar">
            <div class="container navbar-container">
                <a class="logo" href="${base}index.html" aria-label="School Selection Guide home">
                    ${LOGO_MARK}
                    <span class="logo-text">School <span class="logo-highlight">Selection</span> Guide</span>
                </a>
                <nav class="nav-links" aria-label="Primary">${desktopNav}</nav>
                <button class="mobile-menu-toggle" type="button"
                    aria-label="Open navigation menu" aria-expanded="false" aria-controls="mobile-nav">
                    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
                        <path d="M3 6h18M3 12h18M3 18h18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </button>
            </div>
        </header>
        <nav id="mobile-nav" class="mobile-nav" aria-label="Mobile navigation" aria-hidden="true">
            <button class="mobile-close-btn" type="button" aria-label="Close navigation menu">
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
                    <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </button>
            <div id="mobileNavLinks">${mobileNav}</div>
        </nav>
        <div class="mobile-overlay"></div>
    `;
}

const footerTarget = document.getElementById('site-footer');
if (footerTarget) {
    footerTarget.innerHTML = `
        <footer class="footer">
            <div class="container footer-grid">
                <div class="footer-brand">
                    <p class="footer-logo">${LOGO_MARK}<span>School<span class="logo-highlight">Selection</span> Guide</span></p>
                    <p class="footer-about">Helps BECE candidates and families prepare their senior high school choices.</p>
                </div>
                <div class="footer-links">
                    <h3>Explore</h3>
                    <ul>${footerNav}</ul>
                </div>
                <div class="footer-links">
                    <h3>Important</h3>
                    <ul>
                        <li><a class="footer-link" href="${base}index.html#scope">Prototype scope</a></li>
                        <li><a class="footer-link" href="${base}index.html#disclaimer">Disclaimer</a></li>
                    </ul>
                </div>
            </div>
            <div class="footer-bottom container">
                <p>Prototype. Not affiliated with or endorsed by GES or CSSPS.</p>
                <p>&copy; <span id="footer-year"></span> School Selection Guide</p>
            </div>
        </footer>
    `;
}

const yearEl = document.getElementById('footer-year');
if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
}

// ---- Mobile navigation behaviour ----
const toggle = document.querySelector('.mobile-menu-toggle');
const mobileMenu = document.getElementById('mobile-nav');
const overlay = document.querySelector('.mobile-overlay');
const closeBtn = document.querySelector('.mobile-close-btn');
let lastFocused = null;

function isMenuOpen() {
    return Boolean(mobileMenu && mobileMenu.classList.contains('active'));
}

function openMenu() {
    if (!mobileMenu) return;
    lastFocused = document.activeElement;
    mobileMenu.classList.add('active');
    overlay?.classList.add('active');
    mobileMenu.setAttribute('aria-hidden', 'false');
    toggle?.setAttribute('aria-expanded', 'true');
    document.body.classList.add('nav-open');
    closeBtn?.focus();
}

function closeMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.remove('active');
    overlay?.classList.remove('active');
    mobileMenu.setAttribute('aria-hidden', 'true');
    toggle?.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-open');
    if (lastFocused instanceof HTMLElement) {
        lastFocused.focus();
    }
}

toggle?.addEventListener('click', () => {
    if (isMenuOpen()) {
        closeMenu();
    } else {
        openMenu();
    }
});

closeBtn?.addEventListener('click', closeMenu);
overlay?.addEventListener('click', closeMenu);

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isMenuOpen()) {
        closeMenu();
    }
});

mobileMenu?.addEventListener('click', (event) => {
    if (event.target instanceof HTMLElement && event.target.closest('a')) {
        closeMenu();
    }
});
