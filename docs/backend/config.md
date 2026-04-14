# Backend — конфигурация

Конфигурация разбита на два слоя: **секреты и переменные окружения** (`.env`, не коммитятся) и **статические настройки модулей** (`config.json` рядом с каждым модулем, коммитятся).

## .env

Шаблон — [`src/backend/.env.example`](../../src/backend/.env.example).

| Переменная | Назначение | Пример |
|---|---|---|
| `PORT` | Порт API внутри процесса/контейнера | `3000` (для dev), `80` (для живого VK) |
| `API_PORT` | Внешний порт при запуске через `docker compose` (маппится на `PORT`) | `3000` |
| `CORS_ORIGIN` | Разрешённые origins. `*` — любой. Список через запятую — whitelist с `credentials` | `*`, `https://history.example.com` |
| `MONGO_URL` | Строка подключения к Mongo **без** учётных данных. В compose переопределяется на `mongodb://mongo:27017/...` | `mongodb://localhost:27017/history_map` |
| `MONGO_USER` | Пользователь Mongo. Пусто — подключение без авторизации (dev). В compose — root-юзер контейнера | `admin` |
| `MONGO_PASSWORD` | Пароль Mongo. Только алфавитно-цифровые символы | `SuperSecret123` |
| `MONGO_AUTH_SOURCE` | БД для аутентификации (admin по умолчанию) | `admin` |
| `JWT_ACCESS_SECRET` | Секрет для подписи access-токенов | случайные 32+ символа |
| `JWT_REFRESH_SECRET` | Секрет для подписи refresh-токенов | случайные 32+ символа (отличается от access) |
| `JWT_ACCESS_TTL` | Срок жизни access-токена (формат [`ms`](https://github.com/vercel/ms)) | `15m` |
| `JWT_REFRESH_TTL` | Срок жизни refresh-токена | `30d` |
| `VK_CLIENT_ID` | ID приложения из админки VK ID | `54543923` |
| `VK_CLIENT_SECRET` | Защищённый ключ приложения VK | `xxxxxxxxxxx` |
| `VK_REDIRECT_URI` | Точный URL callback-а, совпадающий с настройкой в VK | `http://localhost/api/auth/vk` |
| `FRONTEND_URL` | Куда редиректить после `/api/auth/vk` (JWT кладутся в hash) | `http://localhost/` |
| `BLACKLIST_WORDS` | (опц.) Переопределяет дефолтный blacklist модерации. Список через запятую | `стоп,нет` |

## config.json модулей

Каждый модуль в [`src/backend/modules/`](../../src/backend/modules/) может иметь рядом `config.json`. Читается автоматически базовым классом [`Module`](../../src/backend/modules/_class.js).

### `modules/api/config.json`

| Поле | Назначение |
|---|---|
| `https` | `true`/`false`. HTTPS не настроен — оставь `false`, поднимай TLS в reverse-proxy |
| `port` | Дефолтный порт (переопределяется `process.env.PORT`) |
| `timeout` | Резерв, сейчас не используется |
| `api_sub_url` | Префикс API-путей. По умолчанию `api` → все методы живут под `/api/...` |
| `paths.methods` | Директория с API-методами |
| `paths.static.client` | Статика клиента |
| `paths.static.api` | Статика для API-доков (legacy, Swagger теперь на `/api/docs`) |
| `headers` | Массив `{name, value}` для принудительных заголовков в каждом ответе |

### `modules/db/config.json`

| Поле | Назначение |
|---|---|
| `url` | Fallback-URL Mongo, если `process.env.MONGO_URL` не задан |
| `directory` | Подпапка с Mongoose-схемами |

### `modules/logger/config.json`

| Поле | Назначение |
|---|---|
| `UTC` | Писать время в UTC |
| `directory` | Папка для файлов логов |
| `format.file_name` | Шаблон имени файла (плейсхолдеры `%YYYY%`, `%MM%`, `%DD%`) |
| `format.file_extension` | Расширение лог-файла |
| `format.log` | Шаблон строки лога (`%level%`, `%HH%`, `%MM%`, `%SS%`, `%text%`) |
| `save_logs` | Количество дней для хранения (пока не используется для ротации) |

### `config.json` API-метода

Формат — рядом с `index.js` метода (например, [`methods/auth/vk/config.json`](../../src/backend/modules/api/methods/auth/vk/config.json)).

```jsonc
{
    "use": true,              // отключаемо без удаления файла
    "method": "get",          // get|post|put|patch|delete
    "auth": true,             // true — требуется Bearer; "optional" — используется если есть; не задано — публичный

    "params": [
        {
            "name": "id",
            "type": "objectId",   // string | number | boolean | object | objectId
            "required": true,
            "description": "...",
            "interval": [1, 100], // для number (inclusive)
            "orientation": "positive", // для number
            "valid_values": ["foo", "bar"]
        }
    ],

    "openapi": {
        "summary": "Краткое название",
        "description": "Что делает метод",
        "tags": [ "auth" ],
        "response_schema": { "type": "object", "properties": { "ok": { "type": "boolean" } } },
        "success_description": "Текст для 200 в Swagger",
        "responses": { "404": { "description": "..." } }
    }
}
```

Формат ответа на всех endpoint'ах:
- **успех** (status < 400): `{ "response": <payload> }`
- **ошибка**: `{ "error": { "code": <int>, "message": "...", "param_name": "..." } }` (param_name только для `-2`)

Коды ошибок ([methods/_class.js](../../src/backend/modules/api/methods/_class.js)):

| Код | Смысл |
|---|---|
| `-1` | Внутренняя ошибка сервера |
| `-2` | Ошибка валидации параметров (`param_name` указывает на битое поле) |
| `-3` | Метод отключён (`use: false`) |
| `-4` | Требуется авторизация |
| `-5` | Недействительный или просроченный токен |
| `-6` | Не найдено |
