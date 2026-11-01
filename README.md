# Pracownia Estery — Vercel / Next.js

Strona z trzema kafelkami, bezpłatnym sennikiem, językiem aniołów, czytelnią i dziennikiem snów. Kod Duszy prowadzi na https://soul-decoder-estera.vercel.app/.

## Publikacja na Vercelu

Repozytorium: `emiolsz/pracownia_estery`, gałąź `main`, Root Directory: katalog główny (puste pole), Framework: **Next.js**. Konfiguracja `vercel.json` ustawia instalację `npm ci`, budowanie `npm run build` i wynik `.next`. Usuń wcześniejsze ręczne nadpisania poleceń instalacji/budowania lub Output Directory w ustawieniach projektu. Nie ustawiaj `dist` ani `vinext build`.

Bez kluczy strona może się skompilować i pokazać kafelki, formularz snu oraz pobieranie PDF z wpisaną treścią. To nie oznacza jeszcze uruchomienia AI, poczty ani dziennika.

## Logowanie i baza — Supabase

Można wykorzystać istniejący projekt Supabase. W SQL Editor uruchom jednorazowo `supabase/migrations/202610180001_estera.sql`. Tabele `estera_*` nie zmieniają tabel Soul Decodera. Dane z prywatnego podglądu Sites nie są automatycznie migrowane.

Dodaj w Vercel > Settings > Environment Variables:

- `SUPABASE_URL` — adres projektu Supabase.
- `SUPABASE_ANON_KEY` — klucz anon/publishable projektu.
- `SUPABASE_SERVICE_ROLE_KEY` — klucz serwerowy service_role. Nigdy nie dodawaj prefiksu `NEXT_PUBLIC_` i nie umieszczaj go w repozytorium.
- `ADMIN_EMAIL` — adres właścicielki uprawnionej do redakcji czytelni.

W Supabase włącz logowanie e-mailem i skonfiguruj SMTP. W szablonie wiadomości logowania (Magic Link) musi być widoczny kod `{{ .Token }}` — formularz na stronie przyjmuje kod, a nie wymaga kliknięcia linku. Osoby korzystające z dziennika tworzą konto przez potwierdzenie adresu e-mail; nie ma newslettera ani subskrypcji.

Sesja działa w ciasteczkach HttpOnly, Secure w produkcji, SameSite=Lax. Serwer weryfikuje konto w Supabase. Nie ufa nagłówkom tożsamości ChatGPT. Dostęp do snów zawęża do identyfikatora zalogowanej osoby; redakcja wymaga ADMIN_EMAIL. Tabele mają RLS i odebrane uprawnienia anon/authenticated; dostęp przez sprawdzający uprawnienia serwer.

## Interpretacje i poczta

- `GEMINI_API_KEY` — klucz Google AI Studio. Domyślny model: `gemini-3.5-flash-lite`; opcjonalne nadpisanie przez `GEMINI_MODEL`. Gdy dodano oba klucze AI, domyślnie używany jest Gemini. `AI_PROVIDER=google` lub `openai` wybiera dostawcę jawnie. Treść snu jest wysyłana do wybranego dostawcy dopiero po zaznaczeniu zgody.
- `OPENAI_API_KEY` — alternatywny klucz API OpenAI; `OPENAI_MODEL` opcjonalnie (domyślnie `gpt-4.1-mini`). Potrzebna jest także skonfigurowana baza do trwałych limitów użycia.
- `BREVO_API_KEY` — alternatywnie klucz API Brevo (**nie klucz SMTP**). `MAIL_FROM` to zatwierdzony adres nadawcy. Brevo ma pierwszeństwo, gdy podano oba klucze pocztowe; można wybrać `MAIL_PROVIDER=brevo` lub `resend`.
- `RESEND_API_KEY` — klucz Resend; `MAIL_FROM` — zatwierdzony adres nadawcy w Resend. PDF wysyłany jest wyłącznie na potwierdzony adres zalogowanej osoby. Mail zawiera odnośnik do Soul Decodera.

