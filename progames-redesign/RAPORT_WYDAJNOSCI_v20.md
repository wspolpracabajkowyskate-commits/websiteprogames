# Audyt wydajności PRO GAMES — wersja 20

Data: 2 października 2026. Materiał wejściowy: `progames-v19(2).zip`.

## Zakres i najważniejsze ustalenia

Sprawdzono 407 plików projektu: wszystkie skrypty wykonywane w przeglądarce, arkusze CSS, szablony i generator, dane 42 produktów, 90 wygenerowanych stron EN/ES, zasoby, zależności npm, konfigurację hostingu i testy. Nie zmieniono CSS, układu, tekstów, kolorów, adresata formularza ani funkcji strony.

1. **Za duże logo w nagłówku i stopce.** PNG 1254×1254 ważył 1 935 174 B, a nagłówek pokazuje go w rozmiarze 32–44 px. Wspólny wariant WebP 256×256 ma 78 456 B (dokładny rozmiar w zestawieniu plików). Zapewnia ponad dwukrotną rozdzielczość największego standardowego rozmiaru stopki 104 px. Pełnowymiarowe źródło zachowano. Nie zmieniono geometrii elementów.
2. **Powtórne tworzenie gotowego HTML.** Generator zapisuje kompletne karty i szczegóły produktu. `script.js` i `product.js` zastępowały je ponownie przez `innerHTML` po starcie. Teraz istniejący DOM zostaje i otrzymuje obsługę zdarzeń. Dynamiczne generowanie pozostało dla starszych adresów `product.html?model=…`. Zachowano animację wejścia kart oraz przełączanie wariantu wskazanego w URL.
3. **Ponowna budowa listy formularza.** Gotowe opcje produktów były usuwane i dodawane ponownie. Teraz istniejąca lista jest używana bez przebudowy.
4. **Pełne dane obu języków i informacje źródłowe w każdym wejściu.** `products.js` miał 168 181 B. Generator tworzy osobne pliki przeglądarkowe: EN 78 082 B, ES 112 306 B. Pominięto wyłącznie pola pochodzenia zdjęć i adresów źródłowych, niewykorzystywane w interfejsie. Pełna baza pozostaje źródłem generatora i audytu. Wszystkie opisy, obrazy i mapowania kolorów zachowano.
5. **Fonty WOFF.** Dziesięć lokalnych fontów przekonwertowano do WOFF2, bez usuwania znaków i bez zmiany metryk. Łączny rozmiar plików jest mniejszy o około 29%. Nie połączono różnych grubości kroju — to odrębne potrzebne fonty, nie duplikaty.
6. **Niewłaściwy PDF rozpoczynał ładowanie.** HTML katalogu ustawiał katalog maszyn przed odczytaniem `?catalog=parts`. JS następnie przełączał iframe na części. Teraz adres jest ustawiany raz, zgodnie z parametrem. Ponowne kliknięcie tego samego katalogu nie przeładowuje iframe. Pozostał podgląd bez JS przez `noscript`. To usunięcie zbędnej nawigacji/pobierania, nie dowód pobrania całych 10,26 MB katalogu maszyn w każdym wejściu.
7. **Drobna praca przy interakcji.** Lista kart jest przechowywana, zamiast ponownie wyszukiwana przy każdym filtrowaniu. Obsługa przewijania zmienia klasę nagłówka tylko po przekroczeniu progu 40 px. Zdarzenie pozostaje pasywne.
8. **PNG karty części.** Pełnowymiarowa bezstratna konwersja do WebP zmniejsza plik z 1 503 853 do 1 038 062 B. Zachowano rozdzielczość i widoczne piksele.

## Duplikaty, animacje, pamięć i requesty

