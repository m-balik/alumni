const { DataTypes, Model } = require('sequelize');
const { ValidationFailed } = require('../middleware/errors');

/** Announcement — week 04 homework: a second model, same shape, two controllers. */
module.exports = (sequelize) => {
  class Announcement extends Model {
    static async all() {
      return Announcement.findAll({ order: [['id', 'DESC']] });
    }

    static async oneById(id) {
      const numericId = Number(id);
      if (!Number.isInteger(numericId)) return null;
      return Announcement.findByPk(numericId);
    }

    static async create_(data) {
      Announcement.validate_(data);
      return Announcement.create(Announcement.pick_(data));
    }

    static async update_(id, data) {
      const row = await Announcement.oneById(id);
      if (!row) return null;
      const patch = Announcement.pick_(data);
      if (patch.title !== undefined && !patch.title) {
        throw new ValidationFailed('title cannot be empty');
      }
      await row.update(patch);
      return row;
    }

    static async delete_(id) {
      const row = await Announcement.oneById(id);
      if (!row) return false;
      await row.destroy();
      return true;
    }

    static validate_(data = {}) {
      const errors = [];
      if (!data.title || !String(data.title).trim()) errors.push('title is required');
      if (!data.body || !String(data.body).trim()) errors.push('body is required');
      if (errors.length) throw new ValidationFailed(errors.join('; '));
    }

    static pick_(data = {}) {
      const out = {};
      if (data.title !== undefined) out.title = String(data.title).trim();
      if (data.body !== undefined) out.body = String(data.body).trim();
      const published = data.isPublished ?? data.is_published;
      if (published !== undefined) {
        out.is_published = published === true || published === 'true' || published === 'on';
      }
      return out;
    }

    toJSON() {
      const v = { ...this.get() };
      return {
        id: v.id,
        title: v.title,
        body: v.body,
        isPublished: v.is_published,
        createdAt: v.created_at,
      };
    }
  }

  Announcement.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      title: { type: DataTypes.STRING(160), allowNull: false },
      body: { type: DataTypes.TEXT, allowNull: false },
      is_published: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    {
      sequelize,
      modelName: 'announcement',
      tableName: 'announcements',
      underscored: true,
      timestamps: true,
    }
  );

  return Announcement;
};
