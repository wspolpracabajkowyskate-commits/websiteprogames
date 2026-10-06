# PRO GAMES CREATOR — wersja 40

Zintegrowana implementacja w istniejącej stronie statycznej. Gotowe pliki `creator/dist/` są w paczce; nie trzeba przenosić witryny do nowego frameworka.

## Stan dostawy

Zaimplementowane: rzeczywista scena Three.js + React Three Fiber, GLB skompresowany Meshopt, osiem niezależnych stref UV, lakier obudowy, pięć wyglądów LED, wybór wyposażenia, edytor naklejek, pięć języków, kamery i OrbitControls, ekran ładowania, fallback, eksport PNG i JSON, import JSON, localStorage, link konfiguracji i formularz korzystający z istniejącego `/api/contact` / Resend.

**To jest implementacja z modelem demonstracyjnym, nie finalny fotorealistyczny asset ani zatwierdzona produkcyjnie konfiguracja.** Konstrukcja opiera się na dostarczonych dziewięciu referencjach. Wymiary są przybliżone; nie dostarczono CAD ani dokumentacji wymiarowej. Nie wdrożono do Vercel i nie wysłano rzeczywistych wiadomości.

## Uruchomienie i wdrożenie

- `npm ci`
- `npm run build` — istniejący generator pięciu języków, następnie integracja i bundle Creatora.
- `npm run build:creator` — wyłącznie Creator oraz aktualizacja pozycji menu.
- `npm run build:creator-model` — ponowne wygenerowanie demonstracyjnego GLB z geometrii źródłowej i kompresja.
- `python -m http.server 8000` — podgląd statyczny pod `http://localhost:8000/creator/` lub `/pl/creator/`. Prosty serwer Pythona nie wykonuje API i reguł Vercel.
- Vercel: zastosować zawartość katalogu `progames/` do istniejącego projektu. Obecne ustawienie `buildCommand: ""` zachowano: paczka zawiera gotowy bundle. Jeżeli kod będzie zmieniany, należy wykonać build lokalnie przed publikacją.
- Formularz wykorzystuje dotychczasowe zmienne `RESEND_API_KEY` oraz `CONTACT_FROM` i odbiorcę `office@progames.pl`. Brak konfiguracji zwraca błąd, nie pozorny sukces.
- Środowisko preview Vercel nie figuruje automatycznie na liście dozwolonych originów API. W testach użyć symulacji; dopuszczać wyłącznie konkretny kontrolowany origin, nigdy wildcard.

Trasy: `/creator`, `/pl/creator`, `/es/creator`, `/de/creator`, `/fr/creator`. Linki konfiguracji: `/creator/config/<UUID>#c=<stan>`, również z prefiksem języka. Vercel przepisuje je na odpowiedni dokument HTML. Stan zapisano w fragmencie URL, nie w bazie.

**Zachowane przekierowanie domen:** dostarczony `vercel.json` przekierowuje `progames.pl` i `www.progames.pl` na `www.progamespoland.com`. Nie zostało zmienione.

## Utworzone pliki i odpowiedzialności

| Plik / katalog | Zawartość |
| --- | --- |
| `creator/src/App.jsx` | Panel, formularz, upload, import/eksport, podsumowanie |
| `creator/src/Viewer.jsx` | React Three Fiber, kamera, światło studyjne, loader GLB, screenshot, materiałowe strefy |
| `creator/src/model.js` | Źródło demonstracyjnej geometrii |
| `creator/src/textures.js` | Kompozycja tekstur UV, fit/fill, skala, pozycja i obrót |
| `creator/src/state.js` | Niezależny stan, walidacja, localStorage, dane przenośne |
| `creator/src/i18n.js` | Klucze UI w EN, PL, ES, DE, FR |
| `creator/src/entry.jsx` | Uruchomienie React wyłącznie na stronie Creatora |
| `creator/products/doubleStrike.js` | Rejestr produktów, materiały, strefy, kolory, presety, opcje |
| `creator/models/double-strike-demo.glb` | Wymienialny model demonstracyjny, Meshopt |
| `creator/textures/score.png` | Wycięty panel graficzny z dostarczonej referencji |
| `creator/textures/reference.webp` | Statyczne zdjęcie referencyjne używane tylko w fallbacku / wyborze produktu |
| `creator/dist/` | Gotowe lokalne moduły; Three/R3F w osobnym lazy chunku |
| `creator/creator.css` | Izolowane style konfiguratora |
| `creator/index.html`, `{pl,es,de,fr}/creator/index.html` | Pięć wersji z istniejącym nagłówkiem, menu i stopką |
| `build/creator.cjs`, `build/creator-bundle.cjs` | Integracja i bundlowanie |
| `build/creator-model.mjs`, `build/creator-optimize.mjs` | Eksport i kompresja modelu |
| `verification/test-creator.cjs` | Testy stanu, geometrii, kontraktu GLB, tras i API |
| `verification/test-creator-browser.cjs` | Testy do uruchomienia w środowisku z działającym Chromium |
| `CREATOR-CHANGES.json` | Dokładny wykaz plików dodanych i zmienionych względem wejściowego ZIP |