- W zbadanych wejściach nie stwierdzono powtórnego pobierania tego samego skryptu lub fontu. Nagłówek i stopka korzystające z tego samego adresu logo współdzielą zasób.
- Na dysku istnieją dwa identyczne pliki: `boxer-flash-black.webp` i `boxer-flash-black-clean-v18.webp`. Sama obecność kopii nie powoduje dwukrotnego transferu. Zachowano je dla zgodności istniejących adresów.
- Nie ma runtime React/Vue/Three.js, canvas, WebGL, GIF-ów ani filmów. `linkedom` służy do budowania HTML, Playwright do testów; nie trafiają jako biblioteki do przeglądarki.
- Nie stwierdzono zewnętrznych zależności renderowania ani requestów do zewnętrznych usług w teście 90 stron. Adresy `sourceImage` w bazie są metadanymi, nie poleceniami pobierania.
- Większość zdjęć kart i powiązanych produktów już miała `loading="lazy"`; zachowano to. Hero i główny produkt pozostają zasobami priorytetowymi. Nie dodano masowego preload, ponieważ konkurowałby z treścią pierwszego ekranu.
- Skrypty produktu otrzymały `defer` w kolejności zależności. Nie użyto `async`, który mógłby uruchomić logikę przed załadowaniem danych.
- CSS zawiera starsze nadpisywane reguły, blur/backdrop-filter, cienie i przejścia. Pozostawiono arkusz bez zmian: nie ma dowodu, że jego 85 KB stanowi główne wąskie gardło, a automatyczne usuwanie reguł grozi zmianą widoku mobilnego i stanów interakcji.
- Mapa inicjalizuje bieżące statusy i ma jeden timer co minutę; to mały moduł 4,7 KB. Nie stwierdzono narastania rejestracji zdarzeń przy zmianie koloru lub filtra. Dwa listenery filtra w oryginale obsługują różne zadania, nie są same w sobie wyciekiem pamięci.
- Przeprowadzony audyt i testy nie wykazały wycieku pamięci. Nie wykonano wielogodzinnego profilu heap/GC ani badań na fizycznym słabym telefonie; nie jest to gwarancja braku każdego możliwego wycieku czy spadku FPS.
- Pełne obrazy Boxer Flash ważą około 1–1,17 MB. Zachowano ich jakość i mapowanie kolorów. Po tej optymalizacji nadal mogą stanowić istotną część czasu wyświetlenia produktu.
- Wejście na statyczny produkt z parametrem innego koloru może pobrać domyślne zdjęcie z HTML, a następnie wybrany wariant. Nie usunięto początkowego zdjęcia z HTML, aby zachować natychmiastową treść i działanie bez JS. Usunięcie tego przypadku wymaga renderowania zależnego od query na serwerze.

## Co zmieniono i co pozostawiono

Zmodyfikowane źródła: `script.js`, `product.js`, `assets/fonts/fonts.css`, `build/generate.cjs`, osiem szablonów w `build/templates/` oraz test przeglądarkowy. Wygenerowano ponownie 90 stron i dwa zgodnościowe pliki `product*.html`. Dodano 10 fontów WOFF2, dwa pliki danych językowych i trzy pliki WebP. Szczegółowa lista jest w `verification/performance/changed-files.json`.

Nie usunięto produktów, języków, kolorów, PDF-ów, zdjęć źródłowych ani funkcji. Usunięto z wykonania ponowne renderowanie gotowej treści, ponowną budowę opcji formularza i zbędną nawigację iframe. Nie łączono skryptów w jeden pakiet: mała liczba plików i ich różne zastosowania nie uzasadniają ładowania wszystkiego na każdej stronie.

## Weryfikacja

- Testy publikacji: 90 stron, 84 strony produktów, 442 kontrole wariantów, 1352 linki wewnętrzne; testy SEO, DOM, wyścigu przełączeń i błędu zdjęcia — PASS.
- Zgodność kopii: 1314 kontroli treści lokalizowanych — PASS. Test porównuje z bazą źródłową w przekazanej paczce, nie z aktualną stroną internetową.
- Mapa: EN/ES, wybór wydarzeń i granice dat w strefie Warszawy — PASS.
- Chromium: 90 stron, 424 kliknięcia przełączeń wariantów, wejścia z parametrem wariantu, wyszukiwanie i czyszczenie filtrów; brak błędów JS, brak wykrytego poziomego overflow w testowanych szerokościach, brak zewnętrznych requestów.
- Fonty: zgodne mapy znaków i metryki. Pełnowymiarowe konwersje PNG→WebP: zgodność widocznych pikseli.

## Wdrożenie

Rozpakuj ZIP i wgraj zawartość folderu `progames` w miejsce obecnego projektu. Jest to gotowa strona statyczna — budowanie na hostingu nie jest wymagane. Zachowano konfigurację Vercel i wszystkie przekierowania. Po podmianie wyczyść cache/CDN starych HTML, JS i CSS; istniejące adresy nie mają pełnego wersjonowania treścią. Na innym hostingu konfiguracja `vercel.json` nie ustawia nagłówków automatycznie.

