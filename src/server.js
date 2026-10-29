require('dotenv').config();

const app = require('./app');
const { sequelize } = require('./models');

const PORT = Number(process.env.APP_PORT || 3000);

async function start() {
  try {
    await sequelize.authenticate();
    console.log('[db]  connected to', process.env.DB_NAME, 'at', process.env.DB_HOST);
  } catch (err) {
    console.error('[db]  connection failed:', err.message);
    process.exit(1);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[app] Alumni Tracking System on http://localhost:${PORT}`);
    console.log(`[app] Swagger UI            on http://localhost:${PORT}/api/swagger`);
  });
}

start();
