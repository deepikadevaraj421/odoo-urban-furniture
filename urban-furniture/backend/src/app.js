const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Existing Route imports
const authRoutes = require('./modules/auth/auth.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const accountantRoutes = require('./modules/accountant/accountant.routes');
const customerRoutes = require('./modules/customer/customer.routes');

// ERP Route imports
const contactRoutes = require('./modules/contact/contact.routes');
const productRoutes = require('./modules/product/product.routes');
const accountRoutes = require('./modules/account/account.routes');
const journalRoutes = require('./modules/journal/journal.routes');
const salesRoutes = require('./modules/sales/sales.routes');
const purchaseRoutes = require('./modules/purchase/purchase.routes');
const paymentRoutes = require('./modules/payment/payment.routes');
const analyticsRoutes = require('./modules/analytics/analytics.routes');
const reportRoutes = require('./modules/report/report.routes');

// Middleware imports
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ==============================================
// CORS CONFIGURATION
// ==============================================
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
  'http://127.0.0.1:3000',
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g., Postman, curl, server-to-server)
    if (!origin) return callback(null, true);

    // Allow localhost / 127.0.0.1 on any port or any origin from allowed list
    const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    if (isLocalhost || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 204,
};

// CORS middleware registered BEFORE all API routes and security headers
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Security headers
app.use(helmet({ crossOriginResourcePolicy: false }));

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

// ERP API Routes
app.use('/api/contacts', contactRoutes);
app.use('/api/products', productRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api', journalRoutes);       // handles /api/journals and /api/journal-entries
app.use('/api', salesRoutes);         // handles /api/sales-orders and /api/customer-invoices
app.use('/api', purchaseRoutes);      // handles /api/purchase-orders and /api/vendor-bills
app.use('/api/payments', paymentRoutes);
app.use('/api', analyticsRoutes);     // handles /api/analytic-accounts and /api/budgets
app.use('/api/reports', reportRoutes);

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
