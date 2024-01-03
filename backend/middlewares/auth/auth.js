const jwt = require("jsonwebtoken");
const InvalidTokensController = require('../../controllers/invalidTokenController');

module.exports = (req, res, next) => {
    try {
        const cookiesString = req.header("cookie") || "";
        const cookiesSplit = cookiesString.split('; ');
        const cookies = new Map();
        cookiesSplit.forEach(pair => {
            const [key, value] = pair.split('=');
            cookies.set(key, value);
        });

        const accessToken = cookies.get("accessToken");
        if (!accessToken) {
            const refreshToken = cookies.get("refreshToken");
            if (!refreshToken) {
                return res.status(401).send({ error: 'Missing refreshToken' });
            }
            return res.status(401).send({ error: 'Missing accessToken' });
        }

        if (!InvalidTokensController.findInvalidToken(accessToken, null)) {
            return res.status(403).send({ error: 'Invalid accessToken blacklisted' });
        }
        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
        if (decoded.role == 1) {
            req.user = decoded;
            next();
        } else {
            return res.status(401).send({ error: "You do not have permission to use this endpoint" });
        }
    } catch (error) {
        console.error("error = " + error);
        if (error.name === "TokenExpiredError")
            return res.status(401).send({ error: "Token expired" });
        res.status(400).send({ error: "Invalid token" });
    }
};