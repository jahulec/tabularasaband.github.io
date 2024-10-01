let lastScrollTop = 0;
const header = document.querySelector("header");
const sliderContainer = document.querySelector(".slider-container");
const sliderImages = document.querySelectorAll(".slider-container img");
const windowHeight = window.innerHeight;
const hamburger = document.getElementById('hamburger');
const navMobile = document.getElementById('nav-mobile');
let currentImageIndex = 0; // Indeks bieżącego obrazu

// Funkcja do aktywowania pierwszego zdjęcia
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
        activateFirstSlide(); // Aktywowanie pierwszego zdjęcia
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
        // Gdy przewijamy w dół, nagłówek się ukrywa
        if (scrollTop > lastScrollTop) {
            header.classList.add("hidden");
        } else {
            // Gdy przewijamy w górę, nagłówek się pokazuje
            header.classList.remove("hidden");
        }
    } else {
        // Nagłówek zawsze widoczny, gdy galeria jest widoczna
        header.classList.remove("hidden");
    }

    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop; // Aktualizacja wartości scrollTop
}

window.onload = function() {
    startSlider(); // Rozpoczęcie działania slidera po pełnym załadowaniu strony
};

window.addEventListener("scroll", function () {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    adjustImageBrightness(scrollTop); // Przyciemnianie obrazów w zależności od scrolla
    handleHeaderVisibility(scrollTop); // Ukrywanie nagłówka na podstawie scrolla
});


document.getElementById('hamburger').addEventListener('click', function() {
    this.classList.toggle('active');
    document.getElementById('nav-mobile').classList.toggle('active');
});

// JavaScript do obsługi kliknięcia na zdjęcia w wersji mobilnej
document.querySelectorAll('.member').forEach(member => {
    member.addEventListener('click', function() {
        // Sprawdź, czy jest już aktywny
        if (this.classList.contains('active')) {
            this.classList.remove('active'); // Usuwanie aktywności po ponownym kliknięciu
        } else {
            // Dezaktywuj inne elementy
            document.querySelectorAll('.member').forEach(el => el.classList.remove('active'));
            this.classList.add('active'); // Dodaj aktywność do klikniętego elementu
        }
    });
});
