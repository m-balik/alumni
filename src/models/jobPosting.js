const { DataTypes, Model, ForeignKeyConstraintError } = require('sequelize');
const { ValidationFailed, NotFound, isForeignKeyError } = require('../middleware/errors');

/**
 * JobPosting — one user has many postings, each posting belongs to exactly one user.
 * user_id is a foreign key: the database refuses a posting for a user who does not exist.
 */
module.exports = (sequelize) => {
  class JobPosting extends Model {
    static async all() {
      return JobPosting.findAll({
        order: [['id', 'ASC']],
        include: [{ association: 'owner', required: false }],
      });
    }

    static async oneById(id) {
      const numericId = Number(id);
      if (!Number.isInteger(numericId)) return null;
      return JobPosting.findByPk(numericId, {
        include: [{ association: 'owner', required: false }],
      });
    }

    /** the postings of one user — the URL says whose they are */
    static async allForUser(userId) {
      const numericId = Number(userId);
      if (!Number.isInteger(numericId)) return null;
      return JobPosting.findAll({ where: { user_id: numericId }, order: [['id', 'ASC']] });
    }

    static async createForUser(userId, data) {
      JobPosting.validate_(data);
      try {
        return await JobPosting.create({ ...JobPosting.pick_(data), user_id: Number(userId) });
      } catch (err) {
        if (err instanceof ForeignKeyConstraintError || isForeignKeyError(err)) {
          throw new NotFound(`User ${userId} not found`);
        }
        throw err;
      }
    }

    static async update_(id, data) {
      const posting = await JobPosting.oneById(id);
      if (!posting) return null;
      await posting.update(JobPosting.pick_(data));
      return posting;
    }

    static async delete_(id) {
      const posting = await JobPosting.oneById(id);
      if (!posting) return false;
      await posting.destroy(); // its applications go with it (CASCADE)
      return true;
    }

    static validate_(data = {}) {
      const errors = [];
      if (!data.title || !String(data.title).trim()) errors.push('title is required');
      if (!data.company || !String(data.company).trim()) errors.push('company is required');
      if (errors.length) throw new ValidationFailed(errors.join('; '));
    }

    static pick_(data = {}) {
      const out = {};
      if (data.title !== undefined) out.title = String(data.title).trim();
      if (data.company !== undefined) out.company = String(data.company).trim();
      if (data.location !== undefined) out.location = String(data.location).trim() || null;
      if (data.description !== undefined) out.description = String(data.description).trim() || null;
      const open = data.isOpen ?? data.is_open;
      if (open !== undefined) out.is_open = open === true || open === 'true' || open === 'on';
      return out;
    }

    toJSON() {
      const v = { ...this.get() };
      return {
        id: v.id,
        userId: v.user_id,
        title: v.title,
        company: v.company,
        location: v.location,
        description: v.description,
        isOpen: v.is_open,
        createdAt: v.created_at,
        ...(v.owner ? { owner: v.owner } : {}),
      };
    }
  }

  JobPosting.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      title: { type: DataTypes.STRING(160), allowNull: false },
      company: { type: DataTypes.STRING(160), allowNull: false },
      location: { type: DataTypes.STRING(120), allowNull: true },
      description: { type: DataTypes.TEXT, allowNull: true },
      is_open: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    {
      sequelize,
      modelName: 'job_posting',
      tableName: 'job_postings',
      underscored: true,
      timestamps: true,
    }
  );

  return JobPosting;
};
