const crypto = require('node:crypto');

const VK_ID_AUTHORIZE_URL = 'https://id.vk.com/authorize';
const VK_ID_TOKEN_URL = 'https://id.vk.com/oauth2/auth';
const VK_API_USERS_GET_URL = 'https://api.vk.com/method/users.get';
const VK_API_VERSION = '5.199';

function base64url(buf) {
    return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function generatePkcePair() {
    const code_verifier = base64url(crypto.randomBytes(32));
    const code_challenge = base64url(crypto.createHash('sha256').update(code_verifier).digest());
    return { code_verifier, code_challenge };
}

function generateState() {
    return base64url(crypto.randomBytes(16));
}

/**
 * URL для редиректа пользователя на VK ID для авторизации.
 * Использует OAuth 2.1 Authorization Code Flow с PKCE.
 */
function getAuthorizeUrl({ state, code_challenge, scope = '' } = {}) {
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: process.env.VK_CLIENT_ID,
        redirect_uri: process.env.VK_REDIRECT_URI,
        state,
        code_challenge,
        code_challenge_method: 's256',
        lang: 'ru'
    });
    if (scope) params.set('scope', scope);
    return VK_ID_AUTHORIZE_URL + '?' + params.toString();
}

/**
 * Обменивает одноразовый `code` (из callback от VK ID) на access_token через PKCE.
 * @param {{ code: string, code_verifier: string, device_id: string, state: string }} args
 * @returns {Promise<{ access_token: string, refresh_token: string, expires_in: number, user_id: number, state: string, scope?: string, id_token?: string }>}
 */
async function exchangeCodeForToken({ code, code_verifier, device_id, state }) {
    const body = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.VK_CLIENT_ID,
        redirect_uri: process.env.VK_REDIRECT_URI,
        code_verifier,
        code,
        device_id,
        state,
        lang: 'ru'
    });
    const resp = await fetch(VK_ID_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString()
    });
    const data = await resp.json();
    if (!data.access_token) {
        const err = new Error('VK ID token exchange failed');
        err.details = data;
        throw err;
    }
    return data;
}

/**
 * Получает профиль пользователя через VK API `users.get` с `lang=ru` —
 * чтобы ФИО приходили на русском.
 * @param {string} access_token
 * @returns {Promise<{ user_id: string, first_name?: string, last_name?: string, avatar?: string }>}
 */
async function getUserInfo(access_token) {
    const body = new URLSearchParams({
        access_token,
        v: VK_API_VERSION,
        fields: 'photo_200',
        lang: 'ru'
    });
    const resp = await fetch(VK_API_USERS_GET_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString()
    });
    const data = await resp.json();
    const user = data && Array.isArray(data.response) ? data.response[0] : null;
    if (!user) {
        const err = new Error('VK API users.get failed');
        err.details = data;
        throw err;
    }
    return {
        user_id: String(user.id),
        first_name: user.first_name,
        last_name: user.last_name,
        avatar: user.photo_200
    };
}

module.exports = { getAuthorizeUrl, exchangeCodeForToken, getUserInfo, generatePkcePair, generateState };
