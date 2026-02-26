let lastScrollTop = 0;
const header = document.querySelector('header');
let sliderImages = [];
let windowHeight = window.innerHeight;
let hamburger = document.getElementById('hamburger');

let currentImageIndex = 0;
let isHeaderHidden = false;
let isChangingSlide = false;
let sliderIntervalId = null;
let hasAutoScrolled = false;
let autoScrollRaf = null;
let autoScrollCanceled = false;
let hasBaseInitialized = false;
let hasLoadInitialized = false;
const SLIDER_INDEX_KEY = 'tr_slider_index';
const LOGO_GIF_SINGLE_LOOP_MS = 700;
const FLOATING_RING_RADIUS = 14;
const FLOATING_RING_CIRCUMFERENCE = 2 * Math.PI * FLOATING_RING_RADIUS;
const FLOATING_SOCIAL_LINKS = [
    {
        href: 'https://www.instagram.com/tabula_rasa_band/',
        label: 'Instagram - Tabula Rasa',
        icon: 'instagram'
    },
    {
        href: 'https://www.tiktok.com/@tabularasaband',
        label: 'TikTok - Tabula Rasa',
        icon: 'tiktok'
    },
    {
        href: 'https://www.youtube.com/@tabula_rasa_band',
        label: 'YouTube - Tabula Rasa',
        icon: 'youtube'
    },
    {
        href: 'https://www.facebook.com/ZespolTabulaRasa/',
        label: 'Facebook - Tabula Rasa',
        icon: 'facebook'
    },
    {
        href: 'https://open.spotify.com/artist/6xvV1lYwFaNpyXmlbzdLi3',
        label: 'Spotify - Tabula Rasa',
        icon: 'spotify'
    }
];
const PAGE_HERO_COPY = {
    'index.html': {
        eyebrow: 'OFICJALNA STRONA',
        title: 'Tabula Rasa',
        subtitle: 'Aktualnosci, muzyka i koncerty zespolu.'
    },
    'about.html': {
        eyebrow: 'O ZESPOLE',
        title: 'O nas',
        subtitle: 'Sklad, historia i kim jest Tabula Rasa.'
    },
    'contact.html': {
        eyebrow: 'NAPISZ DO NAS',
        title: 'Kontakt',
        subtitle: 'Booking, wspolpraca i szybka linia do zespolu.'
    },
    'gallery.html': {
        eyebrow: 'Z KULIS I KONCERTOW',
        title: 'Galeria',
        subtitle: 'Zdjecia koncertowe, backstage i zycie zespolu.'
    },
    'music.html': {
        eyebrow: 'SINGLE I STREAMING',
        title: 'Muzyka',
        subtitle: 'Single, teledyski i streaming na wszystkich platformach.'
    },
    'press.html': {
        eyebrow: 'DLA MEDIOW',
        title: 'Press',
        subtitle: 'Bio, rider i materialy dla mediow i organizatorow.'
    },
    'shows.html': {
        eyebrow: 'NAJBLIZSZE DATY',
        title: 'Koncerty',
        subtitle: 'Trasy, terminy i miasta, w ktorych gramy na zywo.'
    },
    'shop.html': {
        eyebrow: 'MERCH I WYDAWNICTWA',
        title: 'Sklep',
        subtitle: 'Merch i p\u0142yty cd s\u0105 dost\u0119pne tylko na koncertach live.'
    },
    'regulamin.html': {
        eyebrow: 'INFORMACJE PRAWNE',
        title: 'Regulamin',
        subtitle: 'Zasady korzystania z oficjalnej strony Tabula Rasa.'
    },
    'polityka-prywatnosci.html': {
        eyebrow: 'INFORMACJE PRAWNE',
        title: 'Polityka prywatnosci',
        subtitle: 'Jak przetwarzamy dane i chronimy prywatnosc uzytkownikow.'
    },
    'index-en.html': {
        eyebrow: 'OFFICIAL WEBSITE',
        title: 'Tabula Rasa',
        subtitle: 'News, music, and live shows from the band.'
    },
    'about-en.html': {
        eyebrow: 'ABOUT THE BAND',
        title: 'About',
        subtitle: 'Lineup, story, and who Tabula Rasa is.'
    },
    'contact-en.html': {
        eyebrow: 'GET IN TOUCH',
        title: 'Contact',
        subtitle: 'Booking, cooperation, and a direct line to the band.'
    },
    'gallery-en.html': {
        eyebrow: 'LIVE & BACKSTAGE',
        title: 'Gallery',
        subtitle: 'Live photos, backstage moments, and band life.'
    },
    'music-en.html': {
        eyebrow: 'SINGLES & STREAMING',
        title: 'Music',
        subtitle: 'Singles, videos, and streaming across all platforms.'
    },
    'press-en.html': {
        eyebrow: 'MEDIA RESOURCES',
        title: 'Press',
        subtitle: 'Bio, rider, and resources for media and promoters.'
    },
    'shows-en.html': {
        eyebrow: 'UPCOMING DATES',
        title: 'Shows',
        subtitle: 'Tour dates, cities, and upcoming live performances.'
    },
    'shop-en.html': {
        eyebrow: 'MERCH & RELEASES',
        title: 'Shop',
        subtitle: 'Merch and CDs are available only at live shows.'
    },
    'terms.html': {
        eyebrow: 'LEGAL INFORMATION',
        title: 'Terms',
        subtitle: 'Rules for using the official Tabula Rasa website.'
    },
    'privacy-policy.html': {
        eyebrow: 'LEGAL INFORMATION',
        title: 'Privacy policy',
        subtitle: 'How we process data and protect user privacy.'
    }
};
const HEADER_LINKS_PL = [
    { href: 'shop.html', label: 'Sklep' },
    { href: 'music.html', label: 'Muzyka' },
    { href: 'shows.html', label: 'Koncerty' },
    { href: 'gallery.html', label: 'Galeria' },
    { href: 'press.html', label: 'Press' },
    { href: 'about.html', label: 'O nas' },
    { href: 'contact.html', label: 'Kontakt' }
];
const HEADER_LINKS_EN = [
    { href: 'shop-en.html', label: 'Shop' },
    { href: 'music-en.html', label: 'Music' },
    { href: 'shows-en.html', label: 'Shows' },
    { href: 'gallery-en.html', label: 'Gallery' },
    { href: 'press-en.html', label: 'Press' },
    { href: 'about-en.html', label: 'About' },
    { href: 'contact-en.html', label: 'Contact' }
];
const LANGUAGE_SWITCH_MAP = {
    'index.html': 'index-en.html',
    'index-en.html': 'index.html',
    'about.html': 'about-en.html',
    'about-en.html': 'about.html',
    'contact.html': 'contact-en.html',
    'contact-en.html': 'contact.html',
    'gallery.html': 'gallery-en.html',
    'gallery-en.html': 'gallery.html',
    'music.html': 'music-en.html',
    'music-en.html': 'music.html',
    'press.html': 'press-en.html',
    'press-en.html': 'press.html',
    'shows.html': 'shows-en.html',
    'shows-en.html': 'shows.html',
    'shop.html': 'shop-en.html',
    'shop-en.html': 'shop.html',
    'regulamin.html': 'terms.html',
    'terms.html': 'regulamin.html',
    'polityka-prywatnosci.html': 'privacy-policy.html',
    'privacy-policy.html': 'polityka-prywatnosci.html'
};
const GTM_CONTAINER_ID = 'GTM-MK42J45H';
const GTM_DEFER_TIMEOUT_MS = 15000;
const COOKIE_CONSENT_STORAGE_KEY = 'tr_cookie_consent_v1';
const COOKIE_CONSENT_MAX_AGE_DAYS = 180;
const COOKIE_CONSENT_VERSION = '2026-02-25';
const COOKIE_BANNER_ID = 'trCookieConsentBanner';
const COOKIE_SETTINGS_BUTTON_ID = 'trCookieSettingsButton';
const NEWSLETTER_FORM_ENDPOINT = 'https://formspree.io/f/xanwrzoo';
const DOWNLOAD_FILE_PATTERN = /\.(pdf|zip|rar|7z|doc|docx|xls|xlsx|ppt|pptx|mp3|wav|flac|jpg|jpeg|png|webp)$/i;

let floatingUtilities = null;
let floatingSocial = null;
let floatingTopButton = null;
let floatingRingProgress = null;
let youtubeIframeApiPromise = null;

function updateViewportMetrics() {
    windowHeight = window.innerHeight;
}

function getCurrentPageName() {
    const pathname = window.location.pathname || '';
    const fileName = pathname.split('/').filter(Boolean).pop();
    return fileName || 'index.html';
}

function getLanguageSwitchHref(pageName, isEnglish) {
    const mapped = LANGUAGE_SWITCH_MAP[pageName];
    if (mapped) return `/${mapped}`;
    return isEnglish ? '/index.html' : '/index-en.html';
}

function buildHeaderLinksMarkup(links) {
    return links.map((entry) => `<span><a href="${entry.href}">${entry.label}</a></span>`).join('');
}

function buildMobileLinksMarkup(links) {
    return links.map((entry) => `<li><a href="${entry.href}" class="mobile-nav-link">${entry.label}</a></li>`).join('');
}

function buildSocialLinksMarkup(linkClass) {
    return FLOATING_SOCIAL_LINKS.map((entry) => (
        `<a href="${entry.href}" class="${linkClass}" target="_blank" rel="noopener noreferrer" aria-label="${entry.label}">${getSocialIconSvg(entry.icon)}</a>`
    )).join('');
}

