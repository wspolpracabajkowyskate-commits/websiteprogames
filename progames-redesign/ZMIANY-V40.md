# Poprawki v40

- Formularze w EN, ES, PL, DE i FR oraz oba szablony źródłowe: action mailto zastąpione przez /api/contact. Usunięto enctype text/plain; dodano autocomplete dla formularza, imienia i nazwiska, firmy oraz e-maila.
- Zachowano istniejącą obsługę JavaScript: wysyłka przez API po konfiguracji Resend albo przygotowanie wiadomości w programie pocztowym. Nie oznacza to automatycznej aktywacji Resend.
- Dodano nagłówek Strict-Transport-Security (bez obejmowania subdomen) w konfiguracji Vercel i generatorze tej konfiguracji.
- Logo Argentyny: PNG 2766616 bajtów zastąpiony WebP 155960 bajtów (800 × 800), około 94% mniej. Zachowano proporcje, wygląd i lazy loading. Usunięto dwie zastąpione wersje PNG, łącznie około 5,5 MB.
- Pozostawiono pliki źródłowe, testy i dokumentację potrzebne do dalszego utrzymania. Istniejący .vercelignore wyklucza je z publikacji.

## Weryfikacja
PASS: node verification/check-v40.cjs; sprawdzenie składni contact.js, script.js, api/contact.js, build/redirects.cjs.
Test przeglądarkowy nie został wykonany: środowisko nie ma zainstalowanego Chromium. Nie wysyłano rzeczywistych e-maili.

## Wdrożenie
Wgraj cały projekt na Vercel, łącznie z api i vercel.json. Strona musi działać pod HTTPS z prawidłowym certyfikatem; zmiana HTML nie naprawi certyfikatu ani hostingu HTTP. Na innym hostingu skonfiguruj HTTPS i przekierowanie HTTP → HTTPS osobno.
Po wdrożeniu sprawdź formularz pod adresem HTTPS, autouzupełnianie oraz rzeczywiste dostarczenie zapytania. Bezpośrednia wysyłka wymaga RESEND_API_KEY i CONTACT_FROM, zgodnie z FORMULARZ-V34.md. Bez nich nadal otwiera się program pocztowy.
