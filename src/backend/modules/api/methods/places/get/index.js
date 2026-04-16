const Method = require('../../_class');

const modules = require('../../../../../modules');
const { extractPreview } = require('../../../../../utils/places');

class PlacesGet extends Method {
    constructor(url, express) { super(__dirname, url, express) }

    async getResponse(req) {
        const { id } = req.container_data;
        const Place = modules.db.models.places;
        const doc = await Place.findById(id).lean();
        if (!doc) return { error_code: -6, status: 404 };

        doc.preview = extractPreview(doc);
        doc.coordinates = doc.coordinates && Array.isArray(doc.coordinates.coordinates) ? doc.coordinates.coordinates : null;
        return { place: doc };
    }
}

module.exports = PlacesGet;
