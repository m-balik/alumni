/**
 * The model layer.
 *
 * Week 03-04: this file held an array and an id counter in memory.
 * Week 05: the array became a database table. Only this layer changed —
 *          the controllers only learned to `await`.
 */
const { Sequelize } = require('sequelize');

const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

const User = require('./user')(sequelize);
const Announcement = require('./announcement')(sequelize);
const JobPosting = require('./jobPosting')(sequelize);
const Application = require('./application')(sequelize);

const db = { sequelize, Sequelize, User, Announcement, JobPosting, Application };

/* ---------- relations (week 06) ---------- */

// one-to-many: one user has many job postings, each posting belongs to one user
User.hasMany(JobPosting, {
  foreignKey: 'user_id',
  as: 'jobs',
  onDelete: 'RESTRICT', // the delete rule, as written in ddd.md
});
JobPosting.belongsTo(User, { foreignKey: 'user_id', as: 'owner' });

// many-to-many: many users apply to many postings, through `applications`
User.belongsToMany(JobPosting, {
  through: Application,
  foreignKey: 'user_id',
  otherKey: 'job_posting_id',
  as: 'appliedPostings',
});
JobPosting.belongsToMany(User, {
  through: Application,
  foreignKey: 'job_posting_id',
  otherKey: 'user_id',
  as: 'applicants',
});

// the join table is also a model of its own (it carries status + created_at)
Application.belongsTo(User, { foreignKey: 'user_id', as: 'applicant' });
Application.belongsTo(JobPosting, { foreignKey: 'job_posting_id', as: 'posting' });
User.hasMany(Application, { foreignKey: 'user_id', as: 'applications', onDelete: 'CASCADE' });
JobPosting.hasMany(Application, { foreignKey: 'job_posting_id', as: 'applications', onDelete: 'CASCADE' });

module.exports = db;
