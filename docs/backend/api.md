# Backend — API

Живая Swagger-документация поднимается при каждом запуске сервера из `openapi`-секций в `config.json` методов.

| Ресурс | URL |
|---|---|
| Swagger UI | http://localhost:3000/api/docs |
| OpenAPI JSON | http://localhost:3000/api/openapi.json |

## Формат ответов

- Успех: `{ "response": <payload> }`
- Ошибка: `{ "error": { "code": <int>, "message": "..." } }`

Подробнее про коды ошибок и формат `config.json` методов — [config.md](config.md).

## Авторизация

Все защищённые методы принимают JWT в заголовке:

```
Authorization: Bearer <access_token>
```

Токены выдаются методом [`GET /api/auth/vk`](../../src/backend/modules/api/methods/auth/vk/) после успешной VK-авторизации. Схема подключения VK — см. [setup.md](setup.md) и env-переменные `VK_*` в [config.md](config.md).

## Endpoints на текущий момент

| Метод | Путь | Описание |
|---|---|---|
| GET | `/api/ping` | Проверка работы API |
| GET | `/api/auth/vk` | VK ID — инициация авторизации (без `?code`) / callback (с `?code`) |
| GET | `/api/auth/me` | Профиль текущего пользователя (auth) |
| POST | `/api/auth/refresh` | Обновление пары access+refresh |
| POST | `/api/auth/logout` | Инвалидация refresh в БД (auth) |
| GET | `/api/places/points` | Пины карты (фильтры + гео-радиус) |
| GET | `/api/places/cards` | Карточки с пагинацией |
| GET | `/api/places/get` | Полная плашка по `id` |
| GET | `/api/places/filters` | Доступные значения фильтров (кэш 10 мин) |
| GET | `/api/places/count` | Общее число мест (кэш 10 мин, для лендинга) |
| GET | `/api/reviews/list` | Approved-отзывы для места, пагинация, sort по дате desc |
| POST | `/api/reviews/create` | Создание отзыва с blacklist-модерацией (auth) |
