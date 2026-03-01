const { PostVote } = require('../models');

// Helper: get upvote/downvote counts + user's current vote for a post
async function getPostVoteCounts(post_id, user_id = null) {
    const upvotes = await PostVote.count({ where: { post_id, vote_type: 1 } });
    const downvotes = await PostVote.count({ where: { post_id, vote_type: -1 } });
    let userVote = null;
    if (user_id) {
        const v = await PostVote.findOne({ where: { user_id, post_id } });
        userVote = v ? v.vote_type : null;
    }
    return { upvotes, downvotes, userVote };
}

// GET /api/post-votes/:post_id?user_id=...
exports.getPostVotes = async (req, res) => {
    try {
        const { post_id } = req.params;
        const user_id = req.query.user_id || null;
        const counts = await getPostVoteCounts(post_id, user_id);
        res.json(counts);
    } catch (error) {
        console.error('GetPostVotes Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// POST /api/post-votes/cast  { user_id, post_id, vote_type }
exports.castPostVote = async (req, res) => {
    try {
        const { user_id, post_id, vote_type } = req.body;

        if (!user_id || !post_id) {
            return res.status(400).json({ error: 'user_id and post_id are required' });
        }
        if (![1, -1].includes(vote_type)) {
            return res.status(400).json({ error: 'Invalid vote_type. Must be 1 or -1' });
        }

        const existing = await PostVote.findOne({ where: { user_id, post_id } });

        if (existing) {
            if (existing.vote_type === vote_type) {
                // Same vote again → toggle off (remove)
                await existing.destroy();
                const counts = await getPostVoteCounts(post_id, user_id);
                return res.json({ message: 'Vote removed', ...counts });
            } else {
                // Opposite vote → switch
                existing.vote_type = vote_type;
                await existing.save();
                const counts = await getPostVoteCounts(post_id, user_id);
                return res.json({ message: 'Vote switched', ...counts });
            }
        }

        // New vote
        await PostVote.create({ user_id, post_id, vote_type });
        const counts = await getPostVoteCounts(post_id, user_id);
        res.status(201).json({ message: 'Vote cast', ...counts });
    } catch (error) {
        console.error('CastPostVote Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
