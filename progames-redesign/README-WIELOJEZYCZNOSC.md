# PRO GAMES — pięć języków

Paczka zawiera całą stronę oraz gotowe pliki statyczne do publikacji. Język domyślny to English. Dotychczasowe treści English i Español zostały zachowane.

| Język | Strona główna | Produkty | Katalogi |
|---|---|---|---|
| English | `/` | `/en/products/…html` | `/catalog.html` |
| Español | `/es.html` | `/es/productos/…html` | `/catalog-es.html` |
| Polski | `/pl/` | `/pl/produkty/…html` | `/pl/katalog.html` |
| Deutsch | `/de/` | `/de/produkte/…html` | `/de/katalog.html` |
| Français | `/fr/` | `/fr/produits/…html` | `/fr/catalogue.html` |

Każdy język obejmuje 45 produktów, stronę główną, kolekcję Boxer Standard i katalogi: łącznie 240 indeksowalnych podstron. Selektor zachowuje aktualną podstronę, parametry konfiguracji i kotwicę. Kolory, opcje wyposażenia i wybrany katalog są przenoszone przy zmianie języka.

## Publikacja

Wgraj zawartość katalogu `progames` jako katalog główny projektu, zastępując dotychczasowe pliki. Zachowaj strukturę folderów. `vercel.json` zawiera aktualne przekierowania; stare przekierowania polskiej wersji do angielskiej zostały usunięte. Strona nie wymaga serwera aplikacyjnego. Ta paczka nie została automatycznie wdrożona na działającą stronę.

## Aktualizacja treści

- EN/ES: dotychczasowe szablony w `build/templates` i dane w `products.js`.
- PL/DE/FR: pliki `i18n/*.tsv`. Każdy wiersz zawiera cztery pola rozdzielone tabulatorami: tekst źródłowy EN, PL, DE, FR.
- `core.tsv`: sekcje strony, nawigacja i kontakt.
- `product-ui.tsv`: konfigurator, kolory, kategorie, katalogi i przyciski.
- `descriptions.tsv`: opisy produktów.
- `features.tsv`: funkcje i wyposażenie.
- `meta.tsv`: metadane, opisy zdjęć i lokalizacje.
- `i18n.css`: selektor i korekty responsywności. Oryginalny arkusz `styles.css` pozostaje bez zmian.

Po edycji uruchom:

```sh
npm ci
npm run build
npm test
npm run test:i18n
```

Generator zatrzyma się, jeżeli zabraknie tłumaczenia opisu lub wyposażenia produktu. Nie edytuj ręcznie wynikowych `i18n/pl.js`, `de.js`, `fr.js` ani wygenerowanych podstron. Powstaną ponownie podczas budowania.

## Zachowane zasoby i funkcje

Zdjęcia, przypisania kolorów, logo, fonty oraz katalogi PDF pozostały oryginalne. Pliki PDF nie były tłumaczone; przetłumaczono interfejs ich przeglądania. Formularz zachowuje działanie z paczki źródłowej: przygotowuje wiadomość do `office@progames.pl` w programie pocztowym użytkownika. Nie dodano usługi wysyłania wiadomości z serwera.

Testy i ich wyniki znajdują się w `verification`. Raport: `RAPORT-JEZYKI-v26.md`.
