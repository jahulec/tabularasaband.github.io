let lastScrollTop = 0;
const header = document.querySelector("header");
const sliderImages = document.querySelectorAll(".background-slider img");
const windowHeight = window.innerHeight;
const hamburger = document.getElementById('hamburger');
const navMobile = document.getElementById('nav-mobile');
let currentImageIndex = 0; // Indeks bieżącego obrazu
let isHeaderHidden = false;
const maxOpacityScroll = window.innerHeight; // Maksymalna wartość scrolla, po której zdjęcia są w pełni przyciemnione


// 1. Debugowanie ładowania obrazów
function debugImageLoading() {
    console.log("Funkcja debugImageLoading uruchomiona");
    const images = document.querySelectorAll('.background-slider img'); 

    images.forEach((img, index) => {
        img.addEventListener('load', () => {
            console.log(`Obraz ${index + 1} (${img.src}) załadowany.`);
        });

        img.addEventListener('error', () => {
            console.error(`Błąd ładowania obrazu ${index + 1} (${img.src}).`);
        });
    });
    console.log("Funkcja debugImageLoading zakończona");
}

// 2. Funkcja do obsługi zmiany obrazów mobilnych/desktopowych
function handleImageSwap() {
    console.log("Funkcja handleImageSwap uruchomiona");
    const sliderImages = document.querySelectorAll('.background-slider img');
    
    sliderImages.forEach(img => {
        if (window.innerWidth <= 768) {
            img.src = img.getAttribute('data-mobile-src');
        } else {
            img.src = img.getAttribute('data-desktop-src');
        }
    });
    console.log("Funkcja handleImageSwap zakończona");
}

// 3. Funkcja zmiany obrazów
function changeSlide() {
    console.log("Funkcja changeSlide uruchomiona");
    const sliderImages = document.querySelectorAll('.background-slider img');
    
    sliderImages.forEach(img => {
        img.classList.remove('active');
    });

    currentImageIndex = (currentImageIndex + 1) % sliderImages.length;
    sliderImages[currentImageIndex].classList.add('active');
    console.log(`Aktywny slajd: ${currentImageIndex + 1}`);
    console.log("Funkcja changeSlide zakończona");
}

// 4. Funkcja uruchamiająca slider
function startSlider() {
    console.log("Funkcja startSlider uruchomiona");
    const sliderImages = document.querySelectorAll('.background-slider img');
    if (Array.from(sliderImages).every(img => img.complete)) {
        activateFirstSlide();
        setInterval(changeSlide, 5000);
    } else {
        setTimeout(startSlider, 100);
    }
    console.log("Funkcja startSlider zakończona");
}

// 5. Funkcja aktywująca pierwszy slajd
function activateFirstSlide() {
    console.log("Funkcja activateFirstSlide uruchomiona");
    const sliderImages = document.querySelectorAll('.background-slider img');
    sliderImages[0].classList.add('active');
}

window.onload = function() {
    console.log("Strona załadowana, uruchamianie funkcji");
    debugImageLoading();
    handleImageSwap();
    startSlider();
};

// Reagowanie na zmianę rozmiaru okna
window.addEventListener("resize", handleImageSwap);


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
    this.classList.toggle('active');
    document.getElementById('nav-mobile').classList.toggle('active');
});

function handleHeaderVisibility(scrollTop) {
    const opacityFactor = Math.min(scrollTop / maxOpacityScroll, 1); // Opacity osiągnie 1, gdy scrollTop = windowHeight
    const isImagesFullyDimmed = opacityFactor === 1; // Sprawdzamy, czy obrazy są w pełni przyciemnione

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

// Zdarzenie scrollowania, aby ukrywać/pokazywać nagłówek
window.addEventListener('scroll', function () {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    adjustImageBrightness(scrollTop); // Zmiana jasności zdjęć przy scrollowaniu
    handleHeaderVisibility(scrollTop); // Ukrywanie/pokazywanie nagłówka
});
// Dodanie event listenera na załadowanie strony, który uruchamia slider
window.addEventListener("load", startSlider);



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


let stickyHeader = document.querySelector('.mobile-sticky-header');
let isStickyVisible = false;

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

window.addEventListener('load', function() {
    const h1Element = document.querySelector('h1');
    
    // Użycie GSAP ScrollToPlugin do płynnego przewijania do H1
    gsap.to(window, {
        scrollTo: { y: h1Element, offsetY: window.innerHeight / 2 }, // Przewiń do H1 na środku ekranu
        duration: 1, // Czas przewijania (możesz dostosować)
        ease: "power2.out" // Płynne przewijanie
    });
});

