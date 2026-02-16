let lastScrollTop = 0;
const header = document.querySelector('header');
let sliderImages = [];
let windowHeight = window.innerHeight;
const hamburger = document.getElementById('hamburger');
const stickyHeader = document.querySelector('.mobile-sticky-header');
const MOBILE_STICKY_MIN_WIDTH = 430;

let currentImageIndex = 0;
let isHeaderHidden = false;
let isStickyVisible = false;
let isChangingSlide = false;
let sliderIntervalId = null;
let hasAutoScrolled = false;
let autoScrollRaf = null;
let autoScrollCanceled = false;
let maxOpacityScroll = window.innerHeight;
let hasBaseInitialized = false;
let hasLoadInitialized = false;
const SLIDER_INDEX_KEY = 'tr_slider_index';

function updateViewportMetrics() {
    windowHeight = window.innerHeight;
    maxOpacityScroll = window.innerHeight;
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
    const isMobile = window.innerWidth <= 768;
    sliderImages.forEach((img) => {
        applyImageSource(img, isMobile);
    });
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
    const isMobile = window.innerWidth <= 768;
    applyImageSource(sliderImages[currentImageIndex], isMobile);
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
    sliderIntervalId = setInterval(changeSlide, 5000);

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
    const dimOpacity = Math.min(Math.max(opacityFactor * 0.9, 0), 0.9);
    document.documentElement.style.setProperty('--bg-dim', dimOpacity.toFixed(3));
}

function handleHeaderVisibility(scrollTop) {
    if (!header) return;

    const opacityFactor = Math.min(scrollTop / maxOpacityScroll, 1);
    const isImagesFullyDimmed = opacityFactor === 1;
    const isHamburgerActive = hamburger ? hamburger.classList.contains('active') : false;

    if (isHamburgerActive) {
        header.classList.remove('hidden');
        isHeaderHidden = false;
        return;
    }

    if (scrollTop < lastScrollTop && isHeaderHidden) {
        header.classList.remove('hidden');
        isHeaderHidden = false;
    } else if (scrollTop > lastScrollTop && !isHeaderHidden && isImagesFullyDimmed) {
        header.classList.add('hidden');
        isHeaderHidden = true;
    }

    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
}

function handleStickyHeader(scrollY) {
    if (!stickyHeader) return;

    const inMobileRange = window.innerWidth <= 768;
    const isLargePhone = window.innerWidth >= MOBILE_STICKY_MIN_WIDTH;
    if (!inMobileRange || !isLargePhone || document.body.classList.contains('menu-open')) {
        stickyHeader.classList.add('hide');
        stickyHeader.classList.remove('show');
        isStickyVisible = false;
        return;
    }

    if (scrollY > 170 && !isStickyVisible) {
        stickyHeader.classList.add('show');
        stickyHeader.classList.remove('hide');
        isStickyVisible = true;
    } else if (scrollY <= 170 && isStickyVisible) {
        stickyHeader.classList.add('hide');
        stickyHeader.classList.remove('show');
        isStickyVisible = false;
    }
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

    const logoImages = Array.from(document.querySelectorAll('header .desktop-header img.logo'));
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
            let showingAnim = false;

            const showAnim = () => {
                if (showingAnim) return;
                showingAnim = true;
                logo.classList.add('logo-animated');
                logo.src = animSrc;
            };

            const showStatic = () => {
                if (!showingAnim) return;
                showingAnim = false;
                logo.src = staticSrc;
                logo.classList.remove('logo-animated');
            };

            logo.addEventListener('mouseenter', showAnim);
            logo.addEventListener('mouseleave', showStatic);

            const parentLink = logo.closest('a');
            if (parentLink) {
                parentLink.addEventListener('focus', showAnim);
                parentLink.addEventListener('blur', showStatic);
            }
        });
    });
}

window.addEventListener('load', () => {
    if (hasLoadInitialized) return;
    hasLoadInitialized = true;

    adjustImageBrightness(window.scrollY || 0);
});

