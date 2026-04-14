const Method = require('../../_class');

const modules = require('../../../../../modules');
const cache = require('../../../../../utils/cache');

const CACHE_KEY = 'places:filters';
const CACHE_TTL_MS = 10 * 60 * 1000;

class PlacesFilters extends Method {
    constructor(url, express) { super(__dirname, url, express) }

    async getResponse() {
        return cache.getOrSet(CACHE_KEY, CACHE_TTL_MS, async () => {
            const Place = modules.db.models.places;
            const [ categories, epochs, architecture_styles, rating_agg ] = await Promise.all([
                Place.distinct('category', { category: { $ne: null } }),
                Place.distinct('epoch', { epoch: { $ne: null } }),
                Place.distinct('architecture_style', { architecture_style: { $ne: null } }),
                Place.aggregate([
                    { $match: { avg_rating: { $ne: null } } },
                    { $group: { _id: null, min: { $min: '$avg_rating' }, max: { $max: '$avg_rating' } } }
                ])
            ]);
            const rating = rating_agg.length > 0 ? rating_agg[0] : { min: null, max: null };

            return {
                categories: [...categories].sort(),
                epochs: [...epochs].sort(),
                architecture_styles: [...architecture_styles].sort(),
                rating: { min: rating.min, max: rating.max }
            };
        });
    }
}

module.exports = PlacesFilters;
