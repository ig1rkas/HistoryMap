# HistoryMap
![logo](docs/images/banner.png)

## Описание проекта
Веб-сервис с интерактивной картой достопримечательностей Санкт-Петербурга. Пользователь может просматривать места на карте, фильтровать их по полям (категория, эпоха, архитектурный стиль, рейтинг), открывать подробную информацию, оставлять отзывы и оценки. Авторизация — через VK ID.

## Полезные ссылки
* Дашборд проекта: https://github.com/users/stanevko-ilya/projects/4
* Дизайн в Figma: https://www.figma.com/design/RJeuXs7pYUfLApqXnjhpXM/HistoryMap?node-id=0-1&t=Ji8BnYOcBwPg8lcx-1

## Установка

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
Будет описано после реализации фронтенд-части.

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
Будет описано после реализации фронтенд-части.

## Архитектура проекта
* [`./src/backend`](https://github.com/ig1rkas/HistoryMap/tree/development/src/backend) — актуальный исходный код Backend-части проекта
* [`./src/frontend`](https://github.com/ig1rkas/HistoryMap/tree/development/src/frontend) — актуальный исходный код Frontend-части проекта
* [`./docs`](https://github.com/ig1rkas/HistoryMap/tree/development/docs) — актуальная документация проекта

## Разработчики
* Дизайн + Backend: [Станевко Илья](https://github.com/stanevko-ilya)
* Аналитика + Frontend: [Пожидаев Денис](https://github.com/ig1rkas)
