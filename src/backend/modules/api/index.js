const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const express = require('express');
const body_parser = require('body-parser');
const cors = require('cors');
const swagger_ui = require('swagger-ui-express');

const Module = require('../_class');
const directorySearch = require('../../functions/directorySearch');
const { buildOpenApiSpec } = require('./openapi');

const modules = require('../../modules');

class API extends Module {
    /** @returns {import('./config.json')} */
    getConfig() { return super.getConfig() }

    /**
     *
     * @param {*} res res
     * @param {Object|String} data Ответ, который необхоимо вывести
     * @param {Number} code Код ответа
     * @description Возвращает ответ пользователю на API запрос
     */
    static send(res, data, code=200) { res.status(code).send(code < 400 ? { response: data } : { error: data }) }

    /** @type {{ key: String, cert: String }} */
    #options;
    getOptions() { return this.#options }
    loadOptions() {
        // TODO: Настроить доступ к SSL после установки сертификата
        try {
            const SSL_PATH = path.join(this.getDirname(), '');
            this.#options = {
                key: fs.readFileSync(path.join(SSL_PATH, '')),
                cert: fs.readFileSync(path.join(SSL_PATH, ''))
            }
        } catch (e) {
            modules.logger.warn(e.message);
        }
    }

    /** @type {express.Express} */
    #express;
    /** Используется тестами, чтобы дёргать роуты через supertest без прослушивания порта */
    getExpress() { return this.#express }
    #initExpress() {
        const config = this.getConfig();

        this.#express = express();

        // CORS
        const cors_origin = process.env.CORS_ORIGIN || '*';
        this.#express.use(cors({
            origin: cors_origin === '*' ? true : cors_origin.split(',').map(s => s.trim()),
            credentials: cors_origin !== '*'
        }));

        this.#express.use('/', express.static(path.join(this.getDirname(), config.paths.static.client)));
        this.#express.use('/' + config.api_sub_url, express.static(path.join(this.getDirname(), config.paths.static.api)));

        const headers = config.headers;
        if (headers instanceof Array && headers.length > 0)
            this.#express.use((req, res, next) => {
                for (let i = 0; i < headers.length; i++) {
                    const header = headers[i];
                    if ('name' in header && 'value' in header) res.setHeader(header.name, header.value);
                }
                next();
            });

        this.#express.use((req, res, next) => {
            if (req.method === 'OPTIONS') return API.send(res, 'OK');
            next();
        });

        this.#express.use(body_parser.json());
        this.#express.use(body_parser.urlencoded({ extended: false }));

        //Дополнительные обработчики
    }

    #initMethod() {
        directorySearch(
            path.join(this.getDirname(), this.getConfig().paths.methods),
            file_path => {
                const splited = file_path.replace(/\\/g, '/').split('/');
                /** @type {import('./methods/_class')} */
                new (require(file_path))('/' + this.getConfig().api_sub_url + '/' + splited.slice(splited.findIndex(e => e === this.getConfig().paths.methods.split('/').reverse()[0]) + 1, splited.length - 1).join('/'), this.#express);
            },
            'index.js'
        );
    }

    #initSwagger() {
        const config = this.getConfig();
        const methodsDir = path.join(this.getDirname(), config.paths.methods);

        const spec = buildOpenApiSpec({
            methodsDir,
            apiSubUrl: config.api_sub_url
        });

        const docs_path = '/' + config.api_sub_url + '/docs';
        const spec_path = '/' + config.api_sub_url + '/openapi.json';

        this.#express.get(spec_path, (req, res) => res.json(spec));
        this.#express.use(docs_path, swagger_ui.serve, swagger_ui.setup(spec, {
            customSiteTitle: 'HistoryMap API'
        }));

        modules.logger.info(`Swagger UI: ${docs_path} | OpenAPI JSON: ${spec_path}`);
    }

    #initErrorHandler() {
        // Глобальный перехват ошибок Express (регистрируется после всех роутов)
        this.#express.use((err, req, res, next) => {
            try { modules.logger.error(`Необработанная ошибка на ${req.method} ${req.url}: ${modules.logger.stringError(err, false)}`) }
            catch { console.error('[api]', err); }
            if (res.headersSent) return next(err);
            API.send(res, { code: -1, message: 'Внутренняя ошибка сервера' }, 500);
        });
    }

    /** @type {http.Server|https.Server} */
    #server;

    async startFunction() {
        this.#initExpress();
        this.#initMethod();
        this.#initSwagger();
        this.#initErrorHandler();

        const mode_https = this.getConfig().https;

        if (!this.getOptions() && mode_https) this.loadOptions();
        const options = this.getOptions();

        this.#server = (mode_https ? https : http).createServer(options ? options : {}, this.#express);

        await new Promise((res, rej) => {
            const port = 'PORT' in process.env ? Number(process.env.PORT) : this.getConfig().port;
            this.#server.once('error', rej);
            this.#server.listen(port, () => {
                this.#server.removeListener('error', rej);
                modules.logger.info(`${mode_https ? 'HTTPS' : 'HTTP'} сервер запрущен, порт: ${port}`);
                res(true);
            })
        });
    }

    async stopFunction() {
        await new Promise((res) =>
            this.#server.close(() => {
                modules.logger.info(`${this.getConfig().https ? 'HTTPS' : 'HTTP'} сервер остановлен`);
                res(true);
            })
        );
    }

    // Передача _dirname, так как класс API используется для класса Socket
    constructor(_dirname=__dirname) { super(_dirname) }
}

module.exports = API;
