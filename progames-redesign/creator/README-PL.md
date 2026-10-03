# PRO GAMES CREATOR — prototyp 01

Gotowy, odizolowany konfigurator jednego modelu Double Strike (Boxer / Kicker), odtworzonego z dziewięciu dostarczonych widoków. Nie zmienia kart produktów, istniejącego konfiguratora, menu ani formularza obecnej strony.

## Uruchomienie i wgranie

Paczka zawiera pełną stronę v25 oraz dodany folder `progames/creator/`. Żaden istniejący plik strony v25 nie został zmieniony. Do istniejącego wdrożenia v25 wystarczy skopiować folder `creator` do katalogu głównego strony, obok `index.html` i `assets`.

Otwórz `https://TWOJA-DOMENA/creator/` i kliknij **START CREATING**. Można użyć też `/creator/index.html`. Podstrona nie jest dodana do menu ani mapy strony; ma `noindex,nofollow`. Nie została opublikowana na żywo w ramach tej pracy. Brak linku w menu nie stanowi zabezpieczenia dostępu.

Do korzystania z konfiguratora nie trzeba instalować Blendera, Node.js ani Three.js. Wszystkie zasoby potrzebne przeglądarce są lokalne. Podstrona musi być serwowana przez HTTP(S), tak jak pozostała strona; otwieranie przez `file://` nie obsługuje poprawnie modułów i GLB. Zapis ID przez Web Crypto wymaga HTTPS lub localhost. Ewentualny podgląd lokalny dla programisty: `python3 -m http.server 8000 --directory progames`, następnie `http://localhost:8000/creator/`.

## Co działa

- Obrót 360°, widoki przód / tył / bok, zoom i reset kamery.
- Sześć kolorów: niebieski, czarny, biały, czerwony, pomarańczowy, żółty. Zakres zaczerpnięty z istniejących danych produktu Double Strike 2; odwzorowanie odcienia na ekranie jest orientacyjne.
- Pięć osobnych modułów: card reader, ticket dispenser, banknote acceptor, additional coin slot, capsule dispenser.
- Osobny PNG/JPG/SVG na przodzie oraz każdym boku. Przesunięcie w dwóch osiach, skala, obrót, reset położenia, usunięcie i podmiana.
- Włączenie / wyłączenie fabrycznych naklejek i LED-ów. Ekran pozostaje osobnym obiektem.
- Podgląd na cały ekran bez panelu; Escape zamyka ten widok.
- Reset całego projektu po potwierdzeniu.
- Automatyczny zapis lokalny i odtworzenie po odświeżeniu, o ile przeglądarka pozwala na localStorage i wystarcza miejsca.
- Eksport JSON z grafikami osadzonymi w pliku oraz ponowny import. Import jest walidowany przed zastąpieniem bieżącego projektu.
- Stabilny ID powiązany z zawartością konfiguracji: `PGC-DS-` + 20 znaków skrótu SHA-256. Ta sama konfiguracja daje ten sam ID; zmiana grafiki, koloru, wyposażenia lub transformacji zmienia ID. Nie jest to rejestr globalnych zamówień ani identyfikator nadany przez serwer.
- Eksport PNG aktualnego widoku z ID konfiguracji.
- Przycisk zapytania otwiera podsumowanie i przygotowuje e-mail do `office@progames.pl`. JSON i PNG należy pobrać i ręcznie dołączyć do wiadomości. Nic nie jest wysyłane automatycznie, nie ma produkcyjnego CRM.

Na telefonie strona domyślnie przewija się normalnie. Przycisk **Enable touch rotation** aktywuje obrót palcem i pinch zoom. **Allow page scrolling** przywraca przewijanie strony. Dzięki temu scena nie przechwytuje wszystkich gestów podczas czytania konfiguratora.

Grafiki są przetwarzane lokalnie. Maksymalny plik uploadu: 8 MB; do tekstury jest sprowadzany do maksymalnie 1024 px. SVG obsługuje bezpieczny, samodzielny podzbiór elementów. Skrypty, zasoby zewnętrzne i nieobsługiwane konstrukcje są odrzucane; w takich przypadkach należy wyeksportować logo do PNG.

## Model — zakres i uczciwe ograniczenia

To działający model geometryczny 3D, a nie obracane zdjęcie. Jest jednak **uproszczoną rekonstrukcją referencyjną, nie zatwierdzonym modelem produkcyjnym ani CAD**. Materiały dostarczone w zadaniu mają niespójne detale nadruków, zapisów i perspektywy. Nie da się z nich potwierdzić dokładności wymiarowej ani ukrytych podzespołów.

Nie otrzymano zweryfikowanych wymiarów dla tej konkretnej referencji. Przyjęto roboczą skalę metrów i proporcje widoczne na ujęciach; wysokość modelu to około 2,17 m. W istniejących danych strony model Double Strike 2 ma osobne wymiary katalogowe, ale nie zostały automatycznie uznane za pomiar załączonej maszyny. Model nie służy do projektowania produkcyjnego ani sprawdzania szerokości drzwi.

