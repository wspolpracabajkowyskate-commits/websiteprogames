# v27 — spójny nagłówek mobilny

## Wprowadzona zmiana

Wszystkie wersje EN / ES / PL / DE / FR korzystają teraz z tej samej siatki nagłówka przy szerokości do 640 px. Kreska, krótki napis nad tytułem, obie linie tytułu, opis i przyciski mają wspólne pozycje i wymiary kontenerów. Przyciski mają jednakową wysokość, szerokość i rozmiar tekstu. Dłuższe słowa w tytule mają odpowiednio dopasowaną wielkość fontu, bez przesuwania kolejnych elementów.

Przyczyną wcześniejszego przesuwania było wyrównanie całego bloku do dołu sekcji, podczas gdy wysokość bloku zależała od długości tłumaczenia. Wersja v27 rezerwuje wspólne miejsce dla poszczególnych elementów.

Nie zmieniono treści, grafik, kolorów produktów ani konfiguratora. Zmiana układu dotyczy mobilnego nagłówka strony głównej. Desktop zachowuje wcześniejszy układ.

## Sprawdzenie

- 5 języków × 8 szerokości: 320, 360, 375, 390, 414, 430, 480 i 640 px.
- 40 widoków ze sprawdzeniem zgodności współrzędnych X/Y oraz wymiarów elementów; tolerancja poniżej 0,1 px.
- Brak poziomego przepełnienia nagłówka i strony w tych widokach.
- Wspólne wymiary obu przycisków, bez zmiany wysokości przy dłuższej etykiecie.
- Sprawdzone rzeczywiste przejście przez listę wszystkich pięciu języków.
- Brak błędów JavaScript w tej kontroli.
- Zachowana treść EN/ES: porównanie z zapisanymi sumami kontrolnymi.
- Przeprowadzony przegląd głównych sekcji strony: produkty, produkcja, zastosowania, dystrybutorzy, targi, części i kontakt.

Testy wykonano w Chromium. Skrypt: `verification/hero-v27.cjs`. Wyniki: `verification/hero-v27-results.json`. Zrzuty: `verification/hero-v27-*.png`.

## Propozycje dodatków — niewdrożone

1. **Udostępnij konfigurację.** Mały przycisk przy podsumowaniu kopiuje link do konkretnego modelu, koloru i wyposażenia. Obecny adres już przechowuje te wybory, więc można wykorzystać istniejącą funkcję. W razie braku dostępu do schowka można pokazać pole z adresem do ręcznego skopiowania.
2. **Zobacz automat w akcji.** Przycisk przy zdjęciu produktu otwiera krótki, prawdziwy film z urządzeniem: uderzenie, światła, wynik. Film ładuje się dopiero po kliknięciu. Potrzebne byłyby nagrania rzeczywistych maszyn.
3. **Delikatna reakcja wyboru koloru.** Krótka animacja obramowania aktywnej próbki oraz aktualizacja podsumowania podkreślają, że wybór został przyjęty. Bez przesuwania zdjęcia; z respektowaniem ograniczenia animacji ustawionego przez użytkownika.
4. **Umów spotkanie przy targach.** Mały link obok nadchodzącego wydarzenia prowadzi do zapytania z wpisaną nazwą targów. To naturalne uzupełnienie istniejącej mapy i listy, bez dodawania dużej sekcji.
5. **Porównaj modele.** Większy, opcjonalny kolejny krok: zestawienie 2–3 maszyn według wymiarów, rodzaju gry i wyposażenia. Pokazywać wyłącznie potwierdzone dane; dla brakujących parametrów pozostawić informację o kontakcie z działem sprzedaży.

Najpierw warto rozważyć udostępnianie konfiguracji i subtelną reakcję wyboru koloru. Krótkie filmy dałyby największą zmianę w sposobie prezentowania samych urządzeń.

## Wdrożenie

Paczka zawiera całą stronę, nie samą poprawkę. Arkusz `i18n.css` ma nowy parametr wersji, aby przeglądarka pobrała aktualne style po wdrożeniu. Zmiana jest uwzględniona w generatorze, więc pozostanie po `npm run build`. Nie opublikowano jej automatycznie na publicznej domenie.
