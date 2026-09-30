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