Nie udostępniaj kluczy w czacie ani w plikach GitHuba. Po zmianie zmiennych wykonaj Redeploy.

Limity startowe: 3 udane interpretacje/dzień bez logowania, 20 dla zalogowanego konta, 200 dla całej strony, 10 wysyłek PDF na konto/dzień, 500 snów na konto. Limity przechowywane są w bazie, nie w pamięci pojedynczej funkcji. Miejsca w limicie są rezerwowane atomowo w istniejącej tabeli estera_usage, naliczane dopiero po uzyskaniu pełnej odpowiedzi i zwalniane przy błędzie. Rezerwacje po przerwanym żądaniu wygasają po 180 sekundach. Nowy licznik interpret-v2 nie przenosi starych liczników prób, obejmujących błędy. Dzień limitu liczony jest według UTC. Żadne wiadomości testowe nie są automatycznie wysyłane podczas kompilacji.

## Sprawdzenie po wdrożeniu

1. Otwórz stronę, sprawdź trzy grafiki i link Kodu Duszy.
2. Wpisz sen i pobierz PDF (bez konta i kluczy AI).
3. Po skonfigurowaniu Supabase potwierdź kod e-mail, zapisz sen, wyloguj się i sprawdź dostęp z drugiego konta.
4. Po dodaniu klucza Gemini lub OpenAI wygeneruj interpretację; po skonfigurowaniu Brevo lub Resend wyślij PDF. Można również wysłać sam wpisany sen przed wygenerowaniem interpretacji.
5. Z konta ADMIN_EMAIL sprawdź szkic i publikację artykułu. Zapis szkicu po publikacji zachowuje poprzednią opublikowaną treść.

## Lokalnie

Node.js 22, `npm ci`, `npm run build`, `npm start`. Plik `.env.example` zawiera same nazwy ustawień, bez kluczy.

Przed publicznym uruchomieniem usług uzupełnij informacje o administratorze danych, prywatności i usługach zewnętrznych oraz sprawdź pocztę i przepływ AI z prawdziwą konfiguracją.

Testy licznika (Node 22+): `node --experimental-transform-types tests/interpretation-quota.test.mjs`.

## Dziennik właścicielki i e-book
ADMIN_EMAIL przypisuje rolę wyłącznie po potwierdzeniu e-maila w Supabase Auth. Administratorka korzysta bezpłatnie z dziennika i zbiorczego e-booka PDF (okładka, spis snów, wpisy chronologicznie). Interpretacje zachowują dotychczasowe limity.
Eksport GET /api/journal/export pobiera wyłącznie wpisy zalogowanej osoby z bazy; zwraca 401 bez sesji i 402 bez uprawnienia. Pojedyncze PDF i kopia JSON pozostają bezpłatne.
Dla pozostałych planowana jest subskrypcja na 3 miesiące. Sprzedaż jest wyłączona do ustalenia ceny i odnowień oraz podłączenia płatności. Serwer weryfikuje przyszły termin w zaufanym Supabase app_metadata.estera_ebook_until, nigdy w user_metadata. Ten termin powinien zapisywać wyłącznie serwer po zweryfikowaniu płatności. Wygaśnięcie blokuje eksport zbiorczy, nie usuwa snów.
Test uprawnień: node --experimental-transform-types tests/journal-access.test.mjs

## VIP za lojalność
W /admin właścicielka sprawdza zarejestrowane i potwierdzone konto po e-mailu, a następnie przyznaje/odbiera VIP. Tylko serwer i ADMIN_EMAIL mogą zmieniać status przez POST /api/admin/vip; endpoint nie zmienia roli Supabase ani subskrypcji. Zaufane app_metadata.estera_vip=true odblokowuje bezpłatny zbiorczy e-book PDF do wydruku, do odwołania. User metadata są ignorowane. Status jest sprawdzany na świeżo z Supabase Auth przy każdym eksporcie. Cofnięcie VIP nie usuwa snów ani wcześniej pobranych plików; płatne uprawnienie jest niezależne.