function renderSharedHeader() {
    const root = document.querySelector('header.shop-header[data-header-template="shared"]');
    if (!root) return;
    document.body.classList.add('shared-shell-page');

    const pageName = getCurrentPageName();
    const htmlLang = (document.documentElement.getAttribute('lang') || '').toLowerCase();
    const isEnglish = htmlLang.startsWith('en');
    const links = isEnglish ? HEADER_LINKS_EN : HEADER_LINKS_PL;
    const languageHref = getLanguageSwitchHref(pageName, isEnglish);
    const languageLabel = isEnglish ? 'PL' : 'EN';
    const languageAria = isEnglish ? 'Switch to Polish' : 'Switch to English';
    const navAria = isEnglish ? 'Site navigation' : 'Nawigacja strony';
    const mobileNavAria = isEnglish ? 'Mobile navigation' : 'Nawigacja mobilna';
    const menuAria = isEnglish ? 'Open menu' : 'Otworz menu';
    const socialAria = isEnglish ? 'Social media links' : 'Linki social media';
    const brandHref = isEnglish ? 'index-en.html' : 'index.html';

    root.innerHTML = `
    <div class="container header-inner">
        <a href="${languageHref}" class="header-mobile-lang" aria-label="${languageAria}">${languageLabel}</a>
        <a class="brand" href="${brandHref}" aria-label="Tabula Rasa">
            <img src="logo.png" data-logo-anim="logo.gif" alt="Tabula Rasa" class="brand-logo">
        </a>

        <nav class="header-nav" aria-label="${navAria}">
            ${buildHeaderLinksMarkup(links)}
        </nav>

        <div class="header-actions">
            <a href="${languageHref}" class="header-lang-link" aria-label="${languageAria}">${languageLabel}</a>
            <button class="hamburger-btn" id="hamburger" type="button" aria-label="${menuAria}" aria-controls="nav-mobile" aria-expanded="false">
                <span></span>
                <span></span>
                <span></span>
            </button>
        </div>
    </div>

    <nav class="mobile-nav" id="nav-mobile" aria-label="${mobileNavAria}" aria-hidden="true">
        <aside class="mobile-nav-panel" role="dialog" aria-modal="true" aria-label="Menu">
            <ul class="mobile-nav-list">
                ${buildMobileLinksMarkup(links)}
            </ul>
            <div class="mobile-nav-social" role="group" aria-label="${socialAria}">
                ${buildSocialLinksMarkup('mobile-nav-social-link')}
            </div>
        </aside>
    </nav>`;

    hamburger = document.getElementById('hamburger');
}

renderSharedHeader();

function getHeroTitleForViewport(pageName, baseTitle) {
    const isMobileViewport = window.matchMedia('(max-width: 900px)').matches;
    if (!isMobileViewport) return baseTitle;
    if (pageName === 'index.html') return 'Aktualno\u015Bci';
    if (pageName === 'index-en.html') return 'News';
    return baseTitle;
}

function injectPageHeroCopy() {
    const newsSection = document.getElementById('news');
    if (!newsSection || newsSection.dataset.heroInit === '1') return;

    const heading = newsSection.querySelector('#welcome, h1');
    if (!heading) return;

    const currentPage = getCurrentPageName();
    const htmlLang = (document.documentElement.getAttribute('lang') || '').toLowerCase();
    const fallbackCopy = htmlLang.startsWith('en')
        ? {
            eyebrow: 'OFFICIAL WEBSITE',
            title: heading.textContent ? heading.textContent.trim() : 'Tabula Rasa',
            subtitle: 'Music, live shows, and current updates from the band.'
        }
        : {
            eyebrow: 'OFICJALNA STRONA',
            title: heading.textContent ? heading.textContent.trim() : 'Tabula Rasa',
            subtitle: 'Muzyka, koncerty i aktualnosci zespolu.'
        };
    const copy = { ...(PAGE_HERO_COPY[currentPage] || fallbackCopy) };
    copy.title = getHeroTitleForViewport(currentPage, copy.title);

    const intro = document.createElement('div');
    intro.className = 'hero-content page-hero-intro';

    const eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow page-hero-eyebrow';
    eyebrow.textContent = copy.eyebrow;

    const subtitle = document.createElement('p');
    subtitle.className = 'lead page-hero-subtitle';
    subtitle.textContent = copy.subtitle;

    heading.textContent = copy.title;
    heading.classList.add('page-hero-title');

    newsSection.classList.add('hero');
    newsSection.insertBefore(intro, heading);
    intro.appendChild(eyebrow);
    intro.appendChild(heading);
    intro.appendChild(subtitle);
    newsSection.dataset.heroInit = '1';
}

function refreshResponsiveHeroTitle() {
    const pageName = getCurrentPageName();
    if (pageName !== 'index.html' && pageName !== 'index-en.html') return;

    const newsSection = document.getElementById('news');
    if (!newsSection || newsSection.dataset.heroInit !== '1') return;

    const heading = newsSection.querySelector('.page-hero-title');
    if (!heading) return;

    const baseTitle = PAGE_HERO_COPY[pageName] && PAGE_HERO_COPY[pageName].title
        ? PAGE_HERO_COPY[pageName].title
        : heading.textContent.trim();
    const responsiveTitle = getHeroTitleForViewport(pageName, baseTitle);

    if (heading.textContent !== responsiveTitle) {
        heading.textContent = responsiveTitle;
    }
}

function hasGtmScript(containerId = GTM_CONTAINER_ID) {
    const expectedSrc = `googletagmanager.com/gtm.js?id=${containerId}`;
    return Array.from(document.scripts).some((script) => (script.src || '').includes(expectedSrc));
}

function hasGtmStartEvent() {
    if (!Array.isArray(window.dataLayer)) return false;
    return window.dataLayer.some((entry) => (
        entry &&
        typeof entry === 'object' &&
        (entry.event === 'gtm.js' || Object.prototype.hasOwnProperty.call(entry, 'gtm.start'))
    ));
}