function initializeBaseState() {
    if (hasBaseInitialized) return;
    hasBaseInitialized = true;

    updateViewportMetrics();
    ensureScrollEnabled(true);
    handleImageSwap();
    adjustImageBrightness(window.scrollY || 0);
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
        '.article',
        '.article-content',
        '.song',
        '.concert-item',
        '.member',
        '.gallery-grid img',
        '.press-links .rider-download-btn',
        '.contact-form .form-group',
        '.contact-info',
        'footer .footer-section',
        'footer .footer-bottom'
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
        '.gallery-grid',
        '.videos',
        '.concerts-section',
        '.press-links',
        'footer .footer-container'
    ];

    staggerGroups.forEach((groupSelector) => {
        document.querySelectorAll(groupSelector).forEach((group) => {
            const children = Array.from(group.querySelectorAll('.reveal'));
            children.forEach((el, index) => {
                const delay = Math.min(index, 10) * 70;
                el.style.transitionDelay = `${delay}ms`;
            });
        });
    });

    if (prefersReduced || typeof IntersectionObserver === 'undefined') {
        allNodes.forEach((node) => node.classList.add('reveal-visible'));
        return;
    }

    const io = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('reveal-visible');
            observer.unobserve(entry.target);
        });
    }, {
        threshold: 0.12,
        rootMargin: '0px 0px -10% 0px'
    });

    allNodes.forEach((node) => io.observe(node));
}

document.addEventListener('DOMContentLoaded', () => {
    initializeBaseState();
    startSlider();
    ensureGsapScrollPlugin();
    initHeaderLogoHoverAnimation();
    initScrollReveal();
    setTimeout(() => {
        autoScrollToHeadlineOnLoad();
    }, 200);
});

window.addEventListener('pageshow', () => {
    ensureScrollEnabled(true);
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
        handleStickyHeader(window.scrollY);
        scrollRafId = null;
    });
}, { passive: true });

let resizeRafId = null;
window.addEventListener('resize', () => {
    if (resizeRafId !== null) {
        cancelAnimationFrame(resizeRafId);
    }
    resizeRafId = requestAnimationFrame(() => {
        updateViewportMetrics();
        handleImageSwap();
        adjustImageBrightness(window.scrollY || 0);
        handleStickyHeader(window.scrollY);
        resizeRafId = null;
    });
});

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

document.addEventListener('DOMContentLoaded', () => {
    const menuHamburger = document.getElementById('hamburger');
    const menuNav = document.getElementById('nav-mobile');
    if (!menuHamburger || !menuNav) return;

    const links = Array.from(menuNav.querySelectorAll('a'));
    let isOpen = false;

    const syncClosedState = () => {
        isOpen = false;
        menuHamburger.classList.remove('active');
        menuNav.classList.remove('active');
        menuNav.style.pointerEvents = 'none';
        document.body.classList.remove('menu-open');
        setBodyScrollEnabled(true);
        handleStickyHeader(window.scrollY);
    };

    const openMenu = () => {
        if (isOpen) return;
        isOpen = true;
        menuHamburger.classList.add('active');
        menuNav.classList.add('active');
        menuNav.style.pointerEvents = 'auto';
        document.body.classList.add('menu-open');
        setBodyScrollEnabled(false);

        if (header) {
            header.classList.remove('hidden');
            isHeaderHidden = false;
        }
        if (stickyHeader) {
            stickyHeader.classList.add('hide');
            stickyHeader.classList.remove('show');
            isStickyVisible = false;
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
        if (window.innerWidth > 768) {
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

document.querySelectorAll('.member').forEach((member) => {
    member.addEventListener('click', function () {
        if (this.classList.contains('active')) {
            this.classList.remove('active');
        } else {
            document.querySelectorAll('.member').forEach((m) => m.classList.remove('active'));
            this.classList.add('active');
        }
    });
});
