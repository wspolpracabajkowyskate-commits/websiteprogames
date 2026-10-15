# Audyt techniczny ProGames — 2026-10-13

Źródło: odczyt repozytorium websiteprogames/progames-redesign i żądanie HTTP do oficjalnej witryny. Status zmian: **Przygotowane, ale niewdrożone**. Branch: `ai/progames-knowledge-seo`.

## Najważniejszy problem i wykonana poprawka

W repozytorium brakowało **47 plików opublikowanych w sitemap i manifest**, w tym **wszystkich 46 angielskich stron produktów** `/en/products/*.html` oraz `/pl/katalog.html`. Żądanie GET do `https://www.progamespoland.com/en/products/boxer-flash.html` zwróciło **404**. To rzeczywista przeszkoda dla użytkowników, indeksowania i pobierania wiedzy przez AI. Nie ekstrapolowano jednego HTTP na status wszystkich 46 stron produkcyjnych; brak wszystkich potwierdzono w kodzie.

Przywrócono 46 stron EN przez uruchomienie istniejącego renderera `product.js` na danych `products.js`, bez przepisywania logiki konfiguratora. HTML zawiera teraz opis, opcje, warianty i tabelę parametrów bez potrzeby wykonania JavaScript przez crawlera. Dodano zgodne metadane, wzajemne hreflang, canonical, Product i BreadcrumbList. Nie dodano fikcyjnych cen, ocen ani opinii. Produkty dystrybucyjne nie otrzymują ProGames jako producenta. Teksty zastępcze wymagające kontaktu zastąpiono neutralnym komunikatem o dostępności informacji. Odtworzono PL katalog z istniejącego szablonu i słownika tłumaczeń.

## Fakty o architekturze

To statyczna strona HTML/CSS/JavaScript z lokalnym etapem generowania. Nie React ani Next.js. Vercel publikuje pliki statyczne (`framework:null`, pusty `buildCommand`). Sam push zmian generatora bez wygenerowanych HTML nie naprawi publikacji.

Manifest: 263 strony, w tym 230 kart produktów (46 × 5 języków). Pozostałe istniejące strony zawierają prerenderowany HTML, canonicals i alternatywne języki. robots.txt zezwala ogólnym robotom na odczyt treści; blokuje katalogi build i verification, zawiera sitemap. Nie zmieniano polityki zgody na trening modeli.

## Reprodukowalność

Poprzednie `npm run build` wskazywało pięć nieobecnych generatorów; `npm test` wskazywało trzy nieobecne pliki. Zachowano oryginalne polecenia jako `build:legacy` i `test:legacy` z wyraźnym zastrzeżeniem, że nie są obecnie wykonywalne. Domyślny build odtwarza brakujące strony oraz uruchamia istniejącą walidację SEO. **To naprawa publikacji, nie pełne odtworzenie historycznego systemu generującego wszystkie języki**. Przy zmianie całego katalogu potrzebne odzyskanie brakujących generatorów; nie aktualizować danych bez tego kroku.

## Rzeczywiście wykonane testy

- `npm ci --ignore-scripts`: PASS.
- `npm run build`: PASS.
- `npm run test:seo`: PASS.
- `npm run test:i18n`: PASS.
- 263 strony: pojedynczy H1/canonical, unikalne tytuły/opisy, hreflang wzajemny, zgodna sitemap.
- 6082 odnośniki wewnętrzne, 755 obiektów JSON-LD, 2033 obrazów z wymiarami, 760 wierszy specyfikacji.
- 30 reprezentatywnych przypadków przekierowań: PASS w symulacji konfiguracji; nie test pełnego routera Vercel.
- Renderer istniejącego konfiguratora uruchomiony lokalnie dla 46 modeli. Brak testu klikania i wizualnego na przeglądarce: binaria Playwright nie są zainstalowane.

## Ograniczenia i kolejne bramki

Brak GSC/CrUX: nie mierzono indeksacji w Google, pozycji, kliknięć, INP/LCP/CLS ani konwersji. HTTP200 lub obecność sitemap nie dowodzi indeksacji. Brak produkcyjnego wdrożenia i testu po publikacji. Przed produkcją wykonać preview, sprawdzić konfigurator (kolor/opcje/przejście do zapytania bez wysyłania), katalog PDF oraz rozmiary mobilne. Nie dotykano formularzy, poczty ani DNS. Wewnętrzne testy nie oceniają prawdziwości historycznych opisów produktowych — te wymagają osobnej weryfikacji źródeł.

Dodatkowa kontrola: żądania HEAD do wszystkich 46 angielskich adresów produktów zwróciły HTTP404. Pełny zapis: seo/live-en-products.json.
