# Audyt modernizacji tabularasaband.pl

Data audytu: 10 lipca 2026  
Branch roboczy: `modernization-2026-07-10`  
Stan wejściowy: commit `37993b6`, czyste drzewo robocze

## 1. Zakres i metoda

Audyt objął wszystkie indeksowalne pliki HTML, wspólny CSS i JavaScript, dane koncertowe, generatory, zasoby graficzne, dokumenty PDF, wersje PL/EN, konfigurację GitHub Pages, manifest, sitemapę, robots.txt i testy automatyczne. Sprawdzono również bazowe zachowanie strony w Chromium przez istniejący zestaw Playwright.

Testy bazowe:

- generator koncertów: 7/7 zaliczonych;
- kontrola kodowania: zaliczona;
- kontrola SEO: 22/22 indeksowalnych stron zaliczonych według obecnego skryptu;
- Playwright: 41 testów zaliczonych, 2 niezaliczone;
- oba błędy Playwright dotyczą nieaktualnej liczby oczekiwanych koncertów (test oczekuje 31, `data/shows.json` zawiera 32), nie awarii interfejsu.

## 2. Struktura projektu

Projekt jest statyczną stroną bez ciężkiego frameworka, wdrażaną przez GitHub Pages dla domeny `tabularasaband.pl`.

- `index.html`, `index-en.html` — strony główne PL/EN;
- `about*.html`, `music*.html`, `shows*.html`, `press*.html`, `contact*.html`, `gallery*.html`, `news*.html` — kluczowe podstrony;
- `shop*.html`, strony prawne i `mapa.html` — treści uzupełniające;
- `styles.css`, `script.js` — wspólna warstwa wizualna i funkcjonalna;
- `styles-gallery.css`, `script-gallery.js` — galeria;
- `data/shows.json` — źródło prawdy dla koncertów;
- `scripts/sync-shows-from-calendar.mjs` — render koncertów do stron PL/EN i strony głównej;
- `scripts/` — optymalizacja obrazów, SEO, build i Lighthouse;
- `tests/` — testy generatora, smoke, mobile i dostępności;
- `galeria/`, `artykul/`, `osoby/`, `ikony/` — lokalne zasoby;
- `Presspack*.pdf`, `RiderTabulaRasa*.pdf` — gotowe dokumenty bez edytowalnego źródła w repozytorium.

Architektura jest właściwa dla skali projektu. Migracja do dużego frameworka nie przyniosłaby obecnie korzyści proporcjonalnych do kosztu.

## 3. Najważniejsze problemy

### Krytyczne

1. Dane o zespole, wydawnictwach, osiągnięciach, kontaktach i linkach są kopiowane ręcznie między stronami. Jedno źródło prawdy istnieje tylko dla koncertów.
2. Role gitarzystów są niespójne. Brief wskazuje Beniamina jako wokal i gitarę prowadzącą, a Johnny'ego jako gitarę rytmiczną; obecny Press podaje odwrotny podział lub ogólne role.
3. Artykuły o `Diamentach` nadal zawierają zapowiedzi i zwroty „prawie tutaj”, „pre-save” oraz czas przyszły mimo premiery 8 lipca 2026.
4. Testy smoke zawierają ręcznie wpisaną liczbę koncertów i są już niezgodne z `data/shows.json`.
5. Obecna strona Muzyka nie jest dyskografią: pokazuje widget Spotify i sześć pełnych iframe'ów YouTube, bez dat, opisów, wyróżnionych utworów ani indywidualnych linków streamingowych.
6. Obecny Press jest listą linków i osiągnięć, nie internetowym EPK. Brakuje quick facts, rekomendowanych utworów, głównego live video, uporządkowanych zasobów, krótkiej i pełnej biografii oraz wyraźnego kontaktu bookingowego.

### Wysokie

1. Hero strony głównej komunikuje wyłącznie nowy singiel. Nie definiuje brzmienia zespołu ani nie pokazuje trzech dowodów wiarygodności.
2. Strona główna nie ma osobnej sekcji najlepszego materiału live, zwartej sekcji osiągnięć, skrótu historii zespołu ani czytelnego składu.
3. Osadzony od razu YouTube na stronie głównej i sześć iframe'ów na stronie Muzyka zwiększają koszt sieci i pracy głównego wątku. Potrzebne są lekkie miniatury aktywowane kliknięciem.
4. `styles.css` ma około 341 KB źródła i jest zbudowany z wielu kolejnych warstw nadpisujących wcześniejsze reguły. Występuje bardzo dużo `!important`, powtórzonych `:root` i media queries. Utrudnia to przewidywalne zmiany i zwiększa ryzyko regresji.
5. `script.js` ma około 139 KB źródła i realizuje globalnie na każdej stronie wiele funkcji: header, cookie consent, GTM, newsletter, slider, tracking, wideo, pokaz koncertów, motion i nawigację. Warunkowe inicjalizacje ograniczają koszt, ale plik wymaga dalszej modularizacji.
6. Nawigacja zawiera więcej pozycji niż docelowa hierarchia. Aktualności, galeria i sklep konkurują na pierwszym poziomie z Muzyką, Koncertami, O nas, Press i Kontaktem.
7. Stopka jest częściowo składana przez JavaScript i ma ręcznie wpisany rok w HTML. Brakuje krótkiego pozycjonowania marki bez JS.

