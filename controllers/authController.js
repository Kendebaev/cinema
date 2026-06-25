const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_998877';

function generateToken(user) {
    return jwt.sign(
        {
            id: user._id,
            username: user.username,
            email: user.email,
            phone: user.phone,
            role: user.role || 'user'
        },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
}

// GET /login
exports.getLogin = (req, res) => {
    if (req.user) {
        return res.redirect('/profile');
    }
    res.render('login', { error: null, success: null });
};

// GET /register
exports.getRegister = (req, res) => {
    if (req.user) {
        return res.redirect('/profile');
    }
    res.render('register', { error: null });
};

// POST /register
exports.postRegister = async (req, res, next) => {
    try {
        const { username, email, phone, password } = req.body;

        // Check if username already taken
        const existingUsername = await User.findByUsername(username);
        if (existingUsername) {
            if (req.xhr || req.headers.accept?.includes('json')) {
                return res.status(400).json({ success: false, message: 'Username is already taken' });
            }
            return res.render('register', { error: 'Username is already taken' });
        }

        // Check if email already registered
        const existingEmail = await User.findByEmail(email);
        if (existingEmail) {
            if (req.xhr || req.headers.accept?.includes('json')) {
                return res.status(400).json({ success: false, message: 'Email is already registered' });
            }
            return res.render('register', { error: 'Email is already registered' });
        }

        const result = await User.create(username, email, phone, password);
        const createdUser = await User.findById(result.insertedId);

        // Generate JWT token
        const token = generateToken(createdUser);

        // API Response
        if (req.xhr || req.headers.accept?.includes('json')) {
            return res.status(201).json({
                success: true,
                message: 'Registration successful!',
                token,
                user: {
                    id: createdUser._id,
                    username: createdUser.username,
                    email: createdUser.email,
                    phone: createdUser.phone,
                    role: createdUser.role
                }
            });
        }

        // Browser response: Set JWT cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: false, // Set to true in production with HTTPS
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        res.redirect('/profile');
    } catch (err) {
        next(err);
    }
};

// POST /login
exports.postLogin = async (req, res, next) => {
    try {
        const { username, password } = req.body;

        // Find user
        const user = await User.findByUsername(username);
        if (!user) {
            if (req.xhr || req.headers.accept?.includes('json')) {
                return res.status(401).json({ success: false, message: 'Invalid username or password' });
            }
            return res.render('login', { error: 'Invalid username or password', success: null });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            if (req.xhr || req.headers.accept?.includes('json')) {
                return res.status(401).json({ success: false, message: 'Invalid username or password' });
            }
            return res.render('login', { error: 'Invalid username or password', success: null });
        }

        // Generate token
        const token = generateToken(user);

        // API Response
        if (req.xhr || req.headers.accept?.includes('json')) {
            return res.status(200).json({
                success: true,
                message: 'Login successful!',
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    phone: user.phone,
                    role: user.role
                }
            });
        }

        // Browser response: Set JWT cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            maxAge: 24 * 60 * 60 * 1000
        });

        res.redirect('/profile');
    } catch (err) {
        next(err);
    }
};

// GET /logout
exports.logout = (req, res) => {
    res.clearCookie('token');
    
    // Clear session for compatibility if used
    if (req.session) {
        req.session.destroy((err) => {
            if (err) console.error('Logout session destroy error:', err);
            res.redirect('/');
        });
    } else {
        res.redirect('/');
    }
};

// POST /delete-account
exports.deleteAccount = async (req, res, next) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        await User.deleteById(req.user.id);
        res.clearCookie('token');

        if (req.session) {
            req.session.destroy((err) => {
                if (err) console.error('Error destroying session:', err);
                res.redirect('/');
            });
        } else {
            res.redirect('/');
        }
    } catch (err) {
        next(err);
    }
};

// GET /profile
exports.getProfile = async (req, res, next) => {
    try {
        if (!req.user || !req.user.id) {
            if (req.xhr || req.headers.accept?.includes('json')) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            return res.redirect('/login');
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            if (req.xhr || req.headers.accept?.includes('json')) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            return res.status(404).render('404');
        }

        const Booking = require('../models/Booking');
        const bookings = await Booking.getUserBookings(user._id);

        if (req.xhr || req.headers.accept?.includes('json')) {
            return res.status(200).json({
                success: true,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    phone: user.phone,
                    role: user.role
                },
                bookings
            });
        }

        res.render('profile', { user, bookings });
    } catch (err) {
        next(err);
    }
};

