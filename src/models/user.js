const { DataTypes, Model, UniqueConstraintError, ForeignKeyConstraintError } = require('sequelize');
const { ValidationFailed, Conflict, isForeignKeyError, isUniqueError } = require('../middleware/errors');

/**
 * User — "an alumnus is a user who graduated".
 * Being an alumnus is a field (is_alumni, graduation_year), not a separate list.
 *
 * The rules live here, once. The controller only turns a refusal into a status code.
 */
module.exports = (sequelize) => {
  class User extends Model {
    /* ---------- the five functions the controllers use ---------- */

    static async all() {
      return User.findAll({ order: [['id', 'ASC']] });
    }

    static async oneById(id) {
      const numericId = Number(id); // the id in the path is text — make it a number first
      if (!Number.isInteger(numericId)) return null;
      return User.findByPk(numericId);
    }

    /** the user plus their job postings — one answer, two tables (LEFT JOIN) */
    static async oneWithJobs(id) {
      const numericId = Number(id);
      if (!Number.isInteger(numericId)) return null;
      return User.findByPk(numericId, {
        // LEFT JOIN: a user without postings still comes back, with "jobs": []
        include: [{ association: 'jobs', required: false }],
      });
    }

    static async create_(data) {
      User.validate_(data);
      try {
        return await User.create(User.pick_(data));
      } catch (err) {
        if (err instanceof UniqueConstraintError || isUniqueError(err)) {
          throw new Conflict('A user with this email already exists');
        }
        throw err;
      }
    }

    /** PATCH: changes only the fields that were sent */
    static async update_(id, data) {
      const user = await User.oneById(id);
      if (!user) return null;
      const patch = User.pick_(data);
      if (patch.email !== undefined && !User.isEmail_(patch.email)) {
        throw new ValidationFailed('email must be a valid e-mail address');
      }
      if (patch.name !== undefined && !String(patch.name).trim()) {
        throw new ValidationFailed('name cannot be empty');
      }
      try {
        await user.update(patch);
        return user;
      } catch (err) {
        if (err instanceof UniqueConstraintError || isUniqueError(err)) {
          throw new Conflict('A user with this email already exists');
        }
        throw err;
      }
    }

    static async delete_(id) {
      const user = await User.oneById(id);
      if (!user) return false;
      try {
        // the delete rule (ddd.md): RESTRICT — refuse while the user still has postings
        await user.destroy();
      } catch (err) {
        if (err instanceof ForeignKeyConstraintError || isForeignKeyError(err)) {
          throw new Conflict('This user still has job postings. Delete them first.');
        }
        throw err;
      }
      return true;
    }

    /* ---------- the rules ---------- */

    static isEmail_(value) {
      return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
    }

    /** "A user must always have an email" — written once, here. */
    static validate_(data = {}) {
      const errors = [];
      if (!data.name || !String(data.name).trim()) errors.push('name is required');
      if (!data.email) errors.push('email is required');
      else if (!User.isEmail_(data.email)) errors.push('email must be a valid e-mail address');
      if (data.isAlumni === true || data.is_alumni === true) {
        const year = data.graduationYear ?? data.graduation_year;
        if (!year) errors.push('graduationYear is required for an alumnus');
      }
      if (errors.length) throw new ValidationFailed(errors.join('; '));
    }

    /** only these fields may come from the outside */
    static pick_(data = {}) {
      const out = {};
      if (data.name !== undefined) out.name = String(data.name).trim();
      if (data.email !== undefined) out.email = String(data.email).trim().toLowerCase();
      const isAlumni = data.isAlumni ?? data.is_alumni;
      if (isAlumni !== undefined) out.is_alumni = isAlumni === true || isAlumni === 'true' || isAlumni === 'on';
      const year = data.graduationYear ?? data.graduation_year;
      if (year !== undefined) out.graduation_year = year === '' || year === null ? null : Number(year);
      if (data.department !== undefined) out.department = String(data.department).trim() || null;
      return out;
    }

    /** what goes out on the wire */
    toJSON() {
      const v = { ...this.get() };
      return {
        id: v.id,
        name: v.name,
        email: v.email,
        isAlumni: v.is_alumni,
        graduationYear: v.graduation_year,
        department: v.department,
        createdAt: v.created_at,
        ...(v.jobs ? { jobs: v.jobs } : {}),
      };
    }
  }

  User.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true }, // never reused
      name: { type: DataTypes.STRING(120), allowNull: false },
      email: { type: DataTypes.STRING(160), allowNull: false, unique: true },
      is_alumni: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      graduation_year: { type: DataTypes.INTEGER, allowNull: true },
      department: { type: DataTypes.STRING(120), allowNull: true },
    },
    {
      sequelize,
      modelName: 'user',
      tableName: 'users',
      underscored: true,
      timestamps: true,
    }
  );

  return User;
};
