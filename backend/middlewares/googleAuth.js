module.exports = (req, res, next) => {
    try {
        const cookiesString = req.header("cookie") || "";
        const cookiesSplit = cookiesString.split('; ');
        const cookies = new Map();
        cookiesSplit.forEach(pair => {
            const [key, value] = pair.split('=');
            cookies.set(key, value);
        });

        const g_csrf_token = cookies.get("g_csrf_token");
        if (!g_csrf_token) {
            return res.status(401).send({ error: 'Missing cookie: g_csrf_token' });
        }
        if (!req.body.g_csrf_token) {
            return res.status(401).send({ error: 'Missing body param: g_csrf_token' });
        }
        if (g_csrf_token !== req.body.g_csrf_token) {
            return res.status(401).send({ error: 'Invalid g_csrf_token' });
        }
        next();
    } catch (error) {
        console.log("error = " + error);
        if (error.name === "TokenExpiredError")
            return res.status(401).send({ error: "Token expired" });
        res.status(400).send({ error: "Invalid token" });
    }
};