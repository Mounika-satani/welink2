'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {

    const table = await queryInterface.describeTable('startup_posts');

    // 1️⃣ Add columns only if they don't exist
    const columnsToAdd = [
      { name: 'media_url', type: Sequelize.TEXT },
      { name: 'media_type', type: Sequelize.STRING },
      { name: 'thumbnail_url', type: Sequelize.TEXT },
      { name: 'post_type', type: Sequelize.STRING, defaultValue: 'UPDATE' },
      { name: 'demo_link', type: Sequelize.TEXT },
      { name: 'external_link', type: Sequelize.TEXT }
    ];

    for (const column of columnsToAdd) {
      if (!table[column.name]) {
        await queryInterface.addColumn('startup_posts', column.name, {
          type: column.type,
          defaultValue: column.defaultValue || null
        });
      }
    }

    // 2️⃣ Migrate data only if startup_media exists
    try {
      const [mediaItems] = await queryInterface.sequelize.query(
        "SELECT * FROM startup_media"
      );

      if (mediaItems && mediaItems.length > 0) {
        const postsToInsert = mediaItems.map(item => ({
          id: item.id,
          startup_id: item.startup_id,
          media_url: item.media_url,
          media_type: item.type,
          thumbnail_url: item.thumbnail_url,
          status: item.status,
          post_type: 'UPDATE',
          created_at: item.created_at,
          updated_at: item.updated_at
        }));

        await queryInterface.bulkInsert('startup_posts', postsToInsert);
      }

      await queryInterface.dropTable('startup_media');

    } catch (error) {
      console.log('startup_media does not exist. Skipping migration.');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // keep your existing down logic
  }
};