'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('categories', 'type', {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: 'INDUSTRY',
            comment: 'Type of category: INDUSTRY, BANNER, ADVERTISEMENT'
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('categories', 'type');
    }
};
