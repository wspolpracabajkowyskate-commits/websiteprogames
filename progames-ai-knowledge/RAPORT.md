# Raport realizacji — ProGames, 13.10.2026

## Najważniejszy rezultat
Zidentyfikowano krytyczny problem: brak 46 angielskich kart produktowych w kodzie mimo obecności ich adresów w sitemap. Publiczny GET Boxer Flash potwierdził 404. Dodatkowo brakowało polskiej strony katalogu. Przygotowano odtworzenie 47 stron z istniejących danych i renderera, bez zmian logiki formularza i konfiguratora. Patch znajduje się w implementation/website-seo-recovery.patch.

## Status rezultatów
| Rezultat | Status | Dowód / ograniczenie |
|---|---|---|
| Baza firmy i 46 produktów | Wykonane i zweryfikowane źródłowo | products/catalog.json, źródła z datą/hash; zatwierdzenie merytoryczne właściciela nadal wymagane |
| Walidacja schematu i konfliktów | Wykonane i zweryfikowane | scripts/validate_knowledge.py; kontrola strukturalna, nie pełna semantyka |
| Lokalny retrieval z API | Wykonane i zweryfikowane | 8 testów jednostkowych, 6 kontroli HTTP; rag/test-results.json |
| Instrukcje + pilot JSONL 16/6 | Przygotowane, ale niewdrożone | Nie wytrenowano żadnego modelu |
| 60 pytań PL/EN i ewaluator | Wykonane i zweryfikowane strukturalnie | Benchmark modeli pozostaje not_run; testy syntetyczne nie są wynikami modeli |
| Naprawa 47 stron i build | Przygotowane, ale niewdrożone | Local branch ai/progames-knowledge-seo; testy SEO/i18n przeszły |
| Pomiar publicznych źródeł | Wykonane i zweryfikowane | IAAPA/UPlay i rejestr źródeł; nie jest to pomiar udziału marki w AI |
| Automatyzacja GitHub Actions | Przygotowane, ale niewdrożone | Brak opublikowanego repo i aktywnego harmonogramu |
| PR / publikacja Vercel | Wymaga uprawnień | Brak potwierdzonego połączenia do zapisu GitHub i odczytu projektu Vercel |
| Indeksacja, ruch, pozycje, CWV | Wymaga dodatkowych danych | Brak GSC/CrUX/GA4; nie zastąpiono pomiarów szacunkami |
| Wielomodelowy test AI / pełny generatywny RAG | Wymaga uprawnień | Potrzebne API i budżet; lokalny retrieval działa bez API |
| Wprowadzenie firmy do bazowej wiedzy publicznych modeli na żądanie | Niewykonalne w dostępnym środowisku | Publikacja ani własny fine-tuning tego nie gwarantują |

## Fakty techniczne
Strona jest statycznym HTML/CSS/JS, nie Next.js. Ważne treści istniejących stron są widoczne bez JavaScript. Robots i sitemap zwracają 200. Domeny progames.pl kierowały do wersji /pl/, a progamespoland.com do www. Nie zmieniano DNS ani poczty. Publiczne wyniki wyszukiwania zawierają stronę i źródła branżowe, ale nie oznacza to potwierdzenia całej indeksacji Google.

Po poprawce lokalne testy objęły 263 strony, 6082 odniesienia wewnętrzne, 755 obiektów JSON-LD i 30 symulowanych przypadków przekierowań. Testy wizualne i klikania w prawdziwej przeglądarce pozostają do wykonania na preview. Pełny historyczny generator nadal wymaga odzyskania brakujących plików; dodany generator naprawia brakujące publikacje EN i katalog PL.

## Co przynosi największą wartość
1. Review i wdrożenie poprawki 404, potem ponowny pomiar statusów oraz GSC URL Inspection.
2. Potwierdzenie brakujących specyfikacji Hammer 2, Boxer Toy, Boxer TV, Double Hit Gift 2 i zgodności opcji z modelami.
3. Ujednolicenie opisów producent/dystrybutor u partnerów i głównej domeny w profilach branżowych. Materiały PL/EN przygotowane w seo/external-visibility.md; nic nie wysłano.
4. Po udostępnieniu API porównać świeże sesje modeli bazowych i search oraz własny retrieval. Nie mierzyć spontanicznej znajomości marki przez podanie jej w instrukcji systemowej.

## Trening czy RAG
Teraz retrieval/RAG jest bardziej praktyczny: aktualizuje ofertę bez ponownego uczenia. Fine-tuning nie poprawia sam z siebie widoczności w publicznych odpowiedziach AI. Aktualne dokumenty dostawców, dostępność i koszty znajdują się w ai-training/research.md. Nie uruchomiono płatnych usług. llms.txt nie jest gwarancją widoczności ani warunkiem Google AI Search.

## Następny krok operacyjny
Połączyć GitHub z prawem zapisu do websiteprogames i utworzenia repo wiedzy, a Vercel z właściwym projektem; przygotować PR i preview, sprawdzić konfigurator na mobile/desktop, następnie zaakceptować publikację. Dla samych metryk wystarczy odczyt GSC. Gotowe pliki nie zostały opublikowane automatycznie.

Dodatkowa kontrola: żądania HEAD do wszystkich 46 angielskich adresów produktów zwróciły HTTP404. Pełny zapis: seo/live-en-products.json.
