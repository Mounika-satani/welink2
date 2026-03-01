const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Founder extends Model {
        static associate(models) {
            Founder.belongsTo(models.Startup, { foreignKey: 'startup_id', as: 'startup' });
        }
    }

    Founder.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        startup_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        role: {
            type: DataTypes.STRING,
        },
        linkedin_url: {
            type: DataTypes.TEXT,
        },
        photo_url: {
            type: DataTypes.TEXT,
        },
    }, {
        sequelize,
        modelName: 'Founder',
        tableName: 'founders',
        underscored: true,
    });

    return Founder;
};
