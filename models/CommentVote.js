const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class CommentVote extends Model {
        static associate(models) {
            CommentVote.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
            CommentVote.belongsTo(models.PostComment, { foreignKey: 'comment_id', as: 'comment' });
        }
    }

    CommentVote.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        comment_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        vote_type: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    }, {
        sequelize,
        modelName: 'CommentVote',
        tableName: 'comment_votes',
        underscored: true,
        indexes: [
            {
                unique: true,
                fields: ['user_id', 'comment_id'], // one vote per user per comment
            },
        ],
    });

    return CommentVote;
};
