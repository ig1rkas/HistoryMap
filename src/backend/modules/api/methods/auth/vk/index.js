const jwt = require('jsonwebtoken');

const Method = require('../../_class');

const modules = require('../../../../../modules');
const vk = require('../../../../../utils/vk');
const jwtUtil = require('../../../../../utils/jwt');

const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const PKCE_COOKIE = 'vk_pkce';
const PKCE_COOKIE_PATH = '/api/auth/vk';
const PKCE_TTL_S = 600;

function redirectToFrontendWithError(res, frontend, reason) {
    const url = new URL(frontend);
    url.hash = 'auth_error=' + encodeURIComponent(reason);
    return res.redirect(302, url.toString());
}

function parseCookies(req) {
    const header = req.headers.cookie || '';
    const out = {};
    for (const part of header.split(';')) {
        const idx = part.indexOf('=');
        if (idx === -1) continue;
        const k = part.slice(0, idx).trim();
        const v = part.slice(idx + 1).trim();
        if (k) out[k] = decodeURIComponent(v);
    }
    return out;
}

function setPkceCookie(res, value, maxAge) {
    res.setHeader('Set-Cookie',
        `${PKCE_COOKIE}=${encodeURIComponent(value)}; Path=${PKCE_COOKIE_PATH}; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`
    );
}

class AuthVK extends Method {
    constructor(url, express) { super(__dirname, url, express) }

    async getResponse(req, res) {
        const { code, error, state, device_id } = req.query;
        const frontend = process.env.FRONTEND_URL || 'http://localhost/';

        if (error) return redirectToFrontendWithError(res, frontend, String(error));

        // Без ?code — старт OAuth: генерим PKCE+state, кладём в подписанный cookie, редиректим на VK ID.
        if (!code) {
            const { code_verifier, code_challenge } = vk.generatePkcePair();
            const flowState = vk.generateState();
            const cookieJwt = jwt.sign(
                { state: flowState, code_verifier },
                process.env.JWT_ACCESS_SECRET,
                { expiresIn: PKCE_TTL_S }
            );
            setPkceCookie(res, cookieJwt, PKCE_TTL_S);
            return res.redirect(302, vk.getAuthorizeUrl({ state: flowState, code_challenge }));
        }

        // Callback от VK ID: достаём PKCE-секреты из cookie и сверяем state.
        const cookies = parseCookies(req);
        const cookieJwt = cookies[PKCE_COOKIE];
        if (!cookieJwt) return redirectToFrontendWithError(res, frontend, 'pkce_cookie_missing');

        let pkce;
        try { pkce = jwt.verify(cookieJwt, process.env.JWT_ACCESS_SECRET) }
        catch { return redirectToFrontendWithError(res, frontend, 'pkce_cookie_invalid') }

        if (!state || pkce.state !== String(state)) {
            return redirectToFrontendWithError(res, frontend, 'state_mismatch');
        }
        if (!device_id) return redirectToFrontendWithError(res, frontend, 'device_id_missing');

        let tokenData;
        try {
            tokenData = await vk.exchangeCodeForToken({
                code: String(code),
                code_verifier: pkce.code_verifier,
                device_id: String(device_id),
                state: String(state)
            });
        } catch (e) {
            modules.logger.error('VK ID token exchange failed: ' + modules.logger.stringError(e, false));
            return redirectToFrontendWithError(res, frontend, 'token_exchange_failed');
        }

        const vk_id = Number(tokenData.user_id);
        const vk_access_token_expires = new Date(Date.now() + (Number(tokenData.expires_in) || 0) * 1000);

        // Профиль (имя/фамилия/аватар) — запрашиваем отдельно, фейл не блокирует логин.
        let profile = null;
        try { profile = await vk.getUserInfo(tokenData.access_token) }
        catch (e) {
            modules.logger.warn('VK ID user_info failed: ' + modules.logger.stringError(e, false));
        }

        const update = {
            vk_id,
            vk_access_token: tokenData.access_token,
            vk_access_token_expires
        };
        if (profile) {
            if (typeof profile.first_name === 'string') update.first_name = profile.first_name;
            if (typeof profile.last_name === 'string') update.last_name = profile.last_name;
            if (typeof profile.avatar === 'string') update.avatar = profile.avatar;
        }

        let user;
        try {
            user = await modules.db.req('users', 'findOneAndUpdate', [
                { vk_id },
                update,
                { upsert: true, new: true, setDefaultsOnInsert: true }
            ]);
        } catch (e) {
            modules.logger.error('VK ID auth upsert failed: ' + modules.logger.stringError(e, false));
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

        // Гасим PKCE-cookie — она одноразовая.
        setPkceCookie(res, '', 0);

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
