'use strict';

/** Week 05 — the first migration. Tables change only through migrations. */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      name: { type: Sequelize.STRING(120), allowNull: false },
      email: { type: Sequelize.STRING(160), allowNull: false, unique: true },
      is_alumni: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      graduation_year: { type: Sequelize.INTEGER, allowNull: true },
      department: { type: Sequelize.STRING(120), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });
    await queryInterface.addIndex('users', ['is_alumni']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('users');
  },
};
