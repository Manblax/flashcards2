# FlashCards2

Полнофункциональное приложение для изучения материалов через флэш-карточки.

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-149eca)
![NestJS](https://img.shields.io/badge/NestJS-11-e0234e)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## Текущее состояние

### Реализовано

- Главная страница с последними модулями
- Библиотека с бесконечной прокруткой
- Группировка модулей по времени (эта неделя, прошлая неделя, старше)
- Просмотр модуля и списка терминов
- Создание, редактирование и удаление модулей
- Загрузка изображений для терминов
- Регистрация и вход пользователя (JWT возвращается backend'ом)
- Вход и регистрация через Google OAuth
- PostgreSQL + Prisma для хранения пользователей, модулей и терминов

### В работе

- Учебные режимы (карточки/заучивание/тест) на странице модуля
- Полноценная серверная авторизация для защищенных операций

## Технологический стек

### Frontend (`frontend/`)

- Next.js 16.0.10 (App Router)
- React 19.2.1
- TypeScript 5
- Tailwind CSS 4
- DaisyUI 5.5.13

### Backend (`backend/`)

- NestJS 11
- Prisma 6.19.1
- PostgreSQL 15 (через Docker)
- JWT + Passport для аутентификации
- Multer для загрузки файлов

## Быстрый старт

### 1. Установка зависимостей

```bash
(cd frontend && npm install)
(cd backend && npm install)
```

### 2. Поднять PostgreSQL

```bash
docker compose up -d
```

Сервис базы данных поднимается на `localhost:5432`, pgAdmin на `localhost:5050`.

### 3. Запустить backend

```bash
# terminal 1
cd backend
npx prisma migrate deploy
npm run start:dev
```

Backend запускается на `http://localhost:3001`.

Интерактивная Swagger-документация доступна на `http://localhost:3001/api/docs`,
OpenAPI JSON — на `http://localhost:3001/api/docs-json`.

Для Google OAuth нужно заполнить переменные в `backend/.env`:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL` (по умолчанию `http://localhost:3001/auth/google/callback`)
- `FRONTEND_URL` (по умолчанию `http://localhost:3000`)

### 4. Запустить frontend

```bash
# terminal 2
cd frontend
npm run dev
```

Frontend запускается на `http://localhost:3000`.

### Домены для разработки и production

Docker Compose использует localhost по умолчанию. Чтобы переопределить адреса,
скопируйте корневой пример окружения и измените нужные значения:

```bash
cp .env.example .env
```

Для локальной разработки значения из примера можно оставить без изменений.

`NEXT_PUBLIC_API_URL` встраивается во frontend во время сборки Docker-образа.
Поэтому в GitHub необходимо создать две Actions repository variables:

- `API_HOST` — DNS-имя API без схемы, например `api.example.com`;
- `NEXT_PUBLIC_API_URL` — соответствующий HTTPS origin, например
  `https://api.example.com`.

CD проверит, что эти значения соответствуют друг другу, перед публикацией
frontend-образа.

CI намеренно использует localhost-адреса: они нужны только для изолированной
сборки и тестов. Production-домен используется в CD при сборке публикуемого
frontend-образа.

Файлы `.env` не коммитятся. Секреты (`JWT_SECRET`, Google OAuth credentials и
пароли базы данных) также должны храниться только в окружении production.

### Production с Nginx и Let’s Encrypt

Production использует отдельный Compose-файл. Публично открыты только порты 80
и 443 контейнера Nginx. Frontend, backend, dictionary service и PostgreSQL
доступны только во внутренней Docker-сети.

Перед первым запуском:

1. Создайте DNS-записи для frontend и API, направленные на VPS.
2. Откройте входящие TCP-порты 80 и 443.
3. Авторизуйте VPS в GHCR: `docker login ghcr.io`.
4. Скопируйте и заполните production-окружение:

```bash
cp .env.production.example .env.production
```

`IMAGE_TAG` должен быть неизменяемым `sha-*` тегом, опубликованным CD.
`NEXT_PUBLIC_API_URL` должен совпадать с адресом, встроенным в выбранный
frontend-образ. Если пароль PostgreSQL содержит специальные URL-символы, в
`DATABASE_URL` его необходимо percent-encode. Внутренние адреса
`INTERNAL_API_URL` и `DICTIONARY_SERVICE_URL` оставьте со значениями из примера:
они используют имена сервисов в закрытой Docker-сети.

Первый запуск получает один SAN-сертификат для обоих доменов и поднимает стек:

```bash
./scripts/init-production-tls.sh .env.production
```

Для обновления измените `IMAGE_TAG` и выполните:

```bash
./scripts/deploy-production.sh .env.production
```

Скрипт проверит конфигурацию, скачает образы, убедится, что frontend собран для
нужного API origin, применит Prisma migrations и перезапустит сервисы. Для
rollback верните предыдущий `sha-*` тег и повторите ту же команду.

Проверка состояния и сертификатов:

```bash
docker compose --env-file .env.production -f docker-compose.production.yml ps
docker compose --env-file .env.production -f docker-compose.production.yml logs certbot
docker compose --env-file .env.production -f docker-compose.production.yml exec certbot certbot certificates
docker compose --env-file .env.production -f docker-compose.production.yml exec certbot certbot renew --dry-run --webroot --webroot-path /var/www/certbot
```

Certbot проверяет продление каждые 12 часов, а Nginx перечитывает сертификаты
каждые 6 часов.

## Скрипты

### Frontend (`frontend/`)

```bash
cd frontend
npm run dev
npm run build
npm run start
npm run lint
npm run test
npm run test:e2e
```

### Backend (`backend/`)

```bash
cd backend
npm run start:dev
npm run build
npm run start:prod
npm run test
npm run test:e2e
```

### Все unit tests

```bash
npm test
```

### E2E tests

```bash
npm run test:e2e
```

## Структура проекта

```text
flashcards2/
├── backend/
│   ├── src/
│   │   ├── auth/                # register/login + JWT strategy
│   │   ├── flashcards/          # CRUD for modules/terms
│   │   ├── uploads/             # image upload endpoint
│   │   └── prisma/              # Prisma service/module
│   ├── prisma/                  # schema + migrations
│   └── uploads/                 # uploaded files
├── frontend/
│   ├── app/                     # Next.js routes (home, library, auth, module pages)
│   ├── components/              # UI components and layouts
│   ├── lib/                     # API client for backend calls
│   ├── types/                   # Shared TS types for frontend
│   └── package.json             # Frontend package manifest
├── deploy/nginx/                # Production reverse-proxy configuration
├── scripts/                     # Production TLS bootstrap and deployment
├── docker-compose.yml           # Development stack
├── docker-compose.production.yml # Production stack
└── README.md
```

## API (основные маршруты)

- `GET /flashcards`, `GET /flashcards/:id`
- `POST /flashcards`, `PATCH /flashcards/:id`, `DELETE /flashcards/:id`
- `POST /upload`
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/google`
- `GET /auth/google/callback`

## Документация

- [frontend/QUICK_START.md](./frontend/QUICK_START.md)
- [frontend/COMPONENTS.md](./frontend/COMPONENTS.md)
- [frontend/PROJECT_OVERVIEW.md](./frontend/PROJECT_OVERVIEW.md)
