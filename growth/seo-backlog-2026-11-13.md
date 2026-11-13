# PRO-GAMES — audyt techniczny, mapa fraz i backlog (13.11.2026)

Dokument roboczy. Nic z niego nie zostało wstawione na stronę. Brak dostępu do Google Search Console, Analytics i CrUX — nie podaję wolumenów, pozycji, kliknięć ani danych Core Web Vitals z ruchu rzeczywistego.

## 1. Stan potwierdzony

Źródła: kod repozytorium, konfiguracja projektu Vercel, odczyt wszystkich 657 adresów z produkcyjnej sitemapy (13.11.2026).

| Obszar | Wynik |
|---|---|
| Statusy | 657/657 adresów z sitemapy: HTTP 200, bez przekierowań |
| Canonical | 657/657 wskazuje na siebie, host `www.progamespoland.com` |
| Title / description | 657 unikalnych tytułów i 657 unikalnych opisów |
| H1 | dokładnie jeden na każdej stronie |
| hreflang | 637 stron z kompletem 13 języków + x-default, 18 stron EN/PL + x-default, 2 poradniki tylko PL; 0 błędów wzajemności, 0 niezgodności z `lang` |
| `lang` / `dir` | zgodne z adresem; arabski ma `dir="rtl"` |
| JSON-LD | poprawna składnia wszędzie; brak cen, ofert, ocen i opinii |
| Soft 404 | nieistniejące adresy zwracają 404 |
| robots.txt / sitemap | poprawne, sitemap bez `noindex`, parametrów i błędów; bez `lastmod` |
| Przekierowania | brak łańcuchów i pętli w regułach `vercel.json` (598 reguł) |
| Skrypty zewnętrzne | brak — żadnej analityki ani zasobów spoza domeny |
| Błędy funkcji (7 dni) | brak w Vercel |

Języki i adresy stron głównych: EN `/`, ES `/es.html`, PL `/pl/`, DE `/de/`, FR `/fr/`, EL `/el/`, IT `/it/`, AR `/ar/`, RO `/ro/`, CS `/cs/`, HU `/hu/`, RU `/ru/`, BG `/bg/`.

## 2. Problemy potwierdzone i naprawione w PR #76

1. **Kontrola jakości nie działała od końca października.** `check-seo.cjs` kończył się błędem `657 !== 655` (strony gry w sitemapie, ale nie w manifeście), a `check-pl-growth.cjs` oczekiwał starego tytułu i H1 polskiej strony głównej. Przez to nie uruchamiał się także codzienny monitoring produkcji.
2. **Duplikaty adresów z kodem 200:** `/el`, `/it`, `/ar`, `/ro`, `/cs`, `/hu`, `/ru`, `/bg` bez ukośnika oraz `/{lang}/index.html`, `/games/index.html`, `/pl/gry/index.html`. Teraz 301 na adres kanoniczny.
3. **404 dla oczywistych adresów językowych:** `/es`, `/es/`, `/en`, `/en/`. Teraz 301 na `/es.html` i `/`.
4. **CSS i JS bez cache przeglądarki:** każda odsłona rewalidowała kilkanaście plików. Pliki wołane z `?v=` mają teraz 1 dzień cache + stale-while-revalidate.
5. **Pliki robocze bez `noindex`:** `/vercel.json`, `/FILES-V42.json`, `/i18n/*.tsv` i podobne.
6. **Podgląd społecznościowy gry:** brak wymiarów i typu grafiki `og:image`.

## 3. Problemy potwierdzone, niezmienione (wymagają decyzji)

| # | Problem | Dlaczego nie zmieniono |
|---|---|---|
| 1 | Krok „Local SEO checks” w CI jest czerwony: `products.js` (zmiana 10.11) nie zgadza się z hashem w `progames-ai-knowledge/sources/source-register.json` | To celowa bramka — wymaga przeglądu bazy wiedzy przez właściciela |
| 2 | `build/games-pages.py` jest nieaktualny względem opublikowanych stron gry (inne zdjęcie, wersje skryptów, brak linku GAMES) | Uruchomienie cofnęłoby ręczne poprawki; trzeba zsynchronizować generator |
| 3 | `/pl/katalog.html` nie ma JSON-LD (pozostałe katalogi mają `WebPage` + `BreadcrumbList`) | Plik powstaje w `recover-static.cjs`; nie mogłem uruchomić pełnego builda lokalnie |
| 4 | `Organization.contactPoint.availableLanguage` i `WebSite.inLanguage` wymieniają 5 języków, strona ma 13 | Trzeba potwierdzić, w ilu językach firma faktycznie obsługuje klientów |
| 5 | Grafika podglądu gry to kwadrat 768×768 przy karcie `summary_large_image` — część serwisów ją przytnie | Wymaga nowej grafiki 1200×630 (zgoda na kreację) |
| 6 | Brak `/favicon.ico` (404); jest tylko `favicon.svg` | Wymaga wygenerowania pliku z istniejącego znaku |
| 7 | Sitemap bez `lastmod` | Prawdziwe daty wymagają pełnej historii git w buildzie; fałszywych nie dodaję |
| 8 | Gra tylko w EN i PL; pozostałe 11 języków linkuje do `/games/` | Tłumaczenie = nowa treść |