Test VIP: `node --experimental-transform-types tests/vip-admin.test.mjs`. Test pełnych tras z lokalnym mockiem Supabase: po `npm run build` uruchom `node tests/vip-flow.test.mjs` (porty 3100/3101). Nie używa prawdziwych kont ani sekretów.

## Czasowi redaktorzy
ADMIN_EMAIL nadaje role w /admin. Maksymalnie 5 aktywnych redaktorów; termin wygaśnięcia obowiązkowy. Rola estera_editor_until jest przechowywana w zaufanym Supabase app_metadata, sprawdzanym na świeżo przez serwer. Przeznaczenie: wspólna redakcja szkiców Czytelni, bez publikacji, ról kont, VIP, płatności i cudzych dzienników. Tylko właścicielka może publikować i nadawać/odbierać role. Wygasłe role nie zajmują miejsc. Limit pięciu jest serializowany krótką dzierżawą estera-editor-management-lock w prywatnej estera_usage (bez nowej migracji). Nie zmienia ról ani uprawnień Soul Decodera.

Testy redaktorów: `node --experimental-transform-types tests/editor-admin.test.mjs`; po `npm run build`: `node tests/editor-flow.test.mjs`. Testy używają lokalnych kont testowych i mocka Supabase, bez prawdziwych danych.

## Pracownia i kontakt
/pracownia zawiera formularz kontaktowy. CONTACT_EMAIL wskazuje odbiorcę (fallback ADMIN_EMAIL). Gdy MAIL_FROM i BREVO_API_KEY lub RESEND_API_KEY są skonfigurowane, wiadomość jest wysyłana przez serwer wyłącznie do tej skrzynki; adres odwiedzającego jest Reply-To. Formularz nigdy nie używa odwiedzającego jako nadawcy. POST /api/contact ma kontrolę źródła, walidację, honeypot oraz limity 3/dzień/adres IP i 50/dzień globalnie.
Bez konfiguracji poczty formularz jawnie przygotowuje mailto do wysłania w programie pocztowym odwiedzającego; nie pokazuje fałszywego potwierdzenia wysyłki. Bezpośrednia wysyłka wymaga podłączenia poczty.

## Magazyn Czytelni
Redakcja ma pola: podpis redaktora, tematyka, tytuł, krótki opis i pełna treść. Podgląd pokazuje kartę z dwoma wierszami opisu; pełna treść pozostaje bez skracania. Tematy: Jung, Sny, Synchroniczności, Refleksje. Font Lora jest hostowany lokalnie, z licencją SIL OFL i sprawdzonym zestawem polskich znaków.
Metadane redakcyjne są zapisywane w wersjonowanej treści estera_articles.body (ESTERA_ARTICLE_V1); istniejąca funkcja publikowania utrwala cały komplet w published_body. API dekoduje je do osobnych pól; stare teksty bez nagłówka pozostają czytelne bez migracji. Edycja szkicu nie zmienia opublikowanego podpisu ani tematyki przed ponowną publikacją. Test: node --experimental-transform-types tests/article-content.test.mjs.

## Kolejny sen
W interpretatorze dostępne są przyciski „Kolejny sen” i „Zapisz i dodaj kolejny sen” (także pod wynikiem). Nowy wpis czyści tytuł, treść, emocje, interpretację, zaznaczone konteksty oraz zgodę; ustawia bieżącą datę i fokus na tytule. Niezapisana treść wymaga potwierdzenia porzucenia. Zapis i kolejny wpis czyści formularz dopiero po potwierdzonym POST; błąd zachowuje dane. Kolejne kliknięcie po potwierdzonym zapisie identycznego formularza nie tworzy kopii. „Dodaj sen” z dziennika korzysta z tego samego przejścia. Pola są zablokowane na czas zapisu/interpretacji, aby nie utracić zmian wpisanych w trakcie żądania.

