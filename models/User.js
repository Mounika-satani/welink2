const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class User extends Model {
        static associate(models) {
            User.hasOne(models.Startup, { foreignKey: 'owner_user_id', as: 'startup' });
            User.hasMany(models.StartupView, { foreignKey: 'user_id', as: 'views' });
            User.hasMany(models.PostComment, { foreignKey: 'user_id', as: 'comments' });
        }
    }

    User.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        firebase_uid: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
        },
        role: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'USER',
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        photo_url: {
            type: DataTypes.TEXT,
        },
        auth_provider: {
            type: DataTypes.STRING,
        }
    }, {
        sequelize,
        modelName: 'User',
        tableName: 'users',
        underscored: true,
    });

    return User;
};
