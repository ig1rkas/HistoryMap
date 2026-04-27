const Method = require('../../_class');

const modules = require('../../../../../modules');

const DEFAULT_LIMIT = 20;
const DEFAULT_OFFSET = 0;

class ReviewsList extends Method {
    constructor(url, express) { super(__dirname, url, express) }

    async getResponse(req) {
        const { place_id, limit = DEFAULT_LIMIT, offset = DEFAULT_OFFSET } = req.container_data;

        const Review = modules.db.models.reviews;
        const User = modules.db.models.users;
        const filter = { place_id, moderation_status: 'approved' };

        const [ total, reviews ] = await Promise.all([
            Review.countDocuments(filter),
            Review.find(filter).sort({ created_at: -1 }).skip(offset).limit(limit).lean()
        ]);

        const authorIds = [...new Set(reviews.map(r => String(r.author_id)))];
        const authors = authorIds.length
            ? await User.find(
                { _id: { $in: authorIds } },
                { vk_id: 1, first_name: 1, last_name: 1, avatar: 1 }
            ).lean()
            : [];
        const authorById = new Map(authors.map(a => [String(a._id), a]));

        const reviewsWithAuthor = reviews.map(r => ({
            ...r,
            author: authorById.get(String(r.author_id)) || null
        }));

        return { reviews: reviewsWithAuthor, total, limit, offset };
    }
}

module.exports = ReviewsList;
