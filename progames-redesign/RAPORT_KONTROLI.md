# Aktualizacja v9 — 1 października 2026

Po ponownej kontroli starej strony poprawiono opisy i dane produktowe. Aktualny stan: 37 opisów źródłowych i ich tłumaczeń; 5 produktów bez pełnego opisu źródłowego ma wyłącznie informację kontaktową, bez niepotwierdzonych parametrów. Szczegóły w ZGODNOSC_OPISOW_v9.md. Powtórzone testy 135 stron, 666 wyborów wariantów i 2160 linków zakończyły się powodzeniem. Poniższy raport v8 pozostaje historycznym opisem wcześniejszych prac; jego informacja o 42 pełnych opisach została zastąpiona niniejszą korektą.

# Kontrola przed publikacją — Pro Games Poland v8

Data: 1 października 2026 r. Strona nie została opublikowana ani podłączona do domen.

## Wprowadzone zmiany

- Konturowa mapa świata na czarnym tle, pod targami i nad Spare Parts. Pinezki Londynu i Orlando korzystają z danych istniejących kart targowych. Kliknięcie pokazuje wydarzenie, termin, miejsce i podany numer stoiska. Status „nadchodzące”, „trwają” lub „zakończone” zmienia się według daty w strefie Europe/Warsaw. Mapa jest lokalnym SVG, bez zewnętrznej usługi mapowej.
- Pełna polska wersja interfejsu i opisów 42 produktów; zachowane wersje angielska i hiszpańska. Nazwy własne modeli pozostają oryginalne. Istniejące katalogi PDF nie były tłumaczone.
- Zachowana kolekcja Boxer Standard: 15 modeli za jedną kartą na stronie głównej; 28 kart na stronie głównej.
- 135 indeksowalnych stron HTML, w tym 126 kart produktów. Opisy, specyfikacje i linki są dostępne w HTML przed uruchomieniem JavaScript.
- Indywidualne tytuły i opisy SEO, canonical, wzajemne hreflang PL/EN/ES i x-default, sitemap.xml, robots.txt, Open Graph oraz dane strukturalne Product, Organization, WebSite, BreadcrumbList i ItemList stosownie do strony. Brak wymyślonych cen, opinii i stanów magazynowych. Dane Product bez oferty cenowej nie gwarantują rozszerzonego wyniku cenowego w Google.
- Główny adres SEO: https://www.progamespoland.com. Przygotowano konfigurację przekierowań 301 dla progames.pl, www.progames.pl i progamespoland.com oraz rozpoznanych starych adresów i kart produktów. Dla Vercel: vercel.json; dla innego hostingu: tabela build/redirects.csv do wdrożenia przez administratora.

## Niezależność zdjęć od starej strony

W paczce znajdują się wszystkie 233 obrazy rastrowe (w tym 222 zdjęcia wariantów produktów), 10 plików fontów, mapa SVG i 2 katalogi PDF. Obrazy zostały w pełni zdekodowane, fonty i PDF sprawdzone, SVG sparsowany. Wszystkie zasoby mają niezerowy rozmiar. Manifest SHA-256 znajduje się w verification/asset-manifest.json.

Sprawdzone strony nie pobierają zasobów potrzebnych do wyświetlania z poprzedniej witryny, Wix, Google Fonts ani serwerów dystrybutorów. Stare adresy w metadanych sourceImage i dokumentacji służą wyłącznie identyfikacji źródeł. Po przeniesieniu całej paczki wraz z assets wyłączenie starej strony nie powinno wpływać na te zdjęcia. Linki do serwisów partnerów są zwykłymi odnośnikami, a nie zależnościami zdjęć.

## Wyniki kontroli

| Zakres | Wynik |
|---|---|
| 135 stron: język, H1, tytuł/opis, canonical, hreflang, JSON-LD | OK |
| 126 stron produktów i 666 wyborów wariantów w symulatorze DOM | OK |
| 2160 odnośników wewnętrznych, pliki i kotwice | OK |
| Przełączanie zdjęć, szybkie kolejne wybory i błąd ładowania | OK |
| Kolekcja, wyszukiwanie, katalogi, inicjalizacja bez duplikatów | OK |
| Mapa w 3 językach i statusy na granicach dat | OK |
| Lokalny HTTP: 385 odpowiedzi 200; brakujący plik zwraca 404 | OK |
| Zewnętrzne zależności zasobów renderowania | 0 |
| Wizualny test całej strony w prawdziwej przeglądarce i na telefonie | NIEWYKONANY — przeglądarka środowiska nie uruchomiła się |
| Domeny, HTTPS i przekierowania na docelowym hostingu | DO SPRAWDZENIA PO WDROŻENIU |

Wyniki maszynowe i skrypty znajdują się w verification. Test DOM nie zastępuje kontroli wizualnej i rzeczywistej interakcji w przeglądarce. Nie oznaczamy strony jako w pełni przetestowanej do publikacji.

## Pozostałe kroki przed uruchomieniem

1. Wgrać kompletną zawartość katalogu strony do głównego katalogu hostingu, zachowując assets i strukturę języków. Strona wymaga HTTP/HTTPS; otwieranie przez file:// nie jest obsługiwane.
2. Podłączyć obie domeny, uruchomić certyfikaty HTTPS i zweryfikować 301 do www.progamespoland.com. Sprawdzić rzeczywiste stare adresy, zachowanie parametrów wariantu, stronę 404 i brak pętli przekierowań. Przygotowana konfiguracja nie zmieniła jeszcze DNS ani starego hostingu.
3. Przejść stronę na komputerze i telefonie: menu, wszystkie języki, zdjęcia, mapę, katalogi i zapytanie ofertowe. Dołączono opcjonalny test Playwright; wymaga działającej przeglądarki.
4. Formularz obecnie przygotowuje wiadomość w programie pocztowym użytkownika (mailto). Nie wysyła wiadomości z serwera. Przed publikacją zdecydować, czy taki sposób kontaktu jest wystarczający; jeśli nie, podłączyć rzeczywistą usługę wysyłki i sprawdzić dostarczanie.
5. Po uruchomieniu zweryfikować domenę w Google Search Console, przesłać https://www.progamespoland.com/sitemap.xml i sprawdzić indeksowanie przykładowych stron PL i EN. SEO techniczne nie stanowi gwarancji pozycji w Google.

## Propozycje dalszego rozwoju

- Krótkie autentyczne filmy pokazujące działanie urządzeń na kartach produktów.
- Zdjęcia rzeczywistych realizacji u klientów, z nazwami i zgodami na publikację.
- Zwięzłe FAQ o dostawie, personalizacji i serwisie, oparte na zatwierdzonych warunkach firmy.

Nie dodawano fikcyjnych opinii ani nie zmieniano zaakceptowanego układu strony poza uzgodnionymi funkcjami.

## Źródła wskazówek SEO

- https://developers.google.com/search/docs/specialty/international/localized-versions
- https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- https://developers.google.com/search/docs/appearance/structured-data/product-snippet
- https://vercel.com/docs/project-configuration/vercel-json
