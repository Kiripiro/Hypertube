const { InvalidTokens } = require('../models');
class InvalidTokensController {
    async addInvalidToken(accessToken, refreshToken) {
        try {
            const invalidToken = await InvalidTokens.create({ accessToken, refreshToken });
            return invalidToken;
        } catch (error) {
            throw error;
        }
    }

    async findInvalidToken(accessToken, refreshToken) {
        const whereClause = {};
        if (accessToken) {
            whereClause.accessToken = accessToken;
        }
        if (refreshToken) {
            whereClause.refreshToken = refreshToken;
        }

        try {
            const invalidToken = await InvalidTokens.findOne({ where: whereClause });
            return invalidToken;
        } catch (error) {
            throw error;
        }
    }

    async deleteInvalidToken(accessToken, refreshToken) {
        try {
            const result = await InvalidTokens.destroy({ where: { accessToken, refreshToken } });
            return result;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new InvalidTokensController();
