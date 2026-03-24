# Tematy wiadomości e-mail (Supabase Dashboard)

Oto zlokalizowane tematy dla mechanizmów e-mail zintegrowanych z aplikacją. Skopiuj i wklej odpowiedni kod w pole **Subject** w panelu Supabase.

### 1. Resetowanie hasła (Reset Password)
```text
{{ if eq .Data.language "pl" }}Resetowanie hasła - What's The Score?{{ else }}Password Reset - What's The Score?{{ end }}
```

### 2. Potwierdzenie e-mail (Confirm Signup)
```text
{{ if eq .Data.language "pl" }}Potwierdź swój e-mail - What's The Score?{{ else }}Confirm your email - What's The Score?{{ end }}
```

---

Pamiętaj o ustawieniu odpowiedniego szablonu HTML w polu **Body** z plików:
- `email_template_reset_password.html`
- `email_template_confirm_signup.html`
