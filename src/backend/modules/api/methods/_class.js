const Module = require('../../_class');
const API = require('../index');

const modules = require('../../../modules');
const { default: mongoose } = require('mongoose');
const jwtUtil = require('../../../utils/jwt');

class Method extends Module {
    loadConfig(config_path) {
        return super.loadConfig(
            config_path,
            config => {
                if ('params' in config && config.params instanceof Array && config.params.length > 0) {
                    if (!(new Set(config.params.map(param => param.name)).size === config.params.length)) throw new Error('Имя параметров должны быть уникальные');
                    config.required_params = config.params.filter(param => param.required).map(param => param.name);
                    config.have_params = true;
                }
                return config;
            }
        );
    }

    /** @type {String} */
    #url;
    getUrl() { return this.#url }

    /** @type {import('express').Express} */
    #express;
    getExpress() { return this.#express }

    /** @type {import('../index').send} */
    sendResponse() {};

    #errors = [
        { code: -1, message: 'Ошибка во время выполнения запроса' },
        { code: -2, message: 'Ошибка во время проверки параметров запроса' },
        { code: -3, message: 'Метод отключен' },
        { code: -4, message: 'Требуется авторизация' },
        { code: -5, message: 'Недействительный или просроченный токен' },
        { code: -6, message: 'Не найдено' },
    ];
    getError(code) { return this.#errors.find(error => error.code === code) }
    regError(code, message) {
        if (this.getError()) throw new Error('Код ошибки уже занят в данном методе');
        this.#errors.push({ code, message });
    }

    /**
     * 
     * @param {Object} req Запрос пользователя
     * @param {Object} res Ответ пользователю
     * @returns {*} Ответ вызова метода
     */
    async getResponse(_req, _res) { return true }

    checkParams(data) {
        const config = this.getConfig();
        
        // Проверка наличия обязательных параметров
        for (let i = 0; i < config.required_params.length; i++) {
            const key = config.required_params[i];
            if (!(key in data)) return key;
        }

        // Обработка переданных параметров
        for (const key in data) {
            /**
             * @type {{
             *  name: String,
             *  required: Boolean,
             *  type: 'string'|'number'|'object'|'boolean'|'objectId',
             *  orientation: 'positive'|'negative',
             *  interval: [Number, Number],
             *  valid_values: Array<*>
             * }|undefined}
             */
            const param_config = config.params.find(param => param.name === key);
            if (!param_config) {
                delete data[key];
                continue;
            }

            // Обработка и проверка значения
            let value = data[key];
            try {
                switch (param_config.type) {
                    case 'number':
                        value = +value;
                        
                        if (
                            'orientation' in param_config
                            &&
                            (param_config.orientation === 'positive' && value < 0 || param_config.orientation === 'negative' && value > 0)
                        ) value *= -1;
    
                        if ('interval' in param_config && (param_config.interval[0] > value || param_config.interval[1] < value)) return key;
                    break;
    
                    case 'boolean':
                        value = Boolean(Number.parseInt(value));
                    break;
    
                    case 'object':
                        value = JSON.parse(value);
                    break;

                    case 'objectId':
                        value = new mongoose.Types.ObjectId(value);
                    break;
                }
            } catch { return key }

            if ('valid_values' in param_config && param_config.valid_values.indexOf(value) === -1) return key;

            data[key] = value;
        }

        return true;
    }

    constructor(__dirname, url, express) {
        super(__dirname);

        this.#url = url;
        this.#express = express;
        this.sendResponse = API.send;

        const method_config = this.getConfig();
        if (method_config) {
            if ('errors' in method_config && method_config.errors instanceof Array) {
                for (let i = 0; i < method_config.errors.length; i++) {
                    const error = method_config.errors[i];
                    if ('code' in error && 'message' in error) this.regError(error.code, error.message);
                }
            }
        }

        this.createNode();
    }

    createNode() {
        if (!this.getConfig()) return false;

        this.#express[this.getConfig().method](this.getUrl(), async (req, res) => {
            const config = this.getConfig();

            req.container_data = req[req.method === 'GET' ? 'query' : 'body'];
            if (!req.container_data) req.container_data = {};
            // modules.logger.info(`Выполнение запроса ${this.getUrl()}`);

            let response;
            let done = config.use;
            if (!done) return this.sendResponse(res, this.getError(-3), 500);

            if ('auth' in config && config.auth !== false) {
                const test_mode = process.env.TEST_MODE === 'true';
                const test_user_header = test_mode ? req.headers['x-test-user-id'] : null;

                if (test_user_header !== null && test_user_header !== undefined && test_user_header !== '') {
                    const vk_id = Number(test_user_header);
                    if (!Number.isFinite(vk_id)) {
                        if (config.auth === 'optional') req.user = null;
                        else return this.sendResponse(res, this.getError(-5), 401);
                    } else {
                        try {
                            const user = await modules.db.req('users', 'findOneAndUpdate', [
                                { vk_id },
                                {
                                    $setOnInsert: {
                                        vk_id,
                                        vk_access_token: 'test-mode',
                                        vk_access_token_expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                                    }
                                },
                                { upsert: true, new: true, setDefaultsOnInsert: true }
                            ]);
                            req.user = { user_id: user._id, vk_id };
                        } catch (e) {
                            try { modules.logger.error(`TEST_MODE auth upsert failed: ${modules.logger.stringError(e, false)}`) }
                            catch {}
                            if (config.auth === 'optional') req.user = null;
                            else return this.sendResponse(res, this.getError(-1), 500);
                        }
                    }
                } else {
                    const header = req.headers['authorization'] || req.headers['Authorization'];
                    const token = header && /^bearer\s+/i.test(header) ? header.replace(/^bearer\s+/i, '').trim() : null;

                    if (!token) {
                        if (config.auth === 'optional') req.user = null;
                        else return this.sendResponse(res, this.getError(-4), 401);
                    } else {
                        try { req.user = jwtUtil.verify(token, 'access') }
                        catch {
                            if (config.auth === 'optional') req.user = null;
                            else return this.sendResponse(res, this.getError(-5), 401);
                        }
                    }
                }
            }

            if (config.have_params) done = this.checkParams(req.container_data);
            if (done !== true) return this.sendResponse(res, { ...this.getError(-2), param_name: done }, 400);
            
            try { response = await this.getResponse(req, res) }
            catch (e) {
                done = false;
                try { modules.logger.error(`Ошибка в ${this.getUrl()}: ${modules.logger.stringError(e, false)}`) }
                catch {}
            }

            // Метод мог сам отправить ответ (например, res.redirect) — тогда не трогаем.
            if (res.headersSent) return;

            if (!done) return this.sendResponse(res, this.getError(-1), 500);
            
            if (response instanceof Object && 'error_code' in response) return this.sendResponse(res, this.getError(response.error_code), 'status' in response ? response.status : 200);
            this.sendResponse(res, response);
        });
    }
}

module.exports = Method;
