/* Polish editorial content (v43). Facts come from the existing site, catalogue and v42 English pages.
   No invented prices, specifications, earnings forecasts, reviews or certificates. */
const urls={
 boxing:'/pl/automaty-bokserskie.html',
 arcade:'/pl/automaty-rozrywkowe.html',
 manufacturer:'/pl/producent-automatow-bokserskich.html',
 b2b:'/pl/sprzedaz-hurtowa-i-dystrybucja.html',
 hub:'/pl/poradniki/',
 definition:'/pl/poradniki/co-to-jest-automat-bokserski.html',
 choose:'/pl/poradniki/jak-wybrac-automat-bokserski.html',
 care:'/pl/poradniki/montaz-i-serwis-automatu-bokserskiego.html',
 price:'/pl/poradniki/ile-kosztuje-automat-bokserski.html',
 bar:'/pl/poradniki/automat-bokserski-do-baru.html'
};
/* English counterpart of each translated page (used for hreflang). PL-only pages have none. */
const pairs={boxing:'/en/boxing-machines.html',arcade:'/en/arcade-machines.html',manufacturer:'/en/manufacturer.html',b2b:'/en/distributors-wholesale.html',hub:'/en/knowledge/',definition:'/en/knowledge/what-is-a-boxing-arcade-machine.html',choose:'/en/knowledge/choosing-a-commercial-boxing-machine.html',care:'/en/knowledge/installation-and-maintenance.html'};
const prod=k=>`/pl/produkty/${k}.html`;
const link=(key,label)=>`<a href="${urls[key]}">${label}</a>`;
const plink=(k,label)=>`<a href="${prod(k)}">${label}</a>`;
const section=(title,body,id='')=>`<section class="editorial-section"${id?` id="${id}"`:''}><h2>${title}</h2>${body}</section>`;
const p=s=>`<p>${s}</p>`;
const ul=items=>`<ul>${items.map(i=>`<li>${i}</li>`).join('')}</ul>`;
const ol=items=>`<ol>${items.map(i=>`<li>${i}</li>`).join('')}</ol>`;
const faq=items=>items.map(([q,a])=>`<p><strong>${q}</strong><br>${a}</p>`).join('');
const sales='<a href="mailto:office@progames.pl">office@progames.pl</a> · <a href="tel:+48536068912">+48 536 068 912</a>';
const service='<a href="mailto:service@progames.pl">service@progames.pl</a> · <a href="tel:+48789108086">+48 789 108 086</a>';
const parts='<a href="/pl/katalog.html?catalog=parts">katalogu części zamiennych</a>';

