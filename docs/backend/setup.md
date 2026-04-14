# Backend — установка и запуск

Серверная часть HistoryMap расположена в [`src/backend/`](../../src/backend/). Стек: Node.js 20+, Express 4, MongoDB 7 (Mongoose 8), собственная модульная система из [`template-server`](https://github.com/stanevko-ilya/template-server).

## Требования

- **Node.js 20+** (используется встроенный `fetch`)
- **MongoDB 7** — локально либо через Docker
- **npm** 9+

## Быстрый запуск через Docker

1. Склонируйте репозиторий и перейдите в `src/backend`:
   ```sh
   cd src/backend
   ```

2. Скопируйте шаблон env:
   ```sh
   cp .env.example .env
   ```

3. Откройте `.env` и заполните следующие поля:
   - `MONGO_USER` / `MONGO_PASSWORD` — **любой алфавитно-цифровой** пароль (без символов `@`, `:`, `/`, `?`, `#`)
   - `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — длинные случайные строки
   - `VK_CLIENT_ID` / `VK_CLIENT_SECRET` / `VK_REDIRECT_URI` — выдаются после регистрации приложения на [id.vk.com](https://id.vk.com/about/business)
   - `FRONTEND_URL` — URL, на который выполняется редирект после успешной VK-авторизации (JWT передаются в hash)

4. Поднимите стек:
   ```sh
   docker compose up --build -d
   docker compose logs -f api
   ```

   Будут запущены два контейнера:
   - `history-map-mongo` — MongoDB с авторизацией (root-пользователь создаётся из `MONGO_USER`/`MONGO_PASSWORD` **при первом запуске на пустом volume**)
   - `history-map-api` — API на порту `${API_PORT:-3000}`

5. Проверьте работоспособность:
   - `curl http://localhost:3000/api/ping` → `{"response":{"ok":true}}`
   - Swagger UI — http://localhost:3000/api/docs

6. Для остановки выполните:
   ```sh
   docker compose down
   ```
   Чтобы сбросить volume Mongo (например, после первого запуска без пароля), используйте `docker compose down -v`.

## Локальный запуск без Docker

Требуется уже запущенная MongoDB на `localhost:27017`.

1. Установите зависимости:
   ```sh
   cd src/backend
   npm install
   ```

2. Скопируйте и отредактируйте `.env`:
   ```sh
   cp .env.example .env
   ```
   При локальном mongod **без авторизации** оставьте `MONGO_USER` пустым — значение `MONGO_URL=mongodb://localhost:27017/history_map` будет использовано как есть.

3. Запустите сервер в dev-режиме (nodemon — автоперезагрузка при изменениях):
   ```sh
   npm run dev
   ```

   Либо в обычном режиме:
   ```sh
   npm start
   ```

## Тесты

Используется Vitest + supertest + mongodb-memory-server (поднимается in-memory Mongo, сетевые вызовы к VK мокаются).

```sh
cd src/backend
npm run test:run     # одиночный прогон
npm test             # watch-режим
```

Тесты **не обращаются** к локальной MongoDB и `.env` — переменные окружения переопределяются хелпером [`tests/helpers.js`](../../src/backend/tests/helpers.js), VK API заменяется через `vi.stubGlobal('fetch', ...)`.

## Важные нюансы

- **Порт 80 для VK-авторизации.** VK ID требует `redirect_uri` без явного порта, то есть дефолтный `:80`. Для живого e2e-теста авторизации измените `PORT=80` в `.env` и запустите процесс с правами на привязку к этому порту (Windows: специальных прав не требуется; Linux: необходим `sudo` или `cap_net_bind_service`).
- **Swagger генерируется при старте** — из `openapi`-секций в `config.json` каждого метода. Чтобы добавить новый метод, создайте папку в `src/backend/modules/api/methods/` и перезапустите сервер.
- **Graceful shutdown.** Сервер обрабатывает SIGINT/SIGTERM и останавливает модули в обратном порядке. В Docker это происходит штатно, в dev-режиме — по нажатию `Ctrl+C`.
