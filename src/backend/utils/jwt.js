const jwt = require('jsonwebtoken');

function secret(kind) {
    const key = kind === 'refresh' ? process.env.JWT_REFRESH_SECRET : process.env.JWT_ACCESS_SECRET;
    if (!key) throw new Error(`JWT_${kind === 'refresh' ? 'REFRESH' : 'ACCESS'}_SECRET is not set`);
    return key;
}

function ttl(kind) {
    if (kind === 'refresh') return process.env.JWT_REFRESH_TTL || '30d';
    return process.env.JWT_ACCESS_TTL || '15m';
}

/**
 * @param {Object} payload Данные для включения в JWT (напр. { user_id })
 * @param {'access'|'refresh'} kind
 */
function sign(payload, kind = 'access') {
    return jwt.sign(payload, secret(kind), { expiresIn: ttl(kind) });
}

/**
 * Возвращает payload или бросает ошибку (TokenExpiredError, JsonWebTokenError).
 * @param {String} token
 * @param {'access'|'refresh'} kind
 */
function verify(token, kind = 'access') {
    return jwt.verify(token, secret(kind));
}

function signAccess(payload) { return sign(payload, 'access') }
function signRefresh(payload) { return sign(payload, 'refresh') }

module.exports = { sign, verify, signAccess, signRefresh };
