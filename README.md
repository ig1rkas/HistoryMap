# HistoryMap
![logo](docs/images/banner.png)

## Описание проекта
Веб-сервис с интерактивной картой достопримечательностей Санкт-Петербурга. Пользователь может просматривать места на карте, фильтровать их по полям (категория, эпоха, архитектурный стиль и т.д.), открывать подробную информацию, оставлять отзывы и оценки. Авторизация — через VK ID.

## Полезные ссылки
* Дашборд проекта: https://github.com/users/stanevko-ilya/projects/4
* Дизайн в Figma: https://www.figma.com/design/RJeuXs7pYUfLApqXnjhpXM/HistoryMap?node-id=0-1&t=Ji8BnYOcBwPg8lcx-1

## Установка

### Требования
- **Node.js 20+** и **npm 9+**
- **MongoDB 7** для локального запуска backend без Docker
- **Docker** и **Docker Compose** для быстрого запуска backend-инфраструктуры
- API-ключ **Яндекс.Карт** для отображения карт во frontend
- Приложение **VK ID** для полноценной проверки авторизации

Зависимости устанавливаются отдельно для backend и frontend: общего `package.json` в корне проекта нет.

### Установка и запуск Backend-части
Полная инструкция — [`docs/backend/setup.md`](docs/backend/setup.md).

Быстрый старт через Docker:
```sh
cd src/backend
cp .env.example .env          # заполнить секреты
docker compose up --build -d
curl http://localhost:3000/api/ping
```

Для локального запуска без Docker — `npm install && npm run dev` из `src/backend/` (нужна MongoDB на `localhost:27017`).

### Установка и запуск Frontend-части
Frontend расположен в [`src/frontend`](src/frontend) и запускается как отдельное Vite-приложение.

1. Установите зависимости:
   ```sh
   cd src/frontend
   npm install
   ```

2. Создайте файл `.env` в `src/frontend/` и укажите адрес backend API и ключ Яндекс.Карт:
   ```env
   VITE_API_BASE_URL=http://localhost:3000
   VITE_YANDEX_MAPS_API_KEY=your-yandex-maps-api-key
   ```

   Если backend запущен на другом хосте или порту, измените `VITE_API_BASE_URL`.

3. Запустите frontend в dev-режиме:
   ```sh
   npm run dev
   ```

   По умолчанию Vite поднимает приложение на http://localhost:5173.

4. Для production-сборки используйте:
   ```sh
   npm run build
   npm run preview
   ```

   Сборка создается в `src/frontend/dist`. Конфигурация Vite использует `base: './'` и `vite-plugin-singlefile`, поэтому результат удобно отдавать как статические файлы.

### Быстрый запуск всего проекта локально
1. Запустите backend:
   ```sh
   cd src/backend
   cp .env.example .env
   npm install
   npm run dev
   ```

2. В отдельном терминале запустите frontend:
   ```sh
   cd src/frontend
   npm install
   npm run dev
   ```

3. Откройте http://localhost:5173.

Для работы с реальными данными backend должен быть доступен по адресу из `VITE_API_BASE_URL`, а MongoDB должна быть запущена и доступна backend-части.

## Настройка проекта

### Backend-переменные окружения
Backend настраивается через локальный файл `src/backend/.env`. Его нужно создать из шаблона [`src/backend/.env.example`](src/backend/.env.example).

Ключевые параметры:
- `PORT` / `API_PORT` — порт API при локальном запуске и внешний порт docker-compose.
- `MONGO_URL` — строка подключения к MongoDB при запуске без Docker.
- `MONGO_USER` / `MONGO_PASSWORD` — учетные данные MongoDB для docker-compose.
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — секреты для подписи access- и refresh-токенов.
- `JWT_ACCESS_TTL` / `JWT_REFRESH_TTL` — время жизни токенов.
- `VK_CLIENT_ID`, `VK_CLIENT_SECRET`, `VK_REDIRECT_URI` — параметры приложения VK ID.
- `FRONTEND_URL` — адрес frontend, куда backend возвращает пользователя после VK-авторизации.
- `CORS_ORIGIN` — разрешенный origin frontend. Для локального Vite обычно `http://localhost:5173`.
- `TEST_MODE` — тестовый режим API; в production должен быть `false`.

