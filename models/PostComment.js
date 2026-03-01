const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class PostComment extends Model {
        static associate(models) {
            PostComment.belongsTo(models.StartupPost, { foreignKey: 'post_id', as: 'post' });
            PostComment.belongsTo(models.User, { foreignKey: 'user_id', as: 'author' });
            PostComment.hasMany(models.CommentVote, { foreignKey: 'comment_id', as: 'votes' });
        }
    }

    PostComment.init({
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
            allowNull: false,
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'ACTIVE',
        },
    }, {
        sequelize,
        modelName: 'PostComment',
        tableName: 'post_comments',
        underscored: true,
    });

    return PostComment;
};
