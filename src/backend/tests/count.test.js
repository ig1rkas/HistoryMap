import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createRequire } from 'node:module';
import { bootTestServer, shutdownTestServer } from './helpers.js';

const require = createRequire(import.meta.url);

async function seedPlace(db, title) {
    return db.models.places.create({
        title,
        short_description: 'описание',
        coordinates: { type: 'Point', coordinates: [ 30.3, 59.9 ] }
    });
}

describe('GET /api/places/count', () => {
    let ctx;
    beforeAll(async () => { ctx = await bootTestServer() });
    afterAll(async () => shutdownTestServer(ctx));
    beforeEach(() => {
        const cache = require('../utils/cache');
        cache.invalidate('places:count');
    });

    it('возвращает 0 на пустой БД', async () => {
        await ctx.modules.db.models.places.deleteMany({});
        const res = await request(ctx.app).get('/api/places/count');
        expect(res.status).toBe(200);
        expect(res.body.response.count).toBe(0);
    });

    it('возвращает текущее количество мест', async () => {
        await ctx.modules.db.models.places.deleteMany({});
        await seedPlace(ctx.modules.db, 'A');
        await seedPlace(ctx.modules.db, 'B');
        await seedPlace(ctx.modules.db, 'C');
        const res = await request(ctx.app).get('/api/places/count');
        expect(res.status).toBe(200);
        expect(res.body.response.count).toBe(3);
    });

    it('значение кэшируется — добавленное после первого запроса место не учитывается до инвалидации', async () => {
        const cache = require('../utils/cache');
        await ctx.modules.db.models.places.deleteMany({});
        await seedPlace(ctx.modules.db, 'one');

        const res1 = await request(ctx.app).get('/api/places/count');
        expect(res1.body.response.count).toBe(1);

        await seedPlace(ctx.modules.db, 'two');
        const res2 = await request(ctx.app).get('/api/places/count');
        expect(res2.body.response.count).toBe(1);

        cache.invalidate('places:count');
        const res3 = await request(ctx.app).get('/api/places/count');
        expect(res3.body.response.count).toBe(2);
    });
});
