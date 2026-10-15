# Widoczność zewnętrzna ProGames — kontrola 2026-10-13

Status badania: **Wykonane i zweryfikowane w zakresie wyszukiwania publicznych źródeł**. Działania wobec partnerów: **Przygotowane, ale niewdrożone**. Nie wysłano wiadomości, nie edytowano profili zewnętrznych. Rejestr URL, dat i pewności: `sources/external-register.json`.

## Najważniejszy wynik

Marka ma już autentyczny ślad branżowy. Profil IAAPA identyfikuje PRO-GAMES POLAND jako producenta i podaje adres Rybnicka 19a w Jastrzębiu-Zdroju oraz telefon zgodny z witryną firmy [EXT-01]. Organizator IAAPA Europe 2026 publikuje profil wystawcy ze stoiskiem S2201 [EXT-02]. UPlay America na własnej stronie deklaruje wyłączną dystrybucję Pro-Games Poland w Amerykach; to samo powiązanie występuje w profilu Amusement Expo 2026 [EXT-03, EXT-04]. Są to wartościowe punkty oparcia dla poprawnej identyfikacji firmy.

To nie dowodzi obecności w wiedzy bazowej modeli ani określonej pozycji w Google. Narzędzie wyszukiwania zwróciło oficjalne strony EN/PL, stronę producenta, dystrybucji i poradników. Odczyt strony głównej narzędziem `open` zakończył się błędem mimo pełnego wyniku wyszukiwania. Nie należy na tej podstawie deklarować awarii strony ani blokady wszystkich botów.

## Źródła i konkretne niespójności

| Źródło | Ustalenie | Działanie |
|---|---|---|
| IAAPA Marketplace | Producent, zgodny adres i telefon, odnośnik nadal `http://www.progames.pl` | Przy aktualizacji profilu ustawić `https://www.progamespoland.com/`; zachować działające przekierowanie starej domeny. |
| IAAPA Europe 2026 | Wystawca PRO-GAMES POLAND, S2201, link do starej domeny | Ujednolicić nazwę wyświetlaną, opis i URL; zachować historyczny kontekst targów. |
| UPlay America | Wyraźna relacja producent–dystrybutor, oferta podobnych modeli | Utrzymać wzajemne linki i wspólne identyfikatory modeli; nie kopiować regionalnych gwarancji do globalnej oferty. |
| PrimeTime Amusements | Modele m.in. Boxer Combat przypisane do pola „Manufacturer: UPlay America” [EXT-05] | Uzgodnić z partnerem rozróżnienie producent ProGames / dystrybutor UPlay, o ile odzwierciedla umowy dla danego SKU. Nie zmieniać cudzej strony samodzielnie. |
| Parkmag, relacja 2024 | Historyczne potwierdzenie produktów i obecności na IAAPA; nazwy bywają skrócone lub zawierają literówki [EXT-06] | Zachować artykuł jako źródło historyczne; aktualne nazwy brać z kart producenta. Materiał nie potwierdza bieżącej dostępności wszystkich modeli. |
| Funboxer | Deklaracja dystrybucji w Holandii znaleziona w indeksie; bezpośredni odczyt timeout [EXT-07] | Zweryfikować aktualne upoważnienie u ProGames przed dodaniem do zatwierdzonej listy partnerów. |
| Festi Market | Kategoria ProGames w wynikach wyszukiwania [EXT-08] | Traktować jako sprzedawcę prezentującego markę, nie dowód oficjalnej autoryzacji. |

Nie utożsamiać domeny `progames-online.com` opisującej gry karciane ani hiszpańskiej spółki Progames Málaga z producentem z Jastrzębia-Zdroju bez odrębnych dowodów. W szerokich zapytaniach występują podobne nazwy; opis firmy powinien zawsze łączyć nazwę z krajem, automatami arcade i domeną oficjalną.

## Faktycznie wykonane wyszukiwania

2026-10-13 użyto dwóch systemów wyszukiwania dostępnych w narzędziu web, nie bezpośredniego konta Google ani eksportu SERP. Zapytania:

- `"ProGames" boxing machines distributor`
- `"ProGames" IAAPA manufacturer`
- `producent automatów bokserskich Polska`
- `boxing arcade machine manufacturers Poland Europe`
- `site:iaapa.org "Progames"`
- `"UPlay America" "ProGames"`
- `site:progamespoland.com`
- `"ProGames" "distributors" boxing`
- `"Uplay America" boxer machines official`
- `"producent automatów bokserskich" ProGames`
- `"boxing machine manufacturer" ProGames`

