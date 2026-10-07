# PRO GAMES CREATOR — Studio v41

Zaktualizowana kompletna strona z konfiguratorem Double Strike. Gotowy bundle znajduje się w `creator/dist/`; do podglądu nie trzeba kompilować kodu.

## Podgląd

W katalogu `progames` uruchom:

```sh
python -m http.server 8000
```

Otwórz `http://localhost:8000/pl/creator/` (PL) lub `http://localhost:8000/creator/` (EN). Nie otwieraj HTML bezpośrednio przez `file://` — moduły i model wymagają serwera HTTP. Lokalny serwer Pythona nie obsługuje wysyłki formularza ani reguł przekierowań Vercel.

## Co zmieniono

- Interfejs studia: większy podgląd, jasna neutralna scena, spokojny zielony akcent, uporządkowana konfiguracja, responsywny układ i widoczne stany wyboru.
- Rzeczywisty obrotowy model 3D, a nie płaski render: edytowalne źródło Three.js i skompresowany GLB `creator/models/double-strike-studio.glb`.
- Lakier z clearcoat, osobne materiały metalu, skóry i gumy; studyjne softboksy generujące odbicia, mapy mikrostruktury skóry, mapowanie tonalne ACES i cienie.
- Szwy gruszki, fałdy szyjki, sferyczne łatki piłki, bieżnik podestu, śruby, zawiasy, uszczelka drzwi, wnęka kickera, soczewki LED i segmentowane paski.
- Tekstury naklejek wyodrębnione z dostarczonych rzutów. Panel wyników korzysta ze zbliżenia bez gruszki zasłaniającej grafikę. Oryginalna stara tekstura zawierała sfotografowaną gruszkę.
- Dziesięć edytowalnych stref grafiki, w tym dwa dolne boki. Nowe strefy są uwzględnione w walidacji zapytania ofertowego.
- Wybór banknotów i biletów pokazuje odpowiednie elementy modelu. Pozostałe wyposażenie jest zapisywane w konfiguracji i zapytaniu; nie jest pełną dokumentacją jego montażu.
- Przełącznik „Studio 3D / Wzorzec”. Wzorzec jest nieruchomą ilustracją z załączników, a nie podglądem wybranej konfiguracji.
- Zachowano zmianę koloru i LED, upload i ustawianie grafiki, zapis PNG, import/eksport JSON, lokalne zapisywanie stanu, link konfiguracji i formularz zapytania.
- Zachowano pozostałą stronę i pięć wersji językowych.

## Zakres odwzorowania

Model odtworzono z obrazów, bez CAD, pomiarów i produkcyjnych plików naklejek. Proporcje i detale są przybliżeniem wizualnym. Tekstury z referencji mają wbudowane światło i perspektywę; nie są płaskimi plikami produkcyjnymi. Model nie stanowi zatwierdzonego projektu technicznego ani skanu fotogrametrycznego. Do finalnej zgodności 1:1 potrzebne są wymiary i oryginalne grafiki producenta.

## Edycja i kompilacja

```sh
npm ci
npm run build:creator-model
npm run build:creator
npm run test:creator
```

`build:creator-model` eksportuje źródłową geometrię i kompresuje GLB przez Meshopt. `build:creator` generuje dokumenty językowe oraz bundle. Po samych zmianach JSX można uruchomić `node build/creator-bundle.cjs`. Kolory, strefy i wyposażenie są w `creator/products/doubleStrike.js`; model w `creator/src/model.js`; światło i mikrostruktury w `creator/src/materials.js`.

## Wdrożenie

Paczka zawiera kompletne pliki strony i gotowy bundle. Zawartość katalogu `progames/` zastępuje pliki istniejącego projektu. Konfiguracja `vercel.json` i istniejące przekierowania domen pozostają zachowane. Zmienne formularza to dotychczasowe `RESEND_API_KEY` i `CONTACT_FROM`; zapytania kierowane są do dotychczasowego odbiorcy. Nie publikowano strony i nie wysyłano rzeczywistych wiadomości.

## Weryfikacja tej wersji

Wykonano kompilację GLB i bundla oraz testy: walidacja konfiguracji i plików, localStorage z symulacją, eksport metadanych, kontrakt nazw i UV modelu, materiały, pięć dokumentów językowych, izolacja strony głównej, trasy i formularz API z symulowanym dostawcą poczty. Składnia CSS przeszła parser.

Test przeglądarkowy nie został ukończony: Chromium nie uruchamiał się w środowisku wykonawczym, a przeglądarka zdalna blokowała lokalny adres. Z tego powodu nie potwierdzono wizualnie wyglądu ani działania mobilnego/WebGL, pobierania PNG i gestów kamery w tej sesji. Test `npm run test:creator:browser` jest dołączony do uruchomienia w środowisku z Chromium (`npx playwright install chromium`); opcjonalnie obsługuje `CHROMIUM_PATH`.
