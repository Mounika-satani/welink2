const express = require('express');
const router = express.Router();
const multer = require('multer');
const founderController = require('../controllers/founderController');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image files are allowed'));
    }
});

router.post('/add', upload.single('photo'), founderController.addFounder);
router.get('/startup/:startup_id', founderController.getFoundersByStartup);
router.put('/:id', upload.single('photo'), founderController.updateFounder);

module.exports = router;
