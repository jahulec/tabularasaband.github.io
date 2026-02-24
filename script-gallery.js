(() => {
    const galleryGrid = document.querySelector('.gallery-grid');
    const expandedImageContainer = document.getElementById('expandedImageContainer');
    const expandedImage = document.getElementById('expandedImage');

    if (!galleryGrid || !expandedImageContainer || !expandedImage) return;
    if (expandedImageContainer.parentElement !== document.body) {
        document.body.appendChild(expandedImageContainer);
    }

    const galleryImages = Array.from(galleryGrid.querySelectorAll('img'));
    if (galleryImages.length === 0) return;
    const canUseModal = () => true;
    const focusableSelector = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
    let lastFocusedElement = null;

    const htmlLang = (document.documentElement.getAttribute('lang') || '').toLowerCase();
    const isEnglish = htmlLang.startsWith('en');
    expandedImageContainer.setAttribute('role', 'dialog');
    expandedImageContainer.setAttribute('aria-modal', 'true');
    expandedImageContainer.setAttribute('aria-label', isEnglish ? 'Expanded image' : 'Powiekszone zdjecie');
    expandedImageContainer.setAttribute('aria-hidden', 'true');
    expandedImageContainer.setAttribute('tabindex', '-1');
    expandedImage.setAttribute('tabindex', '0');

    const isModalOpen = () => expandedImageContainer.style.display === 'flex';

    const getFocusableInModal = () => (
        Array.from(expandedImageContainer.querySelectorAll(focusableSelector))
            .filter((node) => !node.hasAttribute('disabled'))
    );

    const setBackgroundAccessibilityHidden = (hidden) => {
        const siblings = Array.from(document.body.children).filter((element) => element !== expandedImageContainer);
        siblings.forEach((element) => {
            if (hidden) {
                if (!element.hasAttribute('data-modal-prev-aria-hidden')) {
                    element.setAttribute('data-modal-prev-aria-hidden', element.getAttribute('aria-hidden') || '');
                }
                element.setAttribute('aria-hidden', 'true');

                if ('inert' in element) {
                    if (!element.hasAttribute('data-modal-prev-inert')) {
                        element.setAttribute('data-modal-prev-inert', element.inert ? '1' : '0');
                    }
                    element.inert = true;
                }
            } else {
                if (element.hasAttribute('data-modal-prev-aria-hidden')) {
                    const prevHidden = element.getAttribute('data-modal-prev-aria-hidden');
                    if (prevHidden) {
                        element.setAttribute('aria-hidden', prevHidden);
                    } else {
                        element.removeAttribute('aria-hidden');
                    }
                    element.removeAttribute('data-modal-prev-aria-hidden');
                }

                if ('inert' in element && element.hasAttribute('data-modal-prev-inert')) {
                    const prevInert = element.getAttribute('data-modal-prev-inert') === '1';
                    element.inert = prevInert;
                    element.removeAttribute('data-modal-prev-inert');
                }
            }
        });
    };

    const setScrollEnabled = (enabled) => {
        if (typeof setBodyScrollEnabled === 'function') {
            setBodyScrollEnabled(enabled);
            return;
        }
        document.documentElement.style.overflowY = enabled ? 'auto' : 'hidden';
        document.body.style.overflowY = enabled ? 'auto' : 'hidden';
    };

    const openImage = (image) => {
        if (!canUseModal()) return;
        lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        expandedImage.src = image.getAttribute('data-full') || image.src;
        expandedImage.alt = image.alt || (isEnglish ? 'Expanded image' : 'Powiekszone zdjecie');
        expandedImageContainer.style.display = 'flex';
        expandedImageContainer.style.pointerEvents = 'auto';
        expandedImageContainer.setAttribute('aria-hidden', 'false');
        setBackgroundAccessibilityHidden(true);
        setScrollEnabled(false);

        requestAnimationFrame(() => {
            expandedImageContainer.style.opacity = '1';
            expandedImage.classList.add('expanded');
            expandedImage.focus({ preventScroll: true });
        });
    };

    const closeImage = () => {
        expandedImage.classList.remove('expanded');
        expandedImageContainer.style.opacity = '0';
        setScrollEnabled(true);

        setTimeout(() => {
            expandedImageContainer.style.display = 'none';
            expandedImageContainer.style.pointerEvents = 'none';
            expandedImageContainer.setAttribute('aria-hidden', 'true');
            setBackgroundAccessibilityHidden(false);
            if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
                lastFocusedElement.focus({ preventScroll: true });
            }
            lastFocusedElement = null;
        }, 240);
    };

    galleryImages.forEach((image) => {
        image.addEventListener('click', () => openImage(image));
    });

    expandedImageContainer.addEventListener('click', () => {
        closeImage();
    });

    document.addEventListener('keydown', (event) => {
        if (!isModalOpen()) return;

        if (event.key === 'Escape') {
            closeImage();
            return;
        }

        if (event.key !== 'Tab') return;

        const focusable = getFocusableInModal();
        if (focusable.length === 0) {
            event.preventDefault();
            expandedImageContainer.focus({ preventScroll: true });
            return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;

        if (!expandedImageContainer.contains(active)) {
            event.preventDefault();
            first.focus({ preventScroll: true });
            return;
        }

        if (event.shiftKey && active === first) {
            event.preventDefault();
            last.focus({ preventScroll: true });
            return;
        }

        if (!event.shiftKey && active === last) {
            event.preventDefault();
            first.focus({ preventScroll: true });
        }
    });

    window.addEventListener('resize', () => {
        if (expandedImageContainer.style.display === 'flex') {
            expandedImage.classList.add('expanded');
        }
    });
})();
