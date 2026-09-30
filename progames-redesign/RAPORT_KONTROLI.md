# Kontrola Pro Games Poland — wersja v6

Data: 1 października 2026 r.

## Zmiana v6 — grupa Boxer Standard

Na stronie głównej 15 modeli Standard zastąpiono jedną kartą „Boxer Standard”. Lista główna zawiera 28 kart (27 pojedynczych produktów + 1 kolekcja). Kliknięcie grupy prowadzi do osobnej strony z 15 modelami, w kolejności z przekazanych zrzutów: Joker, POW Boxer, Champion, Easy, Cyber Punch, Gladiator, MMA, Black Jack, Super Hero, Power Black, Poison Squad, Hacker, Strongman, Viking, Disco.

Nowe strony: `boxer-standard.html` i `boxer-standard-es.html`. Każdy model prowadzi do swojej dotychczasowej karty z kolorami. Zdjęcia okładkowe na stronie kolekcji odpowiadają wybranym wariantom, a link otwiera ten sam kolor. Na karcie produktu jest powrót do grupy Boxer Standard. Wyszukiwarka główna odnajduje kolekcję także po nazwach jej modeli; osobna wyszukiwarka kolekcji zawęża listę 15 modeli. Formularz zapytania nadal zawiera wszystkie 42 modele.

Testy DOM v6: 28 kart na obu stronach głównych, dokładny skład i kolejność 15 modeli, wszystkie 30 linków do modeli (EN/ES), zgodność miniatury i otwieranego zdjęcia, linki powrotne, wyszukiwanie/reset i przełączniki języka — OK. Ponownie przeszły 444 testy wariantów na 84 kartach produktowych. Weryfikacja wizualna układu w pełnej przeglądarce nadal pozostaje niepotwierdzona; nie publikowano strony na domenie.

## Zachowane poprawki v5

Poprawiono bazę wszystkich 42 produktów na podstawie przekazanych plików, nazw oryginalnych zdjęć w galeriach starej strony oraz oględzin zdjęć. Jest 222 wariantów zamiast 149: zmieniono 97 etykiet/przypisań nazw i dodano 73 pominięte warianty. Liczba obejmuje kolory, wzory oraz pojedyncze wersje modeli; nie oznacza 222 różnych kolorów.

## Naprawy

- Nazwa koloru odpowiada zdjęciu obudowy, zamiast kolejności w galerii.
- Uzupełniono warianty wszystkich modeli z pełnych galerii. Zbliżenia i zdjęcia z targów nie są traktowane jako kolejne kolory.
- Boxer Kids: 3 wzory po 6 kolorów; Matte Airbrushed: 3 modele w czarnym macie.
- POW i komiksowe wzory widoczne w źródłowych galeriach są opisane jako osobne wzory. Zdjęcie Standard Gift z galerii Flash Gift jest dostępne we właściwym produkcie Boxer Gift.
- 222 zdjęcia są lokalne; nie wymagają pobierania z Wix ani od dystrybutora przy oglądaniu produktu. Boxer Flash zachowuje 5 zdjęć wariantów z dystrybutora wskazanego w oryginalnych plikach.
- Szybkie kliknięcia nie powodują nadpisania ostatniego wyboru starszym zdjęciem.
- Błąd pobierania pokazuje komunikat i zachowuje poprzedni zgodny zestaw zdjęcie/etykieta.
- Wybór wariantu pozostaje w adresie, przy przełączaniu EN/ES i przejściu do zapytania.
- Poprawiono zachowanie wyboru katalogu przy zmianie języka.
- Dodano stan aktywnego przycisku dla czytników ekranu, fokus klawiatury, komunikat braku wyników, zamykanie menu Escape oraz obsługę ograniczonego ruchu.
- Nieprawidłowy model pokazuje informację o braku produktu; nie podstawia po cichu Championa.
- Formularz tworzy zakodowany temat i treść wiadomości mailto. Tekst jasno informuje o otwarciu programu pocztowego.
- Usunięto niepotwierdzoną deklarację InStock ze schematu produktu.

## Wykonane sprawdzenia

| Sprawdzenie | Wynik |
|---|---|
| Porównanie galerii i wizualna kontrola zdjęć dla 42 produktów | wykonane |
| Testy DOM 42 kart × EN/ES | 84/84 |
| Przełączanie wszystkich wariantów × EN/ES | 444/444 |
| Unikalność identyfikatorów wariantów dla każdego produktu | OK |
| Dekodowanie 222 zdjęć lokalnych | OK |
| Wyścig odpowiedzi oraz błąd pobierania zdjęcia | OK w symulacji DOM |
| Link z kolorem, zmiana języka, przekazanie wariantu w linku zapytania | OK w symulacji DOM |
| Kategorie, wyszukiwanie, brak wyników, reset, otwieranie/zamykanie menu | OK w symulacji DOM |
| Przełączanie PDF i języka katalogu | OK w symulacji DOM |
| Wewnętrzne odwołania do plików HTML/CSS/JS/zdjęć/PDF | brak brakujących plików |
| Składnia JavaScript | OK |

## Ograniczenia i rzeczy do sprawdzenia przed publikacją

