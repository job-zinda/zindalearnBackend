import './config/env.js';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

// Route imports
import authRoutes from './routes/auth.routes.js';
import courseRoutes from './routes/courses.js';
import enrollmentRoutes from './routes/enrollments.js';
import messageRoutes from './routes/messages.js';
import instructorRoutes from './routes/instructor.routes.js';
import adminRoutes from './routes/admin.routes.js';
import bannerRoutes from './routes/banner.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import videoRoutes from './routes/video.routes.js';
import liveClassRoutes from './modules/liveClasses/routes/liveClass.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import studentProgressRoutes from './routes/studentProgress.routes.js';
import certificateRoutes from './routes/certificate.routes.js';
import studentSettingsRoutes from './routes/studentSettings.routes.js';
import publicRoutes from './routes/public.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import supportRoutes from './routes/support.routes.js';
import errorMiddleware from './middleware/errorMiddleware.js';
import { checkMaintenance } from './middleware/maintenanceMode.js';
import { swaggerSetup } from './swagger.js';

const app = express();

// Trust reverse proxy for accurate IP logging and rate limiting
app.set('trust proxy', 1);

// Security Middleware
app.use(helmet());
app.use(compression());

// Global Rate Limiter
// NOTE: placed AFTER CORS so OPTIONS preflights bypass it
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: 'Too many requests from this IP, please try again later.'
});

// CORS — build allowed origins from env at runtime so no redeploy needed when domain changes
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  next();
});

const buildAllowedOrigins = () => {
  const origins = new Set();

  // Primary production origins from env
  if (process.env.FRONTEND_URL) origins.add(process.env.FRONTEND_URL);
  if (process.env.APP_URL)      origins.add(process.env.APP_URL);

  // Auto-add www <-> non-www variants for each origin
  origins.forEach((url) => {
    try {
      const parsed = new URL(url);
      if (parsed.hostname.startsWith('www.')) {
        // Add non-www version
        parsed.hostname = parsed.hostname.slice(4);
        origins.add(parsed.origin);
      } else {
        // Add www version
        parsed.hostname = 'www.' + parsed.hostname;
        origins.add(parsed.origin);
      }
    } catch (_) { /* ignore invalid URLs */ }
  });

  // Local dev origins — always allowed so `npm run dev` can hit this backend
  // regardless of which NODE_ENV this deployment runs under. Safe to keep on
  // in production: CORS only gates browser JS, and every route still requires
  // a valid bearer token.
  ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'].forEach(o => origins.add(o));

  return origins;
};

const corsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server requests (no origin header) e.g. Postman, curl, health checks
    if (!origin) return callback(null, true);

    const allowedOrigins = buildAllowedOrigins();

    if (allowedOrigins.has(origin)) {
      callback(null, true);
    } else {
      // Use callback(null, false) NOT callback(new Error(...))
      // Throwing an Error here causes Express to return HTTP 500 via errorMiddleware.
      // Returning false causes the cors package to send a proper 403 CORS response.
      console.warn(`[CORS] Blocked origin: ${origin}`);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

app.use(cors(corsOptions));

// Explicitly handle OPTIONS preflight for all routes
// This ensures preflight doesn't get blocked before route handlers run
app.options('*', cors(corsOptions));

// Rate limiter — placed after CORS so OPTIONS preflights are served without consuming quota
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Global Maintenance Mode check
app.use('/api/', checkMaintenance);

// HTTP request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/instructor', instructorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/banners', bannerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/live-classes', liveClassRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/student/progress', studentProgressRoutes);
app.use('/api/student/certificates', certificateRoutes);
app.use('/api/student/settings', studentSettingsRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/support', supportRoutes);

// Swagger Documentation
swaggerSetup(app);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Zinda Learn API is running',
    env: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use(errorMiddleware);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

export default app;
