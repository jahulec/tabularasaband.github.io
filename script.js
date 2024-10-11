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
const maxOpacityScroll = window.innerHeight; // Maksymalna wartość scrolla, po której zdjęcia są w pełni przyciemnione

// Funkcja sprawdzająca, czy wszystkie obrazy zostały poprawnie załadowane
function checkAllImagesLoaded() {
    try {
        console.log("Uruchomienie funkcji checkAllImagesLoaded");
        const images = document.querySelectorAll('.background-slider img');
        let allImagesLoaded = true;

        images.forEach((img, index) => {
            if (!img.complete || img.naturalWidth === 0) {
                console.error(`Obraz ${index + 1} (${img.src}) nie został poprawnie załadowany.`);
                allImagesLoaded = false;
            } else {
                console.log(`Obraz ${index + 1} (${img.src}) załadowany poprawnie.`);
            }
        });

        if (allImagesLoaded) {
            console.log("Wszystkie obrazy zostały poprawnie załadowane.");
        } else {
            console.error("Niektóre obrazy nie zostały poprawnie załadowane.");
        }
    } catch (error) {
        console.error("Błąd w funkcji checkAllImagesLoaded:", error);
    }
}

// Funkcja do obsługi zmiany obrazów mobilnych/desktopowych
function handleImageSwap() {
    try {
        console.log("Uruchomienie funkcji handleImageSwap");
        const sliderImages = document.querySelectorAll('.background-slider img');
    
        sliderImages.forEach(img => {
            if (window.innerWidth <= 768) {
                img.src = img.getAttribute('data-mobile-src');
            } else {
                img.src = img.getAttribute('data-desktop-src');
            }
        });
        console.log("Funkcja handleImageSwap zakończona poprawnie");
    } catch (error) {
        console.error("Błąd w funkcji handleImageSwap:", error);
    }
}

// Funkcja zmiany obrazów
let isChangingSlide = false; // Blokada

function changeSlide() {
    try {
        if (isChangingSlide) return; // Sprawdzamy, czy zmiana slajdu już trwa
        isChangingSlide = true; // Ustawiamy blokadę

        console.log("Uruchomienie funkcji changeSlide");
        sliderImages.forEach((img, index) => {
            img.classList.remove('active');
        });

        currentImageIndex = (currentImageIndex + 1) % sliderImages.length;
        sliderImages[currentImageIndex].classList.add('active');
        console.log(`Aktywny slajd: ${currentImageIndex + 1}`);

        setTimeout(() => { 
            isChangingSlide = false; // Zdejmujemy blokadę po krótkim czasie
        }, 1000); // 1 sekunda, można dostosować
    } catch (error) {
        console.error("Błąd w funkcji changeSlide:", error);
    }
}

// Funkcja uruchamiająca slider
function startSlider() {
    try {
        console.log("Uruchomienie funkcji startSlider");
        const sliderImages = document.querySelectorAll('.background-slider img');
        if (Array.from(sliderImages).every(img => img.complete)) {
            activateFirstSlide();
            setInterval(changeSlide, 5000);
        } else {
            setTimeout(startSlider, 100);
        }
        console.log("Funkcja startSlider zakończona poprawnie");
    } catch (error) {
        console.error("Błąd w funkcji startSlider:", error);
    }
}

// Funkcja aktywująca pierwszy slajd
function activateFirstSlide() {
    try {
        console.log("Uruchomienie funkcji activateFirstSlide");
        const sliderImages = document.querySelectorAll('.background-slider img');
        sliderImages[0].classList.add('active');
        console.log("Pierwszy slajd aktywowany poprawnie");
    } catch (error) {
        console.error("Błąd w funkcji activateFirstSlide:", error);
    }
}

// slider
document.addEventListener("DOMContentLoaded", function() {
    try {
        console.log("Uruchomienie slidera podczas DOMContentLoaded");
        startSlider();
    } catch (error) {
        console.error("Błąd podczas uruchamiania slidera:", error);
    }
});

// przewijanie po załadowaniu strony
document.addEventListener('DOMContentLoaded', function() {
    try {
        console.log("Uruchomienie przewijania po załadowaniu strony");
        const h1Element = document.querySelector('h1');
        
        // Użycie GSAP ScrollToPlugin do płynnego przewijania do H1
        gsap.to(window, {
            scrollTo: { y: h1Element, offsetY: window.innerHeight / 2 }, // Przewiń do H1 na środku ekranu
            duration: 1, // Czas przewijania (możesz dostosować)
            ease: "power2.out" // Płynne przewijanie
        });
        console.log("Przewijanie do H1 zakończone");
    } catch (error) {
        console.error("Błąd podczas przewijania:", error);
    }
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
