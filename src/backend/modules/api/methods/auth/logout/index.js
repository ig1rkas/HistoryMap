const Method = require('../../_class');

const modules = require('../../../../../modules');

class AuthLogout extends Method {
    constructor(url, express) { super(__dirname, url, express) }

    async getResponse(req) {
        const user_id = req.user && req.user.user_id;
        if (!user_id) return { ok: true };

        await modules.db.req('users', 'findByIdAndUpdate', [ user_id, {
            refresh_token: null,
            refresh_token_expires: null
        } ]);
        return { ok: true };
    }
}

module.exports = AuthLogout;
