# Конструктор інтернет-форумів

Курсова робота (5 семестр): вебзастосунок для створення, налаштування й адміністрування
незалежних інтернет-форумів за моделлю SaaS. Технічне завдання: [ТЗ_КР_2026_Подкур_ІП-41.pdf](ТЗ_КР_2026_Подкур_ІП-41.pdf).

## Що зроблено (етап 1 — `submit1`)

- [x] Структура репозиторію: npm workspaces `server` + `client`, спільний `tsconfig.base.json`, `.editorconfig`, `.env.example`.
- [x] **Сервер** (Express 5 + TypeScript): перевірка змінних середовища (Zod), helmet, CORS, rate limiting,
      централізована обробка помилок, ендпоінти `/health/live` і `/health/ready`.
- [x] **Мультиорендність**: визначення форуму за піддоменом / власним доменом, `withTenant()` з
      `SET LOCAL search_path`, валідація імен схем.
- [x] **Міграції**: раннер для схеми `public` і всіх схем форумів (збій однієї схеми не зупиняє інші).
  - `platform/001_init.sql` — тарифи Free / Pro / Business (табл. 4.2), власники, орендарі.
  - `tenant/001_init.sql` — учасники, розділи, теми, пости з повнотекстовим пошуком (tsvector + GIN),
    реакції, скарги, журнал дій.
- [x] **Клієнт** (React 19 + Vite): SPA з маршрутизацією, локалізація uk / en, світла й темна теми на
      CSS Variables, лендинг із перевіркою стану API.
- [x] **Docker**: `docker-compose.yml` (PostgreSQL, сервер, клієнт на nginx), Dockerfile для обох частин.

Перевірено: `npm run typecheck` і `npm run build` проходять, сервер відповідає на `/health/live`.
Міграції на живій БД ще не запускались.

**Далі за планом ТЗ:** автентифікація (JWT, bcrypt/Argon2, OAuth), Provisioning нового форуму,
REST API для розділів, тем і постів.

## Стек

| Частина     | Технології                                          |
| ----------- | --------------------------------------------------- |
| Сервер      | Node.js 22, TypeScript, Express 5, `pg`, Zod        |
| Клієнт      | React 19, TypeScript, Vite, React Router (SPA)      |
| База даних  | PostgreSQL 16 (Shared Database, Separate Schema)    |
| Розгортання | Docker, docker-compose, nginx                       |

## Структура

```
.
├── server/                 REST API
│   ├── migrations/
│   │   ├── platform/       схема public: тарифи, власники, орендарі (tenants)
│   │   └── tenant/         схема кожного форуму: учасники, розділи, теми, пости…
│   └── src/
│       ├── db/             пул з'єднань, withTenant (search_path), міграції
│       ├── middleware/     визначення орендаря за піддоменом, обробка помилок
│       └── routes/
├── client/                 SPA (React)
│   └── src/
│       ├── i18n/           українська / англійська
│       └── pages/
└── docker-compose.yml
```

## Мультиорендність

Кожен форум має окрему схему PostgreSQL `tenant_<id>`. Сервер визначає форум за
заголовком `Host` (`demo.localhost` → `demo`), а всі запити до його даних виконуються
через `withTenant()`, яка в транзакції ставить `SET LOCAL search_path` лише на схему
цього форуму. Міграції `migrations/tenant` застосовуються до всіх схем; збій в одній
схемі не зупиняє інші.

## Запуск для розробки

Потрібні Node.js 22+ і Docker.

```bash
cp .env.example .env      # за потреби змініть паролі та секрети
npm install
npm run db:up             # PostgreSQL у Docker
npm run migrate           # застосувати міграції
npm run dev:server        # API: http://localhost:4000
npm run dev:client        # SPA: http://localhost:5173
```

Перевірка: `curl http://localhost:4000/health/ready`.

## Запуск усього в Docker

```bash
cp .env.example .env
docker compose up --build
```

Клієнт: http://localhost:8080, API: http://localhost:4000.

## Скрипти

| Команда             | Дія                                 |
| ------------------- | ----------------------------------- |
| `npm run build`     | зібрати сервер і клієнт             |
| `npm run typecheck` | перевірка типів обох частин         |
| `npm run migrate`   | застосувати міграції до всіх схем   |
| `npm run db:up`     | запустити PostgreSQL                |
| `npm run db:down`   | зупинити контейнери                 |
