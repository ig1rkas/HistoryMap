import { describe, it, expect, beforeAll } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

beforeAll(() => {
    process.env.JWT_ACCESS_SECRET = 'test-access';
    process.env.JWT_REFRESH_SECRET = 'test-refresh';
    process.env.JWT_ACCESS_TTL = '15m';
    process.env.JWT_REFRESH_TTL = '30d';
});

describe('utils/jwt', () => {
    it('signAccess/verify round-trip', () => {
        const jwtUtil = require('../utils/jwt');
        const token = jwtUtil.signAccess({ user_id: 'abc', vk_id: 1 });
        const payload = jwtUtil.verify(token, 'access');
        expect(payload.user_id).toBe('abc');
        expect(payload.vk_id).toBe(1);
    });

    it('access и refresh подписываются разными секретами', () => {
        const jwtUtil = require('../utils/jwt');
        const access = jwtUtil.signAccess({ user_id: 'x' });
        expect(() => jwtUtil.verify(access, 'refresh')).toThrow();
    });

    it('verify битого токена бросает ошибку', () => {
        const jwtUtil = require('../utils/jwt');
        expect(() => jwtUtil.verify('not-a-jwt', 'access')).toThrow();
    });

    it('бросает, если JWT_ACCESS_SECRET пустой', () => {
        const saved = process.env.JWT_ACCESS_SECRET;
        process.env.JWT_ACCESS_SECRET = '';
        try {
            const p = require.resolve('../utils/jwt');
            delete require.cache[p];
            const jwtUtil = require('../utils/jwt');
            expect(() => jwtUtil.signAccess({})).toThrow(/JWT_ACCESS_SECRET/);
        } finally {
            process.env.JWT_ACCESS_SECRET = saved;
            const p = require.resolve('../utils/jwt');
            delete require.cache[p];
        }
    });
});
