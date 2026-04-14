const fs = require('fs');
const path = require('path');

const directorySearch = require('../../functions/directorySearch');

/**
 * Маппинг типа параметра шаблона на OpenAPI schema
 * @param {{ type: String, interval?: [Number, Number], valid_values?: Array }} param
 */
function paramTypeToSchema(param) {
    let schema;
    switch (param.type) {
        case 'number': schema = { type: 'number' }; break;
        case 'boolean': schema = { type: 'boolean' }; break;
        case 'object': schema = { type: 'object' }; break;
        case 'objectId': schema = { type: 'string', format: 'objectId', pattern: '^[a-fA-F0-9]{24}$' }; break;
        case 'string':
        default: schema = { type: 'string' };
    }
    if (Array.isArray(param.interval) && param.interval.length === 2) {
        schema.minimum = param.interval[0];
        schema.maximum = param.interval[1];
    }
    if (Array.isArray(param.valid_values) && param.valid_values.length > 0) schema.enum = param.valid_values;
    if (param.orientation === 'positive') schema.minimum = Math.max(schema.minimum ?? 0, 0);
    if (param.orientation === 'negative') schema.maximum = Math.min(schema.maximum ?? 0, 0);
    return schema;
}

/**
 * Собрать операцию OpenAPI (для одного HTTP-метода на URL) из config.json метода шаблона
 */
function buildOperation(methodConfig, urlPath) {
    const httpMethod = (methodConfig.method || 'get').toLowerCase();
    const openapi = methodConfig.openapi || {};
    const params = Array.isArray(methodConfig.params) ? methodConfig.params : [];

    const operation = {
        summary: openapi.summary || urlPath,
        tags: openapi.tags || [ 'default' ],
        responses: {}
    };
    if (openapi.description) operation.description = openapi.description;
    if (openapi.operationId) operation.operationId = openapi.operationId;

    // Параметры: GET/DELETE → query, остальное → requestBody
    if (params.length > 0) {
        if (httpMethod === 'get' || httpMethod === 'delete') {
            operation.parameters = params.map(p => {
                const schema = paramTypeToSchema(p);
                const parameter = {
                    name: p.name,
                    in: 'query',
                    required: !!p.required,
                    schema
                };
                if (p.description) parameter.description = p.description;
                return parameter;
            });
        } else {
            const properties = {};
            const required = [];
            for (const p of params) {
                properties[p.name] = paramTypeToSchema(p);
                if (p.description) properties[p.name].description = p.description;
                if (p.required) required.push(p.name);
            }
            const schema = { type: 'object', properties };
            if (required.length > 0) schema.required = required;
            operation.requestBody = {
                required: required.length > 0,
                content: { 'application/json': { schema } }
            };
        }
    }

    // Стандартные ответы шаблона
    operation.responses = {
        '200': {
            description: openapi.success_description || 'Успешный ответ',
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: { response: openapi.response_schema || {} }
                    }
                }
            }
        },
        '400': {
            description: 'Ошибка валидации параметров',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '401': {
            description: 'Требуется авторизация',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        },
        '500': {
            description: 'Внутренняя ошибка сервера или метод отключён',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
        }
    };

    // Не всем методам нужен 401 — убираем, если auth не указан
    if (!('auth' in methodConfig)) delete operation.responses['401'];

    // Кастомные responses из config — перекрывают стандартные
    if (openapi.responses && typeof openapi.responses === 'object') {
        for (const code in openapi.responses) operation.responses[code] = openapi.responses[code];
    }

    if (methodConfig.auth) operation.security = [ { bearerAuth: [] } ];

    return { httpMethod, operation };
}

/**
 * Обход всех index.js в директории методов и сборка OpenAPI paths.
 * URL-логика повторяет #initMethod из api/index.js.
 */
function collectPaths(methodsDir, apiSubUrl) {
    const paths = {};
    const methodsDirName = methodsDir.replace(/\\/g, '/').split('/').reverse()[0];

    directorySearch(methodsDir, file_path => {
        const configPath = path.join(path.dirname(file_path), 'config.json');
        if (!fs.existsSync(configPath)) return;

        let methodConfig;
        try { methodConfig = JSON.parse(fs.readFileSync(configPath, 'utf8')) }
        catch (e) { return }

        if (methodConfig.use === false) return;

        const splited = file_path.replace(/\\/g, '/').split('/');
        const startIdx = splited.findIndex(e => e === methodsDirName) + 1;
        const urlPath = '/' + apiSubUrl + '/' + splited.slice(startIdx, splited.length - 1).join('/');

        const { httpMethod, operation } = buildOperation(methodConfig, urlPath);
        if (!paths[urlPath]) paths[urlPath] = {};
        paths[urlPath][httpMethod] = operation;
    }, 'index.js');

    return paths;
}

/**
 * Сборка полной OpenAPI 3.0.3 спецификации
 * @param {{ methodsDir: String, apiSubUrl: String, info?: Object }} params
 */
function buildOpenApiSpec({ methodsDir, apiSubUrl, info }) {
    const paths = collectPaths(methodsDir, apiSubUrl);

    return {
        openapi: '3.0.3',
        info: {
            title: 'HistoryMap API',
            version: '1.0.0',
            description: 'API сервиса HistoryMap — карта достопримечательностей Санкт-Петербурга.',
            ...(info || {})
        },
        servers: [ { url: '/' } ],
        paths,
        components: {
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        error: {
                            type: 'object',
                            properties: {
                                code: { type: 'integer' },
                                message: { type: 'string' },
                                param_name: { type: 'string' }
                            }
                        }
                    }
                }
            },
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        }
    };
}

module.exports = { buildOpenApiSpec };
