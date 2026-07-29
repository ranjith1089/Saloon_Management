import app from './app';
import env from './config/env';
import prisma from './config/database';
import logger from './utils/logger';

const server = app.listen(env.PORT, '0.0.0.0', () => {
  logger.info(`🚀 Server running on port ${env.PORT}`);
  logger.info(`📖 API prefix: ${env.API_PREFIX}`);
  logger.info(`🏥 Health check: ${env.API_PREFIX}/health`);
  logger.info(`🌍 Environment: ${env.NODE_ENV}`);
});

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down gracefully...');
  server.close(async () => {
    await prisma.$disconnect();
    logger.info('Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});
