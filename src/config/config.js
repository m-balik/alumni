// Used by sequelize-cli (migrations, seeders) AND by the app itself.
// Every value comes from .env — no password is ever written here.
require('dotenv').config();

const base = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  dialect: 'postgres',
  logging: process.env.SQL_LOG === 'true' ? console.log : false,
  define: {
    underscored: true,   // created_at, user_id ... as written in ddd.md
    freezeTableName: false,
  },
};

module.exports = {
  development: base,
  test: { ...base, database: `${process.env.DB_NAME}_test` },
  production: { ...base, logging: false },
};
