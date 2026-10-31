# Pracownia Estery — Vercel / Next.js

Strona z trzema kafelkami, bezpłatnym sennikiem, językiem aniołów, czytelnią i dziennikiem snów. Kod Duszy prowadzi na https://soul-decoder-estera.vercel.app/.

## Publikacja na Vercelu

Repozytorium: `emiolsz/estera`, gałąź `main`, Root Directory: katalog główny (puste pole), Framework: **Next.js**. Konfiguracja `vercel.json` ustawia instalację `npm ci`, budowanie `npm run build` i wynik `.next`. Usuń wcześniejsze ręczne nadpisania poleceń instalacji/budowania lub Output Directory w ustawieniach projektu. Nie ustawiaj `dist` ani `vinext build`.

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
