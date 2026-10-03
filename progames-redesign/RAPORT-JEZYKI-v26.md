# Raport — pięć wersji językowych PRO GAMES

## Zakres

Dodano Polski, Deutsch i Français. English pozostaje językiem domyślnym, a Español nadal działa. Każdy język obejmuje 45 stron produktów, stronę główną, kolekcję Boxer Standard i stronę katalogów — razem 240 podstron.

Przygotowano redakcyjne tłumaczenia nagłówków, sekcji, opisów produktów, cech, wyposażenia, specyfikacji, kolorów, formularza, komunikatów, nawigacji, katalogów, mapy targów i metadanych. Nazwy handlowe modeli oraz firm zachowano.

Lista języków zawiera pełne nazwy i zaznaczenie aktywnej wersji. Działa klawiaturą, zamyka się klawiszem Escape i po kliknięciu poza listą. Przełączanie języka zachowuje model, kolor, wyposażenie, katalog i kotwicę strony.

Nowe treści są zapisane bezpośrednio w HTML — do odczytania opisów i indeksowania nie jest wymagane JavaScript. Skrypty obsługują stany interaktywne w odpowiednim języku. Uzupełniono canonical, hreflang, x-default, Open Graph, opisy oraz mapę witryny. Usunięto przekierowania, które wcześniej kierowały polskie adresy do wersji angielskiej.

## Wyniki kontroli

| Kontrola | Wynik |
|---|---|
| Teksty EN/ES w 96 stronach, poza selektorem | Identyczne z paczką źródłową |
| Zdjęcia, logo, fonty i PDF-y | Bez zmian, porównanie sum kontrolnych |
| Wszystkie 240 stron przy 360 i 1440 px | 480 widoków; brak błędów JavaScript i wykrytych przepełnień |
| Reprezentatywne strony przy 390 i 768 px | Sprawdzone dodatkowo w teście czterech szerokości |
| Każda nowa karta produktu | 135 kart: zmiana wariantu, jego nazwa, aktywne zaznaczenie i właściwe zdjęcie |
| Test danych i przełączania zdjęć wszystkich języków | 1185 kontroli wariantów |
| Linki wewnętrzne i kotwice | 4115 sprawdzeń |
| Konfigurator i przełączenie języka | Zachowane kolor i wyposażenie |
| Przejście do zapytania | Właściwy model i podsumowanie konfiguracji |
| Wyszukiwanie i czyszczenie filtrów | Poprawne wyniki i komunikaty |
| Menu mobilne i Escape | Poprawne działanie |
| Przełączanie katalogu PDF | Poprawny plik i zachowany parametr katalogu |
| Mapa targów | Pięć języków; statusy przed, podczas i po wydarzeniu |
| npm test / npm run test:i18n | Zakończone poprawnie |

Testy przeglądarkowe wykonano w Chromium. Obejmują automatyczną kontrolę układu oraz oględziny wybranych ekranów; nie są testem na każdym fizycznym urządzeniu i we wszystkich silnikach przeglądarek.

## Korekty układu

Zachowano strukturę sekcji, grafikę i oryginalny arkusz stylów. Dodatkowy `i18n.css` dostosowuje dłuższe nagłówki PL/DE/FR, karty, przyciski oraz pola konfiguracji. Filtry nowych wersji na telefonie zawijają się bez poszerzania strony. Naprawiono także istniejące przepełnienia nagłówków katalogów EN/ES na wąskich ekranach i sekcji kontaktu na desktopie, bez zmiany ich treści. Tytuł katalogów ma odpowiedni kontrast na ciemnym tle.

## Zachowane ograniczenia źródła

PDF-y pozostają oryginalnymi dokumentami; przetłumaczono interfejs ich wyboru i pobierania. Formularz otwiera program pocztowy z wiadomością do office@progames.pl — nie dodano wysyłki serwerowej. Dla modeli bez pełnych danych w paczce źródłowej zachowano prośbę o kontakt zamiast dopisywania niepotwierdzonych parametrów. Gotowe pliki nie zostały automatycznie wdrożone na publiczną domenę.
