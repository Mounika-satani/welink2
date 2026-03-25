const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const { verifyOptionalToken } = require('../middleware/authMiddleware');

router.post('/add', upload.fields([
    { name: 'media', maxCount: 10 },
    { name: 'thumbnail', maxCount: 1 }
]), postController.addPost);


router.get('/', verifyOptionalToken, postController.getAllPosts);
router.get('/trending', verifyOptionalToken, postController.getTrendingPosts);
router.get('/startup/:startup_id', postController.getPostsByStartup);

router.post('/:id/view', verifyOptionalToken, postController.trackPostView);

router.put('/:id', upload.fields([
    { name: 'media', maxCount: 10 },
    { name: 'thumbnail', maxCount: 1 }
]), postController.updatePost);

router.delete('/:id', postController.deletePost);

module.exports = router;