Для локальной связки frontend и backend обычно достаточно:
```env
PORT=3000
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173/
MONGO_URL=mongodb://localhost:27017/history_map
```

### Frontend-переменные окружения
Frontend читает только переменные с префиксом `VITE_`.

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_YANDEX_MAPS_API_KEY=your-yandex-maps-api-key
```

- `VITE_API_BASE_URL` — базовый URL backend API. Если переменная не задана, используется `http://localhost:3000`.
- `VITE_YANDEX_MAPS_API_KEY` — ключ JavaScript API Яндекс.Карт, который передается в `@pbe/react-yandex-maps`.

После изменения `.env` frontend-сервер Vite нужно перезапустить.

## Технологии

### Backend
- **Node.js 20+** + **Express 4** + **body-parser**
- **MongoDB 7** + **Mongoose 8**, `2dsphere`-индекс для геопоиска мест в радиусе
- **JWT** (access + refresh) поверх VK ID OAuth
- **Vitest** + **supertest** + **mongodb-memory-server** для тестов
- **Swagger UI** (автогенерация OpenAPI при старте из `config.json` методов)
- **Docker** + **docker-compose** (контейнеры `mongo` и `api`)
- Собственная модульная система из шаблона [template-server](https://github.com/stanevko-ilya/template-server)

### Frontend
- **React 18** + **React DOM**
- **Vite 5** + **@vitejs/plugin-react**
- **react-router-dom 7** для маршрутов `/` и `/map`
- **@pbe/react-yandex-maps** для интеграции с Яндекс.Картами
- **vite-plugin-singlefile** для сборки frontend в статический single-file bundle
- Собственный API-клиент поверх `fetch` с базовым URL из `VITE_API_BASE_URL`
- Контекст авторизации с хранением JWT в `localStorage` и обновлением access-токена через `/api/auth/refresh`

## Frontend-часть проекта

Основные страницы:
- [`LandingPage`](src/frontend/pages/LandingPage.jsx) — стартовая страница с промо-блоком и интерактивной картой.
- [`MapPage`](src/frontend/pages/MapPage.jsx) — основная карта достопримечательностей с фильтрами, карточками мест, детальной панелью, отзывами и оценками.

Основные модули:
- [`src/frontend/api/client.js`](src/frontend/api/client.js) — функции для запросов к backend API: места, фильтры, отзывы.
- [`src/frontend/auth/AuthContext.jsx`](src/frontend/auth/AuthContext.jsx) — VK ID авторизация, хранение токенов, refresh flow и авторизованные запросы.
- [`src/frontend/components`](src/frontend/components) — переиспользуемые UI-компоненты шапки, футера, hero-блока, карты и информационных карточек.
- [`src/frontend/styles`](src/frontend/styles) — основные стили приложения.

Frontend ожидает backend API со следующими маршрутами:
- `GET /api/places/count`
- `GET /api/places/points`
- `GET /api/places/filters`
- `GET /api/places/get`
- `GET /api/reviews/list`
- `POST /api/reviews/create`
- `GET /api/auth/vk`
- `GET /api/auth/me`
- `POST /api/auth/refresh`

## Архитектура проекта
* [`./src/backend`](https://github.com/ig1rkas/HistoryMap/tree/development/src/backend) — актуальный исходный код Backend-части проекта
* [`./src/frontend`](https://github.com/ig1rkas/HistoryMap/tree/development/src/frontend) — актуальный исходный код Frontend-части проекта
* [`./docs`](https://github.com/ig1rkas/HistoryMap/tree/development/docs) — актуальная документация проекта

## Разработчики
* Дизайн + Backend: [Станевко Илья](https://github.com/stanevko-ilya)
* Аналитика + Frontend: [Пожидаев Денис](https://github.com/ig1rkas)