## Personalizowany sennik, redakcja i chronologia
Imię i płeć/forma językowa są pytane przy logowaniu oraz w ustawieniach dziennika. Ustawienia są zapisywane wyłącznie w user_metadata zalogowanej osoby; nie zmieniają ról, VIP ani innych uprawnień. Imię trafia na okładkę, nie jest przekazywane do AI. Wybrana forma językowa wpływa na nowe interpretacje; istniejące opisy nie są automatycznie przepisywane.
PATCH /api/dreams aktualizuje wyłącznie własny wpis po id i owner; redakcja obejmuje datę, tytuł, opis, emocje i interpretację. Formularz zachowuje starą interpretację podczas korekty opisu oraz w razie nieudanej ponownej interpretacji. Zapis aktualizuje ten sam wpis zamiast tworzyć kopię.
Dziennik ma filtr Od/Do oraz wybór kolejności asc/desc. Eksport /api/journal/export przyjmuje from, to, order, weryfikuje daty i filtruje tylko własne sny. Zakres pozostaje chronologicznie poprawny niezależnie od kierunku sortowania.
Nowy PDF używa oryginalnego logo i grafiki Sennik, granatowo-złotej okładki z imieniem, Lory, kremowych stron, stałej stopki i automatycznej numeracji każdej strony. Pełny e-book ma wprowadzenie, spis treści z rzeczywistymi stronami, wpisy i strony refleksji. Poprzednio pobrane pliki nie są nadpisywane. Testy: tests/journal-person.test.mjs i tests/journal-edit-flow.test.mjs (po npm run build).


## Edycja przed wydrukiem - 1 listopada 2026

W „Mój dziennik” rozwiń „Czytaj / edytuj”. „Edytuj sen / interpretuj ponownie” otwiera ten sam wpis w formularzu: można poprawić tytuł, datę, opis, emocje i interpretację. Zapis używa PATCH własnego wpisu, nie tworzy duplikatu. Sama korekta nie wywołuje AI. Po zmianie opisu, emocji lub formy językowej pojawia się informacja o możliwości ponownej interpretacji. „Interpretuj ponownie” przekazuje pełny aktualny opis i wybraną formę językową; wymaga zgody i korzysta ze zwykłego limitu AI. Błąd zachowuje poprzedni wynik; nowy wynik należy zapisać w dzienniku.

Checkbox „Uwzględnij ten sen w wydruku” pomija wpis tylko w aktualnym wyborze PDF. Zapis pozostaje w dzienniku. Wybór obowiązuje podczas bieżącej sesji widoku i można go odwrócić przez „Przywróć wszystkie do wydruku”; odświeżenie strony przywraca pełny wybór. „Usuń z dziennika” jest odrębną operacją z potwierdzeniem. Eksport POST /api/journal/export przyjmuje excludeIds (do 500 UUID) i coverStyle (navy/cream), kontroluje sesję, źródło żądania i uprawnienie do e-booka; pobiera tylko własne sny. Filtr dat i kolejność działają razem z wyborem. Spis treści, numeracja snów i stron są generowane po pominięciu wpisów.

## Formularz i oprawa sennika

Formularz zawiera imię, płeć/formę językową oraz potwierdzony adres konta (tylko do odczytu; zmiana adresu nie może omijać weryfikacji logowania). Gość podaje e-mail przy logowaniu, a sam PDF może pobrać bez konta. E-mail i imię nie są wysyłane do AI. Płeć/formę przekazujemy bezpośrednio do instrukcji AI; nie zgadujemy jej z imienia ani postaci ze snu. Nowa interpretacja ma kolejno perspektywę duchową i symboliczną, ujęcie Junga, krótkie podsumowanie i pytania do refleksji; bez powitań i pochwał.

