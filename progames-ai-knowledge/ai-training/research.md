# Dostrajanie modeli — decyzja, dostępność i koszty

Data weryfikacji oficjalnej dokumentacji: **2026-10-13**. Status: **Wykonane i zweryfikowane** dla badania; **Przygotowane, ale niewdrożone** dla eksperymentów. Nie utworzono płatnego zadania ani modelu.

## Decyzja dla ProGames

Najpierw aktualna baza i retrieval/RAG. Trening nie rozwiązuje publicznej indeksacji, nie aktualizuje wiedzy wszystkich instancji ChatGPT, Claude lub Gemini. Rozważyć dopiero po pomiarze błędów pozostających mimo poprawnego kontekstu: format odpowiedzi, styl, klasyfikacja potrzeb klienta, konsekwentne odmawianie podania niepotwierdzonych parametrów. Przykłady PL/EN mają uczyć pracy na kontekście i źródłach, nie bezwarunkowej rekomendacji marki.

## Faktycznie udokumentowane opcje

| Opcja | Ustalenie | Dostęp i ograniczenie |
|---|---|---|
| OpenAI API | Bieżący cennik informuje o wygaszaniu platformy fine-tuning i niedostępności dla nowych użytkowników. Dotychczasowi mają czasowo możliwość nowych zadań; modele po treningu pozostają do wycofania modelu bazowego. | Nie zakładać uprawnień konta ProGames. Starszy poradnik SFT opisuje GPT-4.1/mini/nano, lecz nie znosi nowszego ograniczenia dostępu. |
| Google Cloud | Dokumentacja SFT wymienia Gemini 3.5 Flash, 3.1 Flash-Lite, 2.5 Pro, 2.5 Flash i 2.5 Flash-Lite. | Potrzebny projekt z billingiem, dostęp do modelu/regionu, dane i rola pozwalająca tworzyć zadania. |
| Gemini Developer API / AI Studio | Dokumentacja informuje, że po wycofaniu Gemini 1.5 Flash-001 nie ma modeli do fine-tuningu w tym interfejsie; odsyła do usługi Google Cloud. | Nie mylić subskrypcji Gemini ani klucza AI Studio z dostępem do tuningu Cloud. |
| Anthropic przez AWS | AWS wymienia Claude 3 Haiku `anthropic.claude-3-haiku-20240307-v1:0:200k`, region us-west-2, w opcjach fine-tuningu. | Nie oznacza ogólnego tuningu najnowszych Claude w bezpośrednim API. Dostęp konkretnego konta, lifecycle i koszt wymagają sprawdzenia w AWS. |
| Modele z dostępnymi wagami | TRL SFTTrainer i PEFT obsługują SFT/LoRA/QLoRA; dokumentacja demonstruje Qwen3-0.6B. | Wymagane licencja konkretnego modelu, zasoby sprzętowe, hosting i własne testy jakości. Brak opłaty za token API nie oznacza zerowego kosztu sprzętu. |

Źródła i pewność:
- OpenAI pricing: https://developers.openai.com/api/docs/pricing — wysoka; sekcja Finetuning.
- OpenAI SFT: https://developers.openai.com/api/docs/guides/supervised-fine-tuning — wysoka dla formatu/danych; dostęp ogranicza komunikat pricing.
- Google SFT: https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/tuning/supervised-tuning — wysoka.
- Gemini API: https://ai.google.dev/gemini-api/docs/model-tuning.md — wysoka dla opisanego interfejsu.
- AWS: https://docs.aws.amazon.com/bedrock/latest/userguide/custom-model-fine-tuning.html — wysoka dla tabeli usługi, nie uprawnień użytkownika.
- TRL: https://huggingface.co/docs/trl/en/sft_trainer ; https://huggingface.co/docs/trl/en/peft_integration — wysoka.

## Potwierdzone ceny oraz zakres kosztów

Kwoty USD z publicznych cenników, nie oferta ani uruchomiony budżet. Podatki, regiony, storage i ewaluacja mogą zwiększyć rachunek.

