# Polityka crawlerów — stan 2026-10-13

Status: **Przygotowane, ale niewdrożone**. Źródła dostawców odczytano 2026-10-13. Pewność: wysoka dla opisanych funkcji; nie potwierdza to faktycznych wizyt robotów na ProGames.

| Usługa | Identyfikator | Cel i decyzja dla ProGames |
|---|---|---|
| Google Search | Googlebot | Zachować dostęp do publicznych stron, plików potrzebnych do renderowania i produktów. |
| Gemini | Google-Extended | Oddzielny token kontroli wykorzystania treści do treningu i grounding w Gemini/Vertex; nie jest oddzielnym User-Agent HTTP i nie stanowi sygnału rankingowego Google Search. |
| ChatGPT Search | OAI-SearchBot | Dostęp do publicznych stron służy wyszukiwaniu; ustawienie niezależne od GPTBot. |
| OpenAI training | GPTBot | Treści mogą posłużyć przyszłemu treningowi; dopuszczenie nie gwarantuje wykorzystania. |
| ChatGPT użytkownik | ChatGPT-User | Pobrania na żądanie; nie steruje kwalifikacją do Search, robots.txt może nie mieć zastosowania. |
| Claude search | Claude-SearchBot | Indeksowanie na potrzeby wyszukiwania; zachować dostęp publiczny. |
| Claude użytkownik | Claude-User | Pobrania przy pytaniu użytkownika; według Anthropic respektuje robots.txt. |
| Anthropic training | ClaudeBot | Pozyskiwanie potencjalnych danych treningowych, odrębne od wyszukiwania. |
| Perplexity search | PerplexityBot | Wyszukiwanie i linkowanie, nie trening modeli bazowych. |
| Perplexity użytkownik | Perplexity-User | Pobranie inicjowane przez użytkownika; dostawca zaznacza, że zwykle ignoruje robots.txt. |

Nie dodawać zbędnych grup `Allow: /`, jeśli publiczne treści są już dostępne: specyficzna grupa może zmienić dziedziczenie reguł ogólnych. Zachować ograniczenia tras prywatnych. robots.txt nie jest mechanizmem autoryzacji. Reguły WAF sprawdzać oddzielnie od robots.txt. Sam ustawiony User-Agent nie dowodzi tożsamości robota; używać oficjalnych zakresów IP i logów. Nie wprowadzać globalnego obejścia WAF.

Test akceptacyjny: GET publicznego URL → 200, rzeczywista treść, brak challenge/logowania; robots dopuszcza ścieżkę; nagłówki i meta nie zawierają niezamierzonego noindex; logi potwierdzają realne wejścia zweryfikowanych robotów. Test z podszytym UA jest wyłącznie testem reguł, nie wizytą dostawcy.

Źródła:
- https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers
- https://developers.openai.com/api/docs/bots
- https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler
- https://docs.perplexity.ai/docs/resources/perplexity-crawlers
