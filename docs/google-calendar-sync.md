# Automatyczne koncerty z Google Calendar

Strona ma gotowy generator koncertow. Workflow `Calendar Sync` pobiera wydarzenia z Google Calendar co 6 godzin, dopisuje je do obecnej listy w `data/shows.json`, przebudowuje `shows.html`, `shows-en.html`, `index.html` i `index-en.html`, a potem commitnie zmiany na `main`.

Wazne: kalendarz nie zastapuje calej listy. Koncerty, ktore juz sa na stronie, zostaja zachowane nawet wtedy, kiedy nie ma ich w Google Calendar.

## Konfiguracja w Google Calendar

1. Utworz osobny kalendarz, np. `Tabula Rasa - koncerty`.
2. Wejdz w ustawienia tego kalendarza.
3. W sekcji integracji skopiuj adres iCal:
   - najlepiej `Secret address in iCal format`, jesli kalendarz ma zostac prywatny,
   - albo publiczny adres iCal, jesli kalendarz jest publiczny.
4. W repozytorium GitHub wejdz w `Settings > Secrets and variables > Actions`.
5. Dodaj `New repository secret`:
   - nazwa: `GOOGLE_CALENDAR_ICS_URL`
   - wartosc: skopiowany adres iCal.

Po zapisaniu sekretu mozesz wejsc w `Actions > Calendar Sync > Run workflow`, zeby wymusic pierwsza synchronizacje od razu.

## Reczna synchronizacja w GitHub Actions

1. Wejdz w repozytorium na GitHubie.
2. Kliknij zakladke `Actions`.
3. Po lewej wybierz workflow `Calendar Sync`.
4. Kliknij `Run workflow`.
5. Zostaw branch `main` i potwierdz zielonym przyciskiem `Run workflow`.
6. Po chwili workflow zrobi commit `Sync shows from calendar`, jesli kalendarz doda cos nowego.

Jesli workflow nie jest widoczny, najpierw commitnij i wypchnij plik `.github/workflows/calendar-sync.yml` na `main`.

## Jak wpisywac koncerty

Generator czyta dane z wydarzenia tak:

- tytul wydarzenia trafia na strone jako nazwa koncertu, np. `Hydrozagadka | Warszawa`,
- data wydarzenia trafia na strone jako data koncertu,
- lokalizacja trafia do danych SEO `MusicEvent`,
- pierwszy link `https://...` z opisu wydarzenia staje sie przyciskiem `Wiecej` / `More`,
- wydarzenia oznaczone jako anulowane sa pomijane.

Jesli wydarzenie zostanie usuniete z Google Calendar, nie znika automatycznie ze strony. Zeby usunac koncert ze strony, trzeba usunac go z `data/shows.json` albo z wygenerowanej listy przy kolejnej recznej edycji danych.

Na stronie glownej pokazuja sie 3 najblizsze nadchodzace koncerty. Na podstronie koncertow pokazuja sie wszystkie wydarzenia z kalendarza, posortowane po dacie.

## Uruchomienie lokalne

W PowerShell:

```powershell
$env:GOOGLE_CALENDAR_ICS_URL="TU_WKLEJ_ADRES_ICAL"
npm run sync:shows
```

Jesli chcesz tylko przebudowac HTML z obecnego `data/shows.json`:

```powershell
npm run sync:shows:render
```