function initDeferredGtmBootstrap() {
    if (!GTM_CONTAINER_ID || window.__trDeferredGtmSetup) return;
    if (hasGtmScript(GTM_CONTAINER_ID)) return;
    window.__trDeferredGtmSetup = true;
    window.dataLayer = window.dataLayer || [];

    let loaded = false;

    const loadGtm = () => {
        if (loaded || hasGtmScript(GTM_CONTAINER_ID)) return;
        loaded = true;

        if (!hasGtmStartEvent()) {
            window.dataLayer.push({
                'gtm.start': Date.now(),
                event: 'gtm.js'
            });
        }

        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_CONTAINER_ID}`;

        const firstScript = document.getElementsByTagName('script')[0];
        if (firstScript && firstScript.parentNode) {
            firstScript.parentNode.insertBefore(script, firstScript);
        } else if (document.head) {
            document.head.appendChild(script);
        } else {
            document.documentElement.appendChild(script);
        }
    };

    const intentEvents = ['pointerdown', 'keydown', 'touchstart'];
    const listenerOptions = { passive: true };

    const onFirstIntent = () => {
        loadGtm();
        intentEvents.forEach((eventName) => {
            window.removeEventListener(eventName, onFirstIntent, listenerOptions);
        });
    };

    intentEvents.forEach((eventName) => {
        window.addEventListener(eventName, onFirstIntent, listenerOptions);
    });

    window.addEventListener('load', () => {
        window.setTimeout(loadGtm, GTM_DEFER_TIMEOUT_MS);
    }, { once: true });
}

function pushDataLayerEvent(eventName, payload = {}) {
    if (!eventName) return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        event: eventName,
        ...payload
    });
}

function getNormalizedLanguageCode() {
    const htmlLang = (document.documentElement.getAttribute('lang') || '').toLowerCase();
    if (htmlLang.startsWith('en')) return 'en';
    if (htmlLang.startsWith('pl')) return 'pl';
    return htmlLang || 'pl';
}

function getCookieConsentCopy() {
    const language = getNormalizedLanguageCode();
    if (language === 'en') {
        return {
            title: 'Privacy settings',
            description: 'We use necessary cookies and optional analytics and marketing tools only with your consent.',
            acceptAll: 'Accept all',
            rejectOptional: 'Reject optional',
            settings: 'Settings',
            saveSettings: 'Save settings',
            closeSettings: 'Close',
            requiredLabel: 'Necessary',
            requiredHint: 'Always active',
            analyticsLabel: 'Analytics',
            analyticsHint: 'Traffic and performance measurement',
            marketingLabel: 'Marketing',
            marketingHint: 'Ad and social media measurement',
            privacyLabel: 'Privacy policy',
            termsLabel: 'Terms',
            manageLabel: 'Cookies'
        };
    }

    return {
        title: 'Ustawienia prywatnosci',
        description: 'Uzywamy cookies niezbednych oraz opcjonalnych narzedzi analitycznych i marketingowych tylko po Twojej zgodzie.',
        acceptAll: 'Akceptuj wszystkie',
        rejectOptional: 'Odrzuc opcjonalne',
        settings: 'Ustawienia',
        saveSettings: 'Zapisz ustawienia',
        closeSettings: 'Zamknij',
        requiredLabel: 'Niezbedne',
        requiredHint: 'Zawsze aktywne',
        analyticsLabel: 'Analityczne',
        analyticsHint: 'Pomiar ruchu i wydajnosci',
        marketingLabel: 'Marketingowe',
        marketingHint: 'Pomiar reklam i social media',
        privacyLabel: 'Polityka prywatnosci',
        termsLabel: 'Regulamin',
        manageLabel: 'Cookies'
    };
}

function getCookieLegalLinks() {
    const language = getNormalizedLanguageCode();
    if (language === 'en') {
        return {
            privacy: 'privacy-policy.html',
            terms: 'terms.html'
        };
    }

    return {
        privacy: 'polityka-prywatnosci.html',
        terms: 'regulamin.html'
    };
}

function ensureGtagApiStub() {
    window.dataLayer = window.dataLayer || [];
    if (typeof window.gtag !== 'function') {
        window.gtag = function gtag() {
            window.dataLayer.push(arguments);
        };
    }
}

function normalizeCookieConsentState(value) {
    const fallback = {
        necessary: true,
        analytics: false,
        marketing: false,
        updatedAt: new Date().toISOString(),
        version: COOKIE_CONSENT_VERSION
    };

    if (!value || typeof value !== 'object') return fallback;

    return {
        necessary: true,
        analytics: Boolean(value.analytics),
        marketing: Boolean(value.marketing),
        updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : fallback.updatedAt,
        version: typeof value.version === 'string' ? value.version : COOKIE_CONSENT_VERSION
    };
}

function readStoredCookieConsent() {
    try {
        const raw = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        const normalized = normalizeCookieConsentState(parsed);
        const updatedAt = Date.parse(normalized.updatedAt);
        if (Number.isFinite(updatedAt)) {
            const ageMs = Date.now() - updatedAt;
            const maxAgeMs = COOKIE_CONSENT_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
            if (ageMs > maxAgeMs) {
                window.localStorage.removeItem(COOKIE_CONSENT_STORAGE_KEY);
                return null;
            }
        }
        return normalized;
    } catch {
        return null;
    }
}

function writeStoredCookieConsent(consentState) {
    const normalized = normalizeCookieConsentState(consentState);
    try {
        window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(normalized));
    } catch {
        // Ignore storage errors (private mode, quota, etc.).
    }
    return normalized;
}

function buildConsentModePayload(consentState, includeWaitForUpdate = false) {
    const analyticsStorage = consentState.analytics ? 'granted' : 'denied';
    const adStorage = consentState.marketing ? 'granted' : 'denied';

    const payload = {
        ad_storage: adStorage,
        analytics_storage: analyticsStorage,
        ad_user_data: adStorage,
        ad_personalization: adStorage,
        personalization_storage: adStorage,
        functionality_storage: 'granted',
        security_storage: 'granted'
    };

    if (includeWaitForUpdate) {
        payload.wait_for_update = 500;
    }

    return payload;
}

function applyConsentModeState(consentState, mode = 'update') {
    ensureGtagApiStub();
    const includeWaitForUpdate = mode === 'default';
    window.gtag('consent', mode, buildConsentModePayload(consentState, includeWaitForUpdate));
}

function initConsentModeDefaults() {
    if (window.__trConsentModeInit) return;
    window.__trConsentModeInit = true;

    const deniedByDefault = normalizeCookieConsentState({
        analytics: false,
        marketing: false
    });
    const hasHeadConsentDefault = Boolean(window.__trConsentDefaultFromHead);
    if (!hasHeadConsentDefault) {
        applyConsentModeState(deniedByDefault, 'default');
    }

    const stored = readStoredCookieConsent();
    if (stored) {
        window.__trCookieConsentState = stored;
        applyConsentModeState(stored, 'update');
    } else {
        window.__trCookieConsentState = deniedByDefault;
    }
}

function setCookieBannerVisibility(isVisible, showSettings = false) {
    const banner = document.getElementById(COOKIE_BANNER_ID);
    if (!banner) return;

    banner.classList.toggle('is-visible', isVisible);
    banner.classList.toggle('is-settings-open', isVisible && showSettings);
    banner.setAttribute('aria-hidden', isVisible ? 'false' : 'true');

    const fab = document.getElementById(COOKIE_SETTINGS_BUTTON_ID);
    if (fab) {
        fab.classList.toggle('is-hidden', isVisible);
    }
}

function syncCookieConsentInputs(consentState) {
    const banner = document.getElementById(COOKIE_BANNER_ID);
    if (!banner) return;

    const analyticsInput = banner.querySelector('[data-cookie-field="analytics"]');
    const marketingInput = banner.querySelector('[data-cookie-field="marketing"]');
    if (analyticsInput) analyticsInput.checked = Boolean(consentState.analytics);
    if (marketingInput) marketingInput.checked = Boolean(consentState.marketing);
}

function readCookieConsentInputs() {
    const banner = document.getElementById(COOKIE_BANNER_ID);
    if (!banner) {
        return normalizeCookieConsentState({ analytics: false, marketing: false });
    }

    const analyticsInput = banner.querySelector('[data-cookie-field="analytics"]');
    const marketingInput = banner.querySelector('[data-cookie-field="marketing"]');
    return normalizeCookieConsentState({
        analytics: Boolean(analyticsInput && analyticsInput.checked),
        marketing: Boolean(marketingInput && marketingInput.checked)
    });
}

function applyAndStoreCookieConsent(consentState, source = 'banner') {
    const normalized = writeStoredCookieConsent({
        ...consentState,
        updatedAt: new Date().toISOString(),
        version: COOKIE_CONSENT_VERSION
    });

    window.__trCookieConsentState = normalized;
    applyConsentModeState(normalized, 'update');

    const pageName = getCurrentPageName();
    const pageLanguage = getNormalizedLanguageCode();

    pushDataLayerEvent('tr_consent_update', {
        consent_source: source,
        consent_analytics: normalized.analytics ? 'granted' : 'denied',
        consent_marketing: normalized.marketing ? 'granted' : 'denied',
        consent_version: normalized.version,
        page_name: pageName,
        page_language: pageLanguage
    });

    setCookieBannerVisibility(false, false);
    syncCookieConsentInputs(normalized);
}

function openCookieConsentManager(openSettings = true) {
    const currentState = window.__trCookieConsentState || readStoredCookieConsent() || normalizeCookieConsentState({
        analytics: false,
        marketing: false
    });
    syncCookieConsentInputs(currentState);
    setCookieBannerVisibility(true, openSettings);
}

function buildCookieBannerMarkup(copy, links, consentState) {
    const analyticsChecked = consentState.analytics ? 'checked' : '';
    const marketingChecked = consentState.marketing ? 'checked' : '';

    return `
        <div class="cookie-consent-inner">
            <div class="cookie-consent-copy">
                <h2>${copy.title}</h2>
                <p>${copy.description}</p>
            </div>
            <div class="cookie-consent-actions">
                <button type="button" class="cookie-btn cookie-btn-primary" data-cookie-action="accept-all">${copy.acceptAll}</button>
                <button type="button" class="cookie-btn cookie-btn-ghost" data-cookie-action="reject-optional">${copy.rejectOptional}</button>
                <button type="button" class="cookie-btn cookie-btn-link" data-cookie-action="toggle-settings">${copy.settings}</button>
                <div class="cookie-consent-links">
                    <a href="${links.privacy}">${copy.privacyLabel}</a>
                    <span aria-hidden="true">·</span>
                    <a href="${links.terms}">${copy.termsLabel}</a>
                </div>
            </div>
            <div class="cookie-consent-settings">
                <label class="cookie-switch-row cookie-switch-row-required">
                    <span class="cookie-switch-copy">
                        <strong>${copy.requiredLabel}</strong>
                        <small>${copy.requiredHint}</small>
                    </span>
                    <input type="checkbox" checked disabled>
                </label>
                <label class="cookie-switch-row">
                    <span class="cookie-switch-copy">
                        <strong>${copy.analyticsLabel}</strong>
                        <small>${copy.analyticsHint}</small>
                    </span>
                    <input type="checkbox" data-cookie-field="analytics" ${analyticsChecked}>
                </label>
                <label class="cookie-switch-row">
                    <span class="cookie-switch-copy">
                        <strong>${copy.marketingLabel}</strong>
                        <small>${copy.marketingHint}</small>
                    </span>
                    <input type="checkbox" data-cookie-field="marketing" ${marketingChecked}>
                </label>
                <div class="cookie-settings-actions">
                    <button type="button" class="cookie-btn cookie-btn-primary" data-cookie-action="save-settings">${copy.saveSettings}</button>
                    <button type="button" class="cookie-btn cookie-btn-link" data-cookie-action="close-settings">${copy.closeSettings}</button>
                </div>
            </div>
        </div>
    `;
}

function ensureCookieSettingsFab(copy) {
    let button = document.getElementById(COOKIE_SETTINGS_BUTTON_ID);
    if (!button) {
        button = document.createElement('button');
        button.id = COOKIE_SETTINGS_BUTTON_ID;
        button.type = 'button';
        button.className = 'cookie-settings-fab';
        button.setAttribute('aria-label', copy.manageLabel);
        document.body.appendChild(button);
    }

    button.textContent = copy.manageLabel;
    button.addEventListener('click', () => {
        openCookieConsentManager(true);
    });
}

function ensureFooterCookieSettingsLinks(copy) {
    const footerNavs = Array.from(document.querySelectorAll('footer.shop-footer .shop-footer-nav'));
    if (footerNavs.length === 0) return;

    footerNavs.forEach((nav) => {
        if (nav.querySelector('.shop-footer-cookie-link')) return;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'shop-footer-cookie-link';
        button.setAttribute('data-cookie-settings-open', '1');
        button.textContent = copy.manageLabel;
        nav.appendChild(button);
    });
}

function initCookieConsentUi() {
    if (window.__trCookieConsentUiInit) return;
    window.__trCookieConsentUiInit = true;

    const copy = getCookieConsentCopy();
    const links = getCookieLegalLinks();
    const storedConsent = readStoredCookieConsent();
    const initialConsent = storedConsent || normalizeCookieConsentState({
        analytics: false,
        marketing: false
    });

    let banner = document.getElementById(COOKIE_BANNER_ID);
    if (!banner) {
        banner = document.createElement('section');
        banner.id = COOKIE_BANNER_ID;
        banner.className = 'cookie-consent-banner';
        banner.setAttribute('role', 'dialog');
        banner.setAttribute('aria-live', 'polite');
        banner.setAttribute('aria-hidden', 'true');
        banner.innerHTML = buildCookieBannerMarkup(copy, links, initialConsent);
        document.body.appendChild(banner);
    }

    ensureCookieSettingsFab(copy);
    ensureFooterCookieSettingsLinks(copy);
    syncCookieConsentInputs(initialConsent);

    if (!storedConsent) {
        setCookieBannerVisibility(true, false);
    } else {
        setCookieBannerVisibility(false, false);
    }

    banner.addEventListener('click', (event) => {
        const actionButton = event.target.closest('[data-cookie-action]');
        if (!actionButton) return;

        const action = actionButton.getAttribute('data-cookie-action');
        if (action === 'accept-all') {
            applyAndStoreCookieConsent({ analytics: true, marketing: true }, 'accept_all');
            return;
        }
        if (action === 'reject-optional') {
            applyAndStoreCookieConsent({ analytics: false, marketing: false }, 'reject_optional');
            return;
        }
        if (action === 'toggle-settings') {
            banner.classList.toggle('is-settings-open');
            return;
        }
        if (action === 'close-settings') {
            banner.classList.remove('is-settings-open');
            return;
        }
        if (action === 'save-settings') {
            const selected = readCookieConsentInputs();
            applyAndStoreCookieConsent(selected, 'custom_save');
        }
    });

    document.addEventListener('click', (event) => {
        const opener = event.target.closest('[data-cookie-settings-open]');
        if (!opener) return;
        event.preventDefault();
        openCookieConsentManager(true);
    });
}

function getNewsletterCopy() {
    const language = getNormalizedLanguageCode();
    if (language === 'en') {
        return {
            heading: 'Stay in the loop',
            placeholder: 'Your e-mail address',
            button: 'Join',
            pending: 'Sending...',
            success: 'Thanks, you are on the list.',
            error: 'Could not save your signup. Try again in a moment.',
            invalidEmail: 'Enter a valid e-mail address.',
            consent: 'I agree to the processing of my e-mail according to the',
            privacy: 'privacy policy',
            consentRequired: 'Consent is required to sign up.'
        };
    }

    return {
        heading: 'Newsletter koncertowy',
        placeholder: 'Twój adres e-mail',
        button: 'Zapisz się',
        pending: 'Wysyłanie...',
        success: 'Dzięki, jesteś na liście.',
        error: 'Nie udało się zapisać. Spróbuj ponownie za chwilę.',
        invalidEmail: 'Podaj poprawny adres e-mail.',
        consent: 'Wyrażam zgodę na przetwarzanie e-maila zgodnie z',
        privacy: 'polityką prywatności',
        consentRequired: 'Zgoda jest wymagana do zapisu.'
    };
}

function getNewsletterPrivacyHref() {
    return getNormalizedLanguageCode() === 'en'
        ? 'privacy-policy.html'
        : 'polityka-prywatnosci.html';
}

function ensureFooterNewsletterForms() {
    const footerContainers = Array.from(document.querySelectorAll('footer.shop-footer .shop-footer-compact'));
    if (footerContainers.length === 0) return;

    const copy = getNewsletterCopy();
    const privacyHref = getNewsletterPrivacyHref();

    footerContainers.forEach((container) => {
        if (container.querySelector('.shop-footer-newsletter')) return;

        const section = document.createElement('section');
        section.className = 'shop-footer-newsletter';
        section.setAttribute('aria-label', copy.heading);
        section.innerHTML = `
            <p class="shop-footer-newsletter-lead">${copy.heading}</p>
            <form class="shop-footer-newsletter-form newsletter-form" method="POST" action="${NEWSLETTER_FORM_ENDPOINT}" novalidate>
                <input type="email" name="email" placeholder="${copy.placeholder}" aria-label="${copy.placeholder}" autocomplete="email" required>
                <button type="submit">${copy.button}</button>
                <input type="hidden" name="source" value="newsletter_footer">
            </form>
            <label class="shop-footer-newsletter-legal">
                <input type="checkbox" name="newsletter_consent" required>
                <span>${copy.consent} <a href="${privacyHref}">${copy.privacy}</a>.</span>
            </label>
            <p class="shop-footer-newsletter-status" aria-live="polite"></p>
        `;

        const nav = container.querySelector('.shop-footer-nav');
        if (nav) {
            container.insertBefore(section, nav);
        } else {
            container.prepend(section);
        }
    });
}

function initNewsletterFormHandling(pageName, pageLanguage) {
    const forms = Array.from(document.querySelectorAll('form.newsletter-form'));
    if (forms.length === 0) return;

    const copy = getNewsletterCopy();

    forms.forEach((form) => {
        if (form.dataset.trBound === '1') return;
        form.dataset.trBound = '1';

        const submitButton = form.querySelector('button[type="submit"]');
        const status = form.closest('.shop-footer-newsletter') && form.closest('.shop-footer-newsletter').querySelector('.shop-footer-newsletter-status');
        const consentInput = form.closest('.shop-footer-newsletter') && form.closest('.shop-footer-newsletter').querySelector('input[name="newsletter_consent"]');

        form.addEventListener('submit', async (event) => {
            event.preventDefault();

            const emailInput = form.querySelector('input[type="email"]');
            const emailValue = emailInput ? (emailInput.value || '').trim() : '';
            const emailDomain = emailValue.includes('@') ? emailValue.split('@').pop().toLowerCase() : '';
            const consentGiven = Boolean(consentInput && consentInput.checked);

            if (!emailInput || !emailInput.checkValidity()) {
                if (status) {
                    status.textContent = copy.invalidEmail;
                    status.dataset.state = 'error';
                }
                return;
            }

            if (!consentGiven) {
                if (status) {
                    status.textContent = copy.consentRequired;
                    status.dataset.state = 'error';
                }
                return;
            }

            pushDataLayerEvent('tr_newsletter_signup_start', {
                page_name: pageName,
                page_language: pageLanguage,
                form_location: 'footer',
                email_domain: emailDomain
            });

            if (submitButton) {
                submitButton.disabled = true;
                submitButton.dataset.originalLabel = submitButton.textContent || copy.button;
                submitButton.textContent = copy.pending;
            }
            if (status) {
                status.textContent = '';
                status.dataset.state = '';
            }

            const endpoint = form.getAttribute('action') || NEWSLETTER_FORM_ENDPOINT;
            const formData = new FormData(form);
            formData.set('page_name', pageName);
            formData.set('page_language', pageLanguage);
            formData.set('_subject', pageLanguage === 'en'
                ? `Newsletter signup (${pageName})`
                : `Zapis newsletter (${pageName})`);

            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        Accept: 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`Newsletter signup failed with status ${response.status}`);
                }

                if (status) {
                    status.textContent = copy.success;
                    status.dataset.state = 'success';
                }
                form.reset();

                pushDataLayerEvent('tr_newsletter_signup', {
                    page_name: pageName,
                    page_language: pageLanguage,
                    form_location: 'footer',
                    email_domain: emailDomain
                });
            } catch {
                if (status) {
                    status.textContent = copy.error;
                    status.dataset.state = 'error';
                }

                pushDataLayerEvent('tr_newsletter_signup_error', {
                    page_name: pageName,
                    page_language: pageLanguage,
                    form_location: 'footer'
                });
            } finally {
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = submitButton.dataset.originalLabel || copy.button;
                }
            }
        });
    });
}

function getSocialPlatformFromHref(href) {
    const value = (href || '').toLowerCase();
    if (value.includes('instagram.com')) return 'instagram';
    if (value.includes('tiktok.com')) return 'tiktok';
    if (value.includes('youtube.com')) return 'youtube';
    if (value.includes('facebook.com')) return 'facebook';
    if (value.includes('spotify.com')) return 'spotify';
    return '';
}

function getSocialPlacement(link) {
    if (!link) return 'unknown';
    if (link.classList.contains('mobile-nav-social-link')) return 'mobile_menu';
    if (link.classList.contains('shop-footer-social-link')) return 'footer';
    if (link.classList.contains('floating-social-link')) return 'floating';
    return 'other';
}

function initSocialClickTracking(pageName, pageLanguage) {
    if (window.__trSocialClickTrackingInit) return;
    window.__trSocialClickTrackingInit = true;

    document.addEventListener('click', (event) => {
        const link = event.target.closest('a[href]');
        if (!link) return;

        const platform = getSocialPlatformFromHref(link.getAttribute('href') || '');
        if (!platform) return;

        pushDataLayerEvent('tr_social_click', {
            page_name: pageName,
            page_language: pageLanguage,
            social_platform: platform,
            social_placement: getSocialPlacement(link),
            link_url: link.href || ''
        });
    });
}

function getFileExtensionFromPath(pathname) {
    const normalized = (pathname || '').toLowerCase();
    const index = normalized.lastIndexOf('.');
    if (index === -1) return '';
    return normalized.slice(index + 1);
}

function initDownloadTracking(pageName, pageLanguage) {
    if (window.__trDownloadTrackingInit) return;
    window.__trDownloadTrackingInit = true;

    document.addEventListener('click', (event) => {
        const link = event.target.closest('a[href]');
        if (!link) return;

        const href = link.getAttribute('href') || '';
        if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

        let url;
        try {
            url = new URL(href, window.location.href);
        } catch {
            return;
        }

        const hasDownloadAttr = link.hasAttribute('download');
        const isResourceButton = link.classList.contains('rider-download-btn');
        const looksLikeFile = DOWNLOAD_FILE_PATTERN.test(url.pathname || '');
        if (!hasDownloadAttr && !isResourceButton && !looksLikeFile) return;

        const fileNameFromPath = decodeURIComponent((url.pathname || '').split('/').filter(Boolean).pop() || '');
        const fallbackName = (link.textContent || '').trim();
        const fileName = fileNameFromPath || fallbackName || 'resource';
        const fileExtension = getFileExtensionFromPath(url.pathname || '');

        pushDataLayerEvent('tr_file_download', {
            page_name: pageName,
            page_language: pageLanguage,
            file_name: fileName,
            file_extension: fileExtension,
            file_url: url.href,
            is_external: url.origin !== window.location.origin ? 'true' : 'false'
        });
    });
}

function ensureYouTubeIframeApi() {
    if (window.YT && typeof window.YT.Player === 'function') {
        return Promise.resolve(window.YT);
    }
    if (youtubeIframeApiPromise) return youtubeIframeApiPromise;

    youtubeIframeApiPromise = new Promise((resolve, reject) => {
        const existingScript = document.querySelector('script[src=\"https://www.youtube.com/iframe_api\"]');
        if (!existingScript) {
            const script = document.createElement('script');
            script.src = 'https://www.youtube.com/iframe_api';
            script.async = true;
            document.head.appendChild(script);
        }

        const previousReady = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
            if (typeof previousReady === 'function') previousReady();
            resolve(window.YT);
        };

        window.setTimeout(() => {
            if (window.YT && typeof window.YT.Player === 'function') {
                resolve(window.YT);
            } else {
                reject(new Error('YouTube API init timeout'));
            }
        }, 12000);
    });

    return youtubeIframeApiPromise;
}

function ensureYouTubePlayerSrc(iframe) {
    const rawSrc = iframe.getAttribute('src') || '';
    if (!rawSrc) return rawSrc;

    let url;
    try {
        url = new URL(rawSrc, window.location.href);
    } catch {
        return rawSrc;
    }

    url.searchParams.set('enablejsapi', '1');
    url.searchParams.set('origin', window.location.origin);
    if (!url.searchParams.has('rel')) {
        url.searchParams.set('rel', '0');
    }

    const nextSrc = url.toString();
    if (nextSrc !== rawSrc) {
        iframe.setAttribute('src', nextSrc);
    }
    return nextSrc;
}

function getYouTubeVideoIdFromSrc(src) {
    if (!src) return '';
    try {
        const url = new URL(src, window.location.href);
        const parts = (url.pathname || '').split('/').filter(Boolean);
        return parts.length > 0 ? parts[parts.length - 1] : '';
    } catch {
        return '';
    }
}

function initYouTubeVideoTracking(pageName, pageLanguage) {
    if (window.__trYoutubeVideoTrackingInit) return;
    window.__trYoutubeVideoTrackingInit = true;

    const youtubeIframes = Array.from(document.querySelectorAll('.video-container iframe[src*=\"youtube.com/embed/\"]'));
    if (youtubeIframes.length === 0) return;

    const playersState = new Map();

    ensureYouTubeIframeApi()
        .then(() => {
            youtubeIframes.forEach((iframe, index) => {
                const songTitleNode = iframe.closest('.song') && iframe.closest('.song').querySelector('h3');
                const songTitle = songTitleNode ? songTitleNode.textContent.trim() : '';
                const src = ensureYouTubePlayerSrc(iframe);
                const videoId = getYouTubeVideoIdFromSrc(src);

                if (!iframe.id) {
                    iframe.id = `tr-youtube-player-${index + 1}`;
                }

                const state = {
                    videoId,
                    videoTitle: songTitle,
                    started: false,
                    milestones: new Set(),
                    timer: null
                };
                playersState.set(iframe.id, state);

                const stopTimer = () => {
                    if (state.timer) {
                        window.clearInterval(state.timer);
                        state.timer = null;
                    }
                };

                const markMilestones = (player) => {
                    const duration = Number(player.getDuration());
                    const currentTime = Number(player.getCurrentTime());
                    if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(currentTime)) return;

                    const progress = Math.min(100, Math.max(0, Math.round((currentTime / duration) * 100)));
                    const checkpoints = [25, 50, 75];
                    checkpoints.forEach((checkpoint) => {
                        if (progress >= checkpoint && !state.milestones.has(checkpoint)) {
                            state.milestones.add(checkpoint);
                            pushDataLayerEvent('tr_video_progress', {
                                page_name: pageName,
                                page_language: pageLanguage,
                                video_provider: 'youtube',
                                video_id: state.videoId,
                                video_title: state.videoTitle,
                                progress_percent: checkpoint
                            });
                        }
                    });

                    if (progress >= 98 && !state.milestones.has(100)) {
                        state.milestones.add(100);
                        pushDataLayerEvent('tr_video_complete', {
                            page_name: pageName,
                            page_language: pageLanguage,
                            video_provider: 'youtube',
                            video_id: state.videoId,
                            video_title: state.videoTitle
                        });
                    }
                };

                const startTimer = (player) => {
                    if (state.timer) return;
                    state.timer = window.setInterval(() => {
                        markMilestones(player);
                    }, 1000);
                };

                // eslint-disable-next-line no-new
                new window.YT.Player(iframe.id, {
                    events: {
                        onStateChange: (event) => {
                            if (event.data === window.YT.PlayerState.PLAYING) {
                                if (!state.started) {
                                    state.started = true;
                                    pushDataLayerEvent('tr_video_play', {
                                        page_name: pageName,
                                        page_language: pageLanguage,
                                        video_provider: 'youtube',
                                        video_id: state.videoId,
                                        video_title: state.videoTitle
                                    });
                                }
                                startTimer(event.target);
                                return;
                            }

                            if (event.data === window.YT.PlayerState.ENDED) {
                                markMilestones(event.target);
                                stopTimer();
                                return;
                            }

                            if (event.data === window.YT.PlayerState.PAUSED || event.data === window.YT.PlayerState.BUFFERING) {
                                stopTimer();
                            }
                        }
                    }
                });
            });
        })
        .catch(() => {
            // Ignore API init errors - tracking is best effort only.
        });
}

function initMarketingEventTracking() {
    if (window.__trMarketingEventsInit) return;
    window.__trMarketingEventsInit = true;

    const pageName = getCurrentPageName();
    const pagePath = window.location.pathname || '/';
    const pageLanguage = getNormalizedLanguageCode();
    const pageTitle = (document.title || '').trim();

    pushDataLayerEvent('tr_page_view', {
        page_name: pageName,
        page_path: pagePath,
        page_language: pageLanguage,
        page_title: pageTitle
    });

    const ticketButtons = Array.from(document.querySelectorAll('.ticket-btn'));
    ticketButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const concertNameNode = button.closest('.concert-item') && button.closest('.concert-item').querySelector('h3');
            const concertName = concertNameNode ? concertNameNode.textContent.trim() : '';
            const ticketUrl = button.getAttribute('href') || '';

            pushDataLayerEvent('tr_ticket_click', {
                page_name: pageName,
                page_language: pageLanguage,
                concert_name: concertName,
                ticket_url: ticketUrl
            });
        });
    });

    const contactForms = Array.from(document.querySelectorAll('form.contact-form'));
    contactForms.forEach((form) => {
        form.addEventListener('submit', () => {
            const formAction = form.getAttribute('action') || '';
            pushDataLayerEvent('tr_contact_submit', {
                page_name: pageName,
                page_language: pageLanguage,
                form_action: formAction
            });
        });
    });

    initNewsletterFormHandling(pageName, pageLanguage);
    initSocialClickTracking(pageName, pageLanguage);
    initDownloadTracking(pageName, pageLanguage);
    initYouTubeVideoTracking(pageName, pageLanguage);

    const menuLinks = Array.from(document.querySelectorAll('.header-nav a, .mobile-nav-link'));
    menuLinks.forEach((link) => {
        link.addEventListener('click', () => {
            const target = getLinkPageName(link);
            const navType = link.classList.contains('mobile-nav-link') ? 'mobile' : 'desktop';

            pushDataLayerEvent('tr_navigation_click', {
                page_name: pageName,
                page_language: pageLanguage,
                nav_type: navType,
                nav_target: target
            });
        });
    });

    const langLinks = Array.from(document.querySelectorAll('.header-lang-link, .header-mobile-lang'));
    langLinks.forEach((link) => {
        link.addEventListener('click', () => {
            const targetPath = link.getAttribute('href') || '';

            pushDataLayerEvent('tr_language_switch_click', {
                page_name: pageName,
                page_language: pageLanguage,
                target_path: targetPath
            });
        });
    });
}

initConsentModeDefaults();
initDeferredGtmBootstrap();

function ensureAccessibleIframes() {
    const htmlLang = (document.documentElement.getAttribute('lang') || '').toLowerCase();
    const isEnglish = htmlLang.startsWith('en');
    const missingTitleIframes = Array.from(document.querySelectorAll('iframe:not([title])'));
    if (missingTitleIframes.length === 0) return;

    missingTitleIframes.forEach((frame) => {
        const src = (frame.getAttribute('src') || '').toLowerCase();
        const songTitle = frame.closest('.song') && frame.closest('.song').querySelector('h3')
            ? frame.closest('.song').querySelector('h3').textContent.trim()
            : '';

        let title = isEnglish ? 'Embedded content' : 'Osadzona tresc';
        if (src.includes('youtube.com/embed/')) {
            title = songTitle
                ? (isEnglish ? `YouTube video: ${songTitle}` : `Teledysk YouTube: ${songTitle}`)
                : (isEnglish ? 'YouTube video' : 'Teledysk YouTube');
        } else if (src.includes('open.spotify.com/embed/')) {
            title = songTitle
                ? (isEnglish ? `Spotify player: ${songTitle}` : `Odtwarzacz Spotify: ${songTitle}`)
                : (isEnglish ? 'Spotify player' : 'Odtwarzacz Spotify');
        } else if (src.includes('google.com/maps/')) {
            title = isEnglish ? 'Map' : 'Mapa';
        }

        frame.setAttribute('title', title);
    });
}

function initWebVitalsRum() {
    if (window.__trWebVitalsRumInit) return;
    window.__trWebVitalsRumInit = true;

    const supportsPerf = typeof window.performance !== 'undefined';
    if (!supportsPerf) return;

    const pageName = getCurrentPageName();
    const sentMetrics = new Set();

    const sendMetric = (name, value, unit = 'ms') => {
        if (!Number.isFinite(value)) return;
        if (sentMetrics.has(name)) return;
        sentMetrics.add(name);

        const normalizedValue = unit === 'score'
            ? Number(value.toFixed(3))
            : Math.round(value);

        const payload = {
            event: 'web_vital',
            metric_name: name,
            metric_unit: unit,
            metric_value: normalizedValue,
            page: pageName
        };

        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push(payload);

        if (typeof window.gtag === 'function') {
            window.gtag('event', 'web_vital', {
                metric_name: name,
                metric_unit: unit,
                metric_value: normalizedValue,
                page_path: window.location.pathname || '/',
                page_title: document.title || ''
            });
        }
    };

    const navEntry = window.performance.getEntriesByType
        ? window.performance.getEntriesByType('navigation')[0]
        : null;
    if (navEntry && Number.isFinite(navEntry.responseStart)) {
        sendMetric('TTFB', navEntry.responseStart);
    }

    if (typeof PerformanceObserver === 'undefined') return;

    try {
        const paintObserver = new PerformanceObserver((entryList) => {
            entryList.getEntries().forEach((entry) => {
                if (entry.name === 'first-contentful-paint') {
                    sendMetric('FCP', entry.startTime);
                }
            });
        });
        paintObserver.observe({ type: 'paint', buffered: true });
    } catch (_) {
        // Ignore unsupported paint observer configurations.
    }

    let lcpValue = null;
    let clsValue = 0;
    let inpValue = 0;

    try {
        const lcpObserver = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];
            if (lastEntry) {
                lcpValue = lastEntry.startTime;
            }
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (_) {
        // Ignore unsupported LCP observer.
    }

    try {
        const clsObserver = new PerformanceObserver((entryList) => {
            entryList.getEntries().forEach((entry) => {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                }
            });
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch (_) {
        // Ignore unsupported CLS observer.
    }

    try {
        const inpObserver = new PerformanceObserver((entryList) => {
            entryList.getEntries().forEach((entry) => {
                const duration = entry.duration || 0;
                if (entry.interactionId > 0 && duration > inpValue) {
                    inpValue = duration;
                }
            });
        });
        inpObserver.observe({ type: 'event', buffered: true, durationThreshold: 40 });
    } catch (_) {
        // Ignore unsupported INP observer.
    }

    let didFlush = false;
    const flushVitals = () => {
        if (didFlush) return;
        didFlush = true;

        if (lcpValue !== null) {
            sendMetric('LCP', lcpValue);
        }
        sendMetric('CLS', clsValue, 'score');
        if (inpValue > 0) {
            sendMetric('INP', inpValue);
        }
    };

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            flushVitals();
        }
    }, { capture: true });
    window.addEventListener('pagehide', flushVitals, { once: true });
}

function ensureGsapScrollPlugin() {
    if (typeof gsap === 'undefined') return false;
    const alreadyRegistered = !!(gsap.plugins && gsap.plugins.scrollTo);
    if (alreadyRegistered) return true;
    if (typeof ScrollToPlugin === 'undefined') return false;
    gsap.registerPlugin(ScrollToPlugin);
    return !!(gsap.plugins && gsap.plugins.scrollTo);
}

function scrollToHeadline() {
    const h1Element = document.querySelector('h1');
    if (!h1Element) return;
    if (!ensureGsapScrollPlugin()) {
        h1Element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    gsap.to(window, {
        scrollTo: { y: h1Element, offsetY: window.innerHeight / 2 },
        duration: 1,
        ease: 'power2.out'
    });
}

function autoScrollToHeadlineOnLoad() {
    const h1Element = document.querySelector('h1');
    if (!h1Element) return;
    if (hasAutoScrolled) return;
    hasAutoScrolled = true;
    autoScrollCanceled = false;

    if (history && 'scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    if (window.scrollY > 0) {
        window.scrollTo(0, 0);
    }

    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const offset = Math.max(0, (window.innerHeight - h1Element.offsetHeight) / 2);
    const target = h1Element.getBoundingClientRect().top + window.pageYOffset - offset;

    if (prefersReduced) {
        window.scrollTo(0, target);
        ensureScrollEnabled();
        return;
    }

    const start = window.pageYOffset;
    const distance = target - start;
    const duration = 900;
    const startTime = performance.now();

    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    const step = (now) => {
        if (autoScrollCanceled) {
            autoScrollRaf = null;
            ensureScrollEnabled();
            return;
        }
        const elapsed = now - startTime;
        const t = Math.min(elapsed / duration, 1);
        const y = start + distance * easeOutCubic(t);
        window.scrollTo(0, y);
        if (t < 1) {
            autoScrollRaf = requestAnimationFrame(step);
        } else {
            autoScrollRaf = null;
            ensureScrollEnabled();
        }
    };

    if (autoScrollRaf) {
        cancelAnimationFrame(autoScrollRaf);
    }
    autoScrollRaf = requestAnimationFrame(step);
}

function cancelAutoScrollOnUserInput() {
    if (autoScrollRaf) {
        autoScrollCanceled = true;
        cancelAnimationFrame(autoScrollRaf);
        autoScrollRaf = null;
    }
    ensureScrollEnabled();
}

function isMobileMenuOpen() {
    const menuNav = document.getElementById('nav-mobile');
    return !!(menuNav && menuNav.classList.contains('active'));
}

function isGalleryModalOpen() {
    const modal = document.getElementById('expandedImageContainer');
    if (!modal) return false;
    const computed = window.getComputedStyle(modal);
    return computed.display !== 'none' && computed.pointerEvents !== 'none' && computed.opacity !== '0';
}

function canUnlockScroll() {
    return !isMobileMenuOpen() && !isGalleryModalOpen();
}

function ensureScrollEnabled(force = false) {
    if (!force && !canUnlockScroll()) return;
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    document.documentElement.style.overflowY = 'auto';
    document.body.style.overflowY = 'auto';
    document.documentElement.style.height = 'auto';
    document.body.style.height = 'auto';
    document.documentElement.style.position = 'static';
    document.body.style.position = 'static';
}

function refreshSliderImages() {
    sliderImages = Array.from(document.querySelectorAll('.background-slider img'));
    sliderImages.forEach((img) => {
        img.style.filter = '';
        img.decoding = 'async';
    });
}

function applyImageSource(img, isMobile) {
    if (!img) return;

    const src = isMobile
        ? img.getAttribute('data-mobile-src')
        : img.getAttribute('data-desktop-src');
    const srcset = isMobile
        ? img.getAttribute('data-mobile-srcset')
        : img.getAttribute('data-desktop-srcset');

    if (srcset && img.getAttribute('srcset') !== srcset) {
        img.srcset = srcset;
        img.sizes = '(max-width: 768px) 100vw, 100vw';
    }

    if (src && img.getAttribute('src') !== src) {
        img.src = src;
    }
}

function clearImageSource(img) {
    if (!img) return;
    img.removeAttribute('srcset');
    img.removeAttribute('sizes');
    if (!img.classList.contains('active')) {
        img.removeAttribute('src');
    }
}

function syncSliderImageSources() {
    if (sliderImages.length === 0) return;

    const isMobile = window.innerWidth <= 768;
    const nextIndex = sliderImages.length > 1
        ? (currentImageIndex + 1) % sliderImages.length
        : currentImageIndex;

    sliderImages.forEach((img, index) => {
        const shouldLoad = index === currentImageIndex || index === nextIndex;
        if (shouldLoad) {
            applyImageSource(img, isMobile);
        } else {
            clearImageSource(img);
        }
    });
}

function saveSliderIndex() {
    try {
        sessionStorage.setItem(SLIDER_INDEX_KEY, String(currentImageIndex));
    } catch (_) {
        // ignore storage errors
    }
}

function loadSavedSliderIndex() {
    try {
        const raw = sessionStorage.getItem(SLIDER_INDEX_KEY);
        if (raw === null) return null;
        const parsed = Number.parseInt(raw, 10);
        return Number.isInteger(parsed) ? parsed : null;
    } catch (_) {
        return null;
    }
}

function applySliderLoadingHints() {
    if (sliderImages.length === 0) {
        refreshSliderImages();
    }
    const nextIndex = sliderImages.length > 1
        ? (currentImageIndex + 1) % sliderImages.length
        : currentImageIndex;

    sliderImages.forEach((img, index) => {
        const isActive = index === currentImageIndex;
        const isNext = index === nextIndex;
        img.loading = isActive ? 'eager' : 'lazy';
        img.setAttribute('fetchpriority', isActive ? 'high' : (isNext ? 'auto' : 'low'));
    });
}

function preloadNextSlide() {
    if (sliderImages.length <= 1) return;

    const nextIndex = (currentImageIndex + 1) % sliderImages.length;
    const nextImage = sliderImages[nextIndex];
    if (!nextImage) return;

    const isMobile = window.innerWidth <= 768;
    const src = isMobile
        ? nextImage.getAttribute('data-mobile-src')
        : nextImage.getAttribute('data-desktop-src');
    const srcset = isMobile
        ? nextImage.getAttribute('data-mobile-srcset')
        : nextImage.getAttribute('data-desktop-srcset');

    if (!src && !srcset) return;

    const preloader = new Image();
    if (srcset) {
        preloader.srcset = srcset;
        preloader.sizes = '(max-width: 768px) 100vw, 100vw';
    }
    if (src) {
        preloader.src = src;
    }
}

function handleImageSwap() {
    refreshSliderImages();
    if (sliderImages.length === 0) return;

    const activeIndex = sliderImages.findIndex((img) => img.classList.contains('active'));
    currentImageIndex = activeIndex >= 0 ? activeIndex : 0;
    syncSliderImageSources();
    applySliderLoadingHints();
    preloadNextSlide();
}

function changeSlide() {
    if (sliderImages.length === 0) {
        refreshSliderImages();
    }
    if (isChangingSlide || sliderImages.length === 0) return;
    isChangingSlide = true;

    sliderImages.forEach((img) => img.classList.remove('active'));
    currentImageIndex = (currentImageIndex + 1) % sliderImages.length;
    sliderImages[currentImageIndex].classList.add('active');
    syncSliderImageSources();
    saveSliderIndex();
    preloadNextSlide();

    setTimeout(() => {
        isChangingSlide = false;
    }, 1000);
}

function startSlider() {
    refreshSliderImages();
    if (sliderImages.length === 0) return;
    const sliderRoot = document.querySelector('.background-slider');
    if (sliderRoot) {
        sliderRoot.classList.remove('is-ready');
    }

    sliderImages.forEach((img) => {
        img.classList.remove('active');
        img.classList.remove('zoom-start');
    });

    const savedIndex = loadSavedSliderIndex();
    if (savedIndex !== null && savedIndex >= 0 && savedIndex < sliderImages.length) {
        currentImageIndex = savedIndex;
    } else {
        currentImageIndex = 0;
    }

    const initialSlide = sliderImages[currentImageIndex];
    if (initialSlide) {
        initialSlide.classList.add('active', 'zoom-start');
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                initialSlide.classList.remove('zoom-start');
            });
        });
    }

    handleImageSwap();
    applySliderLoadingHints();
    saveSliderIndex();
    preloadNextSlide();
    if (sliderIntervalId !== null) {
        clearInterval(sliderIntervalId);
    }
    sliderIntervalId = setInterval(changeSlide, 5600);

    if (sliderRoot) {
        sliderRoot.classList.add('is-ready');
    }
}

function stopSlider() {
    if (sliderIntervalId !== null) {
        clearInterval(sliderIntervalId);
        sliderIntervalId = null;
    }
}

function adjustImageBrightness(scrollTop) {
    const opacityFactor = Math.min(scrollTop / windowHeight, 1);
    const isMobile = window.innerWidth <= 640;
    const baseDim = isMobile ? 0.72 : 0.66;
    const maxDim = 0.88;
    const dimOpacity = baseDim + (maxDim - baseDim) * opacityFactor;
    document.documentElement.style.setProperty('--bg-dim', dimOpacity.toFixed(3));
}

function handleHeaderVisibility(scrollTop) {
    if (!header) return;

    const isHamburgerActive = hamburger ? hamburger.classList.contains('active') : false;
    const nearTop = scrollTop < 80;
    const delta = scrollTop - lastScrollTop;

    if (isHamburgerActive || nearTop) {
        header.classList.remove('hidden', 'is-hidden');
        isHeaderHidden = false;
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
        return;
    }

    if (delta > 6 && !isHeaderHidden) {
        header.classList.add('hidden', 'is-hidden');
        isHeaderHidden = true;
    } else if (delta < -6 && isHeaderHidden) {
        header.classList.remove('hidden', 'is-hidden');
        isHeaderHidden = false;
    }

    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
}

function setBodyScrollEnabled(enabled) {
    if (enabled) {
        ensureScrollEnabled();
        return;
    }
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflowY = 'hidden';
    document.body.style.overflowY = 'hidden';
}

function findFirstReachableImage(candidates, onReady) {
    if (!Array.isArray(candidates) || candidates.length === 0) return;
    let index = 0;

    const tryNext = () => {
        if (index >= candidates.length) return;
        const src = candidates[index++];
        const probe = new Image();
        probe.onload = () => onReady(src);
        probe.onerror = tryNext;
        probe.src = src;
    };

    tryNext();
}

function initHeaderLogoHoverAnimation() {
    const canHover = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!canHover) return;

    const logoImages = Array.from(document.querySelectorAll('header .brand-logo, header .logo'));
    if (logoImages.length === 0) return;

    logoImages.forEach((logo) => {
        const staticSrc = logo.getAttribute('src');
        if (!staticSrc) return;

        const explicitAnimSrc = logo.getAttribute('data-logo-anim') || logo.getAttribute('data-anim-src');
        const baseDirEnd = staticSrc.lastIndexOf('/');
        const baseDir = baseDirEnd >= 0 ? staticSrc.slice(0, baseDirEnd + 1) : '';
        const candidates = explicitAnimSrc
            ? [explicitAnimSrc]
            : [`${baseDir}logo.gif`, `${baseDir}logo-anim.gif`];

        findFirstReachableImage(candidates, (animSrc) => {
            let revertTimer = null;

            const showStatic = () => {
                if (revertTimer) {
                    clearTimeout(revertTimer);
                    revertTimer = null;
                }
                logo.src = staticSrc;
                logo.classList.remove('logo-animated');
            };

            const showAnimOnce = () => {
                if (revertTimer) {
                    clearTimeout(revertTimer);
                }
                logo.classList.add('logo-animated');
                logo.src = animSrc;
                revertTimer = setTimeout(showStatic, LOGO_GIF_SINGLE_LOOP_MS);
            };

            logo.addEventListener('mouseenter', showAnimOnce);
            logo.addEventListener('mouseleave', showStatic);

            const parentLink = logo.closest('a');
            if (parentLink) {
                parentLink.addEventListener('focus', showAnimOnce);
                parentLink.addEventListener('blur', showStatic);
            }
        });
    });
}

function getSocialIconSvg(icon) {
    if (icon === 'instagram') {
        return '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" ry="5" fill="none" stroke="currentColor" stroke-width="1.8"></rect><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="1.8"></circle><circle cx="17.2" cy="6.8" r="1.2" fill="currentColor"></circle></svg>';
    }
    if (icon === 'tiktok') {
        return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4c.7 1.7 2 2.8 4 3.2v2.7c-1.2 0-2.4-.3-3.6-.9V14a5 5 0 1 1-5-5c.3 0 .7 0 1 .1v2.8a2.3 2.3 0 1 0 1.2 2V4h2.4Z" fill="currentColor"></path></svg>';
    }
    if (icon === 'youtube') {
        return '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.8" y="6.6" width="18.4" height="10.8" rx="3.4" fill="none" stroke="currentColor" stroke-width="1.8"></rect><path d="M10 9.2 15.4 12 10 14.8Z" fill="currentColor"></path></svg>';
    }
    if (icon === 'facebook') {
        return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 21v-7h2.4l.4-3h-2.8V9.2c0-.9.3-1.5 1.5-1.5h1.4V5a17.3 17.3 0 0 0-2.1-.1c-2 0-3.4 1.2-3.4 3.6V11H8.6v3h2.3v7h2.6Z" fill="currentColor"></path></svg>';
    }
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.1" fill="none" stroke="currentColor" stroke-width="1.8"></circle><path d="M7.3 9.5c2.8-1 6.6-.9 9.4.2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path><path d="M8.1 12.4c2.3-.7 5.5-.6 7.8.2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path><path d="M8.9 15c1.8-.5 4.3-.4 6 .2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path></svg>';
}

function createFloatingUtilities() {
    if (floatingUtilities || !document.body) return;

    const existing = document.querySelector('.floating-utilities');
    if (existing) {
        floatingUtilities = existing;
        floatingSocial = existing.querySelector('.floating-social');
        floatingTopButton = existing.querySelector('.scroll-top-progress');
        floatingRingProgress = existing.querySelector('.scroll-top-ring-progress');
        return;
    }

    const root = document.createElement('div');
    root.className = 'floating-utilities';
    root.setAttribute('aria-hidden', 'false');

    const social = document.createElement('div');
    social.className = 'floating-social';
    social.setAttribute('aria-label', 'Social media');

    FLOATING_SOCIAL_LINKS.forEach((entry) => {
        const link = document.createElement('a');
        link.className = 'floating-social-link';
        link.href = entry.href;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.setAttribute('aria-label', entry.label);
        link.innerHTML = getSocialIconSvg(entry.icon);
        social.appendChild(link);
    });

    const topButton = document.createElement('button');
    topButton.type = 'button';
    topButton.className = 'scroll-top-progress';
    topButton.setAttribute('aria-label', 'Wroc na gore');
    topButton.innerHTML = '<svg class="scroll-top-ring" viewBox="0 0 36 36" aria-hidden="true"><circle class="scroll-top-ring-track" cx="18" cy="18" r="14"></circle><circle class="scroll-top-ring-progress" cx="18" cy="18" r="14"></circle></svg><svg class="scroll-top-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 18V6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path><path d="M7 11 12 6l5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path></svg>';
    topButton.addEventListener('click', () => {
        scrollToHeadline();
    });

    root.appendChild(social);
    root.appendChild(topButton);
    document.body.appendChild(root);

    floatingUtilities = root;
    floatingSocial = social;
    floatingTopButton = topButton;
    floatingRingProgress = topButton.querySelector('.scroll-top-ring-progress');
}

function updateFloatingUtilities() {
    if (!floatingUtilities || !floatingTopButton || !floatingRingProgress) return;

    const viewportHeight = window.innerHeight || 1;
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - viewportHeight);
    const currentScroll = Math.max(0, window.scrollY || 0);
    const progress = maxScroll > 0 ? Math.min(100, (currentScroll / maxScroll) * 100) : 0;

    const dashOffset = FLOATING_RING_CIRCUMFERENCE - (progress / 100) * FLOATING_RING_CIRCUMFERENCE;
    floatingRingProgress.style.strokeDasharray = String(FLOATING_RING_CIRCUMFERENCE);
    floatingRingProgress.style.strokeDashoffset = String(dashOffset);

    const showTop = currentScroll > 120;
    floatingTopButton.classList.toggle('is-visible', showTop);

    if (floatingSocial) {
        let hideSocial = false;
        const footer = document.querySelector('footer');
        if (footer) {
            const footerRect = footer.getBoundingClientRect();
            hideSocial = footerRect.top <= (viewportHeight - 120);
        }
        floatingSocial.classList.toggle('is-hidden', hideSocial);
    }
}

window.addEventListener('load', () => {
    if (hasLoadInitialized) return;
    hasLoadInitialized = true;

    createFloatingUtilities();
    adjustImageBrightness(window.scrollY || 0);
    updateFloatingUtilities();
});

function initializeBaseState() {
    if (hasBaseInitialized) return;
    hasBaseInitialized = true;

    updateViewportMetrics();
    ensureScrollEnabled(true);
    handleImageSwap();
    adjustImageBrightness(window.scrollY || 0);
    createFloatingUtilities();
    updateFloatingUtilities();
}

function initScrollReveal() {
    if (document.body.dataset.revealInit === '1') return;
    document.body.dataset.revealInit = '1';

    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const revealTargets = [
        '#news > h1',
        '#news > h2',
        '#news > h3',
        '#news > p',
        '.press-history h2',
        '.press-history h3',
        '.press-history p',
        '.press-history li',
        '.article',
        '.article-content',
        '.song',
        '.concert-item',
        '.member',
        '.gallery-grid img',
        '.rider-section .rider-download-btn',
        '.press-links .rider-download-btn',
        '.contact-form .form-group',
        '.contact-info'
    ];

    const allNodes = [];
    const seen = new Set();
    revealTargets.forEach((selector) => {
        document.querySelectorAll(selector).forEach((node) => {
            if (seen.has(node)) return;
            seen.add(node);
            allNodes.push(node);
        });
    });

    if (allNodes.length === 0) return;

    allNodes.forEach((node) => {
        node.classList.add('reveal');
        if (node.matches('.article-content, .song, .concert-item, .gallery-grid img, .member')) {
            node.classList.add('reveal-soft');
        }
    });

    const staggerGroups = [
        '.videos',
        '.concerts-section',
        '.press-history',
        '.press-achievements',
        '.press-links',
        'footer .footer-container'
    ];

    staggerGroups.forEach((groupSelector) => {
        document.querySelectorAll(groupSelector).forEach((group) => {
            const children = Array.from(group.querySelectorAll('.reveal'));
            const isPressGroup = group.matches('.press-history, .press-achievements');
            const step = isPressGroup ? 34 : 70;
            const cap = isPressGroup ? 7 : 10;
            children.forEach((el, index) => {
                const delay = Math.min(index, cap) * step;
                el.style.transitionDelay = `${delay}ms`;
            });
        });
    });

    if (prefersReduced || typeof IntersectionObserver === 'undefined') {
        allNodes.forEach((node) => node.classList.add('reveal-visible'));
        return;
    }

    const pendingNodes = new Set(allNodes);
    let nodeObserver = null;

    const revealNode = (node) => {
        if (!pendingNodes.has(node)) return;
        node.classList.add('reveal-visible');
        pendingNodes.delete(node);
        if (nodeObserver) {
            nodeObserver.unobserve(node);
        }
    };

    nodeObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            revealNode(entry.target);
        });
    }, {
        threshold: 0.08,
        rootMargin: '0px 0px -8% 0px'
    });

    allNodes.forEach((node) => nodeObserver.observe(node));

    let flushRafId = null;
    const cleanupFallbackListeners = () => {
        window.removeEventListener('scroll', queueFlushPending);
        window.removeEventListener('resize', queueFlushPending);
    };

    const flushPendingReveals = () => {
        if (pendingNodes.size === 0) {
            cleanupFallbackListeners();
            return;
        }
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
        pendingNodes.forEach((node) => {
            const rect = node.getBoundingClientRect();
            const nearViewport = rect.top <= viewportHeight * 0.92 && rect.bottom >= -viewportHeight * 0.18;
            if (nearViewport) {
                revealNode(node);
            }
        });
    };

    const queueFlushPending = () => {
        if (flushRafId !== null) return;
        flushRafId = requestAnimationFrame(() => {
            flushRafId = null;
            flushPendingReveals();
        });
    };

    window.addEventListener('scroll', queueFlushPending, { passive: true });
    window.addEventListener('resize', queueFlushPending, { passive: true });
    queueFlushPending();
}

function initAboutMemberCards() {
    const members = Array.from(document.querySelectorAll('#news.about-page .member'));
    if (members.length === 0) return;

    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isCoarsePointer = window.matchMedia && window.matchMedia('(hover: none), (pointer: coarse)').matches;
    const enableParallax = !prefersReduced && !isCoarsePointer;

    const clearActive = () => {
        members.forEach((item) => item.classList.remove('active'));
    };

    if (isCoarsePointer) {
        members.forEach((member) => {
            member.addEventListener('click', () => {
                const isActive = member.classList.contains('active');
                clearActive();
                if (!isActive) {
                    member.classList.add('active');
                }
            });
        });

        document.addEventListener('click', (event) => {
            if (!event.target.closest('#news.about-page .member')) {
                clearActive();
            }
        });
    }

    if (!enableParallax) return;

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

    members.forEach((member) => {
        const resetParallax = () => {
            member.style.setProperty('--card-rotate-x', '0deg');
            member.style.setProperty('--card-rotate-y', '0deg');
            member.style.setProperty('--card-parallax-x', '0px');
            member.style.setProperty('--card-parallax-y', '0px');
            member.classList.remove('is-parallax-active');
        };

        const updateParallax = (event) => {
            const rect = member.getBoundingClientRect();
            if (rect.width <= 0 || rect.height <= 0) return;

            const relativeX = clamp((event.clientX - rect.left) / rect.width, 0, 1);
            const relativeY = clamp((event.clientY - rect.top) / rect.height, 0, 1);
            const deltaX = (relativeX - 0.5) * 2;
            const deltaY = (relativeY - 0.5) * 2;

            const rotateX = (-deltaY * 4).toFixed(2);
            const rotateY = (deltaX * 5).toFixed(2);
            const parallaxX = (deltaX * 16).toFixed(1);
            const parallaxY = (deltaY * 16).toFixed(1);

            member.style.setProperty('--card-rotate-x', `${rotateX}deg`);
            member.style.setProperty('--card-rotate-y', `${rotateY}deg`);
            member.style.setProperty('--card-parallax-x', `${parallaxX}px`);
            member.style.setProperty('--card-parallax-y', `${parallaxY}px`);
        };

        member.addEventListener('pointerenter', () => {
            member.classList.add('is-parallax-active');
        });
        member.addEventListener('pointermove', updateParallax);
        member.addEventListener('pointerleave', resetParallax);
        member.addEventListener('blur', resetParallax, true);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initializeBaseState();
    injectPageHeroCopy();
    initCookieConsentUi();
    ensureFooterNewsletterForms();
    initMarketingEventTracking();
    ensureAccessibleIframes();
    refreshResponsiveHeroTitle();
    ensureFooterSocialLinks();
    createFloatingUtilities();
    startSlider();
    ensureGsapScrollPlugin();
    initHeaderLogoHoverAnimation();
    initScrollReveal();
    initAboutMemberCards();
    initDeferredShowsEmbed();
    initWebVitalsRum();
    updateFloatingUtilities();
});

window.addEventListener('pageshow', () => {
    ensureScrollEnabled(true);
    createFloatingUtilities();
    updateFloatingUtilities();
    if (!document.hidden && sliderIntervalId === null) {
        startSlider();
    }
});

let scrollRafId = null;
window.addEventListener('scroll', () => {
    if (scrollRafId !== null) return;
    scrollRafId = requestAnimationFrame(() => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        adjustImageBrightness(scrollTop);
        handleHeaderVisibility(scrollTop);
        updateFloatingUtilities();
        scrollRafId = null;
    });
}, { passive: true });

let resizeRafId = null;
const queueViewportRefresh = () => {
    if (resizeRafId !== null) {
        cancelAnimationFrame(resizeRafId);
    }
    resizeRafId = requestAnimationFrame(() => {
        updateViewportMetrics();
        handleImageSwap();
        adjustImageBrightness(window.scrollY || 0);
        refreshResponsiveHeroTitle();
        updateFloatingUtilities();
        resizeRafId = null;
    });
};

window.addEventListener('resize', queueViewportRefresh, { passive: true });
window.addEventListener('orientationchange', queueViewportRefresh);

window.addEventListener('wheel', cancelAutoScrollOnUserInput, { passive: true });
window.addEventListener('touchmove', cancelAutoScrollOnUserInput, { passive: true });
window.addEventListener('keydown', (event) => {
    const keys = ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', 'Space'];
    if (keys.includes(event.code)) {
        cancelAutoScrollOnUserInput();
    }
});

function enforceWheelScrollFallback(event) {
    if (isMobileMenuOpen() || isGalleryModalOpen()) return;
    const doc = document.documentElement;
    if (doc.scrollHeight <= window.innerHeight + 1) return;

    const before = window.scrollY;
    requestAnimationFrame(() => {
        if (window.scrollY === before) {
            window.scrollBy({ top: event.deltaY, behavior: 'auto' });
        }
    });
}

window.addEventListener('wheel', enforceWheelScrollFallback, { passive: true });

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        stopSlider();
    } else if (sliderIntervalId === null) {
        startSlider();
    }
});

function getLinkPageName(link) {
    const href = link ? link.getAttribute('href') || '' : '';
    if (!href) return '';

    try {
        const url = new URL(href, window.location.href);
        const fileName = (url.pathname || '').split('/').filter(Boolean).pop();
        if (!fileName) return 'index.html';
        return fileName.toLowerCase();
    } catch {
        return '';
    }
}

function markActiveMenuEntries() {
    const links = Array.from(document.querySelectorAll('.header-nav a, .mobile-nav-link'));
    if (links.length === 0) return;

    const pageName = getCurrentPageName().toLowerCase();

    links.forEach((link) => {
        const isActive = getLinkPageName(link) === pageName;
        link.classList.toggle('active', isActive);
        if (isActive) {
            link.setAttribute('aria-current', 'page');
        } else {
            link.removeAttribute('aria-current');
        }
    });
}

function ensureFooterSocialLinks() {
    const footerContainers = Array.from(document.querySelectorAll('footer.shop-footer .shop-footer-compact'));
    if (footerContainers.length === 0) return;

    const htmlLang = (document.documentElement.getAttribute('lang') || '').toLowerCase();
    const isEnglish = htmlLang.startsWith('en');
    const socialAria = isEnglish ? 'Social media links' : 'Linki social media';

    footerContainers.forEach((container) => {
        if (container.querySelector('.shop-footer-social')) return;

        const social = document.createElement('div');
        social.className = 'shop-footer-social';
        social.setAttribute('role', 'group');
        social.setAttribute('aria-label', socialAria);
        social.innerHTML = buildSocialLinksMarkup('shop-footer-social-link');

        const copy = container.querySelector('.shop-footer-copy');
        if (copy) {
            container.insertBefore(social, copy);
        } else {
            container.appendChild(social);
        }
    });
}

function initDeferredShowsEmbed() {
    const placeholder = document.getElementById('goingModalEmbed');
    if (!placeholder) return;

    const scriptSrc = placeholder.getAttribute('data-deferred-src');
    if (!scriptSrc) return;

    let hasLoaded = false;
    let isLoading = false;

    const loadEmbedScript = () => {
        if (hasLoaded || isLoading) return;
        isLoading = true;

        const script = document.createElement('script');
        script.src = scriptSrc;
        script.async = true;
        script.onload = () => {
            hasLoaded = true;
            isLoading = false;
        };
        script.onerror = () => {
            isLoading = false;
        };

        document.body.appendChild(script);
    };

    const ticketLinks = Array.from(document.querySelectorAll('.ticket-btn'));
    if (ticketLinks.length === 0) return;

    ticketLinks.forEach((link) => {
        link.addEventListener('pointerenter', loadEmbedScript, { once: true, passive: true });
        link.addEventListener('touchstart', loadEmbedScript, { once: true, passive: true });
        link.addEventListener('focus', loadEmbedScript, { once: true });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const menuHamburger = document.getElementById('hamburger');
    const menuNav = document.getElementById('nav-mobile');
    if (!menuHamburger || !menuNav) return;

    markActiveMenuEntries();

    const links = Array.from(menuNav.querySelectorAll('a'));
    let isOpen = false;

    const syncClosedState = () => {
        isOpen = false;
        menuHamburger.classList.remove('active');
        menuNav.classList.remove('active');
        menuNav.style.pointerEvents = 'none';
        menuNav.setAttribute('aria-hidden', 'true');
        menuHamburger.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('menu-open');
        if (header) header.classList.remove('menu-open');
        setBodyScrollEnabled(true);
    };

    const openMenu = () => {
        if (isOpen) return;
        isOpen = true;
        menuHamburger.classList.add('active');
        menuNav.classList.add('active');
        menuNav.style.pointerEvents = 'auto';
        menuNav.setAttribute('aria-hidden', 'false');
        menuHamburger.setAttribute('aria-expanded', 'true');
        document.body.classList.add('menu-open');
        if (header) header.classList.add('menu-open');
        setBodyScrollEnabled(false);

        if (header) {
            header.classList.remove('hidden', 'is-hidden');
            isHeaderHidden = false;
        }
    };

    const closeMenu = () => {
        if (!isOpen) return;
        syncClosedState();
    };

    syncClosedState();

    menuHamburger.addEventListener('click', (event) => {
        event.preventDefault();
        if (isOpen) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    links.forEach((a) => a.addEventListener('click', () => closeMenu()));

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeMenu();
    });

    menuNav.addEventListener('click', (event) => {
        if (event.target === menuNav) closeMenu();
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 900) {
            syncClosedState();
        }
    });
});

const scrollTopBtn = document.getElementById('scrollTopBtn');
if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => {
        scrollToHeadline();
    });
}

