const { SchemaTypes } = require('mongoose');
const createTypesValidator = require('./_createTypesValidator');

module.exports = [
    // Структура
    {
        author_id: {
            type: SchemaTypes.ObjectId,
            required: true,
            index: true
        },
        place_id: {
            type: SchemaTypes.ObjectId,
            required: true,
            index: true
        },

        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },

        text: {
            ...createTypesValidator([ 'string' ], true),
            default: null
        },

        moderation_status: {
            type: String,
            enum: [ 'pending', 'approved', 'rejected' ],
            default: 'pending',
            index: true
        }
    },

    // Настройки
    {
        versionKey: false,
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
    }
]