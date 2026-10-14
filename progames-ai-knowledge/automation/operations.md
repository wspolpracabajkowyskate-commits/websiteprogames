# Aktualizacja i pomiar
Status: przygotowane, niewdrożone. Żaden harmonogram ani płatny test nie został uruchomiony.

Źródło zmiany: pull request w websiteprogames lub zatwierdzona karta techniczna. Pobieranie tworzy kandydaturę danych, nie automatyczne zatwierdzenie prawdy. Zachować wersję, hash, URL, czas i różnicę wartości.

Przebieg: pobranie → walidacja schematu/konfliktów → przegląd zmian cen, parametrów i producenta → akceptacja człowieka → nowa wersja katalogu → budowa lokalnego indeksu → testy retrieval → opcjonalny benchmark modeli z limitem budżetu → zapis metryk → review publikacji.

Automatycznie: sprawdzanie składni, źródeł, unikalności ID, linków lokalnych, budowa indeksu i regresja na zatwierdzonej wersji. Człowiek: sprzeczne dane, nowe parametry, deklaracje zgodności, ceny, publikacja zmian, zakup usług, kontakt z partnerami.

CI w .github/workflows jest szablonem do uruchomienia po publikacji repozytorium. Dla łączenia dwóch repo użyć minimalnego uprawnienia contents:read dla źródła i pull-requests:write / contents:write tylko dla repo wiedzy. Nie przechowywać kluczy w JSONL.

Pomiar SEO: Search Console property https://www.progamespoland.com/ lub zweryfikowana domena, uprawnienie odczytu searchconsole.readonly. Eksport tygodniowy po date/query/page/country/device, osobno PL/EN; kliknięcia, wyświetlenia, CTR, średnia pozycja ważona wyświetleniami. Nie porównywać pozycji jako stałego rankingu. URL Inspection read-only dla reprezentatywnych produktów. GA4: zdarzenie lead po potwierdzonym sukcesie istniejącego formularza, nie po samym kliknięciu. W tym projekcie formularzy nie zmieniano.

CWV: CrUX/GSC p75 LCP, INP, CLS z okna 28 dni oddzielnie mobile/desktop. Brak danych nie jest wynikiem zero. Lighthouse to laboratorium, nie dane terenowe. W tym przebiegu CWV nie zmierzono.

AI: stałe 60 pytań, niezależne świeże sesje, zapisana wersja modelu, tryb search/no-search, język, czas, koszt i surowa odpowiedź. Co najmniej 3 powtórzenia na pytanie dla stabilności; oddzielny mianownik dla grupy A, bez ProGames w system prompt. Test z instrukcją ProGames nie mierzy spontanicznej rozpoznawalności. Ręczna ocena faktów i cytatów; null dla niewykonanych testów. Nie uruchamiać automatycznie płatnych wywołań bez budżetu.