Dwie okładki: granat #0C1425 lub kość słoniowa #FDFBF7; obie mają złote napisy i ramkę #B79A60. Wnętrze ma tło #FDFBF7, tytuły Lora i treść DejaVu Sans. Logo i trzy różne grafiki kart Pracowni pozostają oryginalne, bez ujednolicania ich odcieni. Wstęp jest pełnym tekstem autorki, po nim „Jak korzystać z sennika” oraz podpis „Z miłością, Estera” fontem Allura (SIL OFL, lokalny podzbiór znaków podpisu). Ze wstępu usunięto imienny nagłówek, liczbę wpisów i okres; pozostają one na okładce lub w pozostałych elementach dokumentu. Spis treści: Sen / Tytuł / Data / Strona. Stała stopka i automatyczna numeracja na każdej stronie.

Stałe zdanie widoku i PDF: „Potraktuj tę interpretację jako zaproszenie do refleksji — znaczenie snu odkrywasz w odniesieniu do własnych przeżyć i odczuć.” AI otrzymuje polecenie niedodawania własnego wariantu tej noty. Poprzednie interpretacje nie są samoczynnie przepisywane. Dotychczasowe rozmiary fontów zachowane; podpis 29 pt w PDF.

Sprawdzenie: npm run build; node tests/journal-edit-flow.test.mjs; node --experimental-transform-types tests/journal-person.test.mjs. Testy używają sztucznych kont i bazy lokalnej; nie modyfikują prawdziwych snów.


## Wyszukiwanie snów na stronie
W „Mój dziennik” sekcja „Znajdź sen do edycji” zawiera pole „Szukaj w moich snach”. Filtruje tytuł, opis, emocje i interpretację bez rozróżniania wielkości liter ani polskich znaków (np. „lodz” odnajdzie „Łódź”). Wyszukiwanie działa lokalnie w przeglądarce na własnych pobranych wpisach, bez przekazywania frazy do AI. Uwzględnia bieżący zakres dat i sortowanie. Wyniki zawierają fragment dopasowanego tekstu; „Czytaj / edytuj” prowadzi do dotychczasowych działań. Wyszukiwanie nie zmienia wyboru do wydruku ani numeracji PDF. Pusta fraza i „Wyczyść wyszukiwanie” przywracają listę w bieżącym okresie. Brak dopasowań daje komunikat i możliwość zmiany frazy lub dat. Gość widzi sekcję z informacją o konieczności logowania. Test: node tests/journal-search.test.mjs.


## Uproszczony wybór płci K/M/X
Formularz snu, ustawienia dziennika i logowanie pokazują etykietę „Płeć” oraz wyłącznie opcje K, M, X. K oznacza kobietę, M mężczyznę, X brak deklaracji / zwrot neutralny. Techniczne informacje o formach językowych usunięto z formularza. API interpretacji otrzymuje kod K/M/X; serwer mapuje go na instrukcję odpowiednio żeńską, męską lub neutralną. Mapowanie nie jest objaśnieniem widocznym dla odbiorcy. Zapisane wcześniej wartości female/male/neutral pozostają kompatybilne, więc zmiana interfejsu nie kasuje preferencji. Przy logowaniu bez zmiany pola zachowujemy dotychczasową preferencję konta. X nie powoduje zgadywania płci na podstawie imienia lub treści snu.


## Indywidualna Księga Snów - kreator i rzeczywisty podgląd PDF
Zapis snu w dzienniku jest niezależny od druku. Okładka i czcionka nie są wybierane w formularzu zapisu. W dzienniku przycisk „Przygotuj Indywidualną Księgę Snów” otwiera osobny kreator: wybór snów, dat i kolejności, imię, okładka granatowa/jasna oraz treść DejaVu Sans/Lora. Pojedynczy sen nadal można pobrać oddzielnie.

