# PRO GAMES v21 — konfigurator, nowe modele i targi

## Konfigurator wszystkich 45 produktów (EN / ES)
Pod kolorami umieszczono wybór Additional bank-note acceptor, Additional coin slot, Custom stickers, Internet Wi-Fi Boxnet, 5-meter power cable i Ticket Dispenser. Bez opcji Air brush. Własne lekkie ikony SVG, natywne pola checkbox i obsługa klawiatury. Można zaznaczyć oba rodzaje płatności. Brak zaznaczenia oznacza omówienie konfiguracji standardowej, nie brak systemu płatności.

Podsumowanie aktualizuje model, kolor i opcje. Wybory pozostają w URL, przetrwają odświeżenie i zmianę języka. Przycisk przenosi bezpośrednio do formularza, z podsumowaniem i możliwością powrotu do edycji. Treść e-maila zawiera wszystkie wybory oraz Yes/No dla dodatków. Zmiana produktu w formularzu usuwa konfigurację poprzedniego modelu.

Wiadomość nadal jest przygotowywana w aplikacji pocztowej klienta, do office@progames.pl. Strona informuje o konieczności jej wysłania w tej aplikacji. Nie dodano serwerowego endpointu ani nie wysyłano wiadomości testowych. Dostępność wyposażenia dla konkretnego urządzenia potwierdza sprzedaż.

## Nowe modele NEW 2026
- Hammer 2026 — jeden wariant multikolor; nowy model dodany obok dotychczasowego Hammer.
- Win a toy — Black, Red, Blue, Yellow, Green, Orange, White, Pink.
- Boxer Leader Rank — Black, Red, Blue, Yellow, Green, Orange, White.

Użyto dokładnie 16 zdjęć użytkownika, bez generowania nowych wersji kolorystycznych. Mapowanie źródeł: verification/new-products-v21.json. Opisy są robocze EN/ES. Wymiary, masa, zasilanie i pobór mocy oznaczono „To be confirmed / Por confirmar”; nie wpisano fikcyjnych liczb. Dane można edytować w products.js i odtworzyć przez npm run build.

## Mapa targów
Dodano wydarzenia ze zrzutów użytkownika:
- Family Entertainment Expo, Fiera di Bergamo, 24–26 lutego 2026, B9.
- Amusement Expo International, Las Vegas Convention Center, 18–19 marca 2026, 1901.
Pozostawiono London i Orlando. Mapa/lista zawiera cztery wydarzenia i automatycznie określa status według daty w Warszawie.

## Testy i wdrożenie
96 stron, w tym 90 kart produktów. Test przeglądarkowy: 454 przełączenia wariantów, brak błędów JS. Testy konfiguratora: EN/ES, 360/390/768/1440 px; zaznaczanie i odznaczanie, kolor, odświeżenie, język, edycja, formularz i przechwycenie treści e-maila bez wysyłki. Testy statyczne: 474 kontrole wariantów, 1532 linki. Wyniki w verification/v21/.

Wgraj zawartość folderu progames. HTML i dane są już wygenerowane. Zaktualizowane JS/CSS mają parametr v=21, ale po wdrożeniu warto wyczyścić cache starych plików HTML na hostingu. Zachowano wcześniejszą optymalizację v20; dawny raport wydajności dotyczy v20, nie jest nowym pomiarem v21.
