# 🌙 Сонна Книга — Dream Journal PWA

Щоденник снів із синхронізацією через Google Drive.  
Один вхід — і дані автоматично зберігаються та доступні з будь-якого пристрою.

---

## Стек

| Шар | Технологія |
|-----|------------|
| Frontend | Vanilla HTML/CSS/JS, PWA (Service Worker) |
| Backend (auth) | Vercel Serverless Functions |
| Сховище даних | Google Drive **appDataFolder** (прихована папка, видима тільки застосунку) |
| Auth | OAuth 2.0 Authorization Code Flow + httpOnly refresh token cookie |
| Хостинг | Vercel |

---

## Структура проєкту

```
.
├── index.html          ← SPA (весь UI)
├── manifest.json       ← PWA manifest
├── sw.js               ← Service Worker (офлайн кеш)
├── vercel.json         ← Vercel routing
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
└── api/
    ├── auth-login.js   ← Redirect → Google consent
    ├── auth-callback.js← Exchange code → tokens, set cookie
    ├── refresh.js      ← Silent token refresh via cookie
    └── logout.js       ← Revoke + clear cookie
```

---

## Налаштування — покрокова інструкція

### 1. Google Cloud Console

1. Відкрий [console.cloud.google.com](https://console.cloud.google.com)
2. Створи новий проєкт (або вибери існуючий)
3. **APIs & Services → Enable APIs** → увімкни **Google Drive API**
4. **APIs & Services → OAuth consent screen**
   - User type: **External**
   - App name: `Сонна Книга`
   - Scopes: додай `https://www.googleapis.com/auth/drive.appdata`
   - Test users: додай свій Google-акаунт (поки в режимі тестування)
5. **APIs & Services → Credentials → Create Credentials → OAuth Client ID**
   - Application type: **Web application**
   - Name: `Dream Journal`
   - Authorized redirect URIs: додай **обидва**:
     ```
     https://твій-домен.vercel.app/api/auth-callback
     http://localhost:3000/api/auth-callback
     ```
6. Скопіюй **Client ID** та **Client Secret**

---

### 2. GitHub

```bash
# Клонуй або створи репозиторій
git init
git add .
git commit -m "Initial: Сонна Книга PWA"
git remote add origin https://github.com/твій-юзер/dream-journal.git
git push -u origin main
```

---

### 3. Vercel

1. Відкрий [vercel.com](https://vercel.com) → **Add New Project**
2. Вибери репозиторій з GitHub
3. Framework Preset: **Other**
4. **Environment Variables** — додай:

   | Name | Value |
   |------|-------|
   | `GDRIVE_CLIENT_ID` | Client ID з Google Console |
   | `GDRIVE_CLIENT_SECRET` | Client Secret з Google Console |

5. **Deploy** → отримай URL вигляду `https://dream-journal-xxx.vercel.app`

6. Поверніться в Google Console → Credentials → додай production URL до Authorized redirect URIs:
   ```
   https://dream-journal-xxx.vercel.app/api/auth-callback
   ```

---

### 4. Іконки

Потрібні два файли (можна згенерувати на [realfavicongenerator.net](https://realfavicongenerator.net)):
- `icons/icon-192.png`
- `icons/icon-512.png`

---

## Як працює авторизація

```
Користувач                SPA (index.html)         /api/*            Google
    │                           │                     │                  │
    │── Відкриває застосунок ──▶│                     │                  │
    │                           │── GET /api/refresh ▶│                  │
    │                           │                     │── cookie OK? ───▶│
    │                           │◀── { access_token } │                  │
    │                           │                     │                  │
    │  (або перший вхід)        │                     │                  │
    │── Натискає "Увійти" ─────▶│── redirect ────────▶/api/auth-login    │
    │                           │                     │── redirect ──────▶│
    │                           │                     │                  │ consent
    │                           │                     │◀── code ─────────│
    │                           │                     │/api/auth-callback│
    │                           │                     │── exchange code ─▶│
    │                           │                     │◀── tokens ───────│
    │                           │                     │ Set-Cookie:       │
    │                           │                     │  dream_refresh    │
    │                           │◀── redirect /?#at=… │                  │
    │                           │                     │                  │
    │  (наступний раз)          │                     │                  │
    │── Відкриває застосунок ──▶│── GET /api/refresh ▶│                  │
    │                           │   (з cookie) ───────│── Google token ─▶│
    │                           │◀── { access_token } │                  │
    │                    автоматично                   │                  │
```

Після першого входу cookie живе **180 днів**. Повторний логін потрібен тільки якщо:
- Очищено cookies/кеш браузера
- Користувач явно натиснув «Вийти»
- Минуло 180 днів

---

## Де зберігаються дані

Всі дані зберігаються у **Google Drive appDataFolder** — прихована папка, яка:
- Не відображається у звичайному Drive користувача
- Видима тільки цьому застосунку
- Не займає квоту Drive користувача (формально — займає, але не видно)

Файли в appdata:
| Файл | Вміст |
|------|-------|
| `dreamjournal.json` | Масив снів + налаштування + обкладинка (base64) |

---

## Локальна розробка

```bash
npm i -g vercel
vercel dev   # запускає на localhost:3000
```

Env vars для локального запуску — у файлі `.env.local`:
```
GDRIVE_CLIENT_ID=your_client_id
GDRIVE_CLIENT_SECRET=your_client_secret
```

---

## Деплой оновлень

```bash
git add .
git commit -m "feat: ..."
git push
# Vercel автоматично перебудовує з GitHub
```
