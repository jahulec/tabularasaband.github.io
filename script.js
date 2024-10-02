let lastScrollTop = 0;
const header = document.querySelector("header");
const sliderContainer = document.querySelector(".slider-container");
const sliderImages = document.querySelectorAll(".slider-container img");
const windowHeight = window.innerHeight;
const hamburger = document.getElementById('hamburger');
const navMobile = document.getElementById('nav-mobile');
let currentImageIndex = 0; // Indeks bieżącego obrazu


window.addEventListener("load", function() {
    handleImageSwap(); // Zmień obrazy w zależności od urządzenia
});

window.addEventListener("resize", handleImageSwap); // Zmiana obrazu po zmianie rozmiaru ekranu


function handleImageSwap() {
    const sliderImages = document.querySelectorAll('.slider-container img');
    
    sliderImages.forEach(img => {
        if (window.innerWidth <= 768) {
            // Mobile - zmieniamy na wersje mobilne
            img.src = img.getAttribute('data-mobile-src');
        } else {
            // Desktop - zmieniamy na wersje desktopowe
            img.src = img.getAttribute('data-desktop-src');
        }
    });
}
// Funkcja do aktywowania pierwszego zdjęcia
function activateFirstSlide() {
    sliderImages[0].classList.add('active'); // Dodanie klasy .active do pierwszego zdjęcia
}

// Funkcja do zmiany zdjęć co kilka sekund
function changeSlide() {
    sliderImages.forEach((img) => {
        img.classList.remove('active'); // Usuwanie klasy active ze wszystkich obrazów
    });

    currentImageIndex = (currentImageIndex + 1) % sliderImages.length;
    sliderImages[currentImageIndex].classList.add('active');
}

// Sprawdzanie, czy wszystkie zdjęcia zostały załadowane
function areImagesLoaded() {
    let allLoaded = true;
    sliderImages.forEach((img) => {
        if (!img.complete || img.naturalHeight === 0) {
            allLoaded = false;
        }
    });
    return allLoaded;
}

// Uruchomienie funkcji zmiany zdjęć po załadowaniu wszystkich obrazów
function startSlider() {
    if (areImagesLoaded()) {
        activateFirstSlide();
        setInterval(changeSlide, 5000); // Co 5 sekund zmiana zdjęcia
    } else {
        setTimeout(startSlider, 100); // Sprawdzanie załadowania co 100ms
    }
}

// Funkcja do przyciemniania obrazów w zależności od scrollowania
function adjustImageBrightness(scrollTop) {
    const opacityFactor = Math.min(scrollTop / windowHeight, 1); // Im więcej przewiniemy, tym ciemniejsze stają się zdjęcia
    sliderImages.forEach((img) => {
        img.style.filter = `brightness(${1.1 - opacityFactor})`; // Zdjęcia stają się coraz ciemniejsze
    });
}

// Funkcja do ukrywania/pokazywania nagłówka na podstawie przewijania
function handleHeaderVisibility(scrollTop) {
    const galleryBottom = sliderContainer.getBoundingClientRect().bottom;

    // Ukrywanie nagłówka po zniknięciu galerii
    if (galleryBottom <= 0) {
        if (scrollTop > lastScrollTop) {
            header.classList.add("hidden"); // Ukryj nagłówek, gdy przewijasz w dół
        } else {
            header.classList.remove("hidden"); // Pokaż nagłówek, gdy przewijasz w górę
        }
    } else {
        header.classList.remove("hidden"); // Nagłówek zawsze widoczny, gdy galeria jest widoczna
    }

    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop; // Aktualizacja wartości scrollTop
}

// Obsługa hamburger menu
document.getElementById('hamburger').addEventListener('click', function() {
    this.classList.toggle('active');
    document.getElementById('nav-mobile').classList.toggle('active');
});

// Obsługa kliknięcia na członków zespołu (wersja mobilna)
document.querySelectorAll('.member').forEach(member => {
    member.addEventListener('click', function() {
        if (this.classList.contains('active')) {
            this.classList.remove('active'); // Usuwanie aktywności po ponownym kliknięciu
        } else {
            document.querySelectorAll('.member').forEach(el => el.classList.remove('active'));
            this.classList.add('active'); // Dodanie aktywności do klikniętego elementu
        }
    });
});

// Dodanie event listenera na załadowanie strony, który uruchamia slider
window.addEventListener("load", startSlider);

// Obsługa scrollowania
window.addEventListener("scroll", function () {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    adjustImageBrightness(scrollTop); // Przyciemnianie obrazów w zależności od scrolla
    handleHeaderVisibility(scrollTop); // Ukrywanie nagłówka na podstawie scrolla
});



