# Dokumentacja wdrożeniowa projektu "What's The Score?"

Niniejszy poradnik zawiera kompletne, krokowe instrukcje pozwalające wdrożyć bezproblemowo całą architekturę aplikacji (baza danych, uwierzytelnianie, wysyłkę e-maili i hosting Frontendowy).

## Struktura folderu `deploy`
*   `/database` - zawiera pliki `*.sql` z modelem bazy danych, podstawowymi procedurami oraz politykami (RLS).
*   `/emails` - zawiera zaawansowane szablony HTML wykorzystywane podczas potwierdzania rejestracji oraz resetowania hasła (zgodne z aktualnym motywem aplikacji).

---

## 1. Konfiguracja bazy danych: Supabase

### Krok 1: Nowy projekt
1. Zaloguj się na stronę [Supabase](https://app.supabase.com) i utwórz nową organizację oraz projekt powiązany z "What's The Score?".
2. Wybierz region bazodanowy w zależności od lokalizacji Twoich użytkowników (preferowane: Frankfurt ew. Londyn).
3. Po wygenerowaniu projektu, przejdź do sekcji **Project Settings -> API** i skopiuj klucze: `Project URL` oraz `anon public`. Podepniesz je na Vercelu na dalszym etapie.

### Krok 2: Import struktury bazy (Schemat SQL)
1. Udaj się do zakładki **SQL Editor** po lewej stronie.
2. Otwórz pliki migracyjne z folderu `deploy/database`. Zaleca się zacząć od pełnego importu z `full_schema.sql` (lub plików z chronologią `01_...`, jeśli takowe posiadasz).
3. Jeżeli w plikach konfiguracyjnych są inne schematy jak `tournament_schema.sql` lub zaktualizowane restrykcje, wykonaj je jeden po drugim.

### Krok 3: Ustawienia Autoryzacji i Emaili (Supabase Auth)
1. Przejdź do zakładki **Authentication -> URL Configuration** i dodaj w *Site URL* swoją produkcyjną domenę na Vercel (np. `https://whatsthescore.art`). W *Redirect URLs* powinieneś dodatkowo uwiarygodnić wildcard, dodając np. `https://whatsthescore.art/**`.
2. Udaj się do zakładki **Authentication -> Configuration -> Email Templates**. Skonfiguruj dwie konkretne zakładki:
    *   **Confirm Signup**: Zmień tryb wysyłki jeśli to konieczne (kod PIN). Kod z pliku `deploy/emails/email_template_confirm_signup.html` wklej w całości jako "Message body". A w Subject polecać się wpisać coś w stylu "Potwierdź swój e-mail".
    *   **Reset Password**: Odnajdź plik `deploy/emails/email_template_reset_password.html` i wklej jego treść HTML. Subject: "Zresetuj hasło - What's The Score?".

*(Jeżeli wiadomości e-mail z podstawowego Supabase lądują w spamie u użytkowników, zobacz na Krok 4 poniżej, aby wykorzystać profesjonalne bramki e-mail. Jest on szczególnie polecany do wdrożeń komercyjnych).*

---

## 2. Poczta produkcyjna: Resend SMTP (Opcjonalnie, ale mocno polecane)

Ta sekcja eliminuje lądowanie e-maili z weryfikacją z domeny `supabase.co` do folderu Spam, za pomocą zewnętrznego dostawcy poczty (np. Resend).

1. Zarejestruj się w [Resend.com](https://resend.com) i w zakładce *Domains* zweryfikuj swoją nową domenę przez rekordy DNS (dodanie kluczy MX, SPF i DKIM u Twojego dostawcy / Vercel Domains).
2. W wygenerowanej liście *API Keys*, utwórz klucz dający uprawnienia z nazwą np. `WTS_Production_Supabase`. Skopiuj wygenerowany token, gdyż pojawi się tylko raz.
3. Wracamy do panelu **Supabase -> Authentication -> SMTP Settings**:
    *   Włącz opcję *Enable Custom SMTP* (`ON`).
    *   **Sender address**: `no-reply@twojadomena.pl` (Email zweryfikowany z Resend).
    *   **Sender name**: `What's The Score?` (Wyświetla się na liście e-maili użytkownika).
    *   **Host**: `smtp.resend.com`
    *   **Port**: `465` (SSL) lub `587` (TLS).
    *   **User**: `resend` (to słowo musi być wpisane dosłownie tak!).
    *   **Pass**: Twój wykopiony przed chwilą API Key z Resend zaczynający się od `re_...`.
4. Gotowe, autoryzacyjne weryfikacje przebiegają pod Twoją docelową marką.

---

## 3. Konfiguracja domeny webowej i hosting Frontendowy: Vercel

### Krok 1: Wpięcie repozytorium GitHub do Vercela
1. Utwórz nowe konto na stronie [Vercel](https://vercel.com/) (rekomendowany darmowy plan do zastosowań na powiadomienia hobbystyczne/niskoruchomych projektów, Vercel jest autorem rameworka Next.js stosowanego w projekcie).
2. Kliknij `Add New -> Project` z panelu Dashboard Vercel'a. Zaimportuj połączenie ze swoim repo.
3. Z listy "Framework Preset" Vercel automatycznie powiniem wyodrębnić **Next.js**. Jako główny folder użyj domyślnego katalogu kompilacji `./`.

### Krok 2: Deployment i Zmienne Środowiskowe
Nie klikaj od razu przycisku "Deploy". Rozwiń dolne menu `Environment Variables` (Zmienne Konfiguracyjne) i utwórz nowo dodane pozycje (pobrane w punkcie 1, kroku 1 Supabase):

```env
NEXT_PUBLIC_SUPABASE_URL=twoj_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=twoj_anon_klucz_publiczny_supabase
```

*(Uwaga: w tych polach nie używaj cudzysłowów ani znaków ukośników ukończeniowych dla url - wpisuj tekst naturalnie. Ułatwi to odczyt ze startowego configu).*

4. Teraz wciśnij "Deploy". Vercel odetnie pakiet środowiskowy z logiką, zbuduje pliki produkcyjne `PWA` i skonfiguruje publiczną ścieżkę do strony głównej.

*(Wiedz: Zdecydowane zmiany na obiekcie i funkcjonalności mogą nastąpić po edycji np. integracji Dicebear'a oraz awatarów w pliku centralnym `src/lib/config.ts`).*

Po udanym Deployment'cie upewnij się, że przetestujesz rejestrację, aby zapewnić, że tabele `profiles`, procedury dla nowych użytkowników z Supabase i triggery dla logowania działają bez zarzutu - w razie potrzeb powróć do tabeli RLS w Twojej bazie by wyśledzić errory. Powodzenia.
