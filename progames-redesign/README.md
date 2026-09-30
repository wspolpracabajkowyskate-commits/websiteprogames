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
