const createTypesValidator = require('./_createTypesValidator');

module.exports = [
    // Структура
    {
        vk_id: {
            type: Number,
            unique: true,
            required: true
        },

        vk_access_token: {
            type: String,
            required: true
        },
        vk_access_token_expires: {
            ...createTypesValidator([ Date ], true),
            required: true
        },

        refresh_token: {
            ...createTypesValidator([ 'string' ], true),
            default: null
        },
        refresh_token_expires: {
            ...createTypesValidator([ Date ], true),
            default: null
        },

        first_name: {
            ...createTypesValidator([ 'string' ], true),
            default: null
        },
        last_name: {
            ...createTypesValidator([ 'string' ], true),
            default: null
        },
        avatar: {
            ...createTypesValidator([ 'string' ], true),
            default: null
        }
    },

    // Настройки
    {
        versionKey: false,
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
    }
]