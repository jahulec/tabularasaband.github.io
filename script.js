let lastScrollTop = 0;
const header = document.querySelector("header");
const sliderImages = document.querySelectorAll(".background-slider img");
const windowHeight = window.innerHeight;
const hamburger = document.getElementById('hamburger');
const navMobile = document.getElementById('nav-mobile');
let currentImageIndex = 0; // Indeks bieżącego obrazu
let isHeaderHidden = false;
const maxOpacityScroll = window.innerHeight; // Maksymalna wartość scrolla, po której zdjęcia są w pełni przyciemnione


// Funkcja do aktywowania pierwszego zdjęcia z efektem zoom po pełnym załadowaniu strony
function activateFirstSlide() {
    sliderImages[0].classList.add('active'); // Dodanie klasy .active do pierwszego zdjęcia
}

// Funkcja do zmiany zdjęć co kilka sekund
function changeSlide() {
    sliderImages.forEach((img, index) => {
        img.classList.remove('active'); // Usuwanie klasy active ze wszystkich obrazów
    });

    currentImageIndex = (currentImageIndex + 1) % sliderImages.length; // Następne zdjęcie w kolejności
    sliderImages[currentImageIndex].classList.add('active'); // Dodawanie klasy active do bieżącego obrazu
}

// Funkcja sprawdzająca, czy wszystkie obrazy zostały załadowane
function areImagesLoaded() {
    return Array.from(sliderImages).every(img => img.complete);
}

// Funkcja, która uruchamia slider, jeśli wszystkie obrazy są załadowane
function startSlider() {
    if (areImagesLoaded()) {
        activateFirstSlide();
        setInterval(changeSlide, 5000); // Zmieniaj zdjęcia co 5 sekund
    } else {
        setTimeout(startSlider, 100); // Sprawdzaj co 100ms, czy obrazy zostały załadowane
    }
}

// Funkcja do zmiany obrazów w zależności od rozdzielczości (desktop/mobile)
function handleImageSwap() {
    sliderImages.forEach(img => {
        // Sprawdzamy, czy obraz jest już ustawiony dla odpowiedniego urządzenia
        if (window.innerWidth <= 768 && img.src !== img.getAttribute('data-mobile-src')) {
            img.src = img.getAttribute('data-mobile-src'); // Ustaw wersję mobilną
        } else if (window.innerWidth > 768 && img.src !== img.getAttribute('data-desktop-src')) {
            img.src = img.getAttribute('data-desktop-src'); // Ustaw wersję desktopową
        }
    });
}

// Nasłuchiwanie na zmianę rozmiaru ekranu i wywołanie funkcji zmiany obrazów
window.addEventListener("resize", handleImageSwap);

// Debugowanie ładowania obrazów
function debugImageLoading() {
    const images = document.querySelectorAll('.background-slider img'); // Pobieramy wszystkie obrazy w galerii

    images.forEach((img, index) => {
        // Zdarzenie "load" dla każdego obrazu
        img.addEventListener('load', () => {
            console.log(`Obraz ${index + 1} (${img.src}) został załadowany poprawnie.`);
        });

        // Zdarzenie "error" dla każdego obrazu w przypadku błędu
        img.addEventListener('error', () => {
            console.error(`Błąd ładowania obrazu ${index + 1} (${img.src}).`);
        });
    });
}

// Wywołanie funkcji debugującej po załadowaniu strony
window.addEventListener('load', function() {
    debugImageLoading(); // Uruchamiamy debugowanie
    handleImageSwap();   // Sprawdzamy i ustawiamy obrazy na mobilne lub desktopowe
    startSlider();       // Rozpoczynamy slider po załadowaniu obrazów
});



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

