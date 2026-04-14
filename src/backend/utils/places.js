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

module.exports = { extractPreview, buildFilter };
