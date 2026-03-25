const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class PostView extends Model {
        static associate(models) {
            PostView.belongsTo(models.StartupPost, { foreignKey: 'post_id', as: 'post' });
            PostView.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
        }
    }

    PostView.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        post_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        user_id: {
            type: DataTypes.UUID,
        },
        ip_address: {
            type: DataTypes.STRING,
        },
        user_agent: {
            type: DataTypes.TEXT,
        },
    }, {
        sequelize,
        modelName: 'PostView',
        tableName: 'post_views',
        underscored: true,
        hooks: {
            afterCreate: async (view) => {
                const { PostMetric } = sequelize.models;
                const [metric] = await PostMetric.findOrCreate({
                    where: { post_id: view.post_id },
                    defaults: { post_id: view.post_id },
                });
                await metric.increment('total_views');
                // The overall trending score will be updated by a separate recalc logic
                // if we want to be reactive to views immediately.
            }
        }
    });

    return PostView;
};
