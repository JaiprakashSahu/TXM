const app = require('./app');
const env = require('./config/env');
const connectDB = require('./config/database');
const seedAdmin = require('./utils/seedAdmin');

const startServer = async () => {
  await connectDB();

  if (env.nodeEnv !== 'test') {
    await seedAdmin();
  }

  app.listen(env.port, () => {
    logger.info(`Server running in ${env.nodeEnv} mode on port ${env.port}`);
  });
};

startServer().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
