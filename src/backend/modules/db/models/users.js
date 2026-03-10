const createTypesValidator = require('./_createTypesValidator');

module.exports = [
    // Структура
    {
        vk_id: {
            type: Number,
            unique: true,
            required: true
        },
        access_token: {
            ...createTypesValidator([ 'string' ], true),
            required: true
        },
        access_token: {
            type: String,
            required: true
        },
        expires: {
            ...createTypesValidator([ Date ], true),
            required: true
        }
    },

    // Настройки
    {
        versionKey: false
    }
]