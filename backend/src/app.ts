import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import env from './config/env';
import routes from './routes';
import { errorHandler, notFound } from './middlewares/errorHandler';

const app: Express = express();

// Security middlewares
app.use(helmet());

// CORS — supports "*" (reflect any origin), comma-separated list, or single origin
const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean);
const allowAll = allowedOrigins.includes('*');

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (curl, mobile apps, server-to-server)
      if (!origin) return callback(null, true);
      if (allowAll) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Allow all *.vercel.app previews by default when only production URL is set
      if (allowedOrigins.some((o) => o.includes('.vercel.app')) && origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      callback(new Error(`CORS: Origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

// Rate limiting — exempt healthcheck probes so platform monitors don't eat the window.
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many requests from this IP, please try again later',
  skip: (req) => req.path.startsWith(env.API_PREFIX + '/health'),
});
app.use(limiter);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Routes
app.use(env.API_PREFIX, routes);

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;
