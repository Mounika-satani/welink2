const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/postCommentController');
const { verifyToken } = require('../middleware/authMiddleware');


router.get('/:post_id', ctrl.getCommentsByPost);


router.get('/:post_id/all', verifyToken, ctrl.getAllCommentsByPost);


router.post('/', verifyToken, ctrl.addComment);

router.post('/:id/vote', verifyToken, ctrl.castCommentVote);

router.put('/:id', verifyToken, ctrl.updateComment);

router.delete('/:id', verifyToken, ctrl.deleteComment);


router.patch('/:id/hide', verifyToken, ctrl.hideComment);

router.patch('/:id/restore', verifyToken, ctrl.restoreComment);

module.exports = router;

