'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('startup_posts', 'comments_enabled', {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('startup_posts', 'comments_enabled');
    }
};
