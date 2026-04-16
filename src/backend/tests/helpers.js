import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { MongoMemoryServer } from 'mongodb-memory-server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

let _mongo = null;

/**
 * Поднимает in-memory MongoDB, выставляет env-переменные и стартует все модули шаблона
 * (logger → db → api) в нужном порядке. Возвращает { modules, app }.
 */
export async function bootTestServer() {
    _mongo = await MongoMemoryServer.create();
    process.env.MONGO_URL = _mongo.getUri();
    process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test-access-secret';
    process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';
    process.env.JWT_ACCESS_TTL = process.env.JWT_ACCESS_TTL || '15m';
    process.env.JWT_REFRESH_TTL = process.env.JWT_REFRESH_TTL || '30d';
    process.env.VK_CLIENT_ID = process.env.VK_CLIENT_ID || 'test_client_id';
    process.env.VK_CLIENT_SECRET = process.env.VK_CLIENT_SECRET || 'test_client_secret';
    process.env.VK_REDIRECT_URI = process.env.VK_REDIRECT_URI || 'http://test/api/auth/vk';
    process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://test/';
    process.env.PORT = '0';

    _clearRequireCache();

    require('../customize');
    const modules = require('../modules');

    await modules.logger.start();
    await modules.db.start();
    await modules.api.start();

    return { modules, app: modules.api.getExpress() };
}

export async function shutdownTestServer(ctx) {
    if (ctx && ctx.modules) {
        try { await ctx.modules.api.stop() } catch (_) {}
        try { await ctx.modules.db.stop() } catch (_) {}
        try { await ctx.modules.logger.stop() } catch (_) {}
    }
    if (_mongo) {
        try { await _mongo.stop() } catch (_) {}
        _mongo = null;
    }
    _clearRequireCache();
}

function _clearRequireCache() {
    const root = path.resolve(__dirname, '..');
    for (const key of Object.keys(require.cache)) {
        if (key.startsWith(root)) delete require.cache[key];
    }
}
