let lastScrollTop = 0;
const header = document.querySelector("header");
const sliderImages = document.querySelectorAll(".background-slider img");
const windowHeight = window.innerHeight;
const hamburger = document.getElementById('hamburger');
const navMobile = document.getElementById('nav-mobile');
let currentImageIndex = 0; // Indeks bieżącego obrazu
let isHeaderHidden = false;
let stickyHeader = document.querySelector('.mobile-sticky-header');
let isStickyVisible = false;
let isChangingSlide = false; // Blokada globalna
const maxOpacityScroll = window.innerHeight; // Maksymalna wartość scrolla, po której zdjęcia są w pełni przyciemnione

// Funkcja sprawdzająca, czy wszystkie obrazy zostały poprawnie załadowane
function checkImagesLoaded() {
    const sliderImages = document.querySelectorAll('.background-slider img');
    let allImagesLoaded = true;

    sliderImages.forEach((img, index) => {
        if (img.complete && img.naturalWidth !== 0) {
            console.log(`Obraz ${index + 1} (${img.src}) został poprawnie załadowany.`);
        } else {
            console.error(`Obraz ${index + 1} (${img.src}) nie został poprawnie załadowany.`);
            allImagesLoaded = false;
        }
    });

    if (allImagesLoaded) {
        console.log("Wszystkie obrazy zostały poprawnie załadowane.");
    } else {
        console.error("Niektóre obrazy nie zostały poprawnie załadowane.");
    }

    return allImagesLoaded;
}

// Funkcja do obsługi zmiany obrazów mobilnych/desktopowych
function handleImageSwap() {
    const sliderImages = document.querySelectorAll('.background-slider img');
    
    sliderImages.forEach(img => {
        if (window.innerWidth <= 768) {
            img.src = img.getAttribute('data-mobile-src');
        } else {
            img.src = img.getAttribute('data-desktop-src');
        }
    });
}

// Funkcja zmiany obrazów
function changeSlide() {
    if (isChangingSlide) return; // Sprawdzamy, czy zmiana slajdu już trwa
    isChangingSlide = true; // Ustawiamy blokadę

    sliderImages.forEach((img, index) => {
        img.classList.remove('active');
    });

    currentImageIndex = (currentImageIndex + 1) % sliderImages.length;
    sliderImages[currentImageIndex].classList.add('active');

    setTimeout(() => { 
        isChangingSlide = false; // Zdejmujemy blokadę po krótkim czasie
    }, 1000); // 1 sekunda, można dostosować
}

// Funkcja uruchamiająca slider
function startSlider() {
    const sliderImages = document.querySelectorAll('.background-slider img');
    if (!sliderImages || sliderImages.length === 0) {
        console.error("Nie znaleziono obrazów w sliderze.");
        return;
    }

    if (Array.from(sliderImages).every(img => img.complete)) {
        activateFirstSlide();
        setInterval(changeSlide, 5000);
    } else {
        setTimeout(startSlider, 100); // Sprawdzaj co 100ms
    }
}

// Funkcja aktywująca pierwszy slajd
function activateFirstSlide() {
    const sliderImages = document.querySelectorAll('.background-slider img');
    sliderImages[0].classList.add('active');
}

// Funkcja aktywująca wszystko po page onload
window.addEventListener('load', function() {
    console.log("Strona została w pełni załadowana, uruchamiam wszystkie skrypty.");

    // Uruchomienie wymiany obrazów
    handleImageSwap();

    // Uruchomienie slidera
    startSlider();

    // Uruchomienie przewijania do H1 po pełnym załadowaniu
    const h1Element = document.querySelector('h1');
    gsap.to(window, {
        scrollTo: { y: h1Element, offsetY: window.innerHeight / 2 }, // Przewiń do H1 na środku ekranu
        duration: 1, // Czas przewijania (możesz dostosować)
        ease: "power2.out" // Płynne przewijanie
    });
});

// zciemnianie
function adjustImageBrightness(scrollTop) {
    const opacityFactor = Math.min(scrollTop / windowHeight, 1); // Im więcej przewiniemy, tym ciemniejsze stają się zdjęcia
    sliderImages.forEach((img) => {
        const brightness = Math.max(1 - opacityFactor, 0.1); // Jasność nie mniejsza niż 0.1
        img.style.filter = `brightness(${brightness})`; // Ustaw jasność obrazów
    });
}

