'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

    const table = await queryInterface.describeTable('startup_posts');

    if (!table.comments_enabled) {
      await queryInterface.addColumn('startup_posts', 'comments_enabled', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('startup_posts');

    if (table.comments_enabled) {
      await queryInterface.removeColumn('startup_posts', 'comments_enabled');
    }
  }
};