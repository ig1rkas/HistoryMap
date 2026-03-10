const { SchemaTypes } = require('mongoose');
const createTypesValidator = require('./_createTypesValidator');

module.exports = [
    // Структура
    {
        coordinates: {
            lat: {
                type: Number,
                required: true
            },
            lon: {
                type: Number,
                required: true
            }
        },

        title: {
            type: String,
            required: true
        },

        short_description: {
            type: String,
            required: true
        },

        gallery: [{ link: String }],
        preview_gallery_id: createTypesValidator([ 'number' ], true),

        information: [{
            title: String,
            content: String
        }],

        tags: [{
            key: String,
            value: SchemaTypes.Mixed
        }],

        avg_rating: {
            ...createTypesValidator(['number'], true),
            default: null
        }
    },

    // Настройки
    {
        versionKey: false
    }
]