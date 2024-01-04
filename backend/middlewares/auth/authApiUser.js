const jwt = require("jsonwebtoken");
const InvalidTokensController = require('../../controllers/invalidTokenController');

module.exports = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).send({ error: "No token provided" });
        }
        const accessToken = authHeader.split(' ')[1];
        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
        if (decoded.role == 2 || decoded.role == 1) {
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