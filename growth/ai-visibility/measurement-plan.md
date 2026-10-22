# Pomiar widoczności PRO GAMES w AI i wyszukiwarkach

## Zestaw pytań
`questions-v2.json` — 30 PL + 30 EN:
- A (12/język): odkrywanie producentów, bez marki;
- P (8/język): konkretne potrzeby zakupowe, bez marki;
- B (6/język): tożsamość marki i oficjalny adres;
- C (4/język): marka + fakty o produktach.
A+P = 20/30 pytań na język bez nazwy PRO GAMES.

Arkusz do ręcznych testów: `tracking-sheet.csv` (jedna kopia na datę i narzędzie).

## Narzędzia i tryb
Gemini (aplikacja), ChatGPT z wyszukiwaniem, Perplexity, Claude.ai z wyszukiwaniem, Google (AI Overviews/AI Mode, jeśli się pojawią), Bing/Copilot.
Zasady: nowa rozmowa dla każdego pytania, wylogowana lub czysta sesja bez historii, zapis daty, nazwy i trybu modelu, lokalizacji (PL / EN-US przez VPN, jeśli dostępny). Każde pytanie 2× w odstępie min. 1 dnia — pojedyncza odpowiedź nie jest rankingiem.

## Mierniki
1. % odpowiedzi wymieniających PRO GAMES (osobno A, P, B, C; osobno PL/EN).
2. % odpowiedzi z poprawnym linkiem do progamespoland.com (lub progames.pl → przekierowanie).
3. % odpowiedzi opisujących PRO GAMES jako producenta (nie dystrybutora/sklep).
4. Źródła cytowane przy PRO GAMES (domena + typ: własna strona / IAAPA / dystrybutor / katalog / media).
5. Pozycja PRO GAMES na liście producentów (1 = pierwszy).
6. Ruch: Vercel Web Analytics — `referrerHostname` (chatgpt.com, perplexity.ai, gemini.google.com, copilot.microsoft.com, claude.ai) oraz zapytania z formularza z dopiskiem „skąd o nas wiesz”. Uwaga: wiele aplikacji AI nie przekazuje referera — ruch z AI będzie zaniżony.

## Punkt wyjścia (22.10.2026)
`../results/search-baseline-2026-10-22.json` — test narzędzia wyszukiwania Claude (nie odpowiedzi Gemini/ChatGPT):
- 0/15 zapytań bez wariantu „Pro Games” zwróciło stronę PRO GAMES; oficjalna domena progamespoland.com nie pojawiła się w żadnym wyniku (także dla `site:`).
- Marka pojawia się tylko przy zapytaniach „Pro Games Poland” / „progames.pl”: przez Facebook, Instagram, ogłoszenia i katalogi linkujące do martwej domeny boxer-progames.com.
- Przy konkurencji cytowane są profile IAAPA Marketplace, profile wystawców IAAPA Expo i newsy branżowe (Intergame/Amusements & Attractions, Replay, Arcade Heroes).
Odpowiedzi Gemini, ChatGPT, Perplexity, Google AI: **nieprzetestowane** (brak dostępu z tego środowiska) — do wykonania ręcznie według arkusza.

## Harmonogram
- T0 (do 31.10.2026): ręczny test 60 pytań w Gemini i ChatGPT (minimum), zapis w arkuszu.
- T+30 (21.11.2026), T+60 (21.12.2026), T+90 (20.01.2027): powtórka 60 pytań + kontrola źródeł z `external-sources.md` (czy poprawione) + Search Console / Bing Webmaster (indeksacja stron producenta i kategorii).
Wnioski: zmianę przypisujemy działaniu tylko wtedy, gdy zmieniło się źródło cytowane w odpowiedzi (np. pojawił się link z profilu IAAPA lub UPlay po korekcie).

## Kolejne iteracje (wg wyników)
- Jeśli marka jest, ale bez linku → sprawdzić, które źródło model cytuje, i poprawić link w tym źródle.
- Jeśli marki brak przy A/P → dalsze źródła branżowe (profile wystawców, publikacje targowe), nie kolejne podstrony.
- Jeśli opis błędny (np. „dystrybutor”, „Żory”) → korekta konkretnego źródła z cytowania.
