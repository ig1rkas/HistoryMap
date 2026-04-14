import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createRequire } from 'node:module';
import { bootTestServer, shutdownTestServer } from './helpers.js';

const require = createRequire(import.meta.url);

describe('Auth middleware (/api/auth/me)', () => {
    let ctx;
    beforeAll(async () => { ctx = await bootTestServer() });
    afterAll(async () => shutdownTestServer(ctx));

    it('401 без заголовка Authorization', async () => {
        const res = await request(ctx.app).get('/api/auth/me');
        expect(res.status).toBe(401);
        expect(res.body.error.code).toBe(-4);
    });

    it('401 при невалидном токене', async () => {
        const res = await request(ctx.app).get('/api/auth/me').set('Authorization', 'Bearer not-a-jwt');
        expect(res.status).toBe(401);
        expect(res.body.error.code).toBe(-5);
    });

    it('404 при валидном токене с несуществующим пользователем', async () => {
        const jwtUtil = require('../utils/jwt');
        const token = jwtUtil.signAccess({ user_id: '507f1f77bcf86cd799439011', vk_id: 0 });
        const res = await request(ctx.app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(404);
    });
});

describe('POST /api/auth/refresh', () => {
    let ctx;
    beforeAll(async () => { ctx = await bootTestServer() });
    afterAll(async () => shutdownTestServer(ctx));

    it('400 без refresh_token в теле', async () => {
        const res = await request(ctx.app).post('/api/auth/refresh').send({});
        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe(-2);
    });

    it('401 при невалидном refresh', async () => {
        const res = await request(ctx.app).post('/api/auth/refresh').send({ refresh_token: 'bad' });
        expect(res.status).toBe(401);
        expect(res.body.error.code).toBe(-5);
    });

    it('401 если refresh корректный, но не совпадает с сохранённым в БД', async () => {
        const jwtUtil = require('../utils/jwt');
        const user = await ctx.modules.db.req('users', 'create', [{
            vk_id: 111,
            vk_access_token: 'vk-token',
            vk_access_token_expires: new Date(Date.now() + 3600_000)
        }]);
        const refresh = jwtUtil.signRefresh({ user_id: user._id });
        const res = await request(ctx.app).post('/api/auth/refresh').send({ refresh_token: refresh });
        expect(res.status).toBe(401);
    });

    it('200 + новая пара, если refresh совпадает с сохранённым', async () => {
        const jwtUtil = require('../utils/jwt');
        const user = await ctx.modules.db.req('users', 'create', [{
            vk_id: 222,
            vk_access_token: 'vk-token',
            vk_access_token_expires: new Date(Date.now() + 3600_000)
        }]);
        const refresh = jwtUtil.signRefresh({ user_id: user._id });
        await ctx.modules.db.req('users', 'findByIdAndUpdate', [user._id, {
            refresh_token: refresh,
            refresh_token_expires: new Date(Date.now() + 30 * 24 * 3600_000)
        }]);

        const res = await request(ctx.app).post('/api/auth/refresh').send({ refresh_token: refresh });
        expect(res.status).toBe(200);
        expect(res.body.response.access_token).toEqual(expect.any(String));
        expect(res.body.response.refresh_token).toEqual(expect.any(String));
        expect(res.body.response.refresh_token).not.toBe(refresh);
    });
});

describe('GET /api/auth/vk', () => {
    let ctx;
    beforeAll(async () => { ctx = await bootTestServer() });
    afterAll(async () => shutdownTestServer(ctx));
    beforeEach(() => vi.unstubAllGlobals());

    it('без ?code — 302 на oauth.vk.com/authorize c client_id и redirect_uri', async () => {
        const res = await request(ctx.app).get('/api/auth/vk');
        expect(res.status).toBe(302);
        const loc = res.headers.location;
        expect(loc).toContain('oauth.vk.com/authorize');
        expect(loc).toContain(`client_id=${process.env.VK_CLIENT_ID}`);
        expect(loc).toContain(`redirect_uri=${encodeURIComponent(process.env.VK_REDIRECT_URI)}`);
    });

    it('с ?code — мокает VK token exchange, upsert-ит user и редиректит на FRONTEND_URL с токенами в hash', async () => {
        const fakeUserId = 123456;
        vi.stubGlobal('fetch', async () => ({
            ok: true,
            json: async () => ({ access_token: 'vk-access', expires_in: 3600, user_id: fakeUserId })
        }));

        const res = await request(ctx.app).get('/api/auth/vk?code=abc123');
        expect(res.status).toBe(302);
        const loc = new URL(res.headers.location);
        expect(loc.origin + loc.pathname).toBe(process.env.FRONTEND_URL);
        const hash = new URLSearchParams(loc.hash.replace(/^#/, ''));
        expect(hash.get('access_token')).toEqual(expect.any(String));
        expect(hash.get('refresh_token')).toEqual(expect.any(String));
        expect(hash.get('user_id')).toEqual(expect.any(String));

        const user = await ctx.modules.db.req('users', 'findOne', [{ vk_id: fakeUserId }]);
        expect(user).toBeTruthy();
        expect(user.vk_access_token).toBe('vk-access');
    });

    it('с ?error — редирект на FRONTEND_URL с auth_error в hash', async () => {
        const res = await request(ctx.app).get('/api/auth/vk?error=access_denied');
        expect(res.status).toBe(302);
        const loc = new URL(res.headers.location);
        expect(loc.hash).toContain('auth_error=access_denied');
    });

    it('если VK вернул некорректный ответ — редирект с auth_error=token_exchange_failed', async () => {
        vi.stubGlobal('fetch', async () => ({
            ok: true,
            json: async () => ({ error: 'invalid_code' })
        }));
        const res = await request(ctx.app).get('/api/auth/vk?code=bad');
        expect(res.status).toBe(302);
        const loc = new URL(res.headers.location);
        expect(loc.hash).toContain('auth_error=token_exchange_failed');
    });
});

describe('POST /api/auth/logout', () => {
    let ctx;
    beforeAll(async () => { ctx = await bootTestServer() });
    afterAll(async () => shutdownTestServer(ctx));

    it('401 без токена', async () => {
        const res = await request(ctx.app).post('/api/auth/logout');
        expect(res.status).toBe(401);
    });

    it('200 и обнуляет refresh_token в БД', async () => {
        const jwtUtil = require('../utils/jwt');
        const user = await ctx.modules.db.req('users', 'create', [{
            vk_id: 333,
            vk_access_token: 't',
            vk_access_token_expires: new Date(Date.now() + 1000),
            refresh_token: 'some-refresh',
            refresh_token_expires: new Date(Date.now() + 1000)
        }]);
        const access = jwtUtil.signAccess({ user_id: user._id, vk_id: 333 });
        const res = await request(ctx.app).post('/api/auth/logout').set('Authorization', `Bearer ${access}`);
        expect(res.status).toBe(200);
        expect(res.body.response.ok).toBe(true);

        const fresh = await ctx.modules.db.req('users', 'findById', [user._id]);
        expect(fresh.refresh_token).toBeNull();
    });
});
