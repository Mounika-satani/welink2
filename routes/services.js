const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const adminAuth = require('../middleware/adminAuth');

router.get('/', serviceController.getAllServices);

router.post('/', adminAuth, serviceController.createService);

router.put('/:id', adminAuth, serviceController.updateService);

router.delete('/:id', adminAuth, serviceController.deleteService);

module.exports = router;
