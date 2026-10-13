# ProGames v43: pozycjonowanie wersji polskiej

## Co się zmieniło

**10 nowych polskich stron** (ten sam wygląd i CSS co istniejące strony redakcyjne v42):

| Adres | Główne frazy |
|---|---|
| /pl/automaty-bokserskie.html | automaty bokserskie, bokser, siłomierz, automat bokserski na monety, cena |
| /pl/automaty-rozrywkowe.html | automaty rozrywkowe, młot, kopacz, cymbergaj, automat do koszykówki |
| /pl/producent-automatow-bokserskich.html | producent automatów bokserskich, polski producent |
| /pl/sprzedaz-hurtowa-i-dystrybucja.html | automaty bokserskie hurtowo, dystrybucja |
| /pl/poradniki/ | poradniki |
| /pl/poradniki/co-to-jest-automat-bokserski.html | co to jest automat bokserski, siłomierz |
| /pl/poradniki/jak-wybrac-automat-bokserski.html | jak wybrać automat bokserski |
| /pl/poradniki/ile-kosztuje-automat-bokserski.html | ile kosztuje automat bokserski, cena boksera |
| /pl/poradniki/automat-bokserski-do-baru.html | automat bokserski do baru / pubu / klubu |
| /pl/poradniki/montaz-i-serwis-automatu-bokserskiego.html | serwis, części, montaż |

Treści są oparte wyłącznie na informacjach z obecnej strony i katalogu. Nie ma w nich wymyślonych cen, parametrów, prognoz zarobków ani opinii.

**Istniejące strony PL (ok. 47 plików):** linki „Boxing machines (EN)”, „Poradniki (angielski)”, „O ProGames (angielski)” prowadzą teraz do polskich stron. Polskie są też okruszki nawigacji w danych strukturalnych. Wygląd się nie zmienił, zmieniły się tylko adresy i podpisy linków.

**Tytuły i opisy PL:** strona główna PL („Automaty bokserskie i rozrywkowe – producent z Polski”), Boxer Standard i opisy wszystkich 46 kart produktów (fraza „od polskiego producenta”, „zapytaj o cenę”).

**hreflang:** polskie strony i ich angielskie odpowiedniki wskazują siebie nawzajem (en / pl / x-default). Sitemap ma 263 adresy.

**progames.pl → wersja polska** (vercel.json):
- progames.pl i www.progames.pl → /pl/
- stare adresy z progames.pl (np. /boxer-combat, /double-hit) → polskie karty produktów zamiast angielskich
- /air-hockey → /pl/automaty-rozrywkowe.html#cymbergaj, /basketball → #koszykowka

**Bez zmian:** style, skrypty, formularz kontaktowy (api/contact.js, contact.js), adresy e-mail (office@ i service@progames.pl) i rekordy DNS/poczty.

**Build:** nowy krok `build/seo-pl-v43.cjs` jest dopisany na końcu `npm run build`. Nie wymaga dodatkowych pakietów i można go uruchamiać wielokrotnie. Kolejne przebudowy nie skasują zmian. Treść stron PL jest w `build/content-pl-v43.cjs`.

## Wdrożenie (kolejność ma znaczenie)

1. **GitHub:** podmień pliki w repozytorium na zawartość tej paczki i zrób commit. Vercel opublikuje stronę sam.
2. **Vercel → Project → Settings → Domains:** sprawdź `progames.pl` i `www.progames.pl`.
   - Jeśli przy domenie jest ustawione **„Redirect to www.progamespoland.com”**, zmień to na **„Connect to an environment → Production”** (bez przekierowania). Przekierowanie na poziomie domeny działa przed `vercel.json` i zawsze kieruje na stronę angielską. Dopiero po tej zmianie zadziała nowa reguła → /pl/.
   - Jeśli domeny progames.pl w ogóle nie ma w projekcie Vercel, bo przekierowanie robi Wix („przekierowanie domeny”), zmień w Wix cel przekierowania na `https://www.progamespoland.com/pl/`.
   - **Nie zmieniaj w Wix rekordów MX ani innych rekordów pocztowych.** Poczta office@progames.pl działa niezależnie od strony.
3. **Test po publikacji:** wejdź na `progames.pl` i `progames.pl/boxer-combat`. Oba adresy powinny otworzyć wersję polską. Wyślij też jedno zapytanie testowe z formularza i sprawdź, czy przyszło na office@progames.pl.
4. **Google Search Console:** zgłoś ponownie `https://www.progamespoland.com/sitemap.xml`. W „Sprawdzanie adresu URL” poproś o indeksowanie `/pl/`, `/pl/automaty-bokserskie.html` i `/pl/poradniki/`.
5. **Profil Firmy w Google** (Jastrzębie-Zdrój): ustaw adres strony na `https://www.progamespoland.com/pl/`. Na polskim Facebooku i Instagramie też linkuj do `/pl/`.

## Kontrola

Kontrola w Pythonie, odpowiadająca testom `check-seo`, `check-i18n` i `check-v42`, przeszła bez błędów: 263 strony, 6281 linków wewnętrznych, 803 obiekty JSON-LD, 2033 obrazy z wymiarami, unikalne tytuły i opisy, wzajemne hreflang, poprawna sitemapa i symulacja przekierowań (bez łańcuchów). Testy w `verification/` zostały dostosowane do nowych stron. W środowisku przygotowania nie można było zainstalować pakietów npm, dlatego testy node trzeba uruchomić u siebie: `npm ci && npm run test:seo && npm run test:i18n`.

Strony sprawdzono wizualnie w Chromium (desktop 1280 px i telefon 390 px): brak przewijania w poziomie i brak błędów w konsoli.

Efekty w Google pojawiają się zwykle po kilku tygodniach od ponownego zaindeksowania. Najwięcej pomogą teraz polskie linki zewnętrzne: katalogi firm, portale branżowe, klienci i Profil Firmy w Google.
