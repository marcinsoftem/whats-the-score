# Konfiguracja Resend dla produkcyjnej bazy Supabase

Ten przewodnik pomoże Ci skonfigurować usługę **Resend** jako zewnętrzny dostawca SMTP w Twoim projekcie produkcyjnym Supabase.

## 1. Wygenerowanie API Key w Resend
1. Zaloguj się na [Resend.com](https://resend.com/api-keys).
2. Wybierz zakładkę **API Keys**.
3. Kliknij **Create API Key**.
4. Nadaj mu nazwę (np. `Supabase-Production`) i uprawnienia **Sending** (jeśli chcesz pełnego bezpieczeństwa) lub **Full Access**.
5. Skopiuj klucz (zaczyna się od `re_...`).

## 2. Konfiguracja domeny (Resend)
Aby Twoje maile dochodziły do skrzynek i nie były traktowane jako SPAM:
1. Wejdź w **Domains** -> **Add Domain**.
2. Dodaj swoją domenę (np. `twojadomena.pl`).
3. Dokończ weryfikację **DNS** u swojego dostawcy domen (trzeba dodać rekordy MX, SPF i DKIM podane przez Resend).

## 3. Ustawienia w Supabase
Wejdź w panelu Supabase do: **Project Settings** -> **Authentication** -> **SMTP Settings**.

| Pole | Wartość |
| :--- | :--- |
| **Enable Custom SMTP** | ON |
| **Sender address** | `no-reply@twojadomena.pl` (Email zweryfikowany w Resend) |
| **Sender name** | `What's The Score?` |
| **SMTP Host** | `smtp.resend.com` |
| **SMTP Port** | `465` (SSL) lub `587` (TLS) |
| **SMTP User** | `resend` (to słowo musi być wpisane dosłownie tak!) |
| **SMTP Pass** | Twój API Key z Resend (`re_...`) |

## 4. Dodatkowe ustawienia (Authentication)
Pamiętaj o dodaniu produkcyjnych adresów URL w sekcji **URL Configuration** -> **Redirect URLs**:
1. `https://twojadomena.pl/**`
2. `https://www.twojadomena.pl/**`

Dzięki temu maile z resetem hasła będą poprawnie przekierowywały gracza z powrotem do aplikacji produkcyjnej.

## 5. Przetestuj szablony
W sekcji **Email Templates** upewnij się, że korzystasz z szablonów HTML przygotowanych wcześniej (znajdują się w folderze `docs/` repozytorium).
