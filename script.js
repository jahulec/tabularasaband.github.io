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
let autoScrollTween = null;
const maxOpacityScroll = window.innerHeight;

function scrollToHeadline() {
    const h1Element = document.querySelector('h1');
    if (!h1Element || typeof gsap === 'undefined') return;

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

    if (history && 'scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    if (window.scrollY > 0) {
        window.scrollTo(0, 0);
    }

    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const offset = Math.max(0, (window.innerHeight - h1Element.offsetHeight) / 2);

    if (typeof gsap !== 'undefined') {
        if (autoScrollTween) {
            autoScrollTween.kill();
        }
        autoScrollTween = gsap.to(window, {
            scrollTo: { y: h1Element, offsetY: offset },
            duration: prefersReduced ? 0 : 1,
            ease: 'power2.out',
            autoKill: true,
            onComplete: () => {
                autoScrollTween = null;
                ensureScrollEnabled();
            }
        });
        return;
    }

    if (prefersReduced) {
        h1Element.scrollIntoView({ block: 'center' });
    } else {
        h1Element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function cancelAutoScrollOnUserInput() {
    if (autoScrollTween) {
        autoScrollTween.kill();
        autoScrollTween = null;
    }
    ensureScrollEnabled();
}

function ensureScrollEnabled() {
    document.documentElement.style.overflowY = 'auto';
    document.body.style.overflowY = 'auto';
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

if (hamburger && navMobile) {
    hamburger.addEventListener('click', function () {
        this.classList.toggle('active');
        navMobile.classList.toggle('active');

        if (this.classList.contains('active') && header) {
            header.classList.remove('hidden');
            isHeaderHidden = false;
        }
    });
}

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