window.addEventListener('scroll', function() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    adjustImageBrightness(scrollTop); // Zmiana jasności zdjęć przy scrollowaniu
    handleHeaderVisibility(scrollTop); // Ukrywanie/pokazywanie nagłówka
});

// Obsługa hamburger menu
document.getElementById('hamburger').addEventListener('click', function() {
    console.log("Hamburger clicked");
    this.classList.toggle('active');
    document.getElementById('nav-mobile').classList.toggle('active');

    if (this.classList.contains('active')) {
        console.log("Hamburger is active");
        // Gdy hamburger jest aktywny, pokaż nagłówek (jeśli jest ukryty)
        header.classList.remove("hidden");
        isHeaderHidden = false;
    } else {
        console.log("Hamburger is not active");
    }
});

// chowanie nagłówka
function handleHeaderVisibility(scrollTop) {
    const opacityFactor = Math.min(scrollTop / maxOpacityScroll, 1); // Opacity osiągnie 1, gdy scrollTop = windowHeight
    const isImagesFullyDimmed = opacityFactor === 1; // Sprawdzamy, czy obrazy są w pełni przyciemnione

    // Sprawdzenie, czy hamburger menu jest aktywne
    const isHamburgerActive = hamburger.classList.contains('active');

    if (isHamburgerActive) {
        // Jeśli menu hamburgera jest aktywne, nie chowaj nagłówka
        header.classList.remove("hidden");
        isHeaderHidden = false;
        return; // Zakończ funkcję, nie chowamy nagłówka
    }

    if (scrollTop < lastScrollTop && isHeaderHidden) {
        // Jeśli przewijasz do góry, pokaż nagłówek
        header.classList.remove("hidden");
        isHeaderHidden = false;
    } else if (scrollTop > lastScrollTop && !isHeaderHidden && isImagesFullyDimmed) {
        // Ukryj nagłówek tylko wtedy, gdy obrazy są w pełni przyciemnione i przewijasz w dół
        header.classList.add("hidden");
        isHeaderHidden = true;
    }

    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop; // Aktualizacja wartości scrollTop
}

// obsługa scroll
window.addEventListener('scroll', function () {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    adjustImageBrightness(scrollTop); // Zmiana jasności zdjęć przy scrollowaniu
    handleHeaderVisibility(scrollTop); // Ukrywanie/pokazywanie nagłówka
});

// dolny nagłówek
window.addEventListener('scroll', function () {
    let scrollY = window.scrollY;

    if (scrollY > 170 && !isStickyVisible) {
        // Pojawienie się nagłówka po 400px scrolla
        stickyHeader.classList.add('show');
        stickyHeader.classList.remove('hide');
        isStickyVisible = true;
    } else if (scrollY <= 170 && isStickyVisible) {
        // Ukrywanie nagłówka po powrocie na górę
        stickyHeader.classList.add('hide');
        stickyHeader.classList.remove('show');
        isStickyVisible = false;
    }
});

// przewijanie po załadowaniu strony
document.addEventListener('DOMContentLoaded', function() {
    const h1Element = document.querySelector('h1');
    
    // Użycie GSAP ScrollToPlugin do płynnego przewijania do H1
    gsap.to(window, {
        scrollTo: { y: h1Element, offsetY: window.innerHeight / 2 }, // Przewiń do H1 na środku ekranu
        duration: 1, // Czas przewijania (możesz dostosować)
        ease: "power2.out" // Płynne przewijanie
    });
});

// przycisk to top
document.getElementById("scrollTopBtn").addEventListener("click", function() {
 const h1Element = document.querySelector('h1');
    
    // Użycie GSAP ScrollToPlugin do płynnego przewijania do H1
    gsap.to(window, {
        scrollTo: { y: h1Element, offsetY: window.innerHeight / 2 }, // Przewiń do H1 na środku ekranu
        duration: 1, // Czas przewijania (możesz dostosować)
        ease: "power2.out" // Płynne przewijanie
    });
});

