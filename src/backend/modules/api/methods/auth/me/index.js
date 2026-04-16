const Method = require('../../_class');

const modules = require('../../../../../modules');

class AuthMe extends Method {
    constructor(url, express) { super(__dirname, url, express) }

    async getResponse(req) {
        const user_id = req.user && req.user.user_id;
        if (!user_id) return { error_code: -4, status: 401 };

        const user = await modules.db.req('users', 'findById', [
            user_id,
            { refresh_token: 0, vk_access_token: 0 }
        ]);
        if (!user) return { error_code: -4, status: 404 };
        return { user };
    }
}

module.exports = AuthMe;
