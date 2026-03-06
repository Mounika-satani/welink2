'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('startups', 'banner_url', {
            type: Sequelize.TEXT,
            allowNull: true,
            defaultValue: null,
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('startups', 'banner_url');
    }
};