Do przyszłych zmian używaj `products.js` i szablonów, a następnie `npm ci`, `npm run build`, `npm test`. Generator odtwarza zoptymalizowane dane językowe i HTML. Oryginalny test przeglądarkowy wymaga lokalnego serwera na porcie 8000 i zainstalowanego Chromium Playwright. Zaktualizowano jego dawną liczbę 28 kart do faktycznych 29 w przesłanym projekcie oraz ograniczono klikanie do prawdziwych przycisków wariantów.

Formularz nadal uruchamia `mailto:office@progames.pl`; paczka nie zawiera serwerowego endpointu wysyłki. Nie zmieniano tego zachowania w ramach optymalizacji.

## Pomiary przed i po

Chromium lokalnie, 3 zimne konteksty dla każdego widoku; tabela podaje mediany. Ograniczenie CPU 4×, sieć 2 Mb/s i 80 ms opóźnienia, widoki 390×900 i 1440×900. Pomiar z lokalnego serwera HTTP bez gzip/Brotli i bez produkcyjnego CDN. Zasoby oznaczają sumę `encodedBodySize` Resource Timing, bez głównego HTML i bez bajtów dokumentów wewnątrz PDF iframe (raportowanych jako 0); nie są pełnym rachunkiem ruchu sieciowego. Liczba requestów jest również z Resource Timing dokumentu nadrzędnego. Nie jest to Lighthouse ani pomiar Core Web Vitals prawdziwych użytkowników.

| Widok | LCP przed → po | DOMContentLoaded przed → po | Zasoby przed → po | Requesty przed → po |
|---|---:|---:|---:|---:|
| Główna, 390 px | 6.22 → 4.92 s | 4.03 → 2.05 s | 4.36 → 2.16 MB | 27 → 27 |
| Boxer Flash, 390 px | 12.16 → 7.48 s | 3.50 → 1.68 s | 3.90 → 1.81 MB | 14 → 14 |
| Katalog części, 390 px | 0.97 → 0.95 s | 0.98 → 0.98 s | 2.53 → 0.53 MB | 10 → 9 |
| Główna, 1440 px | 6.23 → 5.20 s | 4.02 → 2.00 s | 4.86 → 2.66 MB | 34 → 34 |
| Boxer Flash, 1440 px | 12.86 → 8.19 s | 3.52 → 1.68 s | 4.07 → 1.98 MB | 16 → 16 |
| Katalog części, 1440 px | 1.00 → 0.98 s | 0.97 → 0.96 s | 2.53 → 0.53 MB | 10 → 9 |

**Interpretacja:** na widoku 390 px zasoby głównej strony zmalały o 50,5%, jej LCP o 20,8%, a LCP Boxer Flash o 38,5%. W katalogu samo LCP prawie się nie zmieniło — szybki nagłówek tekstowy nie odzwierciedla czasu pełnego pobrania PDF.

**Brak udowodnionej poprawy CPU/CLS:** suma długich zadań dla mobilnej strony głównej wyniosła 1318 → 1426 ms, desktopowej 1317 → 1448 ms. Mobilny produkt 100 → 114 ms, desktopowy 171 → 143 ms. Nie przedstawiam tych wyników jako wzrostu płynności. Mobilny CLS głównej strony pozostał około 0,09, a produktu około 0,14; desktop odpowiednio około 0,00 i 0,02. Dodatkowy ślad wykonania wykazał m.in. zadania layoutu 108, 70 i 59 ms przy CPU 4×; nie wykazał długiej pętli WebGL czy animacji JS. Nie zmieniano strategii `font-display: swap` ani układu, więc etapowe przeliczenia po fontach/zasobach nadal wymagają uwagi przy dalszych pracach. Nie mierzono stabilnego FPS ani rzeczywistego INP.

Porównanie geometrii nagłówków, hero, kart, paneli produktu i wyboru katalogów na 390 i 1440 px wykazało takie same pozycje i rozmiary. Obejrzano zrzuty ekranu; zmiana logo dotyczy sposobu dostarczenia obrazu. Surowe wyniki i skrypt pomiaru są w `verification/performance/`.

**Przewidywany efekt wdrożenia:** wyraźnie lżejsze pierwsze wejście, krótsza gotowość DOM, szybszy główny obraz produktu i brak zbędnej inicjalizacji katalogu maszyn podczas wejścia do części. Skala poprawy na produkcji zależy od urządzenia, cache, kompresji i hostingu; nie należy przenosić lokalnych sekund wprost na każdą wizytę.
