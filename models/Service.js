const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Service extends Model {
        static associate(models) {
            Service.hasMany(models.FormSubmission, { foreignKey: 'service_id', as: 'submissions' });
        }
    }

    Service.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        description: {
            type: DataTypes.TEXT,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    }, {
        sequelize,
        modelName: 'Service',
        tableName: 'services',
        underscored: true,
    });

    return Service;
};