Wyniki zbiorcze pierwszych czterech zapytań zawierały ProGames w źródłach branżowych i dystrybucyjnych oraz Kalkomat, Ritter Bros, JackManTech, AM Boxing i NatPol. Ponieważ narzędzie łączy wyniki partii, nie przypisujemy każdemu wynikowi pozycji lub konkretnego pojedynczego zapytania. Dalsza partia z `site:` potwierdziła odnajdywalność oficjalnej domeny i podstron. Zapytania markowe zwróciły trafne strony EN i PL. Nie zmierzono udziału marki w odpowiedziach konsumenckich ChatGPT, Gemini, Claude, Copilot ani Perplexity.

## Konkurencja i intencje

| Obserwowany podmiot / oficjalny URL | Widoczny sposób opisu | Wniosek dla ProGames |
|---|---|---|
| Kalkomat — https://www.kalkomat.com/ | Kategorie boxer/kicker i rozpoznawalne modele [EXT-09] | Budować stabilne karty modeli i kategorię, a nie tylko filtrowalną galerię. |
| Ritter Bros — https://ritterbros.com/arcade-boxing-machine-for-sale/ | Osobna strona transakcyjna łącząca zakup i europejskiego producenta [EXT-10] | Wykorzystać istniejącą stronę producenta i ofertę B2B; nie mnożyć niemal identycznych landing pages. |
| JackManTech — https://jackmantech.com/ | Producent i operator, różne modele współpracy [EXT-11] | Wyjaśnić własny proces zakupu i obsługę dystrybutorów; nie obiecywać wynajmu ani podziału zysku, jeśli niepotwierdzone. |
| AM Boxing — https://www.boxers.pl/pl | Oferta automatów oraz części [EXT-12] | Połączyć kartę produktu z katalogiem części i właściwym kontaktem serwisowym. |

Dobór priorytetów jest oceną intencji, nie pomiarem wolumenu: `producent automatów bokserskich` / `boxing arcade machine manufacturer` → istniejące strony producenta; `automat bokserski` / `commercial boxing machine` → kategoria i modele; nazwa konkretnego modelu → karta; `boxing machines for distributors` → istniejąca strona hurt/dystrybucja; części/specyfikacje → katalog i karta produktu. Unikać samego `boxing machine` w izolacji, bo wyniki mogą dotyczyć również pakowania przemysłowego.

## Działania o najwyższym wpływie

1. Dostarczyć administratorom IAAPA i partnerom jeden zatwierdzony opis PL/EN, URL .com, nazwę prawną i mapę aktualnych modeli. Wysyłka wymaga oddzielnej autoryzacji użytkownika; materiał poniżej jest gotowy do przeglądu.
2. Uzgodnić z UPlay i dalszymi sprzedawcami producenta vs dystrybutora oraz regionalne aliasy produktów. Nie mieszać wymiarów, napięcia ani gwarancji różnych rynków.
3. Udostępniać materiały prasowe o realnych premierach: zatwierdzona karta, zdjęcia z prawem publikacji, katalog, potwierdzona obecność targowa. Dla Orlando 2026 nie podawać numeru stoiska, jeśli jeszcze brak potwierdzenia organizatora.
4. Uzupełniać istniejące relacje branżowe o aktualne linki produktowe; nie kupować pozornych recenzji ani list „najlepszych producentów”. Wykryty ranking NeoFuns jest materiałem konkurenta, nie niezależnym pomiarem jakości lub udziału rynkowego.
5. Co miesiąc porównywać tę samą listę zapytań oraz osobno zestaw AI: zapisać datę, narzędzie/model, język, odpowiedź, cytowania i błędy. Zmianę pozycji Google badać przez Search Console, a nie kolejność wyników tego narzędzia.

## Gotowy opis dla profili — do zatwierdzenia, nie wysłano

**PL:** ProGames Poland to producent automatów bokserskich i urządzeń rozrywkowych z Jastrzębia-Zdroju. Oficjalna strona przedstawia modele bokserskie, urządzenia łączące różne gry oraz ofertę części i kontakt do serwisu. Aktualne modele, dostępne konfiguracje i katalogi: https://www.progamespoland.com/pl/. Zapytania handlowe: office@progames.pl. [EXT-01, EXT-13]

**EN:** ProGames Poland is a manufacturer of boxing arcade machines and amusement equipment based in Jastrzębie-Zdrój, Poland. Its official website presents boxer models, combined-game machines, product catalogues, spare-parts information and service contacts. Explore the current range and request a configuration-specific quotation at https://www.progamespoland.com/. Sales: office@progames.pl. [EXT-01, EXT-13]

Materiał redakcyjny do przygotowania z działem produktowym: „Jak wybrać konfigurację automatu bokserskiego do konkretnego lokalu” — udokumentowane wymiary i zasilanie, dostęp do serwisu, opcje płatności per model, porównanie dwóch aktualnych urządzeń. Brak danych o zarobkach i trwałości wyklucza twierdzenia o gwarantowanym ROI czy bezawaryjności.
