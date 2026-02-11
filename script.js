let lastScrollTop = 0;
const header = document.querySelector('header');
const sliderImages = document.querySelectorAll('.background-slider img');
const windowHeight = window.innerHeight;
const hamburger = document.getElementById('hamburger');
const navMobile = document.getElementById('nav-mobile');
const stickyHeader = document.querySelector('.mobile-sticky-header');

let currentImageIndex = 0;
let isHeaderHidden = false;
let isStickyVisible = false;
let isChangingSlide = false;
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

function checkImagesLoaded() {
    const images = document.querySelectorAll('.background-slider img');
    return Array.from(images).every((img) => img.complete && img.naturalWidth !== 0);
}

function handleImageSwap() {
    const images = document.querySelectorAll('.background-slider img');
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
    const images = document.querySelectorAll('.background-slider img');
    if (images.length > 0) {
        images[0].classList.add('active');
    }
}

function startSlider() {
    const images = document.querySelectorAll('.background-slider img');
    if (images.length === 0) return;

    if (Array.from(images).every((img) => img.complete)) {
        activateFirstSlide();
        setInterval(changeSlide, 5000);
    } else {
        setTimeout(startSlider, 100);
    }
}

function adjustImageBrightness(scrollTop) {
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

window.addEventListener('load', () => {
    handleImageSwap();
    startSlider();
    scrollToHeadline();
});

window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    adjustImageBrightness(scrollTop);
    handleHeaderVisibility(scrollTop);
    handleStickyHeader(window.scrollY);
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

        setTimeout(() => {
            expandedImageContainer.style.display = 'none';
            galleryGrid.classList.remove('unblurred');
        }, 300);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const firstImage = document.getElementById('firstImage');
    if (!firstImage) return;

    function preloadFirstImage() {
        const mobileSrc = firstImage.getAttribute('data-mobile-src');
        const desktopSrc = firstImage.getAttribute('data-desktop-src');
        const mobileSrcset = firstImage.getAttribute('data-mobile-srcset');
        const desktopSrcset = firstImage.getAttribute('data-desktop-srcset');

        const isMobile = window.innerWidth <= 768;
        if (isMobile && mobileSrcset) {
            firstImage.srcset = mobileSrcset;
            firstImage.sizes = '(max-width: 768px) 100vw, 100vw';
        }
        if (!isMobile && desktopSrcset) {
            firstImage.srcset = desktopSrcset;
            firstImage.sizes = '(max-width: 768px) 100vw, 100vw';
        }

        firstImage.src = isMobile ? mobileSrc : desktopSrc;

        firstImage.onload = () => {
            loadRemainingImages();
        };
    }

    function loadRemainingImages() {
        const images = document.querySelectorAll('.background-slider img:not(#firstImage)');
        images.forEach((img) => {
            const mobileSrc = img.getAttribute('data-mobile-src');
            const desktopSrc = img.getAttribute('data-desktop-src');
            const mobileSrcset = img.getAttribute('data-mobile-srcset');
            const desktopSrcset = img.getAttribute('data-desktop-srcset');

            const isMobile = window.innerWidth <= 768;
            if (isMobile && mobileSrcset) {
                img.srcset = mobileSrcset;
                img.sizes = '(max-width: 768px) 100vw, 100vw';
            }
            if (!isMobile && desktopSrcset) {
                img.srcset = desktopSrcset;
                img.sizes = '(max-width: 768px) 100vw, 100vw';
            }

            img.src = isMobile ? mobileSrc : desktopSrc;
        });
    }

    preloadFirstImage();
    window.addEventListener('resize', preloadFirstImage);
});

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
