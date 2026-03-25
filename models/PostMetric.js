const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class PostMetric extends Model {
        static associate(models) {
            PostMetric.belongsTo(models.StartupPost, { foreignKey: 'post_id', as: 'post' });
        }
    }

    PostMetric.init({
        post_id: {
            type: DataTypes.UUID,
            primaryKey: true,
            allowNull: false,
        },
        total_views: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        total_upvotes: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        total_downvotes: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        trending_score: {
            type: DataTypes.FLOAT,
            defaultValue: 0,
        },
    }, {
        sequelize,
        modelName: 'PostMetric',
        tableName: 'post_metrics',
        underscored: true,
    });

    return PostMetric;
};
