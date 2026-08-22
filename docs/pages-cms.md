# Pages CMS dla tabularasaband.pl

Repozytorium ma gotowy panel treści oparty na Pages CMS. CMS zapisuje dane w GitHubie, a workflow `CMS Build` automatycznie przebudowuje polskie i angielskie strony HTML.

## Uruchomienie

1. Otwórz [app.pagescms.org](https://app.pagescms.org/) i zaloguj się kontem GitHub.
2. Zainstaluj aplikację Pages CMS dla repozytorium strony.
3. Otwórz repozytorium i gałąź `main`. Konfiguracja zostanie odczytana z `.pages.yml`.
4. Zmień treść i zapisz. Po zapisie workflow `CMS Build` odświeży stronę.
5. Jeśli chcesz wymusić przebudowę, użyj akcji **Przebuduj i sprawdź stronę** w panelu.

## Co można edytować

- stronę główną i promowany singiel,
- aktualności PL/EN wraz ze zdjęciem, CTA i opcjonalnym filmem YouTube,
- członków zespołu i historię,
- Spotify oraz listę teledysków,
- koncerty, lokalizacje i linki do biletów,
- opis prasowy, skład i osiągnięcia,
- press pack, rider oraz linki do materiałów prasowych,
- wszystkie dane kontaktowe i komunikat sklepu,
- profile społecznościowe,
- endpointy Formspree i MailerLite oraz identyfikator Google Tag Manager,
- zdjęcia galerii, aktualności, członków zespołu i pliki PDF.

Koncerty nadal mogą trafiać automatycznie z Google Calendar. Ręczna edycja w CMS działa na tym samym pliku `data/shows.json`; synchronizacja kalendarza uzupełnia listę, zamiast ją zastępować.

## Bandsintown i koncerty na Spotify

Spotify pobiera wydarzenia od partnerów biletowych oraz z Bandsintown. Najpewniejszy przepływ dla zespołu to:

1. przejąć lub utworzyć profil Tabula Rasa w Bandsintown for Artists,
2. dodać do niego adres profilu artysty Spotify,
3. publikować kompletne wydarzenia w Bandsintown,
4. pobierać wydarzenia z Bandsintown do `data/shows.json` i renderować je na stronie.

Publiczne API Bandsintown służy do odczytu i wyświetlania wydarzeń, nie do ich tworzenia. Dlatego w pełni automatyczny zapis `Pages CMS → Bandsintown → Spotify` wymagałby indywidualnego dostępu partnerskiego. Bez niego są dwie bezpieczne opcje:

- **zalecana:** Bandsintown jest źródłem koncertów, a strona synchronizuje je przez API;
- **alternatywna:** Pages CMS pozostaje źródłem, a generator przygotowuje plik do ręcznego importu wydarzeń w Bandsintown.

Klucz API Bandsintown powinien trafić do GitHub Secrets, nie do danych Pages CMS ani publicznego repozytorium. Po publikacji lub zmianie wydarzenia trzeba uwzględnić opóźnienie dystrybucji do Spotify.

## Publikacja zdjęć

Po dodaniu zdjęć do galerii uruchom w bibliotece mediów akcję **Optymalizuj i przebuduj galerię**. Workflow utworzy warianty responsywne i przebuduje galerię. Zdjęcie główne aktualności oraz tekst alternatywny należy ustawić w formularzu artykułu.

## Zalecany sposób pracy

- Najpierw zapisz wersję polską i angielską w jednym wpisie. Dzięki temu nie powstają niesparowane treści.
- Nie zmieniaj `slug` opublikowanej aktualności bez potrzeby — jest częścią linku.
- Dla filmu YouTube wklejaj samo ID, nie pełny adres.
- Po większej zmianie sprawdź wynik workflow w GitHub Actions. Nieudana walidacja nie nadpisze wygenerowanej strony.

## Integracje i funkcje warte kolejnych etapów

Najwięcej wartości dadzą, w tej kolejności:

1. **Automatyczne cross-postowanie aktualności** do Facebooka, Instagrama i newslettera po zaznaczeniu pola „gotowe do promocji”. Najbezpieczniej zrobić to przez Make lub n8n, z etapem zatwierdzenia przed publikacją.
2. **Baza kontaktów bookingowych** w Airtable lub Notion: kluby, festiwale, status rozmowy, właściciel kontaktu, termin follow-upu i historia ofert. To powinno pozostać poza publicznym repozytorium.
3. **Formularz bookingowy** z ustrukturyzowanymi polami (data, miasto, venue, budżet, technika), który tworzy rekord w bazie i wydarzenie lub zadanie follow-up.
4. **Analityka konwersji** w GTM/GA4: kliknięcia w bilety, odsłuch, press pack, rider, booking i zapis do newslettera. Obecny GTM daje dobry punkt startu.
5. **Podgląd przed publikacją** na osobnej gałęzi i tymczasowym adresie. Przy częstszych zmianach treści warto przejść z bezpośrednich commitów na pull requesty.
6. **Automatyczne wygaszanie koncertów** i osobne archiwum wydarzeń. Dane już mają daty, więc jest to mały kolejny krok.
7. **Generator EPK**: press pack PDF tworzony z tych samych danych co strona (bio, skład, osiągnięcia, kontakty), aby strona i PDF nigdy się nie rozjeżdżały.
8. **Monitoring błędów i dostępności** po publikacji, np. Sentry dla JavaScriptu oraz cykliczny Lighthouse/Playwright w GitHub Actions.

Nie należy przechowywać w Pages CMS sekretów, prywatnych kalendarzy ani danych mailingowych. CMS zapisuje pliki bezpośrednio w repozytorium, więc adres iCal, klucze API i tokeny muszą zostać w GitHub Secrets.