Nie udało się uruchomić pełnej przeglądarki lokalnej; przeglądarka zdalna blokuje lokalny adres testowy. Testów układu desktop/mobile, faktycznej obsługi dotyku i renderowania PDF w Safari/Chrome nie oznaczam jako zaliczonych. Do paczki dołączono scenariusz Playwright do uruchomienia w zwykłym środowisku z Chromium.

Formularz nie wysyła wiadomości przez serwer: otwiera program pocztowy użytkownika. Automatyczna dostawa wymaga podłączenia usługi mailowej/CRM. Nie wysyłano testowych wiadomości.

Nie publikowano zmian na progamespoland.com. Dostępność oznacza warianty pokazane w źródłowych materiałach, a nie potwierdzony stan magazynowy. Zewnętrznych odnośników partnerów i wydarzeń nie poddano pełnemu audytowi.

## Sprawdzone produkty i warianty

| Produkt | Liczba | Kolory / wzory |
|---|---:|---|
| Monster 3 in 1 Ticket | 7 | White, Orange, Yellow, Green, Blue, Red, Black |
| Monster 3 in 1 | 6 | Red, Black, White, Yellow, Blue, Orange |
| Double Hit | 7 | Red, Black, White, Orange, Blue, Yellow, Comic artwork · Red |
| Double Hit Gift | 6 | Black, Red, White, Orange, Blue, Yellow |
| Double Hit Kids | 6 | White, Black, Orange, Blue, Red, Yellow |
| Double Hit Kids Gift | 6 | White, Orange, Red, Blue, Yellow, Black |
| Double Strike 2 | 6 | Black, White, Red, Orange, Blue, Yellow |
| Joker | 7 | White, Yellow, Red, Green, Blue, Black, Orange |
| POW Boxer | 1 | Yellow |
| Champion | 6 | Orange, Yellow, Red, White, Black, Blue |
| Easy | 6 | White, Yellow, Orange, Black, Red, Blue |
| Cyber Punch | 6 | Orange, White, Red, Black, Yellow, Blue |
| Gladiator | 6 | White, Yellow, Black, Red, Blue, Orange |
| MMA | 6 | White, Black, Blue, Orange, Red, Yellow |
| Black Jack | 6 | Orange, Black, White, Red, Blue, Yellow |
| Super Hero | 7 | Green, Orange, Yellow, White, Red, Black, Blue |
| Power Black | 6 | Black, White, Yellow, Red, Blue, Orange |
| Poison Squad | 6 | Yellow, White, Orange, Red, Black, Blue |
| Hacker | 6 | Yellow, White, Blue, Orange, Red, Black |
| Strongman | 6 | Yellow, White, Blue, Orange, Red, Black |
| Viking | 6 | Orange, Yellow, White, Red, Blue, Black |
| Disco | 6 | White, Black, Yellow, Orange, Blue, Red |
| Matte Airbrushed | 3 | Standard · Matte black, Combat · Matte black, Double Hit · Matte black |
| Boxer Combat | 7 | Red, POW artwork · Blue, White, Orange, Black, Blue, Yellow |
| Boxer Fist · 3 Player | 6 | White, Yellow, Red, Black, Blue, Orange |
| Boxer Ring | 5 | Red, Black, White, Yellow, Blue |
| Boxer Combat Kids | 6 | Orange, Yellow, Black, White, Red, Blue |
| Boxer Kids | 18 | Artwork 01 · White, Artwork 01 · Yellow, Artwork 01 · Blue, Artwork 01 · Red, Artwork 01 · Orange, Artwork 01 · Black, Artwork 02 · White, Artwork 02 · Yellow, Artwork 02 · Orange, Artwork 02 · Black, Artwork 02 · Red, Artwork 02 · Blue, Artwork 03 · Yellow, Artwork 03 · White, Artwork 03 · Orange, Artwork 03 · Red, Artwork 03 · Black, Artwork 03 · Blue |
| Boxer Flash Gift | 6 | Black, Orange, Blue, White, Yellow, Red |
| Hammer | 5 | Black, Red, Blue, White, Yellow |
| Kicker | 6 | Black, White, Orange, Blue, Red, Yellow |
| Boxer Flash | 5 | Black, Red, Blue, Yellow, White |
| Boxer Gift | 6 | Black, White, Red, Orange, Blue, Yellow |
| Bouncy Castles · XS | 10 | Dino with Slide, Sea with Slide, Pirates with Slide, Sea with Roof, Princess with Roof, Pirates with Roof, Jungle with Roof, Princess with Slide, Circus with Slide, Jungle with Slide |
| Air Hockey Golden | 1 | Golden |
| Air Hockey Arctic | 1 | Arctic |
| Air Hockey Matrix | 1 | Matrix |
| Basketball Compact | 1 | Compact |
| Basketball | 1 | Standard |
| Kids Basketball | 1 | Kids |
| Kiddie Ride | 1 | Current range |
| Cyberdart | 1 | Current model |

Dokładne pary nazwa → zdjęcie, nazwy plików źródłowych i adresy galerii znajdują się w `variant-audit.json`. Podgląd wszystkich zdjęć: `KONTROLA_WARIANTOW.html`.