Zmodyfikowane: `api/contact.js` (walidacja i treść `creatorConfiguration`), `package.json` i lockfile, `vercel.json`, szablony `build/templates/*.html`, wygenerowane strony (link PRO GAMES CREATOR w obu menu). Pełny build regeneruje także dotychczasowe pliki danych/SEO zgodnie z oryginalnymi skryptami. Nie zastąpiono strony głównej ani formularza kontaktowego.

## Podmiana profesjonalnego GLB

1. Zapisz finalny asset jako `creator/models/double-strike.glb`.
2. W definicji produktu zmień `modelPath` na `/creator/models/double-strike.glb`.
3. Zachowaj kontrakt nazw stref z `decalZones[].mesh` (np. `decal_top_front`, `decal_right_side`). Każda strefa musi być meshem z UV i własnym materiałem. Loader klonuje materiały naklejek, aby deduplikacja GLB nie sprzęgała edycji stref.
4. Lakier nazwij `BODY_PAINT` lub zaktualizuj `colorMaterials`. LED analogicznie przez `ledZones`. Mesh po nazwie, nie indeksie.
5. Przód +Z, góra +Y, podstawa Y=0; wymiary demo około 1,3 × 2,55 × 1,1 jednostki. Przy zmianie skali dostosuj kamery i pozycje hotspotów. Render nie automatycznie normalizuje dowolnego obcego pliku.
6. Mapy kolorów i napisów muszą mieć poprawne UV 0–1. `top_front` jest rzeczywiście zakrzywioną powierzchnią. Materiały `screen_main` / `screen_record` mają niezależne cyfry demonstracyjne; w finalnym modelu należy dopasować je do rzeczywistych ekranów.
7. Obsługiwany zwykły GLB i Meshopt. Draco wymaga dodatkowego loadera i lokalnych dekoderów; nie jest skonfigurowany. KTX2 również nie jest skonfigurowany, ponieważ dostarczone tekstury są niewielkie.
8. Zaktualizuj oznaczenie modelu demonstracyjnego dopiero po akceptacji finalnego assetu. Wykonaj build i testy wizualne.

## Dodawanie produktu

Dodaj definicję w `creator/products/`, wpisz ją do eksportowanej tablicy `products` i ustaw: `id`, `name`, `category`, `previewPath`, `modelPath`, `cameraPosition`, `configurableMeshes`, `colorMaterials`, `decalZones`, `ledZones`, `availableOptions`, `optionMeshes`, `defaultConfiguration`.

Panel, stan i viewer wybierają produkt z rejestru. Zmiana modelu czyści ustawienia i nadaje nowy identyfikator. Serwer musi dostać odpowiadającą definicję walidacji: `api/contact.js` celowo dopuszcza obecnie tylko `double-strike` i jego osiem stref. Dodając produkt rozszerz ten whitelist, jego testy i klucze językowe; nie usuwaj walidacji. Kamery front/left/right/back mają wspólne pozycje dla obecnej skali — produkty o innych gabarytach wymagają dostosowania tej części definicji sceny.

Opcję wyposażenia można połączyć z geometrią przez `optionMeshes: { wifi: ['wifi_module'] }`; wybrane opcje sterują widocznością nazwanych meshów. W obecnym modelu opcje są pozycjami zamówienia i nie zmieniają konstrukcji.

## Dodawanie strefy, koloru i presetu

- Strefa: dodaj mesh z UV do GLB i rekord `decalZones` (`id`, `mesh`, `position`, `rotation`, `size`, `camera`, opcjonalnie `factoryTexture`). Dopisz klucz tłumaczeń, whitelist API i test kontraktu. `position` służy hotspotowi i generatorowi demo; finalną powierzchnię naklejki dostarcza GLB.
- Kolor: dodaj kod HEX do `colors`. Zmieniane są tylko materiały o nazwach z `colorMaterials`, nigdy worek, piłka, metal, ekrany czy wydruki.
- Preset: dodaj nazwę do `presets`, sposób generowania tekstur / mapowanie plików w `textures.js` i whitelist API. Obecne kolekcje Original / Minimal / Sport / Neon / Custom Branding są demonstracyjne. Poza panelem wyników nie są reprodukcją fabrycznych wydruków.
- Fabryczny wydruk strefy: ustaw `factoryTexture` na lokalny obraz lub rozbuduj mapowanie presetów per strefa. Nie jest potrzebny zewnętrzny CDN ani panel administratora.

