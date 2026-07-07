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
├── docker-compose.yml           # PostgreSQL + pgAdmin
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
