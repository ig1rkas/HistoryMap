const { SchemaTypes } = require('mongoose');
const createTypesValidator = require('./_createTypesValidator');

module.exports = [
    // Структура
    {
        // GeoJSON Point — совместим с 2dsphere индексом и $geoNear/$nearSphere запросами.
        // Порядок в координатах: [долгота, широта].
        coordinates: {
            type: {
                type: String,
                enum: [ 'Point' ],
                default: 'Point'
            },
            coordinates: {
                type: [ Number ],
                required: true,
                validate: {
                    validator: v => Array.isArray(v) && v.length === 2 && v.every(n => typeof n === 'number' && Number.isFinite(n)),
                    message: 'coordinates должен быть [lon, lat] с валидными числами'
                }
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

        // Фильтры (финальный набор значений согласуется по мере сбора данных)
        category: { type: String, default: null },
        epoch: { type: String, default: null },
        architecture_style: { type: String, default: null },

        gallery: [ { link: String } ],
        preview_gallery_id: createTypesValidator([ 'number' ], true),

        information: [ {
            title: String,
            content: String
        } ],

        tags: [ {
            key: String,
            value: SchemaTypes.Mixed
        } ],

        // Пересчитывается при добавлении/удалении одобренных отзывов
        avg_rating: {
            ...createTypesValidator([ 'number' ], true),
            default: null
        },
        rating_count: {
            type: Number,
            default: 0
        }
    },

    // Настройки
    {
        versionKey: false,
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
    },

    // Индексы
    [
        { coordinates: '2dsphere' },
        { category: 1 },
        { epoch: 1 },
        { architecture_style: 1 },
        { avg_rating: -1 }
    ]
]