## Jak działają własne grafiki

PNG/JPG/WebP do 5 MB. Przeglądarka dekoduje obraz, odrzuca uszkodzone pliki, redukuje dłuższy bok do 1024 px, koduje WebP i kontroluje rozmiar wyniku. SVG nie jest obsługiwany. Obraz jest kompozytowany na canvasie o proporcjach strefy, a tekstura nakładana na jej mesh poprzez UV. Pozycja, skala, obrót i fit/fill działają wewnątrz granic tekstury. Nie ma zdjęcia billboard obracanego razem z kamerą.

`localStorage` przechowuje aktualną konfigurację razem z obrazami. Brak miejsca jest sygnalizowany. Eksport JSON zawiera grafiki; import przechodzi walidację. To plik z treścią klienta, więc należy go przesyłać świadomie.

Link udostępniania przenosi parametry i wybory, ale pomija własne obrazy. Dla projektu z grafikami należy przekazać odbiorcy eksport JSON. **Nie ma jeszcze serwerowego magazynu konfiguracji ani uploadów.** Formularz wysyła zwalidowany `creatorConfiguration`, identyfikator i nazwy plików, bez binarnych załączników. UI informuje o konieczności dosłania eksportu na office@progames.pl. Serwer dodaje te dane do dotychczasowej wiadomości Resend.

## Weryfikacja

Wykonano pomyślnie:

- `npm run build` — pełna generacja strony i kompilacja Creatora;
- `npm test` — 245 stron, 1220 wariantów, kontrola linków, SEO, mapy i opisów produktów;
- `npm run test:i18n` — 245 stron, pięć języków, canonicals/hreflang i tłumaczenia istniejących produktów;
- `npm run test:creator` — walidacja i zachowanie stanu, metadane uploadu, rozdzielenie grafiki od danych zapytania, wymiary kluczowych meshów demo, kontrakt nazw/materiałów/UV GLB, pięć dokumentów Creatora, brak ładowania kodu 3D na stronie głównej, reguły Vercel, akceptacja poprawnych danych i odrzucenie błędnych danych API, kompatybilność dotychczasowego formularza. Resend jest w teście symulowany.

**Niezweryfikowane przeglądarkowo:** rendering, jakość cienia i tekstur, gesty, zoom, PNG, upload na żywym canvasie, focus formularza i układ przy 1920×1080, 1440×900, 1366×768, 1024×768, 768×1024 i 390×844. Lokalne Chromium kończyło proces sygnałem 133; przeglądarka zdalna odrzuciła localhost (`ERR_BLOCKED_BY_CLIENT`). Nie ma udokumentowanych zrzutów gotowego renderu i nie należy traktować powyższych testów strukturalnych jako testów wizualnych.

Do uruchomienia w środowisku docelowym:

```
npx playwright install chromium
npm run test:creator:browser
```

Ten test sam uruchamia lokalny serwer, symuluje API (nie wysyła wiadomości) i zapisuje screenshoty w `verification/creator-screenshots/`. Dodatkowo trzeba sprawdzić na fizycznym telefonie obsługę dotyku i wydajność GPU oraz na autoryzowanym środowisku rzeczywistą wysyłkę Resend.

## Co wymaga pracy modelarza / etapu produkcyjnego

Dokładne wymiary, szczegóły tłoczeń i krawędzi daszka, mechanika worka i piłki, obudowa wnęki kickera, osprzęt serwisowy, szwy i deformacje worka, właściwa piłka, UV i oryginalne fabryczne wydruki dla wszystkich powierzchni, precyzyjne materiały oraz akceptacja oświetlenia. Presety graficzne należy zastąpić zatwierdzonymi plikami produkcyjnymi. Ambient occlusion nie ma osobnej wypieczonej mapy ani postprocessingu. Cień jest mapą cienia o rozdzielczości ograniczonej na mobile; nie jest ray tracingiem. Efekty LED są statycznymi materiałami emisyjnymi.

Przed publikacją: wykonać test przeglądarkowy, sprawdzić model wizualnie przy referencjach, potwierdzić formularz i ustawienia Vercel, dodać backend uploadów / trwałych linków, jeżeli link ma przenosić także pliki. Same kolory, naklejki, formularz i stan mogą pozostać przy podmianie zgodnego GLB.
