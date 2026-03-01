const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Category extends Model {
        static associate(models) {
            Category.hasMany(models.Startup, { foreignKey: 'industry_id', as: 'startups' });
        }
    }

    Category.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
        },
        imageUrl: {
            type: DataTypes.TEXT,
            field: 'image_url',
            allowNull: true,
            comment: 'S3 URL for the category cover/banner image',
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    }, {
        sequelize,
        modelName: 'Category',
        tableName: 'categories',
        underscored: true,
    });

    return Category;
};
