const Method = require('../../_class');

const modules = require('../../../../../modules');
const { extractPreview, buildFilter } = require('../../../../../utils/places');

const DEFAULT_LIMIT = 20;
const DEFAULT_OFFSET = 0;

class PlacesCards extends Method {
    constructor(url, express) { super(__dirname, url, express) }

    async getResponse(req) {
        const {
            lat, lon, radius,
            limit = DEFAULT_LIMIT,
            offset = DEFAULT_OFFSET
        } = req.container_data;
        const filter = buildFilter(req.container_data);

        const Place = modules.db.models.places;

        let total;
        let docs;

        if (lat !== undefined && lon !== undefined && radius !== undefined) {
            const geo_stage = {
                $geoNear: {
                    near: { type: 'Point', coordinates: [ lon, lat ] },
                    distanceField: 'distance',
                    maxDistance: radius,
                    spherical: true,
                    query: filter
                }
            };
            const count_result = await Place.aggregate([ geo_stage, { $count: 'total' } ]);
            total = count_result.length > 0 ? count_result[0].total : 0;
            docs = await Place.aggregate([ geo_stage, { $skip: offset }, { $limit: limit } ]);
        } else {
            total = await Place.countDocuments(filter);
            docs = await Place.find(filter).skip(offset).limit(limit).lean();
        }

        const cards = docs.map(doc => ({
            _id: doc._id,
            title: doc.title,
            short_description: doc.short_description,
            category: doc.category,
            epoch: doc.epoch,
            architecture_style: doc.architecture_style,
            preview: extractPreview(doc),
            avg_rating: doc.avg_rating,
            rating_count: doc.rating_count,
            ...(doc.distance !== undefined ? { distance: doc.distance } : {})
        }));

        return { cards, total, limit, offset };
    }
}

module.exports = PlacesCards;
