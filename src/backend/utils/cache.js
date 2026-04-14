/**
 * Простой in-memory TTL-кэш.
 * Формат записи: { value, expires }.
 * Для учебного проекта с одним процессом достаточно. При переходе на несколько инстансов — сменить на Redis.
 */
const store = new Map();

/**
 * Возвращает значение из кэша, либо вычисляет через fn и сохраняет с ttl.
 * Кэширует именно результат fn() (включая ошибки — ошибки не кэшируются).
 * @param {String} key
 * @param {Number} ttlMs
 * @param {() => Promise<*>} fn
 */
async function getOrSet(key, ttlMs, fn) {
    const entry = store.get(key);
    if (entry && entry.expires > Date.now()) return entry.value;
    const value = await fn();
    store.set(key, { value, expires: Date.now() + ttlMs });
    return value;
}

function invalidate(key) { store.delete(key) }

function invalidateAll() { store.clear() }

module.exports = { getOrSet, invalidate, invalidateAll };
