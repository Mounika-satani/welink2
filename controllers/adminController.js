const { Admin, Startup, User, StartupPost, PostVote, PostComment, CommentVote, Founder, StartupMetric, StartupView, sequelize } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendStartupApprovedEmail, sendStartupRejectedEmail, sendPostApprovedEmail, sendPostRejectedEmail } = require('../services/emailService');

exports.adminLogin = async (req, res) => {
    const { email, password } = req.body;

    try {
        const admin = await Admin.findOne({ where: { email } });
        if (!admin) return res.status(404).json({ error: 'Admin not found' });
        const isMatch = await bcrypt.compare(password, admin.password_hash);
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: admin.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
        res.json({ token, admin: { id: admin.id, email: admin.email } });
    } catch (error) {
        console.error('Admin Login Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.createAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const admin = await Admin.create({ email, password_hash });
        res.status(201).json(admin);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

exports.approveStartup = async (req, res) => {
    try {
        const { id } = req.params;
        const startup = await Startup.findByPk(id);

        if (!startup) return res.status(404).json({ error: 'Startup not found' });

        // Approve the startup
        startup.status = 'APPROVED';
        startup.approved_at = new Date();
        await startup.save();

        // Promote the owner's role to STARTUP
        const owner = await User.findByPk(startup.owner_user_id);
        if (owner) {
            owner.role = 'STARTUP';
            await owner.save();
            console.log(`✅ Promoted user ${owner.email} to STARTUP role`);
        }

        // 📧 Email: Startup Approved
        if (owner?.email) {
            sendStartupApprovedEmail({ to: owner.email, startupName: startup.name });
        }

        res.json({
            message: 'Startup approved successfully',
            startup,
            owner: owner ? { id: owner.id, email: owner.email, role: owner.role } : null
        });
    } catch (error) {
        console.error('Approve Startup Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.rejectStartup = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body; // optional rejection reason from admin
        const startup = await Startup.findByPk(id);

        if (!startup) return res.status(404).json({ error: 'Startup not found' });

        startup.status = 'REJECTED';
        await startup.save();

        // Demote owner back to USER if they were promoted
        const owner = await User.findByPk(startup.owner_user_id);
        if (owner && owner.role === 'STARTUP') {
            owner.role = 'USER';
            await owner.save();
            console.log(`↩️ Demoted user ${owner.email} back to USER role`);
        }

        // 📧 Email: Startup Rejected
        if (owner?.email) {
            sendStartupRejectedEmail({ to: owner.email, startupName: startup.name, reason });
        }

        res.json({
            message: 'Startup rejected',
            startup,
            owner: owner ? { id: owner.id, email: owner.email, role: owner.role } : null
        });
    } catch (error) {
        console.error('Reject Startup Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getAllPendingStartups = async (req, res) => {
    try {
        const { Op } = require('sequelize');
        const startups = await Startup.findAll({
            where: { status: { [Op.in]: ['PENDING', 'DRAFT'] } },
            include: [
                { model: User, as: 'owner', attributes: ['id', 'email', 'role'] },
                { model: Founder, as: 'founders' },
            ],
            order: [['updatedAt', 'DESC']],
        });
        res.json(startups);
    } catch (error) {
        console.error('Get Pending Startups Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

// Post Admin Logic
exports.getAllPendingPosts = async (req, res) => {
    try {
        const posts = await StartupPost.findAll({
            where: { status: 'PENDING' },
            include: [{ model: Startup, as: 'startup', attributes: ['name', 'logo_url'] }]
        });
        res.json(posts);
    } catch (error) {
        console.error('Get Pending Posts Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.approvePost = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await StartupPost.findByPk(id, {
            include: [{ model: Startup, as: 'startup', include: [{ model: User, as: 'owner', attributes: ['email'] }] }]
        });
        if (!post) return res.status(404).json({ error: 'Post not found' });

        post.status = 'APPROVED';
        post.approved_at = new Date();
        await post.save();

        // 📧 Email: Post Approved
        const ownerEmail = post.startup?.owner?.email;
        if (ownerEmail) {
            sendPostApprovedEmail({ to: ownerEmail, startupName: post.startup.name, postTitle: post.title });
        }

        res.json({ message: 'Post approved successfully', post });
    } catch (error) {
        console.error('Approve Post Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.rejectPost = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body; // optional rejection reason from admin
        const post = await StartupPost.findByPk(id, {
            include: [{ model: Startup, as: 'startup', include: [{ model: User, as: 'owner', attributes: ['email'] }] }]
        });
        if (!post) return res.status(404).json({ error: 'Post not found' });

        post.status = 'REJECTED';
        await post.save();

        // 📧 Email: Post Rejected
        const ownerEmail = post.startup?.owner?.email;
        if (ownerEmail) {
            sendPostRejectedEmail({ to: ownerEmail, startupName: post.startup?.name, postTitle: post.title, reason });
        }

        res.json({ message: 'Post rejected', post });
    } catch (error) {
        console.error('Reject Post Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.deletePost = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await StartupPost.findByPk(id);
        if (!post) return res.status(404).json({ error: 'Post not found' });

        // Clean up votes and comments before deleting
        await PostVote.destroy({ where: { post_id: id } });
        const comments = await PostComment.findAll({ where: { post_id: id }, attributes: ['id'] });
        const commentIds = comments.map(c => c.id);
        if (commentIds.length > 0) {
            await CommentVote.destroy({ where: { comment_id: commentIds } });
            await PostComment.destroy({ where: { post_id: id } });
        }

        await post.destroy();

        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Delete Post Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.deleteStartup = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const startup = await Startup.findByPk(id, { transaction: t });
        if (!startup) {
            await t.rollback();
            return res.status(404).json({ error: 'Startup not found' });
        }

        // 1. Collect all post IDs for this startup
        const posts = await StartupPost.findAll({
            where: { startup_id: id },
            attributes: ['id'],
            transaction: t
        });
        const postIds = posts.map(p => p.id);

        // 2. Delete votes and comments for all posts (deepest children first)
        if (postIds.length > 0) {
            await PostVote.destroy({ where: { post_id: postIds }, transaction: t });
            const comments = await PostComment.findAll({ where: { post_id: postIds }, attributes: ['id'], transaction: t });
            const commentIds = comments.map(c => c.id);
            if (commentIds.length > 0) {
                await CommentVote.destroy({ where: { comment_id: commentIds }, transaction: t });
            }
            await PostComment.destroy({ where: { post_id: postIds }, transaction: t });
        }

        // 3. Delete all StartupPosts
        await StartupPost.destroy({ where: { startup_id: id }, transaction: t });

        // 4. Delete Founders
        await Founder.destroy({ where: { startup_id: id }, transaction: t });

        // 5. Delete StartupMetric
        await StartupMetric.destroy({ where: { startup_id: id }, transaction: t });

        // 6. Delete StartupViews
        await StartupView.destroy({ where: { startup_id: id }, transaction: t });

        // 7. Downgrade owner back to USER role
        const owner = await User.findByPk(startup.owner_user_id, { transaction: t });
        if (owner && owner.role === 'STARTUP') {
            owner.role = 'USER';
            await owner.save({ transaction: t });
            console.log(`↩️ Demoted user ${owner.email} back to USER role on startup deletion`);
        }

        // 8. Finally delete the startup itself
        await startup.destroy({ transaction: t });

        await t.commit();

        res.json({
            message: 'Startup and all related data deleted successfully',
            owner: owner ? { id: owner.id, email: owner.email, role: owner.role } : null
        });
    } catch (error) {
        await t.rollback();
        console.error('Delete Startup Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── Admin Comment Moderation ──────────────────────────────────────────────

// GET /api/admin/comments — all comments across the platform
exports.getAllComments = async (req, res) => {
    try {
        const comments = await PostComment.findAll({
            include: [
                { model: User, as: 'author', attributes: ['id', 'email'] },
                { model: StartupPost, as: 'post', attributes: ['id', 'title'] },
            ],
            order: [['created_at', 'DESC']],
        });
        res.json(comments);
    } catch (error) {
        console.error('GetAllComments Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// DELETE /api/admin/comments/:id — hard delete any comment
exports.adminDeleteComment = async (req, res) => {
    try {
        const { id } = req.params;
        const comment = await PostComment.findByPk(id);
        if (!comment) return res.status(404).json({ error: 'Comment not found' });

        await CommentVote.destroy({ where: { comment_id: id } });
        await comment.destroy();

        res.json({ message: 'Comment deleted by admin' });
    } catch (error) {
        console.error('AdminDeleteComment Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// PATCH /api/admin/comments/:id/hide — soft-hide any comment
exports.adminHideComment = async (req, res) => {
    try {
        const { id } = req.params;
        const comment = await PostComment.findByPk(id);
        if (!comment) return res.status(404).json({ error: 'Comment not found' });

        await comment.update({ status: 'HIDDEN' });
        res.json({ message: 'Comment hidden by admin' });
    } catch (error) {
        console.error('AdminHideComment Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// PATCH /api/admin/comments/:id/restore — restore a hidden comment back to ACTIVE
exports.adminRestoreComment = async (req, res) => {
    try {
        const { id } = req.params;
        const comment = await PostComment.findByPk(id);
        if (!comment) return res.status(404).json({ error: 'Comment not found' });

        await comment.update({ status: 'ACTIVE' });
        res.json({ message: 'Comment restored to active by admin' });
    } catch (error) {
        console.error('AdminRestoreComment Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


