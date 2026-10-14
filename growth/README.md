# ProGames — etap 3, 14 października 2026

## Stan i zakres pomiarów
- 9 niezależnych zapytań w dostępnym narzędziu wyszukiwania: w zwróconych krótkich próbkach 0 wzmianek ProGames. To nie jest ranking Google ani test odpowiedzi modeli. Surowe wyniki: results/search-baseline-2026-10-13.json.
- 60 istniejących pytań (30 PL/30 EN), bez ponownego generowania. Macierz 5 usług × 60 pytań ma 300 wpisów **not_run**, nie 300 odpowiedzi negatywnych.
- Brak API i budżetu: żadnego płatnego zapytania ani fine-tuningu. Dry-run 60 zapisów sprawdza przygotowanie testu, nie jakość modeli.
- Search Console niedostępne zgodnie z informacją właściciela. Kliknięcia, pozycje, CTR i indeksacja Google nie zostały zmierzone.
- Baza wiedzy przeniesiona z istniejącej paczki do katalogu progames-ai-knowledge. Starsze raporty zachowują historyczny stan sprzed naprawy 404; nie opisują bieżącego wdrożenia.

## Zmiany strony
Rozbudowano EN kategorię automatów o pytania zakupowe, dobór formatu, opcje, części i warunki instalacji. Strony producenta PL/EN wskazują IAAPA oraz UPlay i rozróżniają producenta od dystrybutora. Bez nowych parametrów technicznych, cen czy certyfikatów. Treści są w HTML. Generator growth-content.cjs ponownie nakłada te same sekcje przy buildzie.

## Powtarzalne polecenia (katalog główny repo)
```sh
python3 progames-ai-knowledge/scripts/validate_knowledge.py
python3 -m unittest discover -s progames-ai-knowledge/tests -v
python3 -m unittest discover -s growth/tests -v
python3 growth/scripts/monitor.py --out growth/results/local-NOWA-DATA.json
python3 growth/scripts/monitor.py --live --out growth/results/live-NOWA-DATA.json
python3 growth/scripts/benchmark.py --provider openai --model MODEL_ID --mode search --out growth/results/dry-run-NOWA-DATA.jsonl
```
Ostatnie polecenie domyślnie nie wysyła zapytań. Wykonanie wymaga klucza w zmiennej środowiskowej oraz --execute --paid-approved --budget-usd i --reserved-usd-per-request. Budżet jest sprawdzeniem planu, **nie twardym limitem kosztów po stronie dostawcy**; ustaw limit konta u dostawcy. Nie umieszczaj kluczy w repo.

## Benchmark jakości
Tryby base, instructions, rag, fine_tuned rozdzielają brak kontekstu, instrukcję, pobranie wiedzy i faktycznie dostrojony model. Search ma neutralną instrukcję bez marki. Każde pytanie jest nową rozmową. API OpenAI/Anthropic/Google nie odtwarza automatycznie aplikacji ChatGPT/Claude/Gemini. Perplexity adapter używa Agent API i obsługuje tylko search. Copilot: brak adaptera; oznaczony niedostępny.
Porównuj identyczne pytania, języki i wersje modeli, 3 powtórzenia. Obecność tekstu marki jest automatyczna; poprawność faktów, rozpoznanie firmy, halucynacje i potwierdzenie cytowań pozostają null do oceny człowieka względem rejestru źródeł. Raportuj mianowniki tylko completed, osobno błędy i not_run. Dla spontanicznych wzmianek używaj tylko grupy A i neutralnych trybów. Nie uznawaj RAG za pomiar publicznej widoczności.

## Koszty i wybór metody
Na razie wybór: aktualna baza + istniejące lokalne wyszukiwanie. Nie ma dowodu przewagi fine-tuningu. Dane 16 treningowych/6 walidacyjnych to pilotaż, nie podstawa do deklarowania wysokiej jakości.
Koszt benchmarku = liczba wywołań × tokeny wejścia/wyjścia według modelu + płatne narzędzia wyszukiwania. Przykład przy stawce wyszukiwania 10 USD/1000: 60 pytań × 2 wyszukiwania = 1,20 USD za samą usługę wyszukiwania, bez tokenów. To założenie kalkulacyjne, nie zmierzony rachunek ani zgoda na wydatki. Sprawdź aktualny cennik i uprawnienia wybranego modelu przed startem.
Dokumentacja sprawdzona 13.10.2026: https://developers.openai.com/api/docs/pricing ; https://developers.openai.com/api/docs/guides/tools-web-search ; https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool ; https://ai.google.dev/api/generate-content ; https://docs.perplexity.ai/docs/agent-api/migrate-from-sonar/how-to . Dostępność SFT zależy od konta/modelu; brak uruchomionego treningu. Prywatny model nie zmienia wiedzy publicznego ChatGPT.

## Automatyzacja
Workflow .github/workflows/progames-monitor.yml: walidacja bazy, testy, lokalny monitoring i odczyt produkcji; harmonogram 05:20 UTC, uruchamiany dopiero po obecności na main. Wyniki z datą w artefaktach Actions przez 90 dni, punkt startowy w repo. Nie wykonuje płatnych API. Nie aktualizuje automatycznie potwierdzonych faktów: rozbieżność hash produktów wymaga przeglądu źródeł i zatwierdzenia. Sam plik workflow nie dowodzi działania; wynik konkretnego uruchomienia jest rozstrzygający.

## Wiarygodność zewnętrzna
Priorytet: aktualne modele i oficjalny link w istniejącym profilu IAAPA oraz materiałach UPlay; uzgodnienie spójnego zapisu marki i roli dystrybutora. Przygotuj dla partnerów nazwę firmy, adres oficjalny, link do kategorii, aktualny katalog i potwierdzone parametry. Nie wysłano korespondencji ani nie stworzono sztucznych publikacji.
