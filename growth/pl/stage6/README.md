# Etap 6 — 2026-10-14

## Wykonane lokalnie i zweryfikowane
Rozbudowano dwa istniejące poradniki: wybór automatu (nowa sekcja stanowiska w salonie i formatów gry) oraz cena (porównanie zakresu ofert, kosztów jednorazowych i bieżących). Dodano wzajemne linki do nowych sekcji. Nie tworzono nowej strony o powielonej intencji. Kategoria i istniejący hub już linkują oba poradniki; sitemap i canonical pozostają prawidłowe, bo adresy nie zmieniły się.

Build oraz SEO/i18n/PL PASS: 263 strony, 6095 odnośników, 755 obiektów JSON-LD, 46 polskich produktów. Źródło zmian: build/pl-growth.json; wynik: dwie strony HTML. Zachowano istniejące tytuły, H1 i meta description odpowiadające szerszej intencji każdego poradnika. Porady operacyjne nie stanowią nowych deklaracji parametrów produktów.

## Luki i podział intencji
1. Plan stanowiska w salonie i opis wymagań klienta — uzupełniono poradnik wyboru.
2. Porównywanie ofert o różnym zakresie i kosztów użytkowania — uzupełniono poradnik ceny.
3. Studium rzeczywistej instalacji — wymaga danych operatora i zgody; nie publikowano fikcyjnego przypadku.
Nie dodano kolejnych poradników o zasadzie działania, barach ani montażu: istniejące strony już obsługują te tematy. /pl/ pozostaje stroną producenta, kategoria stroną modeli, poradniki odpowiadają na pytania zakupowe.

## Konkurencja i obserwacje
NatPol (https://natpol.com.pl/automaty-silowe/) porządkuje urządzenia siłowe i różne formaty gry. AM Boxing (https://www.boxers.pl/pl) łączy ofertę z częściami zamiennymi. Kalkomat (https://www.kalkomat.com/) prezentuje rodziny bokserów i kopaczy. MagicPlay (https://magicplay.pl/?4,pl_boxer-20=) dostarcza informacje o konkretnym modelu i opcjach. Ogłoszenia OLX oraz Allegro mieszają urządzenia komercyjne z akcesoriami i sprzętem domowym. Wniosek: ProGames powinno ułatwiać wybór komercyjnego modelu i zakresu zamówienia, zamiast powielać ogólne opisy. Nie ustalono przyczyn rankingowych ani profilu backlinków konkurencji.

search-observations.json zawiera osobne wyniki 8 fraz i 5 pytań, dokładne URL i datę. Domena ProGames wystąpiła dla 6/8 fraz i 4/5 pytań. To publiczne wyszukiwanie dostępnym narzędziem, nie zweryfikowany SERP Google Polska, nie pozycje i nie odpowiedzi modeli AI. Nie znaleziono jej w próbce dla „automat bokserski”, „automat do mierzenia siły ciosu” oraz pytania o produkowane w Polsce automaty do mierzenia siły. Nie dowodzi to globalnej nieobecności. Nie ma pomiaru wzrostu po zmianach.

## Autorytet
15 miejsc w outreach-prospects.json/md; istniejące wzmianki oddzielono od niepotwierdzonej obecności. Opisy i wiadomości w editorial-drafts.md. Nowe pozyskane linki: 0. Wysłane wiadomości: 0. Zaktualizowane profile: 0. Brak dostępu administracyjnego do profili. Nie traktować źródeł sponsorowanych jako gwarancji SEO; warunki i oznaczenia ustalić z wydawcą.

## Dostęp i pomiar
GSC nieużywane zgodnie z prośbą. ChatGPT Search, Gemini, Claude Search, Perplexity i Copilot: brak wykonanych testów odpowiedzi; nie zastępuje ich zapis wyszukiwania. Istniejący benchmark API pozostaje dostępny w growth/scripts/benchmark.py; nie uruchamiano płatnych zapytań. Monitoring GitHub Actions zachowany.

## Trzy kolejne działania
1. Zatwierdzić nadawcę i wysłać dopasowane propozycje Parkmag/Interplay oraz zaktualizować istniejący profil IAAPA przez uprawnionego przedstawiciela.
2. Zebrać z prawdziwej instalacji dane o wymaganiach, wyborze modelu i obsłudze; przygotować studium za zgodą klienta.
3. Co miesiąc powtórzyć identyczne zapytania i sprawdzić nowe publikacje, dostępność stron i zapytania ofertowe; nie porównywać odmiennych silników jako jednego rankingu.

Naprawiono idempotencję build/pl-growth.cjs: przy ponownym buildzie nie dopisuje już drugi raz linku B2B, gdy docelowy tekst zawiera pierwotny fragment.