## 4. Ranking GAMES MONSTER — ocena bezpieczeństwa

Co działa: podpis HMAC stanu gry po stronie serwera, limity punktów i minimalny czas na etap, kontrola rzeczywistego czasu, walidacja nicku, limit rozmiaru żądania, kontrola nagłówka `Origin`, zapis warunkowy (ETag), sekret tylko w zmiennej środowiskowej, brak błędów w logach.

Słabe punkty (bez zmian w kodzie — każda zmiana wymaga decyzji):

- Limit zapytań jest w pamięci pojedynczej instancji funkcji, więc przy wielu instancjach jest nieszczelny. `GET /api/ranking` nie ma limitu i każdorazowo czyta Blob. **Zalecenie:** reguła rate limit w Vercel Firewall dla `/api/ranking` i `/api/contact`.
- Wdrożenia preview mogą zapisywać do produkcyjnego rankingu (wspólny magazyn Blob). **Zalecenie:** osobny magazyn dla preview albo blokada zapisu poza produkcją.
- Każdy może nadpisać cudzy nick wyższym wynikiem; brak filtra wulgaryzmów i narzędzia moderacji.
- Bot może uzyskać wynik bliski maksimum, czekając minimalny czas etapu — ograniczenie typowe dla gier przeglądarkowych.

Pomiar uruchomień i ukończeń: na stronie nie ma żadnego systemu analitycznego, więc nie ma gdzie tego mierzyć. Najmniej inwazyjna opcja to Vercel Web Analytics (bez cookies) ze zdarzeniami `game_start` / `game_complete` — wymaga włączenia w projekcie i decyzji co do informacji o prywatności.

## 5. Mapa tematów i zapytań

Frazy poza PL i EN to **hipotezy oparte na lokalnym nazewnictwie branżowym**, nie dane z narzędzi. Przed użyciem zweryfikować w Search Console (zapytania według kraju) lub Planerze słów kluczowych. Intencja: B = producent/B2B, Z = zakup/dobór modelu, D = dystrybucja/hurt.

| Język | Strona docelowa | Zapytania do weryfikacji | Intencja |
|---|---|---|---|
| PL (priorytet) | `/pl/`, `/pl/producent-automatow-bokserskich.html` | producent automatów bokserskich; polski producent automatów bokserskich; producent automatów rozrywkowych; producent automatów zręcznościowych | B |
| PL | `/pl/automaty-bokserskie.html` | automaty bokserskie; automat bokserski cena; bokser automat; automat do mierzenia siły ciosu; siłomierz bokserski; automaty bokserskie do salonu gier / baru / centrum rozrywki | Z |
| PL | strony produktów, poradniki | automat kopacz; młot siłomierz; automat 3w1; ile kosztuje automat bokserski; automat bokserski do baru | Z |
| PL | strona B2B | automaty bokserskie hurt; dystrybutor automatów rozrywkowych | D |
| EN | `/en/manufacturer.html` | boxing arcade machine manufacturer; boxing machine manufacturer; amusement machine manufacturer; arcade machine manufacturer Europe | B |
| EN | `/en/boxing-machines.html` | commercial boxing machine; boxing arcade machine for sale; punch machine for bar; strength tester machine; kicker arcade machine; hammer arcade machine | Z |
| EN | strona dystrybutorów | boxing machine distributor; arcade machine wholesale supplier | D |
| DE | `/de/` | Boxautomat Hersteller; Boxautomat kaufen; Boxautomaten für Gastronomie; Kraftmesser Automat; Unterhaltungsautomaten Hersteller | B, Z |
| FR | `/fr/` | fabricant machine de boxe arcade; machine à coup de poing; boxer de café; jeu de force arcade; fabricant de jeux d'arcade | B, Z |
| ES | `/es.html` | fabricante de máquinas de boxeo; máquina de boxeo recreativa; máquina de golpeo para bar; máquinas recreativas fabricante (osobno: Argentyna/LatAm — „máquina de boxeo arcade”, „boxeador”) | B, Z |
| IT | `/it/` | produttore macchine pugile; pugnometro; punching ball a gettoni; macchina boxe sala giochi | B, Z |
| CS | `/cs/` | boxovací automat; výrobce boxovacích automatů; boxer automat do baru; zábavní automaty výrobce | B, Z |
| HU | `/hu/` | bokszgép; boxgép eladó; erőmérő automata; játékgép gyártó | B, Z |
| RO | `/ro/` | aparat de box; aparat box de vânzare; producător aparate de box; aparate de joc distractive | B, Z |
| BG | `/bg/` | боксов автомат; боксова круша автомат; производител на боксови автомати; игрални автомати за забавление | B, Z |
| EL | `/el/` | μηχάνημα μποξ; μποξέρ μηχάνημα; κατασκευαστής ψυχαγωγικών μηχανημάτων | B, Z |
| RU | `/ru/` | боксёрский автомат; силомер боксёр; купить боксёрский автомат; производитель развлекательных автоматов | B, Z |
| AR | `/ar/` | ماكينة ملاكمة; لعبة قياس قوة اللكمة; مصنع ألعاب أركيد; ألعاب ترفيهية للمولات | B, Z |

