const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class StartupMetric extends Model {
        static associate(models) {
            StartupMetric.belongsTo(models.Startup, { foreignKey: 'startup_id', as: 'startup' });
        }
    }

    StartupMetric.init({
        startup_id: {
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
        modelName: 'StartupMetric',
        tableName: 'startup_metrics',
        underscored: true,
    });

    return StartupMetric;
};
