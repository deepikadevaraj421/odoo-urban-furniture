const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Route imports
const authRoutes = require('./modules/auth/auth.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const accountantRoutes = require('./modules/accountant/accountant.routes');
const customerRoutes = require('./modules/customer/customer.routes');

// Middleware imports
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ==============================================
// GLOBAL MIDDLEWARE
// ==============================================

// Security headers
app.use(helmet());

// CORS — allow frontend dev server
app.use(cors({
  origin: process.env.NODE_ENV === 'development'
    ? ['http://localhost:5173', 'http://localhost:3000']
    : process.env.FRONTEND_URL,
  credentials: true,
}));

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// ==============================================
// HEALTH CHECK
// ==============================================

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Urban Furniture API is running.',
    timestamp: new Date().toISOString(),
  });
});

// ==============================================
// API ROUTES
// ==============================================

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/accountant', accountantRoutes);
app.use('/api/customer', customerRoutes);

// ==============================================
// 404 HANDLER
// ==============================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

// ==============================================
// GLOBAL ERROR HANDLER
// ==============================================

app.use(errorHandler);

module.exports = app;
