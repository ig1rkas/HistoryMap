import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

describe('utils/moderation', () => {
    let moderation;
    beforeEach(() => {
        const p = require.resolve('../utils/moderation');
        delete require.cache[p];
        moderation = require('../utils/moderation');
    });
    afterEach(() => { delete process.env.BLACKLIST_WORDS });

    it('approved для пустого/отсутствующего текста', () => {
        expect(moderation.check('').status).toBe('approved');
        expect(moderation.check(null).status).toBe('approved');
        expect(moderation.check(undefined).status).toBe('approved');
    });

    it('approved для нейтрального текста', () => {
        expect(moderation.check('Очень красивое место, рекомендую всем!').status).toBe('approved');
    });

    it('rejected при точном вхождении стоп-слова', () => {
        const res = moderation.check('Это badword какой-то');
        expect(res.status).toBe('rejected');
        expect(res.matched).toBe('badword');
    });

    it('rejected если пытаются обойти через пробелы/дефисы', () => {
        expect(moderation.check('b-a-d-w-o-r-d').status).toBe('rejected');
        expect(moderation.check('bad word').status).toBe('rejected');
    });

    it('rejected если пытаются обойти повторами букв', () => {
        expect(moderation.check('baaadwoord').status).toBe('rejected');
    });

    it('rejected независимо от регистра', () => {
        expect(moderation.check('BADWORD').status).toBe('rejected');
        expect(moderation.check('BadWord').status).toBe('rejected');
    });

    it('BLACKLIST_WORDS из env перекрывает дефолт', () => {
        process.env.BLACKLIST_WORDS = 'кот,собака';
        const p = require.resolve('../utils/moderation');
        delete require.cache[p];
        moderation = require('../utils/moderation');

        expect(moderation.check('Я видел кота в парке').status).toBe('rejected');
        expect(moderation.check('Обычный badword').status).toBe('approved');
    });

    it('normalize: lowercase + удаление не-букв + схлопывание повторов', () => {
        expect(moderation.normalize('Прииввеетт, Мир!!! 123')).toBe('привет мир'.replace(/\s/g, ''));
    });
});
