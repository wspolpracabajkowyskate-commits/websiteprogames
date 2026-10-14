# Etap 5 — polska widoczność ProGames
## Zmiany
Główna strona PL otrzymała title „Producent automatów bokserskich w Polsce | ProGames”, nowy meta opis, krótki wstęp, konkretniejszą sekcję o firmie i B2B. H1 i hero zachowano wizualnie; H2 o firmie wskazuje polskiego producenta. Organization już poprawnie identyfikuje firmę, adres i kontakty — nie utworzono nowej encji ani sztucznych ocen.
Strona o firmie ma osobne title/H1 i intencję historii/produkcji/wsparcia; kategoria skupia się na sprzedaży i porównaniu modeli. Linki „Producent: ProGames” z 37 własnych produktów prowadzą do /pl/; nie zmieniono oznaczeń 9 produktów dystrybucyjnych. Zmieniono 19 powtarzalnych opisów i dopasowano Product Schema. Różnice między wzorami Standard opisano na podstawie nazw i widocznych wykończeń, bez wymyślania odmiennych mechanizmów gry. Wszystkie 46 kart sprawdzono automatycznie.
Dodano 2 odnośniki do prawdziwych relacji Parkmag na stronie o firmie. Nie wysłano wiadomości do redakcji ani nie pozyskano nowych linków przychodzących.

## Pliki
- progames-redesign/pl/index.html, pl/automaty-bokserskie.html, pl/producent-automatow-bokserskich.html i 37 kart własnych produktów.
- build/pl-growth.json i pl-growth.cjs: idempotentne poprawki do istniejącego procesu build.
- build/growth-content.json: dodatkowe źródła; build/pages.json: zgodne tytuły; package.json: build/test:pl.
- verification/check-pl-growth.cjs: kontrola 46 produktów; istniejący workflow rozszerzony o testy SEO/języków/PL.
- growth/scripts/benchmark.py: opcjonalny --questions umożliwia użycie nowego zestawu bez nadpisywania istniejących 60 pytań.

## Pomiary i ograniczenia
10 zapytań wyszukiwania: brak ProGames w zwróconych próbkach, nie jest to pomiar pozycji Google Polska. Dostęp do wyników Google z parametrami PL nie powiódł się. Brak GSC zgodnie z informacją właściciela. Nie zmierzono ruchu, CTR, konwersji ani wzrostu pozycji.
Przygotowano dodatkowe 30 polskich pytań bez nazwy marki. API dry-run 30/30 zakończony; rzeczywistych odpowiedzi modeli: 0 (brak odpowiednich API i zatwierdzonego budżetu). Liczba poprawnych wzmianek AI: nieznana, nie zero. Publiczny ChatGPT/Gemini/Copilot/Claude/Perplexity: nieprzetestowane. Własny retrieval nie jest dowodem widoczności.

## Uruchomienia
Z katalogu progames-redesign: npm run build, npm run test:i18n, npm run test:pl.
Z katalogu repo: python3 growth/scripts/benchmark.py --provider openai --model MODEL_ID --questions growth/pl/evaluation-questions.json --limit 30 --out growth/pl/results/NOWA-DATA.jsonl.
To domyślnie dry-run. Płatne wywołania wymagają klucza, zgody i budżetu zgodnie z growth/README.md. Monitoring istniejący działa codziennie; testy PL zostały do niego dodane. Nie uruchamiamy automatycznie płatnych testów AI.

## Kolejne 90 dni
- Dni 1–14: obserwować monitoring; po odzyskaniu GSC zweryfikować domenę, sitemap, indeksację /pl/ i stron kategorii. Zapisać bazowe kliknięcia i wyświetlenia dla PL oraz zapytań producent/zakup; nie porównywać tylko jednego dnia.
- Dni 15–30: zatwierdzić z firmą brakujące specyfikacje, zwłaszcza nowszych modeli, i aktualizować istniejące karty. Przekazać redakcjom aktualny profil oraz wyjaśnienie adresu dopiero po autoryzacji wysyłki.
- Dni 31–60: porównać w GSC dwa okresy 28-dniowe, zapytania i strony. Rozbudować istniejące poradniki wyłącznie tam, gdzie pytania klientów/GSC ujawniają brak. Po budżecie wykonać 30 neutralnych pytań API w 3 powtórzeniach, osobno dla modeli i wersji.
- Dni 61–90: sprawdzić czy /pl/ przejmuje zapytania o producenta, a kategoria o modele; ocenić zapytania ofertowe z CRM/poczty w formie zagregowanej. Zaktualizować profile partnerów, katalog i dane. Nie tworzyć kolejnych stron pod synonimy tej samej intencji.
Harmonogram jest planem działań, nie deklaracją przyszłych wykonanych publikacji. Automatyczny jest wyłącznie monitoring zapisany w Actions.

## Wykonane testy lokalne
14.10.2026: build, SEO i i18n PASS dla 263 stron; test PL PASS dla 46 kart i 46 różnych opisów. 188 porównań elementów formularza, konfiguratorów, wariantów, zdjęć i tabel względem poprzedniej produkcji nie wykazało zmian. Chromium 390/1440 px: home oraz Joker bez błędów JavaScript i poziomego przepełnienia; wybór żółtego koloru i akceptora banknotów działa. Wyniki JSON w results/. Powtórzenie przeglądarkowe: z progames-redesign uruchom node verification/check-pl-browser.cjs po instalacji Chromium dla Playwright.
