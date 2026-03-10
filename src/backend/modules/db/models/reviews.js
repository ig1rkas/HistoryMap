const { SchemaTypes } = require('mongoose');
const createTypesValidator = require('./_createTypesValidator');

module.exports = [
    // Структура
    {
        author_id: {
            type: SchemaTypes.ObjectId,
            required: true
        },
        place_id: {
            type: SchemaTypes.ObjectId,
            required: true
        },

        rating: {
            type: Number,
            required: true
        },

        text: {
            ...createTypesValidator([ 'string' ], true),
            default: true
        }
    },

    // Настройки
    {
        versionKey: false
    }
]