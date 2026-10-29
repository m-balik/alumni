/** GET /api/health — the first JSON answer of the term (week 03). */
const { sequelize } = require('../../models');
const { asyncHandler } = require('../../middleware/errors');

exports.health = asyncHandler(async (req, res) => {
  let database = 'up';
  try {
    await sequelize.authenticate();
  } catch (err) {
    database = 'down';
  }
  res.status(200).json({
    status: 'ok',
    uptime: Number(process.uptime().toFixed(2)),
    database,
    timestamp: new Date().toISOString(),
  });
});
