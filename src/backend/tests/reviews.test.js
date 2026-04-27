import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createRequire } from 'node:module';
import { bootTestServer, shutdownTestServer } from './helpers.js';

const require = createRequire(import.meta.url);

async function seedPlace(db, overrides = {}) {
    return db.models.places.create({
        title: overrides.title || 'Тестовое место',
        short_description: 'описание',
        coordinates: { type: 'Point', coordinates: [ 30.3, 59.9 ] },
        category: 'cathedral',
        epoch: 'XIX',
        architecture_style: 'classicism',
        avg_rating: null,
        rating_count: 0,
        ...overrides
    });
}

async function seedUser(db, vk_id = 42, profile = {}) {
    return db.models.users.create({
        vk_id,
        vk_access_token: 'vk-access',
        vk_access_token_expires: new Date(Date.now() + 3600_000),
        ...profile
    });
}

function authHeader(user_id) {
    const jwtUtil = require('../utils/jwt');
    const token = jwtUtil.signAccess({ user_id, vk_id: 0 });
    return { Authorization: `Bearer ${token}` };
}

describe('POST /api/reviews/create', () => {
    let ctx;
    beforeAll(async () => { ctx = await bootTestServer() });
    afterAll(async () => shutdownTestServer(ctx));

    it('401 без авторизации', async () => {
        const place = await seedPlace(ctx.modules.db);
        const res = await request(ctx.app).post('/api/reviews/create').send({
            place_id: String(place._id), rating: 5
        });
        expect(res.status).toBe(401);
    });

    it('404 для несуществующего места', async () => {
        const user = await seedUser(ctx.modules.db, 101);
        const res = await request(ctx.app)
            .post('/api/reviews/create')
            .set(authHeader(user._id))
            .send({ place_id: '507f1f77bcf86cd799439011', rating: 5 });
        expect(res.status).toBe(404);
        expect(res.body.error.code).toBe(-6);
    });

    it('400 при rating вне [1,5]', async () => {
        const user = await seedUser(ctx.modules.db, 102);
        const place = await seedPlace(ctx.modules.db, { title: 'place102' });
        const res = await request(ctx.app)
            .post('/api/reviews/create')
            .set(authHeader(user._id))
            .send({ place_id: String(place._id), rating: 10 });
        expect(res.status).toBe(400);
    });

    it('200 approved — пересчитывает avg_rating и rating_count', async () => {
        const user = await seedUser(ctx.modules.db, 103);
        const place = await seedPlace(ctx.modules.db, { title: 'place103' });

        const r1 = await request(ctx.app)
            .post('/api/reviews/create')
            .set(authHeader(user._id))
            .send({ place_id: String(place._id), rating: 5, text: 'Великолепно!' });
        expect(r1.status).toBe(200);
        expect(r1.body.response.moderation.status).toBe('approved');
        expect(r1.body.response.place_stats.avg_rating).toBe(5);
        expect(r1.body.response.place_stats.rating_count).toBe(1);

        const r2 = await request(ctx.app)
            .post('/api/reviews/create')
            .set(authHeader(user._id))
            .send({ place_id: String(place._id), rating: 3 });
        expect(r2.status).toBe(200);
        expect(r2.body.response.place_stats.avg_rating).toBe(4);
        expect(r2.body.response.place_stats.rating_count).toBe(2);

        const fresh = await ctx.modules.db.models.places.findById(place._id).lean();
        expect(fresh.avg_rating).toBe(4);
        expect(fresh.rating_count).toBe(2);
    });

    it('200 rejected — отзыв сохраняется, но avg_rating/rating_count не меняются', async () => {
        const user = await seedUser(ctx.modules.db, 104);
        const place = await seedPlace(ctx.modules.db, { title: 'place104' });

        const res = await request(ctx.app)
            .post('/api/reviews/create')
            .set(authHeader(user._id))
            .send({ place_id: String(place._id), rating: 5, text: 'Это badword везде' });
        expect(res.status).toBe(200);
        expect(res.body.response.moderation.status).toBe('rejected');
        expect(res.body.response.moderation.matched).toBe('badword');
        expect(res.body.response.place_stats).toBeNull();

        const fresh = await ctx.modules.db.models.places.findById(place._id).lean();
        expect(fresh.avg_rating).toBeNull();
        expect(fresh.rating_count).toBe(0);

        const saved = await ctx.modules.db.models.reviews.findById(res.body.response.review._id).lean();
        expect(saved.moderation_status).toBe('rejected');
    });
});

describe('GET /api/reviews/list', () => {
    let ctx;
    beforeAll(async () => { ctx = await bootTestServer() });
    afterAll(async () => shutdownTestServer(ctx));

    it('400 без place_id', async () => {
        const res = await request(ctx.app).get('/api/reviews/list');
        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe(-2);
    });

    it('возвращает только approved-отзывы с пагинацией и сортировкой по created_at desc', async () => {
        const user = await seedUser(ctx.modules.db, 201);
        const place = await seedPlace(ctx.modules.db, { title: 'list-place' });

        const Review = ctx.modules.db.models.reviews;
        const now = Date.now();
        await Review.create({ author_id: user._id, place_id: place._id, rating: 5, text: 'first', moderation_status: 'approved', created_at: new Date(now - 3000) });
        await Review.create({ author_id: user._id, place_id: place._id, rating: 4, text: 'second', moderation_status: 'approved', created_at: new Date(now - 2000) });
        await Review.create({ author_id: user._id, place_id: place._id, rating: 1, text: 'bad', moderation_status: 'rejected', created_at: new Date(now - 1000) });

        const res = await request(ctx.app).get('/api/reviews/list').query({ place_id: String(place._id), limit: 10 });
        expect(res.status).toBe(200);
        expect(res.body.response.total).toBe(2);
        expect(res.body.response.reviews).toHaveLength(2);
        expect(res.body.response.reviews.map(r => r.text)).toEqual([ 'second', 'first' ]);
    });

    it('к каждому отзыву прикладывается author с first_name/last_name/avatar', async () => {
        const author = await seedUser(ctx.modules.db, 202, {
            first_name: 'Анна', last_name: 'Аннова', avatar: 'https://vk.com/a.jpg'
        });
        const place = await seedPlace(ctx.modules.db, { title: 'list-place-author' });
        await ctx.modules.db.models.reviews.create({
            author_id: author._id, place_id: place._id, rating: 5, text: 'with-author',
            moderation_status: 'approved'
        });

        const res = await request(ctx.app).get('/api/reviews/list').query({ place_id: String(place._id) });
        expect(res.status).toBe(200);
        const review = res.body.response.reviews[0];
        expect(review.author).toMatchObject({
            _id: String(author._id),
            vk_id: 202,
            first_name: 'Анна',
            last_name: 'Аннова',
            avatar: 'https://vk.com/a.jpg'
        });
        expect(review.author.vk_access_token).toBeUndefined();
        expect(review.author.refresh_token).toBeUndefined();
    });

    it('если автор отзыва удалён из users — author = null, отзыв всё равно отдаётся', async () => {
        const place = await seedPlace(ctx.modules.db, { title: 'list-place-orphan' });
        const ghostId = '507f1f77bcf86cd799439099';
        await ctx.modules.db.models.reviews.create({
            author_id: ghostId, place_id: place._id, rating: 4, text: 'orphan',
            moderation_status: 'approved'
        });

        const res = await request(ctx.app).get('/api/reviews/list').query({ place_id: String(place._id) });
        expect(res.status).toBe(200);
        expect(res.body.response.reviews[0].text).toBe('orphan');
        expect(res.body.response.reviews[0].author).toBeNull();
    });
});
