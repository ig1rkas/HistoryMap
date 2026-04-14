import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { bootTestServer, shutdownTestServer } from './helpers.js';

describe('GET /api/ping', () => {
    let ctx;
    beforeAll(async () => { ctx = await bootTestServer() });
    afterAll(async () => shutdownTestServer(ctx));

    it('отвечает 200 и возвращает { response: { ok: true } }', async () => {
        const res = await request(ctx.app).get('/api/ping');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ response: { ok: true } });
    });
});

describe('GET /api/openapi.json', () => {
    let ctx;
    beforeAll(async () => { ctx = await bootTestServer() });
    afterAll(async () => shutdownTestServer(ctx));

    it('возвращает валидную OpenAPI 3.0.3 спеку со всеми роутами', async () => {
        const res = await request(ctx.app).get('/api/openapi.json');
        expect(res.status).toBe(200);
        expect(res.body.openapi).toBe('3.0.3');

        const paths = Object.keys(res.body.paths).sort();
        expect(paths).toContain('/api/ping');
        expect(paths).toContain('/api/auth/vk');
        expect(paths).toContain('/api/auth/me');
        expect(paths).toContain('/api/auth/refresh');
        expect(paths).toContain('/api/auth/logout');
    });

    it('описывает схему ошибки и bearer security scheme', async () => {
        const res = await request(ctx.app).get('/api/openapi.json');
        expect(res.body.components.schemas.Error).toBeDefined();
        expect(res.body.components.securitySchemes.bearerAuth).toBeDefined();
    });
});