// Obsługa kliknięcia na członka zespołu
document.querySelectorAll('.member').forEach(member => {
    member.addEventListener('click', function() {
        // Sprawdź, czy element już ma klasę 'active'
        if (this.classList.contains('active')) {
            this.classList.remove('active'); // Usuń efekt po ponownym kliknięciu
        } else {
            // Usuń klasę 'active' z innych członków
            document.querySelectorAll('.member').forEach(m => m.classList.remove('active'));
            this.classList.add('active'); // Dodaj efekt powiększenia i przyciemnienia
        }
    });
});

const galleryImages = document.querySelectorAll('.gallery-grid img');
const expandedImageContainer = document.getElementById('expandedImageContainer');
const expandedImage = document.getElementById('expandedImage');
const galleryGrid = document.querySelector('.gallery-grid');

// Obsługa kliknięcia na obrazek
galleryImages.forEach(image => {
    image.addEventListener('click', () => {
        // Ustawienie źródła obrazka
        expandedImage.src = image.src;

        // Wyświetlenie kontenera i rozpoczęcie rozmycia
        expandedImageContainer.style.display = 'flex';
        setTimeout(() => {
            expandedImageContainer.style.opacity = '1'; // Pojawienie się kontenera
            expandedImage.classList.add('expanded'); // Powiększenie obrazka
            galleryGrid.classList.add('blurred'); // Rozmycie i przyciemnienie galerii
        }); // Małe opóźnienie dla płynności
    });
});

// Obsługa kliknięcia na powiększony obrazek (zamykanie)
expandedImageContainer.addEventListener('click', () => {
    // Zresetowanie obrazka i rozpoczęcie odblurowania
    expandedImage.classList.remove('expanded');
    expandedImageContainer.style.opacity = '0'; // Ukrywanie kontenera
    galleryGrid.classList.remove('blurred');
    galleryGrid.classList.add('unblurred'); // Rozjaśnienie i odblurowanie galerii

    // Zatrzymanie blur po zakończeniu animacji
    setTimeout(() => {
        expandedImageContainer.style.display = 'none';
        galleryGrid.classList.remove('unblurred'); // Usunięcie unblur po zamknięciu
    }, 300); // Czas dopasowany do animacji CSS
});

document.addEventListener("DOMContentLoaded", function () {
    const firstImage = document.getElementById("firstImage");

    // Funkcja ładująca pierwszy obrazek w zależności od szerokości ekranu
    function preloadFirstImage() {
        const mobileSrc = firstImage.getAttribute('data-mobile-src');
        const desktopSrc = firstImage.getAttribute('data-desktop-src');

        if (window.innerWidth <= 768) {
            firstImage.src = mobileSrc;  // Ładowanie obrazu mobilnego
        } else {
            firstImage.src = desktopSrc;  // Ładowanie obrazu desktopowego
        }

        firstImage.onload = function () {
            console.log("First image loaded");
            loadRemainingImages();  // Po załadowaniu pierwszego obrazu, załaduj resztę galerii
        };
    }

    // Funkcja do ładowania pozostałych obrazów dynamicznej galerii
    function loadRemainingImages() {
        const images = document.querySelectorAll('.background-slider img:not(#firstImage)');
        images.forEach(img => {
            const mobileSrc = img.getAttribute('data-mobile-src');
            const desktopSrc = img.getAttribute('data-desktop-src');

            if (window.innerWidth <= 768) {
                img.src = mobileSrc;  // Ładuj obrazy mobilne
            } else {
                img.src = desktopSrc;  // Ładuj obrazy desktopowe
            }
        });
    }

    // Preload pierwszego obrazu na starcie
    preloadFirstImage();

    // Opcjonalnie: ponowne ładowanie przy zmianie rozmiaru okna (ponownie ładuje tylko pierwszy obraz)
    window.addEventListener('resize', preloadFirstImage);
});

function downloadFile() {
        setTimeout(() => {
            const link = document.createElement("a");
            link.href = "press.pdf";
            link.download = "press.pdf";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }, 500); // Drobne opóźnienie, żeby najpierw otworzyło nową kartę
    }
