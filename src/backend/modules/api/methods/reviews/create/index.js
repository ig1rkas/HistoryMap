const Method = require('../../_class');

const modules = require('../../../../../modules');
const moderation = require('../../../../../utils/moderation');
const cache = require('../../../../../utils/cache');
const { recalcRating } = require('../../../../../utils/places');

class ReviewsCreate extends Method {
    constructor(url, express) { super(__dirname, url, express) }

    async getResponse(req) {
        const { place_id, rating, text } = req.container_data;
        const user_id = req.user && req.user.user_id;
        if (!user_id) return { error_code: -4, status: 401 };

        const Place = modules.db.models.places;
        const Review = modules.db.models.reviews;

        const place = await Place.findById(place_id).lean();
        if (!place) return { error_code: -6, status: 404 };

        const verdict = text ? moderation.check(text) : { status: 'approved' };

        const review = await Review.create({
            author_id: user_id,
            place_id,
            rating,
            text: text || null,
            moderation_status: verdict.status
        });

        let recomputed = null;
        if (verdict.status === 'approved') {
            recomputed = await recalcRating(Place, Review, place_id);
            cache.invalidate('places:filters');
        }

        return {
            review: review.toObject(),
            moderation: verdict,
            place_stats: recomputed
        };
    }
}

module.exports = ReviewsCreate;
