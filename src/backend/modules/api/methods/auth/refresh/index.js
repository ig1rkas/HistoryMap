const Method = require('../../_class');

const modules = require('../../../../../modules');
const jwtUtil = require('../../../../../utils/jwt');

const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

class AuthRefresh extends Method {
    constructor(url, express) { super(__dirname, url, express) }

    async getResponse(req) {
        const { refresh_token } = req.container_data;

        let payload;
        try { payload = jwtUtil.verify(refresh_token, 'refresh') }
        catch { return { error_code: -5, status: 401 } }

        const user = await modules.db.req('users', 'findById', [ payload.user_id ]);
        if (!user || user.refresh_token !== refresh_token) return { error_code: -5, status: 401 };

        const new_access = jwtUtil.signAccess({ user_id: user._id, vk_id: user.vk_id });
        const new_refresh = jwtUtil.signRefresh({ user_id: user._id });
        const refresh_token_expires = new Date(Date.now() + REFRESH_TTL_MS);

        await modules.db.req('users', 'findByIdAndUpdate', [ user._id, {
            refresh_token: new_refresh,
            refresh_token_expires
        } ]);

        return {
            access_token: new_access,
            refresh_token: new_refresh
        };
    }
}

module.exports = AuthRefresh;
