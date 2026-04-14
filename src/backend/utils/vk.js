const VK_API_VERSION = '5.131';

/**
 * URL, на который перенаправляется пользователь, чтобы авторизоваться на стороне VK.
 */
function getAuthorizeUrl({ scope = '', state } = {}) {
    const params = new URLSearchParams({
        client_id: process.env.VK_CLIENT_ID,
        redirect_uri: process.env.VK_REDIRECT_URI,
        response_type: 'code',
        v: VK_API_VERSION
    });
    if (state) params.set('state', state);
    if (scope) params.set('scope', scope);
    return 'https://oauth.vk.com/authorize?' + params.toString();
}

/**
 * Обменивает одноразовый `code`, полученный после redirect_uri, на access_token пользователя VK.
 * Возвращает: { access_token, expires_in, user_id, email? }
 */
async function exchangeCodeForToken(code) {
    const params = new URLSearchParams({
        client_id: process.env.VK_CLIENT_ID,
        client_secret: process.env.VK_CLIENT_SECRET,
        redirect_uri: process.env.VK_REDIRECT_URI,
        code
    });
    const resp = await fetch('https://oauth.vk.com/access_token?' + params.toString());
    const data = await resp.json();
    if (!data.access_token) {
        const err = new Error('VK token exchange failed');
        err.details = data;
        throw err;
    }
    return data;
}

module.exports = { getAuthorizeUrl, exchangeCodeForToken };
