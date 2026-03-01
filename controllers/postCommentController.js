const { PostComment, CommentVote, User, StartupPost, Startup } = require('../models');

/* ─────────────────────────────────────────────
   Helper: vote counts + caller's vote for a comment
───────────────────────────────────────────── */
async function getCommentVoteCounts(comment_id, user_id = null) {
    const upvotes = await CommentVote.count({ where: { comment_id, vote_type: 1 } });
    const downvotes = await CommentVote.count({ where: { comment_id, vote_type: -1 } });
    let userVote = null;
    if (user_id) {
        const v = await CommentVote.findOne({ where: { user_id, comment_id } });
        userVote = v ? v.vote_type : null;
    }
    return { upvotes, downvotes, userVote };
}

/* ─────────────────────────────────────────────
   Helper: attach vote counts to an array of plain comment objects
───────────────────────────────────────────── */
async function attachVotes(comments, user_id = null) {
    return Promise.all(
        comments.map(async (c) => {
            const voteCounts = await getCommentVoteCounts(c.id, user_id);
            return { ...c, ...voteCounts };
        })
    );
}

/* ─────────────────────────────────────────────
   GET /api/comments/:post_id
   Public. Optional query: ?user_id=xxx
───────────────────────────────────────────── */
exports.getCommentsByPost = async (req, res) => {
    try {
        const { post_id } = req.params;
        const user_id = req.query.user_id || null;

        const comments = await PostComment.findAll({
            where: { post_id, status: 'ACTIVE' },
            include: [{
                model: User,
                as: 'author',
                attributes: ['id', 'email', 'photo_url'],
            }],
            order: [['created_at', 'DESC']],
        });

        const plain = comments.map(c => c.toJSON());
        const withVotes = await attachVotes(plain, user_id);

        res.json(withVotes);
    } catch (error) {
        console.error('GetCommentsByPost Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/* ─────────────────────────────────────────────
   POST /api/comments
   Body: { post_id, content }
   Requires verifyToken
───────────────────────────────────────────── */
exports.addComment = async (req, res) => {
    try {
        const { post_id, content } = req.body;
        const user_id = req.dbUser?.id;

        if (!post_id || !content?.trim()) {
            return res.status(400).json({ error: 'post_id and content are required' });
        }
        if (!user_id) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const post = await StartupPost.findByPk(post_id);
        if (!post || post.status !== 'APPROVED') {
            return res.status(404).json({ error: 'Post not found or not approved' });
        }

        const comment = await PostComment.create({
            post_id,
            user_id,
            content: content.trim(),
            status: 'ACTIVE',
        });

        const full = await PostComment.findByPk(comment.id, {
            include: [{ model: User, as: 'author', attributes: ['id', 'email', 'photo_url'] }],
        });

        res.status(201).json({ ...full.toJSON(), upvotes: 0, downvotes: 0, userVote: null });
    } catch (error) {
        console.error('AddComment Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/* ─────────────────────────────────────────────
   POST /api/comments/:id/vote
   Body: { vote_type: 1 | -1 }  — toggle behaviour
   Requires verifyToken
───────────────────────────────────────────── */
exports.castCommentVote = async (req, res) => {
    try {
        const { id: comment_id } = req.params;
        const { vote_type } = req.body;
        const user_id = req.dbUser?.id;

        if (!user_id) return res.status(401).json({ error: 'Authentication required' });
        if (![1, -1].includes(vote_type)) return res.status(400).json({ error: 'vote_type must be 1 or -1' });

        const comment = await PostComment.findByPk(comment_id);
        if (!comment || comment.status !== 'ACTIVE') {
            return res.status(404).json({ error: 'Comment not found or hidden' });
        }

        const existing = await CommentVote.findOne({ where: { user_id, comment_id } });

        if (existing) {
            if (existing.vote_type === vote_type) {
                await existing.destroy();
                return res.json({ message: 'Vote removed', ...(await getCommentVoteCounts(comment_id, user_id)) });
            }
            existing.vote_type = vote_type;
            await existing.save();
            return res.json({ message: 'Vote switched', ...(await getCommentVoteCounts(comment_id, user_id)) });
        }

        await CommentVote.create({ comment_id, user_id, vote_type });
        res.status(201).json({ message: 'Vote cast', ...(await getCommentVoteCounts(comment_id, user_id)) });
    } catch (error) {
        console.error('CastCommentVote Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/* ─────────────────────────────────────────────
   DELETE /api/comments/:id
   Comment author OR startup owner of the post can delete.
   Requires verifyToken
───────────────────────────────────────────── */
exports.deleteComment = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.dbUser?.id;

        const comment = await PostComment.findByPk(id, {
            include: [{
                model: StartupPost,
                as: 'post',
                include: [{ model: Startup, as: 'startup' }],
            }],
        });

        if (!comment) return res.status(404).json({ error: 'Comment not found' });

        const isAuthor = comment.user_id === user_id;
        const isStartupOwner = comment.post?.startup?.owner_user_id === user_id;

        if (!isAuthor && !isStartupOwner) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        await CommentVote.destroy({ where: { comment_id: id } });
        await comment.destroy();

        res.json({ message: 'Comment deleted' });
    } catch (error) {
        console.error('DeleteComment Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/* ─────────────────────────────────────────────
   PATCH /api/comments/:id/hide
   Startup owner can soft-hide a comment (status → HIDDEN)
   Requires verifyToken
───────────────────────────────────────────── */
exports.hideComment = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.dbUser?.id;

        const comment = await PostComment.findByPk(id, {
            include: [{
                model: StartupPost,
                as: 'post',
                include: [{ model: Startup, as: 'startup' }],
            }],
        });

        if (!comment) return res.status(404).json({ error: 'Comment not found' });

        const isStartupOwner = comment.post?.startup?.owner_user_id === user_id;
        if (!isStartupOwner) {
            return res.status(403).json({ error: 'Forbidden: Only the startup owner can hide comments' });
        }

        await comment.update({ status: 'HIDDEN' });
        res.json({ message: 'Comment hidden' });
    } catch (error) {
        console.error('HideComment Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/* ─────────────────────────────────────────────
   GET /api/comments/:post_id/all
   Startup owner only — returns ALL comments (ACTIVE + HIDDEN)
   Requires verifyToken
───────────────────────────────────────────── */
exports.getAllCommentsByPost = async (req, res) => {
    try {
        const { post_id } = req.params;
        const user_id = req.dbUser?.id;

        // Verify the requester is the startup owner of this post
        const post = await StartupPost.findByPk(post_id, {
            include: [{ model: Startup, as: 'startup', attributes: ['owner_user_id'] }],
        });

        if (!post) return res.status(404).json({ error: 'Post not found' });
        if (post.startup?.owner_user_id !== user_id) {
            return res.status(403).json({ error: 'Forbidden: Only the startup owner can view hidden comments' });
        }

        const comments = await PostComment.findAll({
            where: { post_id }, // No status filter — includes HIDDEN
            include: [{
                model: User,
                as: 'author',
                attributes: ['id', 'email', 'photo_url'],
            }],
            order: [['created_at', 'DESC']],
        });

        const plain = comments.map(c => c.toJSON());
        const withVotes = await attachVotes(plain, user_id);

        res.json(withVotes);
    } catch (error) {
        console.error('GetAllCommentsByPost Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/* ─────────────────────────────────────────────
   PATCH /api/comments/:id/restore
   Startup owner restores a hidden comment → ACTIVE
   Requires verifyToken
───────────────────────────────────────────── */
exports.restoreComment = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.dbUser?.id;

        const comment = await PostComment.findByPk(id, {
            include: [{
                model: StartupPost,
                as: 'post',
                include: [{ model: Startup, as: 'startup' }],
            }],
        });

        if (!comment) return res.status(404).json({ error: 'Comment not found' });

        const isStartupOwner = comment.post?.startup?.owner_user_id === user_id;
        if (!isStartupOwner) {
            return res.status(403).json({ error: 'Forbidden: Only the startup owner can restore comments' });
        }

        await comment.update({ status: 'ACTIVE' });
        res.json({ message: 'Comment restored' });
    } catch (error) {
        console.error('RestoreComment Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

