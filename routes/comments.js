const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/postCommentController');
const { verifyToken } = require('../middleware/authMiddleware');

// Public — fetch all ACTIVE comments for a post
// GET /api/comments/:post_id?user_id=xxx
router.get('/:post_id', ctrl.getCommentsByPost);

// Startup owner only — fetch ALL comments (ACTIVE + HIDDEN) for their post
// GET /api/comments/:post_id/all   (requires token)
router.get('/:post_id/all', verifyToken, ctrl.getAllCommentsByPost);

// Authenticated — post a new comment
// POST /api/comments  { post_id, content }
router.post('/', verifyToken, ctrl.addComment);

// Authenticated — upvote/downvote a comment (toggle)
// POST /api/comments/:id/vote  { vote_type: 1 | -1 }
router.post('/:id/vote', verifyToken, ctrl.castCommentVote);

// Authenticated — delete own comment OR startup owner deletes on their post
// DELETE /api/comments/:id
router.delete('/:id', verifyToken, ctrl.deleteComment);

// Startup owner — soft-hide a comment
// PATCH /api/comments/:id/hide
router.patch('/:id/hide', verifyToken, ctrl.hideComment);

// Startup owner — restore a hidden comment back to ACTIVE
// PATCH /api/comments/:id/restore
router.patch('/:id/restore', verifyToken, ctrl.restoreComment);

module.exports = router;

