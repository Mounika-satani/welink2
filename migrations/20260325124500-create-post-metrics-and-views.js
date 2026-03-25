'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // 1. Post Metrics Table
        await queryInterface.createTable('post_metrics', {
            post_id: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID,
                references: {
                    model: 'startup_posts',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            total_views: {
                type: Sequelize.INTEGER,
                defaultValue: 0
            },
            total_upvotes: {
                type: Sequelize.INTEGER,
                defaultValue: 0
            },
            total_downvotes: {
                type: Sequelize.INTEGER,
                defaultValue: 0
            },
            trending_score: {
                type: Sequelize.FLOAT,
                defaultValue: 0
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });

        // 2. Post Views Table
        await queryInterface.createTable('post_views', {
            id: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4
            },
            post_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'startup_posts',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            user_id: {
                type: Sequelize.UUID,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            ip_address: {
                type: Sequelize.STRING
            },
            user_agent: {
                type: Sequelize.TEXT
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });

        // Add index for post_views to help with tracking cooldowns
        await queryInterface.addIndex('post_views', ['post_id', 'user_id', 'ip_address', 'created_at'], {
            name: 'post_views_dedup_idx'
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('post_views');
        await queryInterface.dropTable('post_metrics');
    }
};