## 4. Treść i aktualność

Potwierdzone w repozytorium:

- zespół powstał w Warszawie pod koniec 2023 roku;
- skład liczy pięć osób;
- Carlos Ceron Lara pochodzi z Chile;
- singiel `Diamenty` miał premierę 8 lipca 2026;
- oficjalne supporty w Progresji: Smith/Kotzen (2 marca 2026) i The Warning (27 czerwca 2026);
- Grand Prix oraz Nagroda Publiczności 38. Przeglądu Wszyscy Śpiewamy na Rockowo;
- pierwsze miejsca: Music On, Ryk Silnika, Pułtusk i Muzyka oraz Rockowa Przystań;
- drugie miejsce w IV Ogólnopolskim Konkursie Zespołów Rockowych im. Mikołaja Matyski;
- autorska trasa `Przebudzenie Tour` obejmująca 11 miast.

Problemy:

- w Press wydarzenia festiwalowe są opisane zwrotem „razem z”, co może sugerować bezpośrednią współpracę; należy rozdzielić supporty, festiwale i konkursy;
- opis Press używa generycznych sformułowań typu „unikalne połączenie” i zbyt szerokiej listy gatunków;
- pełna data starszych singli nie jest dostępna w repozytorium; bez zewnętrznego potwierdzenia można bezpiecznie podać jedynie kolejność i oznaczyć brak dat w `CONTENT_TODO.md`;
- część koncertów nie ma godziny, typu, miejsca rozbitego na osobne pola, linku wydarzenia ani biletów — tych danych nie wolno dopowiadać;
- rekord `Tomasz Karolak | Warszawa` wymaga doprecyzowania charakteru wydarzenia;
- Press pack istnieje tylko jako gotowy PDF, więc nie powinien być automatycznie modyfikowany.

## 5. UX i warstwa wizualna

Mocne strony:

- dobre, własne zdjęcia koncertowe;
- ciemna baza i mocna typografia są zgodne z marką;
- strona główna ma już kierunek redakcyjny i responsywne obrazy;
- mobilne menu, blokada przewijania i galeria mają testy regresji;
- animacje respektują `prefers-reduced-motion`.

Problemy:

- hierarchia strony głównej pokazuje premierę, koncerty, news i galerię, ale nie odpowiada na pytanie „kim jest zespół i dlaczego warto go zobaczyć”;
- hero nie eksponuje faktów scenicznych;
- podstrony korzystają z pełnoekranowego slidera jako powtarzalnego tła, co osłabia odrębność Muzyki, Press i Kontaktu oraz ładuje kilka wariantów obrazu na każdej stronie;
- portrety składu na stronie O nas mają skrótowe podpisy i generyczne teksty alternatywne;
- obecny CSS zawiera stare i nowe systemy wizualne naraz, co daje niespójne odstępy, promienie i formy przycisków;
- na stronie Galeria startuje ładowanie wielu miniatur. Lazy loading ogranicza transfer pełnych plików, ale liczba zapytań jest nadal wysoka.

## 6. SEO

Mocne strony:

- unikalne tytuły i opisy dla głównych stron;
- canonical, hreflang PL/EN i x-default;
- Open Graph, Twitter Cards, sitemap.xml i robots.txt;
- JSON-LD jest obecny na głównych podstronach;
- domena kanoniczna jest spójna z `CNAME`.

Problemy:

- obecny test SEO sprawdza obecność znaczników, ale nie kompletność i trafność danych;
- MusicGroup nie jest jeszcze zasilany jednym źródłem danych i wymaga ujednolicenia ról członków;
- strona Muzyka nie ma pełnego, widocznego katalogu nagrań ani adekwatnego `MusicRecording` dla każdej pozycji;
- strona Press nie ma BreadcrumbList i kompletnej struktury EPK;
- dane Event nie powinny być tworzone dla rekordów bez wystarczająco precyzyjnych danych;
- strona `mapa.html` i sklep są poboczne względem głównej intencji wyszukiwania i nie powinny dominować nawigacji.

## 7. Wydajność

Mocne strony:

- repozytorium ma AVIF/WebP, `srcset`, `sizes`, lazy loading i skrypty optymalizujące;
- obraz LCP ma preload i `fetchpriority`;
- CSS i JS mają wersje minifikowane;
- duże, nieużywane oryginały obrazów zostały usunięte z artefaktu, a zoptymalizowane warianty AVIF/WebP zachowane;
- landing i strona koncertów korzystają z odchudzonych, osobnych paczek CSS, a landing ładuje YouTube dopiero po interakcji;
- GTM uruchamia się po intencji użytkownika i jest powiązany ze zgodą;
- formularz newslettera ma realny endpoint MailerLite, a kontakt realny endpoint Formspree.

Problemy:

