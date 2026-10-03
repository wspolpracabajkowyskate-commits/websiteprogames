# Weryfikacja v8

Z katalogu głównego strony:

```sh
npm install
npm run build
npm test
```

Testy DOM, plików i SEO przeszły: publication-results.json oraz trade-map-test-results.json. Lokalna kontrola HTTP: http-results.json. Manifest zasobów: asset-manifest.json.

Opcjonalny test prawdziwej przeglądarki:

```sh
npx playwright install chromium
python3 -m http.server 8000
```

W drugim terminalu: `npm run test:browser`. Test blokuje zewnętrzne żądania i sprawdza strony, warianty oraz podstawowy układ. Przeglądarka dostępnego środowiska nie uruchomiła się, więc ten test NIE został zaliczony. Przed publikacją potrzebna jest również kontrola wizualna i ręczne przejście strony na komputerze i telefonie. Lokalny serwer Python nie stosuje reguł vercel.json; domeny i przekierowania wymagają osobnego sprawdzenia na hostingu.
