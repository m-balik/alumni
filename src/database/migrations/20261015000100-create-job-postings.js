'use strict';

/**
 * Week 06 — a change travels as a NEW migration. The old ones already ran everywhere.
 * one-to-many: job_postings.user_id -> users.id
 * The delete rule is a decision: RESTRICT (see ddd.md).
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('job_postings', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      title: { type: Sequelize.STRING(160), allowNull: false },
      company: { type: Sequelize.STRING(160), allowNull: false },
      location: { type: Sequelize.STRING(120), allowNull: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      is_open: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });
    await queryInterface.addIndex('job_postings', ['user_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('job_postings');
  },
};
