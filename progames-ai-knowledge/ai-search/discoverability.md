# Cztery mechanizmy wiedzy AI

Stan: 2026-10-13. Status: **Wykonane i zweryfikowane** — badanie dokumentacji; nie pomiar widoczności wszystkich systemów.

## 1. Trening modelu bazowego

Publiczna publikacja nie aktualizuje automatycznie parametrów modelu. Firma kontroluje jakość swoich źródeł i dostęp do nich, natomiast dobór danych, harmonogram treningu oraz zachowanie modelu zależą od dostawcy. Oficjalne strony, autentyczne katalogi i wiarygodne wzmianki mogą stanowić materiał wejściowy; nie ma gwarantowanej ścieżki „dodaj firmę do wszystkich AI”. Patrz rozróżnienie robotów treningowych i wyszukujących w `crawler-policy.md`.

## 2. AI Search / retrieval

Google wymaga do linkowania w AI Overviews i AI Mode strony zaindeksowanej i uprawnionej do wyświetlania fragmentu wyniku. Nie wymaga dodatkowego „AI schema”. Zwykłe SEO, tekstowa treść, linki wewnętrzne i zgodność danych strukturalnych z widoczną treścią pozostają podstawą. Spełnienie wymagań nie gwarantuje indeksacji ani cytowania. Źródło: https://developers.google.com/search/docs/appearance/ai-features (odczyt 2026-10-13).

Rekomendacja projektu: najpierw sprawdzić rzeczywisty HTML produktów, canonical, języki, statusy oraz kompletność opisów, następnie mierzyć cytowania. Dostępny HTML/SSG/SSR upraszcza odbiór treści przez różnych klientów. Nie twierdzimy, że Google nie potrafi renderować JavaScript ani że SSR samodzielnie poprawia ranking.

## 3. Własny RAG

Wyszukiwanie w zatwierdzonym katalogu i przekazanie wyników modelowi daje aktualizacje bez treningu. Zachowywać ID źródeł, daty, wersję katalogu i odpowiedź „brak potwierdzenia”. Pierwszy etap może działać bez wektorowej bazy: nazwy, aliasy, indeks tekstowy, zwracane fragmenty i linki. Indeks semantyczny dodać dopiero, gdy testy wykażą istotne braki wyszukiwania. To rekomendacja projektowa, nie twierdzenie o wdrożeniu u dostawców.

## 4. Własny fine-tuning

Dostrajanie służy przede wszystkim zachowaniu, formatowi i powtarzalności wyspecjalizowanych odpowiedzi. Dla zmiennych cen i parametrów nadal potrzebuje źródła aktualnych danych. Nie wpływa na publiczne odpowiedzi innych użytkowników ChatGPT/Claude/Gemini. Dostępność i cenniki: `../ai-training/research.md`.

## Pomiar

Oddzielić: (a) wyszukiwarkę i znalezione strony, (b) odpowiedzi modelu bez wyszukiwania, (c) model z wyszukiwaniem, (d) własny RAG. Nie traktować wyników jednej wyszukiwarki jako wyników Google albo testu publicznego ChatGPT. W seriach zachować model/version, tryb, datę, język, prompt, surową odpowiedź, cytowania, ocenę faktów i wersję bazy. Wyniki nieuruchomione oznaczać null, nigdy 0%.
