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
app.use(
  cors({
    origin: env.CORS_ORIGIN.split(','),
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many requests from this IP, please try again later',
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
