/**
 * Простая blacklist-модерация текста отзыва.
 * Для учебного проекта — реальные запрещёнки в код не коммитим, используем нейтральные стоп-слова.
 */

// Нейтральные «стоп-слова» для демонстрации: реальный список можно будет подменить через BLACKLIST_WORDS env.
const DEFAULT_BLACKLIST = [
    'badword',
    'stopword',
    'запретслово',
    'плохослово'
];

// Карта частых замен latin→cyrillic (обход фильтра через «а» вместо «а»).
const LATIN_TO_CYR = {
    a: 'а', b: 'в', c: 'с', e: 'е', h: 'н', k: 'к', m: 'м',
    o: 'о', p: 'р', t: 'т', x: 'х', y: 'у'
};

/**
 * Нормализация для сравнения:
 *  - lowercase
 *  - латинские похожие символы заменяются на кириллические
 *  - убираются все не-буквы (цифры, пробелы, знаки)
 *  - схлопываются повторяющиеся подряд буквы ("ппаарк" → "парк")
 */
function normalize(text) {
    if (text === null || text === undefined) return '';
    let s = String(text).toLowerCase();
    s = s.replace(/[a-z]/g, ch => LATIN_TO_CYR[ch] || ch);
    s = s.replace(/[^\p{L}]/gu, '');
    s = s.replace(/(.)\1+/gu, '$1');
    return s;
}

function getBlacklist() {
    const env = process.env.BLACKLIST_WORDS;
    if (!env) return DEFAULT_BLACKLIST;
    return env.split(',').map(s => s.trim()).filter(Boolean);
}

/**
 * Возвращает { status: 'approved'|'rejected', matched?: String }.
 * Пустой/отсутствующий текст — всегда approved.
 */
function check(text) {
    const normalized = normalize(text);
    if (!normalized) return { status: 'approved' };

    for (const word of getBlacklist()) {
        const normalizedWord = normalize(word);
        if (normalizedWord && normalized.includes(normalizedWord)) {
            return { status: 'rejected', matched: word };
        }
    }
    return { status: 'approved' };
}

module.exports = { normalize, check, getBlacklist };
