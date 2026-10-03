# SEO — Pro Games v12

Wdrożono i sprawdzono dla 90 stron EN/ES:
- Unikalne tytuły i opisy meta, bez zmiany opisów produktów widocznych na stronie.
- Canonical oraz wzajemne hreflang EN, ES i x-default.
- Dane JSON-LD: Organization, WebSite, WebPage/CollectionPage, Product, BreadcrumbList i ItemList.
- Logo firmy, dane sprzedaży i serwisu oraz oficjalne profile społecznościowe w danych organizacji.
- Open Graph i Twitter Cards, opisy obrazów oraz alternatywny język podglądu.
- sitemap.xml: 90 kanonicznych adresów, powiązania językowe i zdjęcia produktów.
- robots.txt i przekierowania dawnych adresów zachowane.

Domena kanoniczna: https://www.progamespoland.com — ustawiana w site-config.js.
Po zmianie domeny uruchom npm run build. Nie publikuj z inną domeną kanoniczną niż docelowa.

Po wgraniu plików: zgłoś https://www.progamespoland.com/sitemap.xml w Google Search Console. Zgłoszenie, indeksacja i pozycje Google nie są częścią wykonanej edycji plików.

Kontrola: build i testy przeszły; 90 unikalnych tytułów i opisów, poprawny XML, 444 przełączenia wariantów i 1350 linków. Wygląd nie był ponownie sprawdzany w przeglądarce. Jedyna zmiana wizualna v12 to przeniesienie emblematu przed napis w stopce.

Dokumentacja Google:
https://developers.google.com/search/docs/specialty/international/localized-versions
https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
