# Pro Games Poland — premium redesign prototype

Gotowa, responsywna strona statyczna przygotowana do wdrożenia na Vercel.

## Uruchomienie lokalne
`python -m http.server 8080`

## Vercel
Wgraj cały katalog jako projekt statyczny. `vercel.json` jest już dodany.

## Przed produkcją
- zastąp zewnętrzne obrazy oficjalnymi plikami Pro Games i hostuj je lokalnie/CDN,
- podłącz formularz do endpointu (np. Resend / Formspree / CRM),
- podłącz aktualne PDF specyfikacji,
- uzupełnij politykę prywatności / cookies,
- zweryfikuj końcowy kolor akcentowy z pliku logo,
- dodać wersję EN jako osobny routing lub i18n,
- dodać osobne URL-e SEO dla każdego modelu zamiast query stringów.

## Technologia
HTML5 + CSS + vanilla JS. Brak ciężkiego frameworka = bardzo mały koszt JS, szybki LCP i proste wdrożenie. Kod można bezproblemowo przenieść do Next.js, jeśli później potrzebny będzie CMS lub i18n.

## Aktualizacja: pełny katalog produktów
Projekt zawiera teraz 18 modeli/rodzin produktowych z aktualnej oferty Pro Games / oficjalnego dystrybutora: Monster 3 in 1, Champion, Gladiator, Boxer Flash, Boxer Flash Gift, Boxer Ring, Boxer Combat, Boxer Fist, Boxer Matte Airbrush, Combat Matte Airbrush, Double Hit, Double Hit Gift, Double Strike, Boxer Kids Gift, Boxer Combat Kids, Double Hit Kids, Double Hit Kids Gift, Kicker i Hammer.

Zdjęcia są podpięte do aktualnych publicznych materiałów produktowych. Przed finalnym wdrożeniem produkcyjnym rekomendowane jest przeniesienie oryginalnych assetów do własnego CDN Pro Games po potwierdzeniu praw do wykorzystania.

Dodano linki PDF do katalogu maszyn 2026 i katalogu części zamiennych.


## Aktualizacja product-first
- Hero -> bezpośrednio pełna oferta produktowa.
- 29 modeli/wersji w strukturze danych.
- Jasne tło sekcji produktów.
- Konfigurator koloru na żywo na każdej karcie produktu (wizualizacja poglądowa).
- Osobna strona `/catalog.html` z viewerem PDF, katalogiem maszyn, części oraz lokalnym uploadem PDF.
- Kontakt: +48 536 068 912, office@progames.pl, ul. Rybnicka 19A, 44-335 Jastrzębie-Zdrój.
- Widoczna mapa obecności targowej.

## Contact form email delivery

The EN and ES contact forms submit to `/api/contact`. The serverless function sends every inquiry to `office@progames.pl` using Resend and sets the visitor's email as `Reply-To`. The recipient is hard-coded as `office@progames.pl`, so it cannot be changed accidentally by an environment variable.

### Vercel setup required
1. Create a Resend account and verify the `progames.pl` sending domain.
2. In Vercel → Project → Settings → Environment Variables add:
   - `RESEND_API_KEY` = your Resend API key
   - `CONTACT_FROM` = `Pro Games Website <website@progames.pl>` (optional; already the default)
3. Redeploy the project.

Without `RESEND_API_KEY`, the form intentionally returns an error instead of pretending the message was sent.
