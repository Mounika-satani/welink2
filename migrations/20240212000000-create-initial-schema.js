'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // 1. Users Table
        await queryInterface.createTable('users', {
            id: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4
            },
            firebase_uid: {
                type: Sequelize.STRING,
                unique: true
            },
            email: {
                type: Sequelize.STRING,
                unique: true,
                allowNull: false
            },
            role: {
                type: Sequelize.STRING, // 'USER' | 'STARTUP'
                allowNull: false,
                defaultValue: 'USER'
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                defaultValue: true
            },
            photo_url: {
                type: Sequelize.TEXT
            },
            auth_provider: {
                type: Sequelize.STRING
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });

        // 2. Admin Table
        await queryInterface.createTable('admin', {
            id: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4
            },
            email: {
                type: Sequelize.STRING,
                unique: true,
                allowNull: false
            },
            password_hash: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });

        // 3. Categories Table
        await queryInterface.createTable('categories', {
            id: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4
            },
            name: {
                type: Sequelize.STRING,
                unique: true,
                allowNull: false
            },
            icon_url: {
                type: Sequelize.TEXT
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                defaultValue: true
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });

        // 4. Startups Table
        await queryInterface.createTable('startups', {
            id: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4
            },
            owner_user_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false
            },
            tagline: {
                type: Sequelize.STRING
            },
            description: {
                type: Sequelize.TEXT
            },
            website_url: {
                type: Sequelize.TEXT
            },
            industry_id: { // Reverted to UUID FK
                type: Sequelize.UUID,
                references: {
                    model: 'categories',
                    key: 'id'
                }
            },
            founded_year: {
                type: Sequelize.INTEGER
            },
            team_size: {
                type: Sequelize.INTEGER
            },
            location: {
                type: Sequelize.STRING
            },
            funding_stage: {
                type: Sequelize.STRING
            },
            status: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: 'DRAFT'
            },
            is_featured: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            is_verified: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            featured_rank: {
                type: Sequelize.INTEGER
            },
            homepage_rank: {
                type: Sequelize.INTEGER
            },
            approved_at: {
                type: Sequelize.DATE
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });

        // 5. Founders Table
        await queryInterface.createTable('founders', {
            id: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4
            },
            startup_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'startups',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false
            },
            role: {
                type: Sequelize.STRING
            },
            linkedin_url: {
                type: Sequelize.TEXT
            },
            photo_url: {
                type: Sequelize.TEXT
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });

        // 6. Startup Media Table
        await queryInterface.createTable('startup_media', {
            id: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4
            },
            startup_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'startups',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            type: {
                type: Sequelize.STRING,
                allowNull: false
            },
            media_url: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            thumbnail_url: {
                type: Sequelize.TEXT
            },
            status: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: 'PENDING'
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });

        // 7. Startup Posts Table
        await queryInterface.createTable('startup_posts', {
            id: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4
            },
            startup_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'startups',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            title: {
                type: Sequelize.STRING
            },
            content: {
                type: Sequelize.TEXT
            },
            status: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: 'PENDING'
            },
            approved_at: {
                type: Sequelize.DATE
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });

        // 8. Startup Metrics Table
        await queryInterface.createTable('startup_metrics', {
            startup_id: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID,
                references: {
                    model: 'startups',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            total_views: {
                type: Sequelize.INTEGER,
                defaultValue: 0
            },
            total_upvotes: {
                type: Sequelize.INTEGER,
                defaultValue: 0
            },
            total_downvotes: {
                type: Sequelize.INTEGER,
                defaultValue: 0
            },
            trending_score: {
                type: Sequelize.FLOAT,
                defaultValue: 0
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });

        // 9. Votes Table
        await queryInterface.createTable('votes', {
            id: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4
            },
            user_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                },
            },
            startup_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'startups',
                    key: 'id'
                },
            },
            vote_type: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });

        // Add unique constraint for votes
        await queryInterface.addIndex('votes', ['user_id', 'startup_id'], {
            unique: true,
            name: 'votes_user_startup_unique'
        });

        // 10. Startup Views Table
        await queryInterface.createTable('startup_views', {
            id: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4
            },
            startup_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'startups',
                    key: 'id'
                },
            },
            user_id: {
                type: Sequelize.UUID,
                references: {
                    model: 'users',
                    key: 'id'
                }
            },
            ip_address: {
                type: Sequelize.STRING
            },
            user_agent: {
                type: Sequelize.TEXT
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });
    },

    down: async (queryInterface, Sequelize) => {
        // Drop tables in reverse order
        await queryInterface.dropTable('startup_views');
        await queryInterface.dropTable('votes');
        await queryInterface.dropTable('startup_metrics');
        await queryInterface.dropTable('startup_posts');
        await queryInterface.dropTable('startup_media');
        await queryInterface.dropTable('founders');
        await queryInterface.dropTable('startups');
        await queryInterface.dropTable('categories');
        await queryInterface.dropTable('admin');
        await queryInterface.dropTable('users');
    }
};
