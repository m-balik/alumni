'use strict';

/**
 * many-to-many through a join table: one row per (user, posting).
 * UNIQUE (user_id, job_posting_id) — the same person cannot apply twice;
 * the database refuses, the controller answers 409.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('applications', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      job_posting_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'job_postings', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      // a short list of values, kept as text + a CHECK constraint:
      // a Postgres ENUM type is painful to extend later, a CHECK is one migration
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'applied',
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    await queryInterface.addConstraint('applications', {
      fields: ['user_id', 'job_posting_id'],
      type: 'unique',
      name: 'applications_user_posting_unique',
    });

    await queryInterface.sequelize.query(
      "ALTER TABLE applications ADD CONSTRAINT applications_status_check " +
      "CHECK (status IN ('applied', 'interview', 'offer', 'rejected'));"
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('applications');
  },
};
