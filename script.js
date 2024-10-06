let lastScrollTop = 0;
const header = document.querySelector("header");
const sliderImages = document.querySelectorAll(".background-slider img");
const windowHeight = window.innerHeight;
const hamburger = document.getElementById('hamburger');
const navMobile = document.getElementById('nav-mobile');
let currentImageIndex = 0; // Indeks bieżącego obrazu
let isHeaderHidden = false;
const maxOpacityScroll = window.innerHeight; // Maksymalna wartość scrolla, po której zdjęcia są w pełni przyciemnione


// Funkcja do sprawdzenia, czy obrazy się załadowały
function areImagesLoaded() {
    let allLoaded = true;
    sliderImages.forEach((img) => {
        if (!img.complete || img.naturalHeight === 0) {
            allLoaded = false;
        }
    });
    return allLoaded;
}

sliderImages.forEach((img, index) => {
    console.log(`Image ${index} loaded: `, img.complete);
});

// Funkcja do aktywowania pierwszego zdjęcia
function activateFirstSlide() {
    sliderImages[0].classList.add('active'); // Dodanie klasy .active do pierwszego zdjęcia
}

function changeSlide() {
    // Sprawdzamy, czy są jakieś obrazy
    if (sliderImages.length === 0) return;

    // Usuwanie klasy .active ze wszystkich obrazów
    sliderImages.forEach((img) => {
        img.classList.remove('active');
    });

    // Zwiększamy indeks obrazu i resetujemy, jeśli przekroczy liczbę obrazów
    currentImageIndex = (currentImageIndex + 1) % sliderImages.length;

    // Dodanie klasy .active do bieżącego obrazu
    sliderImages[currentImageIndex].classList.add('active');
}

function startSlider() {
    if (areImagesLoaded()) {
        activateFirstSlide();
        setInterval(changeSlide, 5000); // Uruchamianie zmiany obrazu co 5 sekund
    } else {
        setTimeout(startSlider, 100); // Sprawdzanie załadowania co 100ms
    }
}

function handleImageSwap() {
    sliderImages.forEach(img => {
        if (window.innerWidth <= 768) {
            // Mobile - ustawiamy mobilne wersje obrazów
            img.src = img.getAttribute('data-mobile-src');
        } else {
            // Desktop - ustawiamy desktopowe wersje obrazów
            img.src = img.getAttribute('data-desktop-src');
        }
    });
}

window.addEventListener("load", function() {
    handleImageSwap();
    startSlider();
});

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
