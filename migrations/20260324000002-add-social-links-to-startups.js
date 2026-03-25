'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('startups', 'linkedin_url', {
            type: Sequelize.TEXT,
            allowNull: true,
        });
        await queryInterface.addColumn('startups', 'twitter_url', {
            type: Sequelize.TEXT,
            allowNull: true,
        });
        await queryInterface.addColumn('startups', 'instagram_url', {
            type: Sequelize.TEXT,
            allowNull: true,
        });
        await queryInterface.addColumn('startups', 'facebook_url', {
            type: Sequelize.TEXT,
            allowNull: true,
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('startups', 'linkedin_url');
        await queryInterface.removeColumn('startups', 'twitter_url');
        await queryInterface.removeColumn('startups', 'instagram_url');
        await queryInterface.removeColumn('startups', 'facebook_url');
    },
};
