module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('startup_industries', {
      startup_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'startups',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      category_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'categories',
          key: 'id'
        },
        onDelete: 'CASCADE'
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('startup_industries');
  },
};