Odtworzono: szeroki podest, dolną wnękę z piłką, wąski środkowy korpus, szeroką zaokrągloną górę, zawieszenie worka, ekran, panel monety, naklejki, tylne drzwi, wentylację, gniazdo i LED-y. Pominięto drobne śruby i wewnętrzne mechanizmy. Skóra worka, piłka, listwy i przetłoczenia są uproszczone; model nie jest fotorealistycznym skanem. Fragmenty fabrycznych grafik pochodzą ze zdjęć, więc zawierają część ich oświetlenia.

**Opcjonalne moduły są schematyczne, a ich pozycje montażowe orientacyjne.** Referencje nie pokazują zamontowanego czytnika kart, dodatkowego akceptora banknotów, ticket/capsule dispensera. Funkcja pojawiania / znikania działa, ale wygląd, miejsce montażu i zgodność z tym modelem wymagają potwierdzenia producenta. To ograniczenie jest widoczne także w interfejsie.

Przed produkcyjnym wdrożeniem: potwierdzić H × W × D, rozmieszczenie dodatkowego wyposażenia, dokładne wykrojniki UV do druku oraz porównać prototyp z rzeczywistą maszyną. Nie dodawano kolejnych modeli.

## Pliki

| Plik / folder | Zawartość |
|---|---|
| `index.html`, `creator.css`, `app.js` | Gotowa podstrona i zbudowany kod runtime |
| `assets/double-strike.glb` | Finalny modularny model z osadzonymi teksturami |
| `assets/poster.webp` | Lekki obraz referencyjny przed uruchomieniem 3D |
| `source/model.js` | Parametryczne źródło modelu Three.js |
| `source/export.html` | Przeglądarkowy generator GLB z przyciskiem pobrania |
| `source/app.js` | Czytelny kod konfiguratora, uploadu, transformacji, zapisu, PNG i ID |
| `textures/` | Osobne tekstury wykorzystane do budowy modelu |
| `vendor/` | Lokalna kopia potrzebnych modułów Three.js 0.180.0 i licencja MIT |
| `docs/model-manifest.json` | Pełna lista nazw obiektów, materiałów i liczba trójkątów |
| `docs/ARCHITECTURE.md` | Moduły, powierzchnie brandingu i API przyszłej integracji |
| `docs/REFERENCE-REVIEW.md` | Analiza widoków i porównanie geometrii |
| `docs/test-results.json`, `docs/performance.json` | Wyniki testów i pomiarów |
| `docs/references/` | Lekkie kopie dostarczonych referencji, opisane kierunkami |

Wszystkie zależności przeglądarkowe są w paczce. `app.js` to gotowy bundle, nie wymaga budowania przy wdrożeniu. `source/model.js` można zmieniać i eksportować przez `source/export.html` bez Blendera. Odtworzenie bundla po zmianach kodu przez programistę: `npx esbuild@0.25.10 creator/source/app.js --bundle --minify --format=esm --outfile=creator/app.js` uruchomione z katalogu strony. Instalacja nie jest potrzebna do korzystania z gotowej wersji.

## Wydajność i testy

Model: 27 564 trójkąty łącznie z opcjami, około 2,69 MB GLB. Scena domyślna: około 25 352 trójkąty i 48 wywołań rysowania, zamiast 118 przed połączeniem statycznych detali w obrębie logicznych części. Kod runtime: około 612 KB bez kompresji HTTP. Nie użyto Draco/KTX2, aby uniknąć dodatkowych dekoderów; przy tej wielkości geometria pozostaje prosta, a wszystkie tekstury mają maksymalnie 1024 px.

3D pobierane jest dopiero po kliknięciu Start Creating. Strona główna nie pobiera kodu ani modelu. Nie ma stałej pętli renderowania; w teście bezczynności odnotowano 0 dodatkowych klatek. Cienie są przeliczane przy zmianie konfiguracji, a nie przy samym obracaniu kamery. DPR ograniczony do 1,5 dla wąskich ekranów i do 2 dla pozostałych. Nie ma bloom, postprocessingu ani ciągłych animacji.

Sprawdzono Chromium przy szerokościach 320, 390, 768, 1280 i 1920 px oraz emulację dotyku. Testy objęły wszystkie kolory i moduły, upload PNG/JPG/SVG, trzy powierzchnie, transformacje, błędne SVG/JSON, zapis z osadzonymi grafikami, identyczny ID po odtworzeniu, reset, PNG, e-mail bez wysyłania, podgląd pełny, brak poziomego overflow i brak wzrostu liczby tekstur/geometrii po 12 importach.

**Nie potwierdzono jeszcze płynności na fizycznych telefonach ani w Safari/iOS.** W lokalnym headless Chromium z programowym rendererem uruchomienie 3D trwało około 1,37–1,73 s w osobnym pomiarze, a symulowany obrót uzyskał około 8–12 FPS. To zbyt mało, żeby na tej podstawie zadeklarować płynność produkcyjną; wyniki programowego renderera nie przewidują wydajności prawdziwego GPU. Przed wdrożeniem należy wykonać próbę na docelowym telefonie i komputerze. Pełne surowe wyniki są w `docs/performance.json`.
