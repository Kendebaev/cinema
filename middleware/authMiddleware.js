const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_998877';

// Middleware to extract and verify JWT
function authenticateJWT(req, res, next) {
    let token = null;

    // 1. Check Authorization Header (Standard for API clients)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }
    // 2. Check Cookie (For standard EJS page navigation)
    else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token) {
        req.user = null;
        res.locals.user = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        res.locals.user = decoded;
        next();
    } catch (err) {
        // Clear invalid token cookie
        res.clearCookie('token');
        req.user = null;
        res.locals.user = null;
        next();
    }
}

// Middleware to protect routes (require authentication)
function isAuthenticated(req, res, next) {
    if (req.user) {
        return next();
    }

    // Check if it's an API route or resource route
    if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/resource')) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required. Access denied.'
        });
    }

    // Redirect to login for page views
    return res.redirect('/login');
}

// Middleware to require admin access
function isAdmin(req, res, next) {
    if (req.user && req.user.role === 'admin') {
        return next();
    }

    if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/resource')) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin role required.'
        });
    }

    return res.status(403).render('404');
}

function isOwner(req, res, next) {
    return next();
}

module.exports = { authenticateJWT, isAuthenticated, isAdmin, isOwner };
