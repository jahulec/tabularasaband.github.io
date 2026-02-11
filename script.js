let lastScrollTop = 0;
const header = document.querySelector('header');
let sliderImages = [];
const windowHeight = window.innerHeight;
const hamburger = document.getElementById('hamburger');
const navMobile = document.getElementById('nav-mobile');
const stickyHeader = document.querySelector('.mobile-sticky-header');

let currentImageIndex = 0;
let isHeaderHidden = false;
let isStickyVisible = false;
let isChangingSlide = false;
let sliderIntervalId = null;
let hasAutoScrolled = false;
let autoScrollRaf = null;
let autoScrollCanceled = false;
const maxOpacityScroll = window.innerHeight;

if (typeof gsap !== 'undefined' && typeof ScrollToPlugin !== 'undefined') {
    gsap.registerPlugin(ScrollToPlugin);
}

function scrollToHeadline() {
    const h1Element = document.querySelector('h1');
    if (!h1Element) return;
    if (typeof gsap === 'undefined' || typeof ScrollToPlugin === 'undefined') {
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

function ensureScrollEnabled() {
    document.documentElement.style.overflowY = 'auto';
    document.body.style.overflowY = 'auto';
    document.documentElement.style.height = 'auto';
    document.body.style.height = 'auto';
    document.documentElement.style.position = 'static';
    document.body.style.position = 'static';
}

function refreshSliderImages() {
    sliderImages = Array.from(document.querySelectorAll('.background-slider img'));
}

function handleImageSwap() {
    refreshSliderImages();
    const images = sliderImages;
    const isMobile = window.innerWidth <= 768;
    images.forEach((img) => {
        const src = isMobile
            ? img.getAttribute('data-mobile-src')
            : img.getAttribute('data-desktop-src');
        const srcset = isMobile
            ? img.getAttribute('data-mobile-srcset')
            : img.getAttribute('data-desktop-srcset');
        if (srcset) {
            img.srcset = srcset;
            img.sizes = '(max-width: 768px) 100vw, 100vw';
        }
        if (src) {
            img.src = src;
        }
    });
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

    setTimeout(() => {
        isChangingSlide = false;
    }, 1000);
}

function activateFirstSlide() {
    if (sliderImages.length === 0) {
        refreshSliderImages();
    }
    if (sliderImages.length > 0) {
        sliderImages[0].classList.add('active');
    }
}

function startSlider() {
    refreshSliderImages();
    if (sliderImages.length === 0) return;

    activateFirstSlide();
    if (sliderIntervalId !== null) {
        clearInterval(sliderIntervalId);
    }
    sliderIntervalId = setInterval(changeSlide, 5000);
}

function adjustImageBrightness(scrollTop) {
    if (sliderImages.length === 0) {
        refreshSliderImages();
    }
    const opacityFactor = Math.min(scrollTop / windowHeight, 1);
    sliderImages.forEach((img) => {
        const brightness = Math.max(1 - opacityFactor, 0.1);
        img.style.filter = `brightness(${brightness})`;
    });
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
    const value = enabled ? 'auto' : 'hidden';
    document.documentElement.style.overflowY = value;
    document.body.style.overflowY = value;
}

window.addEventListener('load', () => {
    ensureScrollEnabled();
    handleImageSwap();
    startSlider();
    adjustImageBrightness(window.scrollY || 0);
    setTimeout(() => {
        autoScrollToHeadlineOnLoad();
    }, 200);
});

document.addEventListener('DOMContentLoaded', () => {
    ensureScrollEnabled();
    handleImageSwap();
    activateFirstSlide();
    adjustImageBrightness(window.scrollY || 0);
});

window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    adjustImageBrightness(scrollTop);
    handleHeaderVisibility(scrollTop);
    handleStickyHeader(window.scrollY);
});

window.addEventListener('wheel', cancelAutoScrollOnUserInput, { passive: true });
window.addEventListener('touchmove', cancelAutoScrollOnUserInput, { passive: true });
window.addEventListener('keydown', (event) => {
    const keys = ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', 'Space'];
    if (keys.includes(event.code)) {
        cancelAutoScrollOnUserInput();
    }
});

function enforceWheelScroll(event) {
    const before = window.scrollY;
    requestAnimationFrame(() => {
        if (window.scrollY === before) {
            window.scrollBy({ top: event.deltaY, behavior: 'auto' });
        }
    });
}

window.addEventListener('wheel', enforceWheelScroll, { passive: true });

