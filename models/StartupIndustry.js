const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class StartupIndustry extends Model {
        static associate(models) {
        }
    }

    StartupIndustry.init({
        startup_id: {
            type: DataTypes.UUID,
            allowNull: false,
            primaryKey: true,
            references: {
                model: 'startups',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        category_id: {
            type: DataTypes.UUID,
            allowNull: false,
            primaryKey: true,
            references: {
                model: 'categories',
                key: 'id'
            },
            onDelete: 'CASCADE'
        }
    }, {
        sequelize,
        modelName: 'StartupIndustry',
        tableName: 'startup_industries',
        underscored: true,
        timestamps: false
    });

    return StartupIndustry;
};
