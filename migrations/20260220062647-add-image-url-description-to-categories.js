'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('categories');

    if (!tableDesc.image_url) {
      await queryInterface.addColumn('categories', 'image_url', {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'S3 URL for the category cover/banner image',
      });
    }

    if (!tableDesc.description) {
      await queryInterface.addColumn('categories', 'description', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('categories');

    if (tableDesc.image_url) {
      await queryInterface.removeColumn('categories', 'image_url');
    }

    if (tableDesc.description) {
      await queryInterface.removeColumn('categories', 'description');
    }
  },
};
