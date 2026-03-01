'use strict';

/**
 * Drop the legacy `votes` table.
 * All voting is now handled by the `post_votes` table (PostVote model).
 */
module.exports = {
    up: async (queryInterface) => {
        await queryInterface.dropTable('votes');
    },

    down: async (queryInterface, Sequelize) => {
        // Recreate the table in case we need to roll back
        await queryInterface.createTable('votes', {
            id: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
            },
            user_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: { model: 'users', key: 'id' },
            },
            startup_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: { model: 'startups', key: 'id' },
            },
            vote_type: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            created_at: { allowNull: false, type: Sequelize.DATE },
            updated_at: { allowNull: false, type: Sequelize.DATE },
        });

        await queryInterface.addIndex('votes', ['user_id', 'startup_id'], {
            unique: true,
            name: 'votes_user_startup_unique',
        });
    },
};
