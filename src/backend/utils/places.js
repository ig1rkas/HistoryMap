/**
 * Выбирает ссылку на превью-картинку из элемента gallery по индексу preview_gallery_id.
 * Возвращает null, если gallery пустая или индекс невалидный.
 */
function extractPreview(doc) {
    if (!doc || !Array.isArray(doc.gallery) || doc.gallery.length === 0) return null;
    const idx = Number.isInteger(doc.preview_gallery_id) ? doc.preview_gallery_id : 0;
    const item = doc.gallery[idx] || doc.gallery[0];
    return item ? item.link || null : null;
}

/**
 * Формирует mongo-фильтр из query-параметров (category/epoch/architecture_style/min_rating).
 */
function buildFilter({ category, epoch, architecture_style, min_rating } = {}) {
    const filter = {};
    if (category) filter.category = category;
    if (epoch) filter.epoch = epoch;
    if (architecture_style) filter.architecture_style = architecture_style;
    if (min_rating !== undefined && min_rating !== null) filter.avg_rating = { $gte: min_rating };
    return filter;
}

/**
 * Пересчитывает avg_rating и rating_count у места на основе approved-отзывов.
 * Обновляет документ в places и возвращает итоговые значения.
 * @param {import('mongoose').Model} Place
 * @param {import('mongoose').Model} Review
 * @param {*} place_id
 */
async function recalcRating(Place, Review, place_id) {
    const agg = await Review.aggregate([
        { $match: { place_id: toObjectId(place_id), moderation_status: 'approved' } },
        { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);
    const avg_rating = agg.length > 0 ? agg[0].avg : null;
    const rating_count = agg.length > 0 ? agg[0].count : 0;
    await Place.findByIdAndUpdate(place_id, { avg_rating, rating_count });
    return { avg_rating, rating_count };
}

function toObjectId(id) {
    if (id && typeof id === 'object' && id._bsontype === 'ObjectId') return id;
    const mongoose = require('mongoose');
    return new mongoose.Types.ObjectId(String(id));
}

module.exports = { extractPreview, buildFilter, recalcRating };
