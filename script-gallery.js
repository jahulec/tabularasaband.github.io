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
    let currentIndex = 0;
    let gestureState = null;
    let suppressImageClick = false;
    const SWIPE_DISTANCE = 56;

    const htmlLang = (document.documentElement.getAttribute('lang') || '').toLowerCase();
    const isEnglish = htmlLang.startsWith('en');
    expandedImageContainer.setAttribute('role', 'dialog');
    expandedImageContainer.setAttribute('aria-modal', 'true');
    expandedImageContainer.setAttribute('aria-label', isEnglish ? 'Expanded image' : 'Powiekszone zdjecie');
    expandedImageContainer.setAttribute('aria-hidden', 'true');
    expandedImageContainer.setAttribute('tabindex', '-1');
    expandedImage.setAttribute('tabindex', '0');

    const isModalOpen = () => expandedImageContainer.style.display === 'flex';

    const createNavButton = (direction) => {
        const button = document.createElement('button');
        const isPrevious = direction === 'prev';
        button.type = 'button';
        button.className = `gallery-modal-nav gallery-modal-${direction}`;
        button.setAttribute('aria-label', isPrevious
            ? (isEnglish ? 'Previous image' : 'Poprzednie zdjecie')
            : (isEnglish ? 'Next image' : 'Nastepne zdjecie'));
        button.textContent = isPrevious ? '<' : '>';
        return button;
    };

    const previousButton = createNavButton('prev');
    const nextButton = createNavButton('next');
    expandedImageContainer.append(previousButton, nextButton);

    const getFocusableInModal = () => (
        Array.from(expandedImageContainer.querySelectorAll(focusableSelector))
            .filter((node) => {
                if (node.hasAttribute('disabled')) return false;
                const rects = node.getClientRects();
                return rects.length > 0 && window.getComputedStyle(node).visibility !== 'hidden';
            })
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

    const preloadNeighbor = (index) => {
        const image = galleryImages[index];
        if (!image) return;
        const src = image.getAttribute('data-full') || image.src;
        if (!src) return;
        const preload = new Image();
        preload.src = src;
    };

    const showImageAt = (index) => {
        const normalizedIndex = (index + galleryImages.length) % galleryImages.length;
        const image = galleryImages[normalizedIndex];
        if (!image) return;

        currentIndex = normalizedIndex;
        expandedImage.src = image.getAttribute('data-full') || image.src;
        expandedImage.alt = image.alt || (isEnglish ? 'Expanded image' : 'Powiekszone zdjecie');
        preloadNeighbor((currentIndex + 1) % galleryImages.length);
        preloadNeighbor((currentIndex - 1 + galleryImages.length) % galleryImages.length);
    };

    const nextImage = () => {
        showImageAt(currentIndex + 1);
    };

    const previousImage = () => {
        showImageAt(currentIndex - 1);
    };

    const openImage = (image, index) => {
        if (!canUseModal()) return;
        lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        showImageAt(index);
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

    galleryImages.forEach((image, index) => {
        image.addEventListener('click', () => openImage(image, index));
    });

    expandedImageContainer.addEventListener('click', () => {
        closeImage();
    });

    expandedImage.addEventListener('click', (event) => {
        event.stopPropagation();
        if (suppressImageClick) {
            suppressImageClick = false;
            return;
        }
        closeImage();
    });

    previousButton.addEventListener('click', (event) => {
        event.stopPropagation();
        previousImage();
        expandedImage.focus({ preventScroll: true });
    });

    nextButton.addEventListener('click', (event) => {
        event.stopPropagation();
        nextImage();
        expandedImage.focus({ preventScroll: true });
    });

    const resetGesture = () => {
        gestureState = null;
    };

    const handlePointerDown = (event) => {
        if (!isModalOpen() || event.target.closest('.gallery-modal-nav')) return;
        if (event.pointerType !== 'touch' && event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;

        gestureState = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            lastX: event.clientX,
            lastY: event.clientY,
        };
    };

    const handlePointerMove = (event) => {
        if (!gestureState || event.pointerId !== gestureState.pointerId) return;

        gestureState.lastX = event.clientX;
        gestureState.lastY = event.clientY;

        const deltaX = gestureState.lastX - gestureState.startX;
        const deltaY = gestureState.lastY - gestureState.startY;

        if (Math.abs(deltaY) > Math.abs(deltaX) + 16 && Math.abs(deltaY) > 28) {
            resetGesture();
            return;
        }

        if (Math.abs(deltaX) > 12) {
            suppressImageClick = true;
        }
    };

    const handlePointerEnd = (event) => {
        if (!gestureState || event.pointerId !== gestureState.pointerId) return;

        const deltaX = gestureState.lastX - gestureState.startX;
        const deltaY = gestureState.lastY - gestureState.startY;
        resetGesture();

        if (Math.abs(deltaX) >= SWIPE_DISTANCE && Math.abs(deltaX) > Math.abs(deltaY) * 1.25) {
            event.preventDefault();
            suppressImageClick = true;
            if (deltaX < 0) {
                nextImage();
            } else {
                previousImage();
            }
            window.setTimeout(() => {
                suppressImageClick = false;
            }, 240);
        }
    };

    expandedImageContainer.addEventListener('pointerdown', handlePointerDown);
    expandedImageContainer.addEventListener('pointermove', handlePointerMove);
    expandedImageContainer.addEventListener('pointerup', handlePointerEnd);
    expandedImageContainer.addEventListener('pointercancel', resetGesture);

    expandedImageContainer.addEventListener('touchstart', (event) => {
        if (!isModalOpen() || event.touches.length !== 1 || event.target.closest('.gallery-modal-nav')) return;
        const touch = event.touches[0];
        gestureState = {
            pointerId: 'touch',
            startX: touch.clientX,
            startY: touch.clientY,
            lastX: touch.clientX,
            lastY: touch.clientY,
        };
    }, { passive: true });

    expandedImageContainer.addEventListener('touchmove', (event) => {
        if (!gestureState || gestureState.pointerId !== 'touch' || event.touches.length !== 1) return;
        const touch = event.touches[0];
        handlePointerMove({
            pointerId: 'touch',
            clientX: touch.clientX,
            clientY: touch.clientY,
        });
        if (suppressImageClick) event.preventDefault();
    }, { passive: false });

    expandedImageContainer.addEventListener('touchend', (event) => {
        if (!gestureState || gestureState.pointerId !== 'touch') return;
        handlePointerEnd({
            pointerId: 'touch',
            preventDefault: () => event.preventDefault(),
        });
    }, { passive: false });

    expandedImageContainer.addEventListener('touchcancel', resetGesture, { passive: true });

    document.addEventListener('keydown', (event) => {
        if (!isModalOpen()) return;

        if (event.key === 'Escape') {
            closeImage();
            return;
        }

        if (event.key === 'ArrowRight') {
            event.preventDefault();
            nextImage();
            return;
        }

        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            previousImage();
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