„Pokaż podgląd Księgi” generuje pełny PDF przez istniejący, chroniony eksport. Podgląd w osadzonym czytniku i pobieranie korzystają z tego samego obiektu PDF. Czytnik przeglądarki umożliwia nawigację i powiększanie; alternatywą jest otwarcie PDF w nowej karcie. Po pierwszym uruchomieniu podgląd aktualizuje się po zmianie ustawień (450 ms zwłoki, anulowanie poprzednich żądań). Pobieranie starego podglądu jest blokowane podczas aktualizacji lub błędu. Uprawnienia do zbiorczego e-booka pozostają bez zmian.

„Zapisz roboczą Księgę” zapisuje na koncie jeden szkic: własny wybór identyfikatorów snów, zakres dat, kolejność, imię, okładkę i czcionkę. API /api/journal/draft obsługuje GET i POST; wymaga sesji, kontroluje źródło zapisu i waliduje pola. Zapis dotyczy tylko estera_book_draft w user_metadata; nie zmienia ról, VIP, treści snów ani preferencji języka. Szkic można wczytać ponownie także na innym urządzeniu. Nie zawiera kopii treści snów: następny podgląd użyje ich najnowszego zapisu; usunięte wpisy zostaną pominięte. Nie zapisujemy gotowego PDF jako zamrożonej wersji książki.

Eksport przyjmuje includeIds (tylko własne sny, maksymalnie 500), coverStyle i fontStyle oraz imię. Numery stron i spis treści są przeliczane dla końcowego wyboru i czcionki. Wykluczenia wcześniejszego eksportu nadal są obsługiwane dla kompatybilności. Testy: node tests/book-builder-flow.test.mjs po npm run build.


## Dwa warianty strony głównej
Przełącznik pod wprowadzeniem: „Kość słoniowa” / „Granat”. Jasna wersja używa #FDFBF7 i granatowych napisów #0C1425. Ciemna: tło #0C1425 z palety kart i złote napisy #D6BB80, obramowania #B79A60. Układ, logo i oryginalne grafiki kart pozostają zachowane. Wybór jest zapamiętywany lokalnie (estera.homeTheme.v1), bez zmiany danych konta. Motyw dotyczy strony głównej, jej nagłówka i stopki; po przejściu do dziennika, formularza lub panelu wraca dotychczasowa paleta tych widoków. Nie zmienia motywu okładki PDF ani oprawy zapisanej Księgi.


Karta „Język Aniołów”: zaakceptowany wariant z rozproszonymi, rozświetlonymi cząsteczkami za złotymi skrzydłami. Zastąpiono grafikę jezyk-aniolow.jpg, zachowując układ i pozostałe karty.


### Wspólny motyw podstron
Przełącznik „Kość słoniowa / Granat” jest dostępny we wspólnym układzie: na stronie głównej, w interpretatorach, dzienniku i kreatorze Księgi, Czytelni, kontakcie, logowaniu i administracji. Wybór jest pamiętany w tej przeglądarce (dotychczasowy klucz `estera.homeTheme.v1`). Kość słoniowa `#FDFBF7` ma granatowe napisy `#0C1425`; granat `#0C1425` ma złote napisy `#D6BB80`. Pola formularzy, wyniki i panele korzystają z tej samej palety, obramowania pozostają złote. Motyw strony nie zmienia obrazów kart ani wybranej oprawy generowanego PDF.


### Naprawa interpretacji krótkich liczb
Synchroniczność przyjmuje również jedno- i dwucyfrowe liczby, np. `7`, `0`, `34`. Wspólny wcześniejszy warunek minimum trzech znaków blokował je przed wywołaniem AI. Minimum trzech znaków dotyczy teraz wyłącznie opisu snu; synchroniczność wymaga niepustej treści. Okno wyniku jest pokazywane już na początku oczekiwania i po odpowiedzi/błędzie. Bezpośredni adres `/#liczby` otwiera Język Aniołów. Regresja: `node --experimental-strip-types tests/interpretation-input.test.mjs`.
