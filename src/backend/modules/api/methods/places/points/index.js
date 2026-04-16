const Method = require('../../_class');

const modules = require('../../../../../modules');
const { extractPreview, buildFilter } = require('../../../../../utils/places');

const MAX_POINTS = 5000;

class PlacesPoints extends Method {
    constructor(url, express) { super(__dirname, url, express) }

    async getResponse(req) {
        const { lat, lon, radius } = req.container_data;
        const filter = buildFilter(req.container_data);

        const Place = modules.db.models.places;
        const projection = {
            _id: 1, title: 1, coordinates: 1,
            gallery: 1, preview_gallery_id: 1,
            avg_rating: 1, category: 1
        };

        let docs;
        if (lat !== undefined && lon !== undefined && radius !== undefined) {
            docs = await Place.aggregate([
                {
                    $geoNear: {
                        near: { type: 'Point', coordinates: [ lon, lat ] },
                        distanceField: 'distance',
                        maxDistance: radius,
                        spherical: true,
                        query: filter
                    }
                },
                { $project: { ...projection, distance: 1 } },
                { $limit: MAX_POINTS }
            ]);
        } else {
            docs = await Place.find(filter, projection).limit(MAX_POINTS).lean();
        }

        const points = docs.map(doc => ({
            _id: doc._id,
            title: doc.title,
            category: doc.category,
            coordinates: doc.coordinates && Array.isArray(doc.coordinates.coordinates) ? doc.coordinates.coordinates : null,
            preview: extractPreview(doc),
            avg_rating: doc.avg_rating,
            ...(doc.distance !== undefined ? { distance: doc.distance } : {})
        }));

        return { points };
    }
}

module.exports = PlacesPoints;
