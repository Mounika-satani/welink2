const express = require('express');
const router = express.Router();
const postVoteController = require('../controllers/postVoteController');

router.get('/:post_id', postVoteController.getPostVotes);

router.post('/cast', postVoteController.castPostVote);

module.exports = router;
