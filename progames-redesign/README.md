# Pro Games Poland v9

Statyczna strona PL/EN/ES: 42 produkty, 222 warianty, kolekcja 15 Boxer Standard, mapa targów i 135 indeksowalnych stron HTML. Wszystkie zdjęcia, fonty, mapa i katalogi są lokalne.

Uruchomienie: `python3 -m http.server 8000`, następnie http://localhost:8000. Publikuj w katalogu głównym domeny, zachowując strukturę plików. Serwer nie wymaga Node.js; gotowe HTML są już w paczce.

Źródła: build/templates, products.js, pl-content.js, script.js, product.js, trade-map.js, styles.css. Po zmianach szablonów lub danych uruchom `npm install`, następnie `npm run build` i `npm test`. Generator odtwarza HTML i przekierowania. Ustawienia domeny: site-config.js.

Konfiguracja Vercel: vercel.json. Dla innego hostingu zastosuj build/redirects.csv. Samo wgranie HTML nie konfiguruje DNS ani przekierowań serwera.

Pełny zakres kontroli i ograniczenia: RAPORT_KONTROLI.md. Test rzeczywistej przeglądarki pozostaje do wykonania. Formularz korzysta z programu pocztowego użytkownika (mailto), bez wysyłki serwerowej. Strona nie została publicznie wdrożona.

AUDIT_AND_IA.md zawiera historyczne notatki projektu; aktualny raport to RAPORT_KONTROLI.md.

## Korekta opisów v9

Opisy 37 produktów przeniesiono z poprzedniej strony bez przeredagowywania tekstu angielskiego; PL i ES są wiernymi tłumaczeniami. Dla 5 modeli bez opisu źródłowego usunięto niepotwierdzone treści i parametry. Szczegóły: ZGODNOSC_OPISOW_v9.md. Test porównawczy: verification/check-product-copy.cjs.
