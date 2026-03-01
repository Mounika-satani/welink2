'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // 1. Add new columns to startup_posts
        await queryInterface.addColumn('startup_posts', 'media_url', {
            type: Sequelize.TEXT,
        });
        await queryInterface.addColumn('startup_posts', 'media_type', {
            type: Sequelize.STRING,
        });
        await queryInterface.addColumn('startup_posts', 'thumbnail_url', {
            type: Sequelize.TEXT,
        });
        await queryInterface.addColumn('startup_posts', 'post_type', {
            type: Sequelize.STRING,
            defaultValue: 'UPDATE',
        });
        await queryInterface.addColumn('startup_posts', 'demo_link', {
            type: Sequelize.TEXT,
        });
        await queryInterface.addColumn('startup_posts', 'external_link', {
            type: Sequelize.TEXT,
        });

        // 2. Migrate data from startup_media to startup_posts if startup_media exists
        try {
            const [mediaItems] = await queryInterface.sequelize.query(
                'SELECT * FROM startup_media'
            );

            if (mediaItems && mediaItems.length > 0) {
                const postsToInsert = mediaItems.map(item => ({
                    id: item.id, // Keeping ID might be risky if there are collisions, but usually UUIDs are safe
                    startup_id: item.startup_id,
                    media_url: item.media_url,
                    media_type: item.type, // Map 'type' to 'media_type'
                    thumbnail_url: item.thumbnail_url,
                    status: item.status,
                    post_type: 'UPDATE', // Default to update
                    created_at: item.created_at,
                    updated_at: item.updated_at
                }));

                await queryInterface.bulkInsert('startup_posts', postsToInsert);
            }
        } catch (error) {
            console.log('No existing startup_media table or data to migrate.');
        }

        // 3. Drop startup_media table
        await queryInterface.dropTable('startup_media');
    },

    down: async (queryInterface, Sequelize) => {
        // To revert: recreate startup_media and remove columns from startup_posts
        await queryInterface.createTable('startup_media', {
            id: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4
            },
            startup_id: {
                type: Sequelize.UUID,
                allowNull: false,
            },
            type: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            media_url: {
                type: Sequelize.TEXT,
                allowNull: false,
            },
            thumbnail_url: {
                type: Sequelize.TEXT,
            },
            status: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: 'PENDING',
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

        // Optionally move data back, but down migrations are often best-effort

        await queryInterface.removeColumn('startup_posts', 'media_url');
        await queryInterface.removeColumn('startup_posts', 'media_type');
        await queryInterface.removeColumn('startup_posts', 'thumbnail_url');
        await queryInterface.removeColumn('startup_posts', 'post_type');
        await queryInterface.removeColumn('startup_posts', 'demo_link');
        await queryInterface.removeColumn('startup_posts', 'external_link');
    }
};