- wiele podstron preloaduje ten sam slider, choć nie jest on najważniejszą treścią tych stron;
- pozostałe pełne iframe'y multimedialne (w tym Spotify) są ciężkie;
- część podstron nadal korzysta ze wspólnego minifikowanego CSS o rozmiarze około 185 KB;
- częste animacje scroll/pinned zwiększają koszt na urządzeniach mobilnych;
- lokalny serwer testowy notuje `ConnectionAbortedError`, gdy przeglądarka anuluje pobieranie dużych zestawów obrazów galerii. Nie jest to błąd produkcyjny, ale potwierdza nadmiar równoległych zapytań.

## 8. Dostępność

Mocne strony:

- cookie consent, modal galerii, tytuły iframe i mobile menu są pokryte testami;
- modal galerii obsługuje focus trap i Escape;
- istnieją widoczne style focus i reduced motion;
- formularze mają etykiety i pola wymagane.

Problemy:

- globalna reguła wyłączająca outline z `!important` jest ryzykowna i musi zostać zneutralizowana spójnym `:focus-visible`;
- część alternatywnych opisów zdjęć jest generyczna lub numerowana;
- iframe'y nie powinny być jedyną drogą do utworu;
- komunikaty formularzy i tracking powinny być testowane również po błędzie sieci;
- animowany slider tła na każdej podstronie jest dekoracyjny, ale zwiększa ruch wizualny.

## 9. Formularze, analityka i prywatność

- Kontakt wysyła do realnego endpointu Formspree i nie ujawnia sekretu.
- Newsletter jest integrowany z realnym endpointem MailerLite; należy zachować wyraźną zgodę i komunikaty błędów.
- GTM `GTM-MK42J45H` jest skonfigurowany, a skrypt ma istniejącą warstwę `dataLayer`.
- Istnieje tracking sociali, pobrań, newslettera i odtwarzania YouTube. Należy dodać spójne kategorie dla Spotify, biletów, wydarzeń i bookingu oraz dokumentację nazw zdarzeń.
- Skrypty marketingowe nie powinny startować przed zgodą.

## 10. Bezpieczeństwo i hosting

- linki z `target="_blank"` są w zdecydowanej większości zabezpieczone `rel="noopener noreferrer"`; kontrolę należy utrzymać automatycznie;
- w repozytorium nie znaleziono kluczy API ani sekretów frontendowych;
- GitHub Pages nie pozwala ustawić pełnego zestawu nagłówków bezpieczeństwa z poziomu repozytorium. CSP w meta może łatwo zablokować GTM, MailerLite, Formspree, Spotify i YouTube, więc nie należy wprowadzać jej bez testu produkcyjnego;
- HTTPS i przekierowanie domeny muszą pozostać zarządzane przez GitHub Pages/DNS;
- ścieżki względne są poprawne dla publikacji z katalogu głównego domeny;
- `CNAME`, `.nojekyll`, `robots.txt`, manifest i sitemap istnieją.

## 11. Plan zmian

1. Utworzyć `data/site.json` jako źródło prawdy dla marki, członków, osiągnięć, kontaktów, profili, wydawnictw i rekomendowanego live video.
2. Dodać lekki generator statycznej treści z markerami, tak aby SEO nie zależało od JavaScript i aby PL/EN były renderowane z tych samych danych.
3. Poprawić nieaktualne zapowiedzi `Diamentów` w Aktualnościach PL/EN.
4. Przebudować hero strony głównej: jasne pozycjonowanie, CTA muzyka/koncerty, trzy dowody wiarygodności.
5. Dodać lekkie główne live video, osiągnięcia, skrót historii, skład i profesjonalne CTA bookingowe.
6. Przebudować Muzykę w chronologiczną dyskografię z trzema rekomendowanymi utworami i lekkimi odtwarzaczami YouTube.
7. Przebudować O nas w krótką historię i spójne profile pięciu osób.
8. Przebudować Press PL/EN w internetowy EPK z quick facts, biografiami, osiągnięciami, muzyką, live video, materiałami i kontaktami.
9. Rozszerzyć dane koncertowe o opcjonalne pola bez dopowiadania brakujących faktów; zachować `data/shows.json` jako jedyne źródło.
10. Uporządkować nawigację, CTA, stopkę, dostępność i event tracking.
11. Dodać testy spójności danych, lekkiego wideo, nowych sekcji, linków wewnętrznych i punktów responsywnych.
12. Zbudować minifikowane zasoby, uruchomić pełny zestaw testów i Lighthouse, a wyniki i braki zapisać w dokumentacji końcowej.

## 12. Granice bezpiecznej implementacji

- Nie będą dopisywane niepotwierdzone daty starszych singli, godziny koncertów, ceny ani linki biletowe.
- Gotowe pliki PDF nie będą automatycznie edytowane bez źródła.
- DNS, Cloudflare i ustawienia GitHub Pages nie będą zmieniane z repozytorium.
- Oryginalne zdjęcia pozostaną źródłem roboczym, ale HTML będzie korzystał wyłącznie z wariantów zoptymalizowanych.
- Nie będzie migracji do frameworka ani dodawania zależności frontendowych.
