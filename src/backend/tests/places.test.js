import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createRequire } from 'node:module';
import { bootTestServer, shutdownTestServer } from './helpers.js';

const require = createRequire(import.meta.url);

async function seedPlaces(db) {
    // Санкт-Петербург: центр — Исаакиевский собор.
    // Близкие (< 2 км): Спас на Крови, Казанский собор.
    // Дальние (> 5 км): Петропавловская крепость оставим близкой, возьмём Пулково.
    const docs = [
        {
            title: 'Исаакиевский собор',
            short_description: 'Православный собор в центре СПб',
            coordinates: { type: 'Point', coordinates: [30.3061, 59.9343] },
            category: 'cathedral',
            epoch: 'XIX',
            architecture_style: 'classicism',
            avg_rating: 4.8,
            rating_count: 120,
            gallery: [ { link: 'https://example.com/isaak-1.jpg' }, { link: 'https://example.com/isaak-2.jpg' } ],
            preview_gallery_id: 0
        },
        {
            title: 'Спас на Крови',
            short_description: 'Храм Воскресения Христова',
            coordinates: { type: 'Point', coordinates: [30.3289, 59.9401] },
            category: 'cathedral',
            epoch: 'XIX',
            architecture_style: 'russian-revival',
            avg_rating: 4.9,
            rating_count: 200,
            gallery: [ { link: 'https://example.com/savior-1.jpg' } ],
            preview_gallery_id: 0
        },
        {
            title: 'Казанский собор',
            short_description: 'Кафедральный собор на Невском',
            coordinates: { type: 'Point', coordinates: [30.3244, 59.9343] },
            category: 'cathedral',
            epoch: 'XIX',
            architecture_style: 'empire',
            avg_rating: 4.7,
            rating_count: 150
        },
        {
            title: 'Пулковская обсерватория',
            short_description: 'Астрономическая обсерватория',
            coordinates: { type: 'Point', coordinates: [30.3265, 59.7717] },
            category: 'science',
            epoch: 'XIX',
            architecture_style: 'classicism',
            avg_rating: 4.3,
            rating_count: 30
        }
    ];
    const created = await db.models.places.insertMany(docs);
    return created;
}

describe('GET /api/places/points', () => {
    let ctx;
    let seeded;
    beforeAll(async () => {
        ctx = await bootTestServer();
        seeded = await seedPlaces(ctx.modules.db);
    });
    afterAll(async () => shutdownTestServer(ctx));

    it('без фильтров — возвращает все точки с нормализованными координатами', async () => {
        const res = await request(ctx.app).get('/api/places/points');
        expect(res.status).toBe(200);
        expect(res.body.response.points).toHaveLength(seeded.length);
        const first = res.body.response.points[0];
        expect(first.coordinates).toHaveLength(2);
        expect(typeof first.coordinates[0]).toBe('number');
        expect(typeof first.coordinates[1]).toBe('number');
    });

    it('фильтр по category — возвращает только соборы', async () => {
        const res = await request(ctx.app).get('/api/places/points').query({ category: 'cathedral' });
        expect(res.status).toBe(200);
        expect(res.body.response.points).toHaveLength(3);
        expect(res.body.response.points.every(p => p.category === 'cathedral')).toBe(true);
    });

    it('фильтр по min_rating отфильтровывает Пулково', async () => {
        const res = await request(ctx.app).get('/api/places/points').query({ min_rating: 4.5 });
        expect(res.status).toBe(200);
        expect(res.body.response.points.find(p => p.title.includes('Пулково'))).toBeUndefined();
        expect(res.body.response.points.length).toBeGreaterThanOrEqual(3);
    });

    it('геопоиск радиусом 3 км от Исаакиевского — не включает Пулково (~19 км) и включает соседние соборы', async () => {
        const res = await request(ctx.app).get('/api/places/points').query({
            lat: 59.9343, lon: 30.3061, radius: 3000
        });
        expect(res.status).toBe(200);
        const titles = res.body.response.points.map(p => p.title);
        expect(titles).toContain('Исаакиевский собор');
        expect(titles).toContain('Спас на Крови');
        expect(titles).toContain('Казанский собор');
        expect(titles).not.toContain('Пулковская обсерватория');
        res.body.response.points.forEach(p => expect(typeof p.distance).toBe('number'));
    });

    it('preview собирается из gallery[preview_gallery_id], short_description возвращается', async () => {
        const res = await request(ctx.app).get('/api/places/points').query({ category: 'cathedral' });
        const isaak = res.body.response.points.find(p => p.title === 'Исаакиевский собор');
        expect(isaak.preview).toBe('https://example.com/isaak-1.jpg');
        expect(isaak.short_description).toBe('Православный собор в центре СПб');
    });

    it('невалидный lat вне [-90,90] → 400', async () => {
        const res = await request(ctx.app).get('/api/places/points').query({ lat: 100 });
        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe(-2);
    });
});