document.addEventListener('DOMContentLoaded', () => {
    const menuHamburger = document.getElementById('hamburger');
    const menuNav = document.getElementById('nav-mobile');
    if (!menuHamburger || !menuNav || typeof gsap === 'undefined') return;

    // Upewnij się, że start jest "zamknięty" (żadnych flashów po odświeżeniu)
    menuHamburger.classList.remove('active');
    menuNav.classList.remove('active');
    menuNav.style.pointerEvents = 'none';

    // Owiń tekst linków w span + dodaj linię (bez ręcznej edycji HTML)
    menuNav.querySelectorAll('a').forEach((a) => {
        if (a.querySelector('.nav-link__text')) return;

        const label = (a.textContent || '').trim();
        a.textContent = '';

        const text = document.createElement('span');
        text.className = 'nav-link__text';
        text.textContent = label;

        const line = document.createElement('span');
        line.className = 'nav-link__line';

        a.appendChild(text);
        a.appendChild(line);
    });

    const bars = Array.from(menuHamburger.querySelectorAll('span'));
    const linkTexts = Array.from(menuNav.querySelectorAll('.nav-link__text'));
    const linkLines = Array.from(menuNav.querySelectorAll('.nav-link__line'));
    const links = Array.from(menuNav.querySelectorAll('a'));

    // Stan początkowy animowanych elementów
    gsap.set(linkTexts, {
        clipPath: 'inset(0 100% 0 0)',
        webkitClipPath: 'inset(0 100% 0 0)',
    });
    gsap.set(linkLines, { scaleX: 0 });
    gsap.set(bars, { opacity: 1, scaleX: 1, y: 0 });

    let isOpen = false;

    const lockScroll = (lock) => {
        if (lock) {
            document.documentElement.style.overflow = 'hidden';
            document.body.style.overflow = 'hidden';
        } else {
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
        }
    };

    const barScale = () => {
        return Math.min(22, Math.max(10, window.innerWidth / 30));
    };

    const tl = gsap.timeline({
        paused: true,
        defaults: { ease: 'power3.out' },
        onReverseComplete: () => {
            menuNav.classList.remove('active');
            menuNav.style.pointerEvents = 'none';
            lockScroll(false);
            isOpen = false;
        },
    });

    // OPEN
    tl.add(() => {
        menuNav.classList.add('active');
        menuNav.style.pointerEvents = 'auto';
        lockScroll(true);
        if (header) {
            header.classList.remove('hidden');
            isHeaderHidden = false;
        }
    }, 0)
        .to(bars, { duration: 0.18, y: (i) => (i - 1) * 7 }, 0)
        .to(bars, { duration: 0.35, scaleX: barScale, transformOrigin: 'right center' }, 0.05)
        .to(bars, { duration: 0.18, opacity: 0 }, 0.18)
        .to(linkLines, { duration: 0.5, scaleX: 1, stagger: 0.06 }, 0.25)
        .to(linkTexts, {
            duration: 0.55,
            clipPath: 'inset(0 0% 0 0)',
            webkitClipPath: 'inset(0 0% 0 0)',
            stagger: 0.06,
            ease: 'power2.out',
        }, 0.28);

    const openMenu = () => {
        if (isOpen) return;
        isOpen = true;
        tl.play(0);
    };

    const closeMenu = () => {
        if (!isOpen) return;
        gsap.set(bars, { opacity: 1 });
        tl.reverse();
    };

    menuHamburger.addEventListener('click', (e) => {
        e.preventDefault();
        isOpen ? closeMenu() : openMenu();
    });

    links.forEach((a) => a.addEventListener('click', () => closeMenu()));

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeMenu();
    });

    menuNav.addEventListener('click', (e) => {
        if (e.target === menuNav) closeMenu();
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

const galleryImages = document.querySelectorAll('.gallery-grid img');
const expandedImageContainer = document.getElementById('expandedImageContainer');
const expandedImage = document.getElementById('expandedImage');
const galleryGrid = document.querySelector('.gallery-grid');

if (galleryImages.length > 0 && expandedImageContainer && expandedImage && galleryGrid) {
    galleryImages.forEach((image) => {
        image.addEventListener('click', () => {
            expandedImage.src = image.getAttribute('data-full') || image.src;
            expandedImageContainer.style.display = 'flex';
            expandedImageContainer.style.pointerEvents = 'auto';
            setBodyScrollEnabled(false);

            setTimeout(() => {
                expandedImageContainer.style.opacity = '1';
                expandedImage.classList.add('expanded');
                galleryGrid.classList.add('blurred');
            });
        });
    });

    expandedImageContainer.addEventListener('click', () => {
        expandedImage.classList.remove('expanded');
        expandedImageContainer.style.opacity = '0';
        galleryGrid.classList.remove('blurred');
        galleryGrid.classList.add('unblurred');
        setBodyScrollEnabled(true);

        setTimeout(() => {
            expandedImageContainer.style.display = 'none';
            expandedImageContainer.style.pointerEvents = 'none';
            galleryGrid.classList.remove('unblurred');
        }, 300);
    });
}

function downloadpress() {
    setTimeout(() => {
        const link = document.createElement('a');
        link.href = 'press.pdf';
        link.download = 'press.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, 500);
}

function downloadrider() {
    setTimeout(() => {
        const link = document.createElement('a');
        link.href = 'RiderTabulaRasa.pdf';
        link.download = 'RiderTabulaRasa.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, 500);
}
