const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.get('/all', categoryController.getAllCategories);
router.post('/create', upload.single('image'), categoryController.createCategory);
router.put('/:id', upload.single('image'), categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;