describe('GET /api/places/cards', () => {
    let ctx;
    beforeAll(async () => {
        ctx = await bootTestServer();
        await seedPlaces(ctx.modules.db);
    });
    afterAll(async () => shutdownTestServer(ctx));

    it('возвращает total + cards с пагинацией', async () => {
        const res = await request(ctx.app).get('/api/places/cards').query({ limit: 2, offset: 0 });
        expect(res.status).toBe(200);
        expect(res.body.response.total).toBe(4);
        expect(res.body.response.cards).toHaveLength(2);
        expect(res.body.response.limit).toBe(2);
        expect(res.body.response.offset).toBe(0);
    });

    it('offset работает', async () => {
        const page1 = await request(ctx.app).get('/api/places/cards').query({ limit: 2, offset: 0 });
        const page2 = await request(ctx.app).get('/api/places/cards').query({ limit: 2, offset: 2 });
        const ids1 = page1.body.response.cards.map(c => c._id);
        const ids2 = page2.body.response.cards.map(c => c._id);
        expect(ids1.every(id => !ids2.includes(id))).toBe(true);
    });

    it('геопоиск отсекает Пулково', async () => {
        const res = await request(ctx.app).get('/api/places/cards').query({
            lat: 59.9343, lon: 30.3061, radius: 3000, limit: 20
        });
        expect(res.status).toBe(200);
        expect(res.body.response.total).toBe(3);
        expect(res.body.response.cards.find(c => c.title.includes('Пулково'))).toBeUndefined();
    });
});

describe('GET /api/places/get', () => {
    let ctx;
    let seeded;
    beforeAll(async () => {
        ctx = await bootTestServer();
        seeded = await seedPlaces(ctx.modules.db);
    });
    afterAll(async () => shutdownTestServer(ctx));

    it('400 без id', async () => {
        const res = await request(ctx.app).get('/api/places/get');
        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe(-2);
    });

    it('404 при несуществующем id', async () => {
        const res = await request(ctx.app).get('/api/places/get').query({ id: '507f1f77bcf86cd799439011' });
        expect(res.status).toBe(404);
        expect(res.body.error.code).toBe(-6);
    });

    it('400 при невалидном ObjectId', async () => {
        const res = await request(ctx.app).get('/api/places/get').query({ id: 'not-an-id' });
        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe(-2);
    });

    it('200 — возвращает место с preview и нормализованными coordinates', async () => {
        const isaak = seeded.find(d => d.title === 'Исаакиевский собор');
        const res = await request(ctx.app).get('/api/places/get').query({ id: String(isaak._id) });
        expect(res.status).toBe(200);
        expect(res.body.response.place.title).toBe('Исаакиевский собор');
        expect(res.body.response.place.preview).toBe('https://example.com/isaak-1.jpg');
        expect(res.body.response.place.coordinates).toEqual([ 30.3061, 59.9343 ]);
    });
});

describe('GET /api/places/filters', () => {
    let ctx;
    beforeAll(async () => {
        ctx = await bootTestServer();
        await seedPlaces(ctx.modules.db);
    });
    afterAll(async () => shutdownTestServer(ctx));
    beforeEach(() => {
        const cache = require('../utils/cache');
        cache.invalidateAll();
    });

    it('возвращает distinct по category/epoch/architecture_style и диапазон рейтинга', async () => {
        const res = await request(ctx.app).get('/api/places/filters');
        expect(res.status).toBe(200);
        expect(res.body.response.categories.sort()).toEqual([ 'cathedral', 'science' ]);
        expect(res.body.response.epochs).toEqual([ 'XIX' ]);
        expect(res.body.response.architecture_styles.sort()).toEqual([ 'classicism', 'empire', 'russian-revival' ]);
        expect(res.body.response.rating.min).toBeCloseTo(4.3);
        expect(res.body.response.rating.max).toBeCloseTo(4.9);
    });

    it('кэш: второй вызов не перечитывает БД (меняем запись, значения не меняются в пределах TTL)', async () => {
        const res1 = await request(ctx.app).get('/api/places/filters');
        // добавляем новую категорию — в кэше её ещё нет
        await ctx.modules.db.models.places.create({
            title: 'Новое',
            short_description: 'park place',
            coordinates: { type: 'Point', coordinates: [ 30.3, 59.9 ] },
            category: 'park'
        });
        const res2 = await request(ctx.app).get('/api/places/filters');
        expect(res2.body.response.categories).toEqual(res1.body.response.categories);
    });
});