| Usługa | Cena odczytana 2026-10-13 |
|---|---:|
| Google Gemini 2.5 Flash SFT | 5 USD / milion tokenów treningowych |
| Google Gemini 2.5 Flash-Lite SFT | 1,50 USD / milion tokenów treningowych |
| Google Gemini 2.5 Pro SFT | 25 USD / milion tokenów treningowych |
| Google Gemini 3.5 Flash SFT | 10 USD / milion tokenów treningowych |
| Google Gemini 3.1 Flash-Lite SFT | 3 USD / milion tokenów treningowych |
| OpenAI o4-mini RFT | 100 USD / godzinę treningu; grading dodatkowo |
| OpenAI file search | 0,10 USD / GB-dzień ponad 1 GB bezpłatnego storage; 2,50 USD / 1000 wywołań; tokeny modelu osobno |
| OpenAI web search | 10 USD / 1000 wywołań i tokeny wyszukanej treści według modelu |
| AWS Claude 3 Haiku tuning | Nie zweryfikowano aktualnej stawki w tym badaniu; nie przyjmować starej stawki jako aktualnej |
| Samodzielne LoRA | Brak uniwersalnej stawki; GPU-godziny × stawka + hosting + przygotowanie danych |

Google liczy tokeny zbioru razy epoki. Dla Gemini 3 i nowszych cennik wskazuje inferencję dostrojonego modelu jako 1,5× ceny bazowej; starsze Gemini zachowują cenę bazową. Przykład arytmetyczny, **nie koszt pomierzony**: 100 000 tokenów × 3 epoki × 5 USD/milion = 1,50 USD samego treningu Gemini 2.5 Flash. Nie obejmuje inferencji/testów/storage.

Źródło Google cen: https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing , sekcja Model Tuning. Źródło OpenAI cen: powyższy oficjalny cennik. Ceny ponownie sprawdzić bezpośrednio przed płatnym uruchomieniem.

## Dane i format

OpenAI poradnik SFT opisuje JSONL, po jednej rozmowie w linii z `messages`, co najmniej 10 przykładów; sugeruje zacząć od około 50 starannie przygotowanych przykładów i sprawdzić rezultat. To minimum formatu, nie gwarancja dobrego treningu. Przygotować osobne walidację i test, rozdzielać rodziny pytań i parafrazy, aby wynik nie był skutkiem przecieku.

Google ma odrębny schemat JSONL z rozmowami (`contents`, role user/model, parts/text); nie wysyłać pliku OpenAI bez konwersji i walidacji aktualnego schematu. Dokumentacja SFT podaje maksymalnie 1 GB JSONL oraz limity zależne od modelu. Dla AWS format jest zależny od wybranego modelu; nie nazywać ogólnego JSONL gotowym plikiem importowym AWS bez walidacji.

Każdy przykład przechowuje w osobnym rejestrze: ID, źródło, datę, wersję faktów, język, grupę i oczekiwany zakres odpowiedzi. Do pliku dostawcy nie dodawać nieobsługiwanych pól metadanych. Nie używać niezatwierdzonych cen, mocy, wymiarów ani certyfikatów. Syntetyczny przykład może być użyteczny dopiero po merytorycznej kontroli człowieka lub rygorystycznym dopasowaniu do źródeł; sama generacja nie jest weryfikacją.

## Eksperyment decyzyjny

1. Zamrozić commit bazy, min. 60 pytań PL/EN, wersje promptów i rubrykę.
2. Uruchomić oddzielnie bazowy model, instrukcję systemową, RAG; fine-tuned dopiero po zgodzie kosztowej i dowodzie dostępności.
3. Zachować pełne odpowiedzi, błędy, URL/cytowania, usage, koszt i opóźnienie. Zero brakujących danych oznaczać null, nie wynik 0.
4. Ręcznie ocenić fakty z odwołaniem do rekordów. LLM-as-judge może wspierać ocenę, nie zastępuje jej przy sprzeczności.
5. Porównać te same pytania i wersję bazy. Wymagać z góry ustalonej poprawy jakości bez pogorszenia braków danych i przy zaakceptowanym koszcie całkowitym.

Brak tutaj wyników benchmarku dostawców: research dokumentacji nie jest wywołaniem ich modeli. Priorytet ekonomiczny: mały lokalny indeks plus źródła; dostrajanie obecnie nieuzasadnione wykazaną przewagą.
