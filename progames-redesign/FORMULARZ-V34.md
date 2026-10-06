# Formularz kontaktowy – aktywacja bezpośredniej wysyłki

Odbiorca wszystkich zapytań: office@progames.pl. Funkcja Vercel: api/contact.js.

1. W Resend zweryfikuj domenę nadawcy (zalecana wydzielona subdomena, np. powiadomienia.progames.pl). Dodaj wyłącznie rekordy podane przez Resend dla tej subdomeny. Nie zmieniaj rekordów MX obecnej poczty office@progames.pl.
2. Utwórz klucz Resend z uprawnieniem wysyłki dla zweryfikowanej domeny.
3. W projekcie Vercel websiteprogames dodaj zmienne serwerowe Production:
   - RESEND_API_KEY: klucz Resend (nie umieszczaj go w plikach JS strony).
   - CONTACT_FROM: PRO GAMES <formularz@powiadomienia.progames.pl> (adres w faktycznie zweryfikowanej domenie).
4. Wgraj cały projekt, w tym katalog api, i uruchom ponowne wdrożenie. Sam upload statycznych HTML do hostingu bez funkcji serwerowych nie uruchomi wysyłki.
5. Wyślij własne zapytanie testowe i sprawdź skrzynkę oraz log wysyłki Resend. Przycisk odpowiedzi powinien wskazywać adres klienta.

Do czasu konfiguracji formularz uczciwie działa jak wcześniej: przygotowuje wiadomość w aplikacji pocztowej. Nie pokazuje potwierdzenia wysłania wiadomości z serwera. Po aktywacji automatycznie zmienia przycisk na „Wyślij zapytanie”. Testy w paczce używają symulacji, nie wysyłają rzeczywistych wiadomości.

Kraj i kierunkowy domyślnie odpowiadają językowi (EN: Wielka Brytania, ES: Hiszpania, PL: Polska, DE: Niemcy, FR: Francja). W Vercel przybliżona lokalizacja kraju może zastąpić ten wybór, dopóki użytkownik sam nie zmieni pola. Kraj i numer kierunkowy pozostają edytowalne. Nie jest wymagane udostępnienie lokalizacji GPS.

Zabezpieczenia: walidacja serwerowa, stały odbiorca, kontrola Origin, pole pułapka, limit długości, czas oczekiwania, klucz idempotencji. Limit liczby prób działa na instancję funkcji; przy dużym spamie należy dodatkowo ustawić limit w Vercel Firewall.
Dokumentacja: https://resend.com/docs/api-reference/emails/send-email
