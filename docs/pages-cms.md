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

Koncert dodany w sekcji **Koncerty** Pages CMS automatycznie aktualizuje stronę. Formularz zawiera także pola zgodne z oficjalnym importem Bandsintown: miejsce, miasto, kraj, strefę czasową, godzinę, bilety, lineup, opis i grafikę.

Przy nowym wydarzeniu opcja **Przygotuj do publikacji w Bandsintown i Spotify** jest domyślnie włączona. Po zapisaniu workflow:

1. publikuje koncert na stronie,
2. sprawdza obowiązkowe dane Bandsintown,
3. generuje w głównym katalogu repozytorium plik `bandsintown-events.csv` zgodny z aktualnym szablonem Bulk Upload.

Plik należy przesłać w **Bandsintown for Artists → Events → Bulk Upload**. Po udanym imporcie trzeba wyłączyć przy wydarzeniu opcję eksportu, aby kolejny plik nie zawierał go ponownie. Bandsintown przekazuje opublikowane wydarzenia do połączonego profilu Spotify; aktualizacja może potrwać do 48 godzin.

Publiczne API Bandsintown pozwala pobierać wydarzenia, ale nie udostępnia operacji tworzenia. Całkowicie bezobsługowy zapis z Pages CMS do Bandsintown będzie możliwy dopiero po otrzymaniu od Bandsintown partnerskiego dostępu do zapisu. Nie należy automatyzować logowania do panelu ani przechowywać hasła lub sesji Bandsintown w repozytorium.

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