Co wymaga zmiany treści lub linków (poza zakresem tej implementacji):

- Strony kategorii i producenta istnieją tylko w PL i EN. W 11 językach jedyną stroną docelową dla fraz „producent” i „kupić” jest strona główna — rozważyć tłumaczenia tych podstron.
- Frazy typu „kopacz”, „młot”, „3w1” nie mają własnych stron kategorii.
- Pięć modeli ma opis zastępczy; wiele bokserów Standard dzieli jeden opis.
- Autorytet zewnętrzny: lista korekt w `growth/ai-visibility/external-sources.md` (IAAPA, UPlay, Highway Games, Parkmag) pozostaje aktualna i jest ważniejsza niż dalsze zmiany techniczne.

## 6. GAMES MONSTER — plan promocji (do akceptacji, nic nie opublikowano)

Kanały własne:

1. Facebook i Instagram PRO-GAMES: post z krótkim nagraniem rozgrywki i linkiem `/pl/gry/` (PL) oraz `/games/` (EN); przypięty post lub link w bio.
2. Konta oddziałów (Hiszpania, Argentyna): ten sam materiał z linkiem `/games/`.
3. Kod QR do gry na automatach MONSTER 3in1, w katalogu PDF i na stoisku targowym (IAAPA Expo, 17–20.11) — ranking jako konkurs na stoisku.
4. Stopka mailowa działu sprzedaży i wiadomość do dystrybutorów z prośbą o udostępnienie.
5. Cykliczny post „TOP 10 tygodnia” z rankingu.

Portale i katalogi do zgłoszenia (przed zgłoszeniem sprawdzić regulamin; część wymaga osadzenia gry w iframe lub wersji bez linków zewnętrznych):

| Serwis | Uwagi |
|---|---|
| itch.io | bezpłatne, gra HTML5 jako link zewnętrzny lub paczka; najprostszy start |
| Newgrounds | społeczność gier pixel-art; wymaga wgrania paczki HTML5 |
| Game Jolt | bezpłatne, HTML5 |
| CrazyGames, Poki | selekcja redakcyjna i własne SDK — realne dopiero po decyzji o integracji |
| Y8, Kongregate | zgłoszenie przez formularz dewelopera |
| Reddit: r/WebGames, r/IndieGaming, r/pixelart | jeden post, zgodnie z zasadami autopromocji |
| Polskie: grupy FB o grach retro/arcade, Wykop (tag #gry), PPE.pl / forum | wpis od firmy, bez kont pozornych |
| Branżowe: Parkmag, InterGame, RePlay Magazine | notka prasowa „producent automatów wydał grę przeglądarkową” |

Propozycje postów (do zatwierdzenia treści przez firmę):

- PL: „MONSTER wyszedł z automatu. Zagraj za darmo w przeglądarce, przejdź 10 etapów i wpisz się do rankingu: progamespoland.com/pl/gry/”
- EN: “The MONSTER left the cabinet. Play free in your browser, clear 10 stages and get on the leaderboard: progamespoland.com/games/”

## 7. Backlog

Wymaga danych z Search Console:

- zweryfikować usługę domenową i zgłosić sitemapę; sprawdzić stan indeksowania 13 języków, szczególnie 8 generowanych przy buildzie;
- potwierdzić lub odrzucić frazy z sekcji 5 według kraju;
- sprawdzić, czy `/pl/` i `/pl/producent-automatow-bokserskich.html` nie konkurują o te same zapytania.

Wymaga zmiany treści lub grafiki:

- tłumaczenia stron kategorii i producenta na pozostałe języki;
- prawdziwe opisy pięciu modeli z opisem zastępczym;
- grafika podglądu gry 1200×630 i `favicon.ico`;
- JSON-LD dla `/pl/katalog.html`, aktualizacja listy języków w `Organization`/`WebSite`.

Wymaga decyzji technicznej:

- przegląd i aktualizacja hasha `products.js` w rejestrze źródeł (odblokuje monitoring produkcji);
- reguły rate limit w Vercel Firewall dla `/api/*`;
- osobny magazyn rankingu dla preview;
- włączenie analityki bez cookies i zdarzeń gry;
- synchronizacja `build/games-pages.py` z opublikowanymi stronami.

Wymaga akceptacji publikacji zewnętrznej:

- posty z sekcji 6, zgłoszenia do katalogów gier, notka prasowa;
- korekty profili zewnętrznych z `growth/ai-visibility/external-sources.md`.
