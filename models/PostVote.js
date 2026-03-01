const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class PostVote extends Model {
        static associate(models) {
            PostVote.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
            PostVote.belongsTo(models.StartupPost, { foreignKey: 'post_id', as: 'post' });
        }
    }

    PostVote.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        post_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        vote_type: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    }, {
        sequelize,
        modelName: 'PostVote',
        tableName: 'post_votes',
        underscored: true,
        indexes: [
            {
                unique: true,
                fields: ['user_id', 'post_id'],
            },
        ],
        hooks: {
            // After a new vote is cast → recalculate
            afterCreate: async (vote) => {
                await recalculateForPost(sequelize, vote.post_id);
            },
            // After a vote is switched (up→down or down→up) → recalculate
            afterUpdate: async (vote) => {
                await recalculateForPost(sequelize, vote.post_id);
            },
            // After a vote is removed (toggle off) → recalculate
            afterDestroy: async (vote) => {
                await recalculateForPost(sequelize, vote.post_id);
            },
        },
    });

    return PostVote;
};

/**
 * Recalculates StartupMetric for the startup that owns the given post.
 *
 * Formula (HackerNews-style):
 *   trending_score = (net_votes + 1) / (hours_since_newest_post + 2)^1.5 + views * 0.05
 *
 * - net_votes = total upvotes − total downvotes across ALL posts of the startup
 * - hours_since_newest_post = age in hours of the most recently created post
 * - views = StartupMetric.total_views (from page views tracking)
 *
 * Why fresh recalculation (not incremental)?
 * - No drift from accumulated counter errors
 * - Vote switches are handled correctly in a single pass
 * - Score always reflects the true current state
 */
async function recalculateForPost(sequelize, post_id) {
    try {
        const { PostVote, StartupPost, StartupMetric } = sequelize.models;

        // 1. Find the post that was voted on → get startup_id
        const post = await StartupPost.findByPk(post_id);
        if (!post) return;
        const startup_id = post.startup_id;

        // 2. Get all posts for this startup
        const posts = await StartupPost.findAll({ where: { startup_id } });
        const postIds = posts.map(p => p.id);

        // 3. Count all votes across every post this startup has ever made
        const upvotes = await PostVote.count({ where: { post_id: postIds, vote_type: 1 } });
        const downvotes = await PostVote.count({ where: { post_id: postIds, vote_type: -1 } });
        const net_votes = upvotes - downvotes;

        // 4. Find the most recently created post (drives recency)
        const newestPost = posts.reduce((latest, p) => {
            const pTime = new Date(p.createdAt || p.created_at).getTime();
            const lTime = latest ? new Date(latest.createdAt || latest.created_at).getTime() : 0;
            return pTime > lTime ? p : latest;
        }, null);

        const hours_since_newest = newestPost
            ? (Date.now() - new Date(newestPost.createdAt || newestPost.created_at).getTime()) / (1000 * 60 * 60)
            : 8760; // fallback: 1 year old if startup has no posts

        // 5. Get (or create) the StartupMetric row — we need total_views
        const [metric] = await StartupMetric.findOrCreate({
            where: { startup_id },
            defaults: { startup_id },
        });
        const views = metric.total_views || 0;

        // 6. Apply the formula
        //    trending_score = (net_votes + 1) / (hours + 2)^1.5 + views * 0.05
        const trending_score = (net_votes + 1) / Math.pow(hours_since_newest + 2, 1.5) + views * 0.05;

        // 7. Persist the updated metrics (overwrite, not increment)
        await metric.update({ total_upvotes: upvotes, total_downvotes: downvotes, trending_score });

    } catch (err) {
        console.error('[recalculateForPost] Error updating trending score:', err);
    }
}
