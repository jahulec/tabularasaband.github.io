(() => {
    const galleryGrid = document.querySelector('.gallery-grid');
    const expandedImageContainer = document.getElementById('expandedImageContainer');
    const expandedImage = document.getElementById('expandedImage');

    if (!galleryGrid || !expandedImageContainer || !expandedImage) return;

    const galleryImages = Array.from(galleryGrid.querySelectorAll('img'));
    if (galleryImages.length === 0) return;
    const canUseModal = () => true;

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
        expandedImage.src = image.getAttribute('data-full') || image.src;
        expandedImageContainer.style.display = 'flex';
        expandedImageContainer.style.pointerEvents = 'auto';
        setScrollEnabled(false);

        requestAnimationFrame(() => {
            expandedImageContainer.style.opacity = '1';
            expandedImage.classList.add('expanded');
            galleryGrid.classList.add('blurred');
        });
    };

    const closeImage = () => {
        expandedImage.classList.remove('expanded');
        expandedImageContainer.style.opacity = '0';
        galleryGrid.classList.remove('blurred');
        galleryGrid.classList.add('unblurred');
        setScrollEnabled(true);

        setTimeout(() => {
            expandedImageContainer.style.display = 'none';
            expandedImageContainer.style.pointerEvents = 'none';
            galleryGrid.classList.remove('unblurred');
        }, 300);
    };

    galleryImages.forEach((image) => {
        image.addEventListener('click', () => openImage(image));
    });

    expandedImageContainer.addEventListener('click', (event) => {
        if (event.target === expandedImage) return;
        closeImage();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        if (expandedImageContainer.style.display === 'flex') {
            closeImage();
        }
    });

    window.addEventListener('resize', () => {
        if (expandedImageContainer.style.display === 'flex') {
            expandedImage.classList.add('expanded');
        }
    });
})();
