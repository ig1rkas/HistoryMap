const Method = require('../../_class');

const modules = require('../../../../../modules');

const DEFAULT_LIMIT = 20;
const DEFAULT_OFFSET = 0;

class ReviewsList extends Method {
    constructor(url, express) { super(__dirname, url, express) }

    async getResponse(req) {
        const { place_id, limit = DEFAULT_LIMIT, offset = DEFAULT_OFFSET } = req.container_data;

        const Review = modules.db.models.reviews;
        const filter = { place_id, moderation_status: 'approved' };

        const [ total, reviews ] = await Promise.all([
            Review.countDocuments(filter),
            Review.find(filter).sort({ created_at: -1 }).skip(offset).limit(limit).lean()
        ]);

        return { reviews, total, limit, offset };
    }
}

module.exports = ReviewsList;
