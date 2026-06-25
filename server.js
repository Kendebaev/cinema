require('dotenv').config();

const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo').default || require('connect-mongo');
const path = require('path');
const { connectDB, closeDB } = require('./config/db');
const { authenticateJWT } = require('./middleware/authMiddleware');

// Import routes
const authRoutes = require('./routes/authRoutes');
const movieRoutes = require('./routes/movieRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const contactRoutes = require('./routes/contactRoutes');
const adminRoutes = require('./routes/adminRoutes');
const resourceRoutes = require('./routes/resourceRoutes');

const app = express();

// Prometheus Metrics
const client = require('prom-client');
client.collectDefaultMetrics();

app.get('/metrics', async (req, res) => {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
});

const MONGO_URL = process.env.MONGO_URI;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files & body parsers
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser()); // Enable cookie parsing for JWT

// Custom logger middleware
app.use((req, res, next) => {
  console.log(`[DEBUG] ${req.method} ${req.url}`);
  next();
});

// Session configuration (kept for backwards compatibility with any stores)
app.use(session({
  secret: process.env.SESSION_SECRET || 'cinema-secret-key-2024',
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({
    mongoUrl: MONGO_URL,
    dbName: 'cinema',
    collectionName: 'sessions'
  }),
  cookie: {
    httpOnly: true,
    secure: false,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Apply JWT authentication globally
app.use(authenticateJWT);

// Make user available to EJS views
app.use((req, res, next) => {
  if (req.user) {
    res.locals.user = req.user;
  } else if (req.session && req.session.user) {
    res.locals.user = req.session.user;
  } else {
    res.locals.user = null;
  }
  next();
});

// ===== MOUNT ROUTES =====

// Page routes
app.get('/', (req, res) => {
  res.render('home');
});

app.get('/about', (req, res) => {
  res.render('about');
});

app.use('/', authRoutes);
app.use('/', movieRoutes);
app.use('/', bookingRoutes);
app.use('/', contactRoutes);
app.use('/admin', adminRoutes);
app.use('/', resourceRoutes); // Expose /resource and /resource/:id

// API Info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    project: 'Cinema Ticket Booking System',
    description: 'Backend API for cinema seat booking with MongoDB',
    version: '2.5.0',
    entity: 'Cinema Seats / Movies',
    database: 'MongoDB',
    routes: {
      pages: ['/', '/about', '/contact', '/search', '/movies', '/buy', '/profile', '/my-bookings', '/admin/dashboard'],
      api: {
        'POST /register': 'Register a new user (JWT)',
        'POST /login': 'Log in and get JWT token',
        'GET /profile': 'Retrieve user profile (JWT)',
        'GET /resource': 'Get movie resources (supports search, genre filter, pagination)',
        'POST /resource': 'Create a new movie resource (JWT Admin)',
        'PUT /resource/:id': 'Update a movie resource (JWT Admin)',
        'DELETE /resource/:id': 'Delete a movie resource (JWT Admin)'
      }
    }
  });
});

// 404 handler for API/Resource routes
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API route not found',
    statusCode: 404
  });
});

app.use('/resource', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Resource endpoint not found',
    statusCode: 404
  });
});

// 404 handler for page routes
app.use((req, res) => {
  res.status(404).render('404');
});

// ===== GLOBAL ERROR HANDLING MIDDLEWARE =====
app.use((err, req, res, next) => {
  console.error('[Global Error Handler]:', err);
  
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  // Return JSON for APIs or XHR requests
  if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/resource') || req.xhr || req.headers.accept?.includes('json')) {
    return res.status(statusCode).json({
      success: false,
      message,
      statusCode
    });
  }

  // Render 404 page for standard views (or you can create a custom error page)
  res.status(statusCode).render('404');
});

// ===== START SERVER =====
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();

// Error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('SIGINT', async () => {
  console.log('\nShutting down server...');
  try {
    await closeDB();
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
});