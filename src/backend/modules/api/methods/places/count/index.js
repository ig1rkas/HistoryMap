const Method = require('../../_class');

const modules = require('../../../../../modules');
const cache = require('../../../../../utils/cache');

const CACHE_KEY = 'places:count';
const CACHE_TTL_MS = 10 * 60 * 1000;

class PlacesCount extends Method {
    constructor(url, express) { super(__dirname, url, express) }

    async getResponse() {
        const count = await cache.getOrSet(CACHE_KEY, CACHE_TTL_MS, async () => {
            return modules.db.models.places.countDocuments();
        });
        return { count };
    }
}

module.exports = PlacesCount;