const pages=[
{key:'boxing',kind:'category',
 title:'Automaty bokserskie – boksery i siłomierze | PRO-GAMES',
 description:'Automaty bokserskie od polskiego producenta: boksery Standard i Premium, bokser z kopaczem, modele dla dzieci i wieloosobowe. Porównaj modele i zapytaj o cenę.',
 h1:'Automaty bokserskie dla lokali i operatorów',
 lead:'Automat bokserski – nazywany też bokserem, boxerem albo siłomierzem bokserskim – to gra, w której uderza się w gruszkę, a urządzenie wyświetla wynik. PRO-GAMES projektuje i produkuje komercyjne automaty bokserskie w Polsce, w Jastrzębiu-Zdroju, z myślą o barach, klubach, salonach gier, centrach handlowych i parkach rozrywki.',
 body:
 section('Najpierw wybierz rodzaj automatu, potem wygląd',`<div class="editorial-table-wrap"><table><caption>Rodziny automatów bokserskich PRO-GAMES</caption><thead><tr><th scope="col">Rodzina</th><th scope="col">Na co zwrócić uwagę</th><th scope="col">Zobacz</th></tr></thead><tbody><tr><th scope="row">Boxer Standard</th><td>15 wzorów w jednej kolekcji – porównaj grafiki, kolory i opublikowane dane techniczne.</td><td><a href="/pl/boxer-standard.html">Kolekcja Standard</a></td></tr><tr><th scope="row">Boksery Premium</th><td>Obudowa, funkcje gry i wyposażenie różnią się w zależności od modelu.</td><td>${plink('boxer-combat','Boxer Combat')}</td></tr><tr><th scope="row">Bokser + kopacz</th><td>Dwa wyzwania w jednym automacie – sprawdź wymiary wybranego modelu.</td><td>${plink('double-hit','Double Hit')}</td></tr><tr><th scope="row">3 w 1</th><td>Boks, kopanie i młot w jednym urządzeniu.</td><td>${plink('monster-3in1','Monster 3 in 1')}</td></tr><tr><th scope="row">Z nagrodami lub biletami</th><td>Wersje z funkcją nagród lub biletów – szczegóły potwierdza dział sprzedaży.</td><td>${plink('boxer-gift','Boxer Gift')}</td></tr><tr><th scope="row">Dla dzieci</th><td>Osobna linia dla młodszych graczy – podaj w zapytaniu, dla kogo jest automat.</td><td>${plink('boxer-kids','Boxer Kids')}</td></tr><tr><th scope="row">Wieloosobowe</th><td>Porównuj format gry, nie tylko obudowę.</td><td>${plink('boxer-fist','Boxer Fist · 3 Player')}</td></tr></tbody></table></div>`)
 +section('Automat bokserski na monety – płatności i personalizacja',p('Na stronie każdego produktu działa konfigurator. Możesz w nim zaznaczyć m.in. dodatkowy wrzutnik monet, akceptor banknotów, naklejki z własną grafiką oraz Internet Wi-Fi Boxnet. Dostępność i zgodność opcji z konkretnym modelem potwierdza dział sprzedaży.')+p('Sama opcja Wi-Fi nie oznacza obsługi płatności bezgotówkowych. Jeśli potrzebujesz płatności kartą lub innego systemu, podaj jego nazwę w zapytaniu.'))
 +section('Ile kosztuje automat bokserski?',p('Cena zależy od modelu, wersji i wyposażenia (system płatności, grafika, funkcje nagród lub biletów) oraz od transportu. Każdą ofertę przygotowujemy indywidualnie, a zapytanie trafia bezpośrednio do działu sprzedaży producenta.')+p(`${link('price','Sprawdź, od czego zależy cena automatu bokserskiego')} lub ${link('b2b','zapytaj o zamówienie kilku automatów')}.`))
 +section('Dlaczego automat od polskiego producenta?',ul([
  'Projektujemy i produkujemy automaty w Polsce: montaż, elektronika, testy i kontrola końcowa odbywają się w naszym zakładzie.',
  `Rozmawiasz po polsku bezpośrednio z działem sprzedaży (${sales}) i serwisu (${service}).`,
  `Części zamienne do naszych automatów znajdziesz w ${parts}.`,
  'Konfigurację – kolory, grafikę i system płatności – dopasowujemy do Twojego obiektu.',
  'Marka PRO-GAMES działa od 2012 roku i dostarcza automaty klientom w Europie oraz na innych rynkach.'
 ])+p(`${link('manufacturer','Poznaj PRO-GAMES – producenta automatów bokserskich')}.`))
 +section('Najczęstsze pytania',faq([
  ['Czym różni się automat bokserski od siłomierza?','Siłomierz to potoczna, szersza nazwa automatów, które sprawdzają siłę uderzenia. Automat bokserski to siłomierz z gruszką do uderzania pięścią. W ofercie mamy też siłomierze z młotem ('+plink('hammer','Hammer')+') i kopacze ('+plink('kicker','Kicker')+').'],
  ['Czy automat bokserski nadaje się do baru?','Bary, puby i kluby to jedne z miejsc, dla których projektujemy automaty. Przed zakupem sprawdź wymiary, miejsce potrzebne do gry, zasilanie i drogę dostawy. Pomoże w tym poradnik: '+link('bar','automat bokserski do baru')+'.'],
  ['Czy wynik na automacie to pomiar siły?','Wynik to rezultat gry. Nie traktuj go jako pomiaru medycznego ani skalibrowanego porównania między różnymi modelami.'],
  ['Czy mogę zamówić automat z własną grafiką?','Tak, w konfiguratorze można zaznaczyć naklejki z własną grafiką. Szczegóły i dostępność potwierdza dział sprzedaży.'],
  ['Czy automat może stać na zewnątrz?','Ustawienie na zewnątrz wymaga wyraźnego potwierdzenia dla wybranego modelu. Zapytaj o to dział sprzedaży przed zamówieniem.']
 ])+p(`${link('choose','Przeczytaj poradnik: jak wybrać automat bokserski')}.`)),
 filter:p=>['boxer','combo','kids'].includes(p.category),standardLink:true},

{key:'arcade',kind:'category',
 title:'Automaty rozrywkowe: młot, kopacz, cymbergaje | PRO-GAMES',
 description:'Siłomierze i automaty rozrywkowe PRO-GAMES: młot, kopacz, boksery, a także cymbergaje, automaty do koszykówki i dart z oferty dystrybucyjnej. Zapytaj o ofertę.',
 h1:'Automaty rozrywkowe i siłomierze',
 lead:'Poznaj siłomierze i automaty rozrywkowe produkowane przez PRO-GAMES oraz wybrane atrakcje z oferty dystrybucyjnej: cymbergaje, automaty do koszykówki, dart elektroniczny, bujak i zamki dmuchane dla dzieci. Obie grupy oznaczamy osobno, aby było jasne, które urządzenia produkujemy sami.',
 body:
 section('Automaty produkowane przez PRO-GAMES',p('Produkujemy automaty bokserskie, automaty łączące boks z kopaniem, modele dla dzieci, kopacze oraz siłomierze z młotem. Wyposażenie różni się w zależności od modelu, dlatego porównuj dane techniczne opublikowane na stronach produktów.')+p(`${link('boxing','Porównaj automaty bokserskie')}, ${plink('kicker','kopacz Kicker')}, ${plink('hammer','młot Hammer')} i ${plink('hammer-2026','Hammer 2')}.`))
 +section('Cymbergaje (air hockey) z oferty dystrybucyjnej',p('Air Hockey Golden, Arctic i Matrix to stoły do cymbergaja z naszej oferty dystrybucyjnej. Zapytaj dział sprzedaży o producenta, warunki instalacji i wsparcie dla wybranej wersji.')+p(`${plink('air-hockey-golden','Golden')} · ${plink('air-hockey-arctic','Arctic')} · ${plink('air-hockey-matrix','Matrix')}`),'cymbergaj')
 +section('Automaty do koszykówki z oferty dystrybucyjnej',p('Porównaj modele Basketball, Basketball Compact i Kids Basketball. O potrzebnym miejscu i warunkach instalacji decyduje dokumentacja produktu, a nie nazwa kategorii.')+p(`${plink('basketball','Basketball')} · ${plink('basketball-compact','Basketball Compact')} · ${plink('kids-basketball','Kids Basketball')}`),'koszykowka')
 +section('Inne atrakcje z oferty dystrybucyjnej',p(`${plink('cyberdart','Cyberdart')} (dart elektroniczny), ${plink('kiddie-ride','Kiddie Ride')} (bujak dla dzieci) i ${plink('bouncy-castles-xs','Bouncy Castles · XS')} (zamki dmuchane). Przed zamówieniem zapytaj o producenta, dokumentację i wsparcie dla wybranej wersji.`))
 +section('Planujesz salon gier lub strefę rozrywki?',p('Wyślij do działu sprzedaży listę automatów i planowaną lokalizację. Przed zamówieniem potwierdź drogę dostawy, dostępne miejsce, lokalne wymagania dotyczące płatności i dostęp serwisowy.')+p(link('care','Lista kontrolna: montaż i serwis automatu'))),
 filter:p=>['strength','distributed'].includes(p.category)},

{key:'manufacturer',kind:'about',
 title:'Producent automatów bokserskich w Polsce | PRO-GAMES',
 description:'PRO-GAMES to polski producent komercyjnych automatów bokserskich z Jastrzębia-Zdroju. Poznaj ofertę, etapy produkcji, serwis i części zamienne. Marka od 2012 r.',
 h1:'PRO-GAMES – producent automatów bokserskich w Polsce',
 lead:'PRO-GAMES projektuje i produkuje w Polsce komercyjne automaty bokserskie i urządzenia rozrywkowe. Współpracujemy z operatorami i dystrybutorami, zapewniając obsługę sprzedażową, części zamienne i serwis.',
 body:
 section('Polski producent z szeroką ofertą bokserów',p('PRO-GAMES to polski producent automatów bokserskich z siedzibą przy ul. Rybnickiej 19A, 44-335 Jastrzębie-Zdrój. Marka działa od 2012 roku; obecna spółka to PRO-GAMES POLAND Sp. z o.o.')+p('Oferta obejmuje boksery Standard, boksery Premium, automaty łączące boks z kopaniem, modele dla dzieci i siłomierze. Wybrane dodatkowe atrakcje pochodzą z oferty dystrybucyjnej i są wyraźnie tak oznaczone.')+p(`${link('boxing','Zobacz automaty bokserskie')} i ${link('arcade','pozostałe automaty rozrywkowe')}.`))
 +section('Produkcja, montaż i testy',p('Montaż, elektronika, testy i końcowa konfiguracja automatów odbywają się w Polsce. Zdjęcia poniżej pokazują te etapy. Skontaktuj się z nami, aby omówić konkretny model i konfigurację.')+'%PRODUCTION%')
 +section('Konfiguracja i wsparcie',p('Konfigurator na stronie produktu zapisuje wybrane kolory i wyposażenie. Dział sprzedaży potwierdza dostępność i zgodność opcji z wybranym automatem. Sprawy serwisowe i części zamienne mają osobny kontakt, aby operator od razu trafił do właściwego zespołu.')+p(`Sprzedaż: ${sales}`)+p(`Serwis i części: ${service}`)+p(`${link('b2b','Dystrybucja i zapytania B2B')} · <a href="/pl/katalog.html?catalog=parts">Katalog części zamiennych</a>`))
 +section('Dane firmy','<dl class="editorial-facts"><div><dt>Marka</dt><dd>PRO-GAMES</dd></div><div><dt>Firma</dt><dd>PRO-GAMES POLAND Sp. z o.o.</dd></div><div><dt>Adres</dt><dd>ul. Rybnicka 19A, 44-335 Jastrzębie-Zdrój, Polska</dd></div><div><dt>NIP</dt><dd>633-224-54-91</dd></div><div><dt>REGON</dt><dd>520986702</dd></div></dl>')},

{key:'b2b',kind:'b2b',
 title:'Automaty bokserskie hurtowo – sprzedaż i dystrybucja | PRO-GAMES',
 description:'Hurtowa sprzedaż automatów bokserskich i współpraca dystrybucyjna z producentem PRO-GAMES. Przygotuj listę modeli, kraj dostawy i konfigurację – wycenimy indywidualnie.',
 h1:'Automaty bokserskie dla operatorów i dystrybutorów',
 lead:'Zamawiasz automat do jednego lokalu, kilka sztuk dla sieci obiektów, a może chcesz zostać dystrybutorem? Skontaktuj się z PRO-GAMES, podając rynek docelowy i listę modeli. Warunki handlowe ustalamy indywidualnie.',
 body:
 section('Co podać w zapytaniu hurtowym',ol(['Nazwę firmy, dane kontaktowe i kraj dostawy.','Modele automatów i liczbę sztuk.','Preferowane kolory, grafikę i system płatności.','Rodzaj obiektu lub planowany obszar dystrybucji.','Oczekiwany termin dostawy i ewentualne ograniczenia dojazdu lub wniesienia.'])+p('Poproś dział sprzedaży o pisemne potwierdzenie ceny, ewentualnej minimalnej wielkości zamówienia, terminu realizacji, transportu, warunków gwarancji i dostępności części. Ta strona nie obiecuje standardowych rabatów, minimalnych ilości ani terminów dostawy.'))
 +section('Obecna sieć dystrybucji i wsparcie lokalne',p('Wyłącznym dystrybutorem PRO-GAMES w Ameryce Północnej, Środkowej i Południowej jest UPlay America. Na tym obszarze skontaktuj się z oficjalnym partnerem albo poproś nas o przekazanie zapytania.')+'<p><a href="https://www.uplayamerica.com/" rel="noopener noreferrer">Strona UPlay America</a> · <a href="/pl/#distributors">Zobacz naszą sieć dystrybucji</a></p>'+p('Mamy też własny oddział w Elche w Hiszpanii oraz oddział w Argentynie. Dane kontaktowe znajdziesz na stronie głównej.'))
 +section('Chcesz zostać dystrybutorem?',p('Przedstaw swoją firmę, terytorium, obecne możliwości sprzedażowe i serwisowe oraz automaty, które chcesz oferować. Potwierdzimy, czy współpraca jest możliwa i na jakich zasadach. Samo zapytanie nie daje praw do terytorium.')+p(`${link('manufacturer','O producencie')} · ${link('boxing','Porównaj automaty bokserskie')} · <a href="/pl/#contact">Wyślij zapytanie B2B</a>`))},

{key:'hub',kind:'hub',
 title:'Poradniki: automaty bokserskie dla operatorów | PRO-GAMES',
 description:'Praktyczne poradniki PRO-GAMES o automatach bokserskich: czym jest bokser, jak go wybrać, ile kosztuje, jak przygotować montaż i serwis oraz automat do baru.',
 h1:'Poradniki o automatach bokserskich',
 lead:'Praktyczne informacje, które pomogą wybrać i zaplanować komercyjny automat bokserski. Korzystaj z nich razem z danymi technicznymi i dokumentacją konkretnego modelu.',
 body:
 section('Zacznij od decyzji zakupowej','%CARDS%')
 +section('Produkty i zakupy',p(`${link('boxing','Automaty bokserskie')} · ${link('arcade','Automaty rozrywkowe')} · ${link('b2b','Sprzedaż hurtowa i dystrybucja')} · <a href="/pl/katalog.html">Katalogi produktów i części</a>`)),
 cards:[['definition','Co to jest automat bokserski?','Na czym polega gra i czym różni się bokser od automatu łączonego, np. z kopaczem.'],['choose','Jak wybrać automat bokserski?','Format gry, miejsce, konfiguracja i wsparcie – sprawdź je przed zapytaniem o ofertę.'],['price','Ile kosztuje automat bokserski?','Co wpływa na cenę i jak przygotować zapytanie, żeby oferta była konkretna.'],['bar','Automat bokserski do baru i pubu','Miejsce, zasilanie, płatności i bezpieczeństwo w lokalu.'],['care','Montaż i serwis automatu','Pytania, na które odpowiada dokumentacja techniczna konkretnego modelu.']]},

{key:'definition',kind:'article',
 title:'Co to jest automat bokserski (bokser, siłomierz)? | PRO-GAMES',
 description:'Czym jest automat bokserski, jak działa gra i czym różni się klasyczny bokser od automatu łączonego z kopaczem lub młotem. Poradnik producenta PRO-GAMES.',
 h1:'Co to jest automat bokserski?',
 lead:'Automat bokserski to gra rozrywkowa, w której gracz uderza w gruszkę i otrzymuje wynik na wyświetlaczu. W Polsce takie urządzenie nazywa się też bokserem, boxerem lub siłomierzem.',
 body:
 section('Jak działa gra?',p('Gracz uruchamia grę za pomocą skonfigurowanego w automacie systemu startu lub płatności, uderza w gruszkę i odczytuje wynik. Dokładny przebieg gry, sposób liczenia punktów i dostępne tryby zależą od modelu. Postępuj zgodnie z instrukcją dołączoną do automatu.')+p('Wynik to rezultat gry. Nie traktuj go jako pomiaru medycznego ani skalibrowanego porównania między różnymi modelami, jeśli dokumentacja nie przewiduje takiego zastosowania.'))
 +section('Klasyczny bokser czy automat łączony?',p('Klasyczny bokser skupia się na uderzeniu pięścią. Automaty łączone dodają inne wyzwania: Double Hit łączy boks z kopaniem, a Monster 3 in 1 – boks, kopanie i młot.')+p(`${plink('double-hit','Double Hit')} · ${plink('monster-3in1','Monster 3 in 1')} · <a href="/pl/boxer-standard.html">Boxer Standard</a>`))
 +section('Bokser, boxer, siłomierz – jak to nazwać?',p('To różne nazwy tej samej atrakcji. „Siłomierz” bywa też używany szerzej – dla automatów z młotem i kopaczy. W naszej ofercie znajdziesz wszystkie trzy rodzaje: '+link('boxing','automaty bokserskie')+', '+plink('hammer','młot Hammer')+' i '+plink('kicker','kopacz Kicker')+'.'))
 +section('Jak sprawdzić, czy automat pasuje do Twojego lokalu?',p('Patrz nie tylko na grafikę obudowy. Porównaj opublikowane wymiary, format gry, opcje płatności, obsługę serwisową i wymagania instalacyjne konkretnego automatu. Przy modelach dla dzieci określ, kto będzie z nich korzystać.')+p(`${link('choose','Przejdź do poradnika zakupowego')} lub ${link('boxing','zobacz modele automatów')}.`))},

{key:'choose',kind:'article',
 title:'Jak wybrać automat bokserski do lokalu? Poradnik | PRO-GAMES',
 description:'Lista kontrolna przy zakupie automatu bokserskiego: format gry, wymiary, płatności na monety i bezgotówkowe, własna grafika, serwis i zawartość oferty.',
 h1:'Jak wybrać automat bokserski?',
 lead:'Najpierw wybierz format gry i sprawdź wymagania instalacyjne, a dopiero potem wykończenie i wyposażenie dodatkowe. Dobra oferta wskazuje dokładny model i konfigurację, którą otrzymasz.',
 body:
 section('1. Określ lokal i graczy',p('Niezależnie od tego, czy to bar, rodzinne centrum rozrywki czy park rozrywki, opisz dostawcy, kto będzie grać, czy automat będzie pod nadzorem i gdzie ma stanąć. Sama nazwa rodzaju lokalu nie przesądza, że model jest odpowiedni. Ustawienie na zewnątrz wymaga wyraźnego potwierdzenia dla wybranego automatu.'))
 +section('2. Sprawdź miejsce i dostęp',p('Punktem wyjścia są opublikowane wymiary i masa produktu. Sprawdź drogę dostawy, drzwi i miejsce na podłodze. Zapytaj o wymaganą przestrzeń do gry i dokumentację elektryczną – sam obrys obudowy nie uwzględnia miejsca na zamach i serwis.'))
 +section('3. Wybierz format gry',p('Porównaj klasyczny automat bokserski z połączeniem boksera i kopacza, bokserem wieloosobowym lub modelem dla dzieci. Właściwy wybór zależy od atrakcji, jaką chcesz zaoferować gościom, a nie od niepopartych prognoz zarobków.')+p(`<a href="/pl/boxer-standard.html">Kolekcja Standard</a> · ${plink('boxer-fist','Boxer Fist')} · ${plink('double-hit','Double Hit')} · ${plink('double-hit-kids','Double Hit Kids')}`))
 +section('4. Potwierdź płatności i personalizację',p('W konfiguratorze możesz wybrać wyposażenie takie jak dodatkowy wrzutnik monet, akceptor banknotów, naklejki z własną grafiką i Internet Wi-Fi Boxnet. Dostępność i zgodność potwierdza dział sprzedaży. Opcja Wi-Fi sama w sobie nie oznacza obsługi płatności bezgotówkowych.')+p('Jeśli potrzebujesz płatności kartą, bezgotówkowych lub systemu używanego w Twoim obiekcie, podaj jego nazwę i rynek w zapytaniu. Przed zamówieniem zapytaj o zgodność, odpowiedzialność za instalację i ewentualne opłaty firm zewnętrznych.'))
 +section('5. Sprawdź całą ofertę',p('Potwierdź wersję automatu, wyposażenie w zestawie, transport, termin realizacji, warunki gwarancji i kontakt serwisowy. Zachowaj specyfikację razem z zamówieniem, aby można było sprawdzić dostarczoną konfigurację.')+p(`${link('boxing','Porównaj automaty bokserskie')} · ${link('price','Od czego zależy cena')} · ${link('b2b','Zapytanie hurtowe')} · ${link('care','Montaż i serwis')}`))},

{key:'care',kind:'article',
 title:'Montaż i serwis automatu bokserskiego – poradnik | PRO-GAMES',
 description:'Jak przygotować montaż automatu bokserskiego: miejsce, zasilanie, dostawa i konserwacja. Jak zamówić część zamienną i skontaktować się z serwisem PRO-GAMES.',
 h1:'Montaż i serwis automatu bokserskiego',
 lead:'Wymagania dotyczące instalacji i konserwacji zależą od modelu. Ta lista pomoże zebrać właściwą dokumentację przed dostawą. Nie zastępuje instrukcji obsługi ani instrukcji serwisowej automatu.',
 body:
 section('Przed dostawą',ul(['Potwierdź zamówiony model, wersję, akcesoria i adres dostawy.','Porównaj opublikowane wymiary i masę z drogą wniesienia.','Zapytaj o wymaganą przestrzeń do gry i warunki instalacji.','Sprawdź w dokumentacji technicznej napięcie, częstotliwość, pobór mocy i wymagania dotyczące podłączenia.','Zapytaj, czy planowane miejsce – wewnątrz lub na zewnątrz – jest dopuszczone dla tej wersji.']))
 +section('W trakcie użytkowania',p('Przestrzegaj dołączonych zaleceń dotyczących przeglądów, czyszczenia i konserwacji. Jeśli podejrzewasz uszkodzenie, nieprawidłowe działanie lub usterkę elektryczną, wyłącz automat z użytku i skontaktuj się z serwisem. Nie wykonuj napraw wykraczających poza Twoje kompetencje lub instrukcje producenta.')+p('Częstotliwości przeglądów, części zamiennych i procedur serwisowych nie da się przenieść z innego produktu. Poproś o instrukcję do konkretnego automatu.'))
 +section('Zamawianie części i serwisu',p('Podaj model, numer seryjny (jeśli jest dostępny), opis problemu i wyraźne zdjęcia. Poproś serwis o wskazanie właściwej części i potwierdzenie zgodności przed zamówieniem.')+p(`${service} · <a href="/pl/katalog.html?catalog=parts">Katalog części zamiennych</a>`)+p(`${link('choose','Lista kontrolna przy zakupie')} · ${link('manufacturer','Producent i wsparcie')} · ${link('boxing','Dane techniczne produktów')}`))},

{key:'price',kind:'article',
 title:'Ile kosztuje automat bokserski? Od czego zależy cena | PRO-GAMES',
 description:'Od czego zależy cena automatu bokserskiego: model, wyposażenie, system płatności, grafika, transport i liczba sztuk. Jak zapytać producenta o konkretną ofertę.',
 h1:'Ile kosztuje automat bokserski?',
 lead:'Nie publikujemy cennika, bo cena automatu bokserskiego zależy od modelu, wersji i wyposażenia. Wyjaśniamy, co wpływa na wycenę i jak przygotować zapytanie, aby otrzymać konkretną ofertę od producenta.',
 body:
 section('Model i rodzina automatu',p('Boksery Standard, boksery Premium, automaty łączone (bokser z kopaczem, 3 w 1), modele dla dzieci i boksery wieloosobowe różnią się konstrukcją i wyposażeniem, dlatego każdą rodzinę wyceniamy osobno.')+p(`${link('boxing','Porównaj rodziny automatów bokserskich')}`))
 +section('Wyposażenie i system płatności',p('Na cenę wpływa wybrane wyposażenie, np. dodatkowy wrzutnik monet, akceptor banknotów, Internet Wi-Fi Boxnet lub wersja z funkcją nagród albo biletów (np. Boxer Gift, Monster 3 in 1 Ticket). Jeśli potrzebujesz płatności bezgotówkowych, podaj nazwę systemu – zgodność potwierdza dział sprzedaży.'))
 +section('Grafika i personalizacja',p('Kolory dostępne dla danego modelu oraz naklejki z własną grafiką zaznaczysz w konfiguratorze na stronie produktu. Indywidualną grafikę uwzględniamy w wycenie.'))
 +section('Transport, liczba sztuk i warunki',p('Do wyceny potrzebujemy miejsca dostawy i liczby automatów. Przy zamówieniu kilku sztuk lub współpracy dystrybucyjnej warunki ustalamy indywidualnie.')+p(link('b2b','Sprzedaż hurtowa i dystrybucja')))
 +section('Nowy od producenta czy używany?',p('Kupując używany automat, sprawdź model, numer seryjny, dokumentację, stan techniczny i dostępność części zamiennych. Kupując bezpośrednio od producenta, otrzymujesz ofertę na konkretną wersję i konfigurację, kontakt do serwisu oraz dostęp do '+parts+'.'))
 +section('Jak zapytać o cenę',ol(['Wybrany model lub kilka modeli do porównania.','Liczba sztuk.','Miasto i kraj dostawy.','Rodzaj lokalu i planowane miejsce ustawienia.','Potrzebny system płatności.','Kolory lub własna grafika.','Oczekiwany termin.'])+p(`Zapytanie wyślesz formularzem na stronie produktu lub na <a href="/pl/#contact">stronie głównej</a>. Możesz też napisać lub zadzwonić: ${sales}.`))},

{key:'bar',kind:'article',
 title:'Automat bokserski do baru i pubu – na co uważać | PRO-GAMES',
 description:'Automat bokserski do baru, pubu lub klubu: ile miejsca potrzebuje, jakie zasilanie i płatności wybrać, który model pasuje do lokalu i o czym pamiętać przed zakupem.',
 h1:'Automat bokserski do baru, pubu i klubu',
 lead:'Bokser to atrakcja, która zachęca gości do rywalizacji. Zanim wybierzesz model do lokalu, sprawdź miejsce, zasilanie, system płatności i obsługę serwisową. Ten poradnik zbiera najważniejsze pytania.',
 body:
 section('Miejsce na automat i na grę',p('Wymiary i masę znajdziesz na stronie każdego produktu. Pamiętaj, że gracz potrzebuje dodatkowej przestrzeni na zamach, a osoby w pobliżu – bezpiecznej odległości. Wymagane odstępy podaje dokumentacja konkretnego modelu, więc zapytaj o nie przed zakupem. Sprawdź też drogę dostawy: drzwi, schody i przejścia.'))
 +section('Zasilanie i ustawienie',p('Parametry elektryczne (napięcie, pobór mocy, sposób podłączenia) sprawdź w dokumentacji technicznej wybranego modelu. Ustawienie automatu w ogródku piwnym lub na zewnątrz wymaga wyraźnego potwierdzenia dla danej wersji.'))
 +section('Płatności w lokalu',p('W konfiguratorze możesz wybrać m.in. dodatkowy wrzutnik monet i akceptor banknotów. Jeśli w lokalu chcesz przyjmować płatności bezgotówkowe, podaj nazwę systemu w zapytaniu – dział sprzedaży potwierdzi zgodność.'))
 +section('Który model wybrać do baru?',p(`Klasyczny bokser – np. z <a href="/pl/boxer-standard.html">kolekcji Standard</a> lub ${plink('boxer-combat','Boxer Combat')} – to prosty wybór, gdy chcesz jednej atrakcji. ${plink('double-hit','Double Hit')} łączy boks z kopaniem w jednej obudowie. ${plink('boxer-fist','Boxer Fist · 3 Player')} jest przeznaczony do wspólnej gry i rywalizacji kilku osób.`)+p(`${link('boxing','Zobacz wszystkie automaty bokserskie')}`))
 +section('Wersje z nagrodami',p('Część modeli ma wersje z funkcją nagród lub biletów. Przed uruchomieniem takiego automatu w lokalu sprawdź, jakie przepisy mają do niego zastosowanie w Twojej lokalizacji.'))
 +section('Bezpieczeństwo i obsługa',p('Postępuj zgodnie z instrukcją obsługi. W razie uszkodzenia lub nieprawidłowego działania wyłącz automat z użytku i skontaktuj się z serwisem: '+service+'. Części zamienne znajdziesz w '+parts+'.')+p(`${link('choose','Jak wybrać automat bokserski')} · ${link('price','Ile kosztuje automat bokserski')} · ${link('care','Montaż i serwis')}`))}
];
module.exports={urls,pairs,pages};
