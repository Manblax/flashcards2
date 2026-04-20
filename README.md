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

### Frontend (корень репозитория)

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
npm install
cd backend && npm install
```

### 2. Поднять PostgreSQL

```bash
docker compose up -d
```

Сервис базы данных поднимается на `localhost:5432`, pgAdmin на `localhost:5050`.

### 3. Запустить backend

```bash
cd backend
npx prisma migrate deploy
npm run start:dev
```

Backend запускается на `http://localhost:3001`.

Для Google OAuth нужно заполнить переменные в `backend/.env`:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL` (по умолчанию `http://localhost:3001/auth/google/callback`)
- `FRONTEND_URL` (по умолчанию `http://localhost:3000`)

### 4. Запустить frontend

```bash
cd ..
npm run dev
```

Frontend запускается на `http://localhost:3000`.

## Скрипты

### Frontend (корень)

```bash
npm run dev
npm run build
npm run start
npm run lint
```

### Backend (`backend/`)

```bash
npm run start:dev
npm run build
npm run start:prod
npm run test
npm run test:e2e
```

## Структура проекта

```text
flashcards2/
├── app/                         # Next.js routes (home, library, auth, module pages)
├── components/                  # UI components and layouts
├── lib/                         # API client for backend calls
├── types/                       # Shared TS types for frontend
├── backend/
│   ├── src/
│   │   ├── auth/                # register/login + JWT strategy
│   │   ├── flashcards/          # CRUD for modules/terms
│   │   ├── uploads/             # image upload endpoint
│   │   └── prisma/              # Prisma service/module
│   ├── prisma/                  # schema + migrations
│   └── uploads/                 # uploaded files
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

- [QUICK_START.md](./QUICK_START.md)
- [COMPONENTS.md](./COMPONENTS.md)
- [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)
