const Method = require('../../_class');

const modules = require('../../../../../modules');
const vk = require('../../../../../utils/vk');
const jwtUtil = require('../../../../../utils/jwt');

const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function redirectToFrontendWithError(res, frontend, reason) {
    const url = new URL(frontend);
    url.hash = 'auth_error=' + encodeURIComponent(reason);
    return res.redirect(302, url.toString());
}

class AuthVK extends Method {
    constructor(url, express) { super(__dirname, url, express) }

    async getResponse(req, res) {
        const { code, error } = req.query;
        const frontend = process.env.FRONTEND_URL || 'http://localhost/';

        if (error) return redirectToFrontendWithError(res, frontend, String(error));

        // Без ?code — инициируем OAuth: редиректим пользователя на VK authorize.
        if (!code) return res.redirect(302, vk.getAuthorizeUrl());

        // Callback от VK — обмениваем code на access_token пользователя.
        let tokenData;
        try { tokenData = await vk.exchangeCodeForToken(String(code)) }
        catch (e) {
            modules.logger.error('VK token exchange failed: ' + modules.logger.stringError(e, false));
            return redirectToFrontendWithError(res, frontend, 'token_exchange_failed');
        }

        const vk_id = Number(tokenData.user_id);
        const vk_access_token_expires = new Date(Date.now() + (Number(tokenData.expires_in) || 0) * 1000);

        let user;
        try {
            user = await modules.db.req('users', 'findOneAndUpdate', [
                { vk_id },
                {
                    vk_id,
                    vk_access_token: tokenData.access_token,
                    vk_access_token_expires
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            ]);
        } catch (e) {
            modules.logger.error('VK auth upsert failed: ' + modules.logger.stringError(e, false));
            return redirectToFrontendWithError(res, frontend, 'user_save_failed');
        }

        const access_token = jwtUtil.signAccess({ user_id: user._id, vk_id });
        const refresh_token = jwtUtil.signRefresh({ user_id: user._id });
        const refresh_token_expires = new Date(Date.now() + REFRESH_TTL_MS);

        try {
            await modules.db.req('users', 'findByIdAndUpdate', [ user._id, {
                refresh_token,
                refresh_token_expires
            } ]);
        } catch (e) {
            modules.logger.error('Saving refresh token failed: ' + modules.logger.stringError(e, false));
        }

        const url = new URL(frontend);
        url.hash = new URLSearchParams({
            access_token,
            refresh_token,
            user_id: String(user._id)
        }).toString();
        return res.redirect(302, url.toString());
    }
}

module.exports = AuthVK;
