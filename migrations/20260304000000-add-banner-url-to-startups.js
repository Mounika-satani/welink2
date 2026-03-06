'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {

        const table = await queryInterface.describeTable('startups');

        if (!table.banner_url) {
            await queryInterface.addColumn('startups', 'banner_url', {
                type: Sequelize.TEXT,
                allowNull: true,
                defaultValue: null,
            });
        }

    },

    down: async (queryInterface, Sequelize) => {

        const table = await queryInterface.describeTable('startups');

        if (table.banner_url) {
            await queryInterface.removeColumn('startups', 'banner_url');
        }

    }
};