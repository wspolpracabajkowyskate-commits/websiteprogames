# ProGames AI Knowledge — 2026-10-13

Pakiet roboczy gotowy do utworzenia repozytorium `progames-ai-knowledge`. Nie opublikowano zdalnego repozytorium ani zmian produkcyjnych.

## Uruchomienie
Wymagany Python 3.10+; prototyp bez dodatkowych bibliotek i bez opłat API.
```sh
python scripts/validate_knowledge.py
python -m unittest discover -s tests -v
python scripts/retrieval.py "Boxer Flash" --limit 3
python scripts/retrieval.py --serve --port 8765
```
API lokalne: `http://127.0.0.1:8765/health`, `/search?q=Boxer%20Flash`, `/products`.
To wyszukiwanie dowodów z cytowaniami; nie uruchomiono modelu generatywnego ani treningu.

## Zawartość
- company/products/sources/schemas: 46 produktów, 9 dystrybuowanych, źródła i braki danych. Status źródłowo sprawdzone, oczekuje zatwierdzenia właściciela.
- ai-training: 60 pytań (30 PL/30 EN), pilot 16 rozmów treningowych i 6 walidacyjnych, instrukcje modeli, protokół pomiaru. Pilot nie jest zatwierdzonym zbiorem produkcyjnym.
- rag/scripts/tests: działające lokalne pobieranie wiedzy i testy.
- seo: audyt, pomiary HTTP i mapa intencji fraz bez fikcyjnych wolumenów.
- implementation: patch dla websiteprogames, wyniki testów, instrukcja zastosowania i ograniczenia dostępu.
- ai-search/automation/agents: aktualne mechanizmy crawlerów, źródła, proces aktualizacji i role.

Zacznij od RAPORT.md. Nie publikuj automatycznie całej paczki jako treści witryny: surowe źródła, testy i raporty są zapleczem redakcyjnym.

## Bezpieczeństwo aktualizacji
Katalog jest wersjonowanym źródłem prawdy. Zmiany danych wymagają ponownej kontroli źródeł. Odczyt strony potwierdza jej treść, nie niezależnie wszystkie twierdzenia producenta. Nie wymyślaj cen, certyfikatów, kompatybilności opcji ani producenta produktów dystrybuowanych. Linki EN wymagają wdrożenia poprawki 404; źródło danych products.js zachowano osobno.
