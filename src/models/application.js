const { DataTypes, Model, UniqueConstraintError, ForeignKeyConstraintError } = require('sequelize');
const { Conflict, NotFound, ValidationFailed, isForeignKeyError, isUniqueError } = require('../middleware/errors');

/**
 * Application — the join table of the many-to-many between users and job postings.
 * One row per (user, posting). UNIQUE (user_id, job_posting_id): nobody applies twice.
 */
const STATUSES = ['applied', 'interview', 'offer', 'rejected'];

module.exports = (sequelize) => {
  class Application extends Model {
    /** who applied to this posting */
    static async applicantsOf(jobPostingId) {
      const id = Number(jobPostingId);
      if (!Number.isInteger(id)) return null;
      return Application.findAll({
        where: { job_posting_id: id },
        include: [{ association: 'applicant' }],
        order: [['id', 'ASC']],
      });
    }

    /** where this user applied */
    static async applicationsOf(userId) {
      const id = Number(userId);
      if (!Number.isInteger(id)) return null;
      return Application.findAll({
        where: { user_id: id },
        include: [{ association: 'posting' }],
        order: [['id', 'ASC']],
      });
    }

    static async apply(jobPostingId, userId, status = 'applied') {
      if (!Number.isInteger(Number(userId))) {
        throw new ValidationFailed('userId is required and must be a number');
      }
      if (status && !STATUSES.includes(status)) {
        throw new ValidationFailed(`status must be one of: ${STATUSES.join(', ')}`);
      }
      try {
        return await Application.create({
          job_posting_id: Number(jobPostingId),
          user_id: Number(userId),
          status: status || 'applied',
        });
      } catch (err) {
        // the database refuses the second time — the controller answers 409
        if (err instanceof UniqueConstraintError || isUniqueError(err)) {
          throw new Conflict('This user has already applied to this posting');
        }
        if (err instanceof ForeignKeyConstraintError || isForeignKeyError(err)) {
          throw new NotFound('No such user or job posting');
        }
        throw err;
      }
    }

    static async withdraw(jobPostingId, userId) {
      const row = await Application.findOne({
        where: { job_posting_id: Number(jobPostingId), user_id: Number(userId) },
      });
      if (!row) return false;
      await row.destroy();
      return true;
    }

    toJSON() {
      const v = { ...this.get() };
      return {
        id: v.id,
        userId: v.user_id,
        jobPostingId: v.job_posting_id,
        status: v.status,
        createdAt: v.created_at,
        ...(v.applicant ? { applicant: v.applicant } : {}),
        ...(v.posting ? { posting: v.posting } : {}),
      };
    }
  }

  Application.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      job_posting_id: { type: DataTypes.INTEGER, allowNull: false },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'applied',
        validate: { isIn: [STATUSES] },
      },
    },
    {
      sequelize,
      modelName: 'application',
      tableName: 'applications',
      underscored: true,
      timestamps: true,
      indexes: [{ unique: true, fields: ['user_id', 'job_posting_id'] }],
    }
  );

  Application.STATUSES = STATUSES;
  return Application;
};
