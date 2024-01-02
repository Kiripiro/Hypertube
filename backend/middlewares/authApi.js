const jwt = require("jsonwebtoken");
const InvalidTokensController = require('../controllers/invalidTokenController');

module.exports = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).send({ error: "No token provided" });
        }
        const accessToken = authHeader.split(' ')[1];
        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
        console.log(decoded);
        req.user = decoded;
        next();
    } catch (error) {
        console.error("error = " + error);
        if (error.name === "TokenExpiredError")
            return res.status(401).send({ error: "Token expired" });
        res.status(400).send({ error: "Invalid token" });
    }
};