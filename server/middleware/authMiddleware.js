const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Unauthorized access." });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Isme user ID hoti hai
        next();
    } catch (err) {
        res.status(401).json({ error: "Token invalid." });
    }
};

module.exports = { protect };