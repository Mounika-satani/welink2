const express = require('express');
const router = express.Router();
const formSubmissionController = require('../controllers/formSubmissionController');
const adminAuth = require('../middleware/adminAuth');

router.post('/', formSubmissionController.submitForm);

router.get('/', adminAuth, formSubmissionController.getAllSubmissions);

router.patch('/:id/status', adminAuth, formSubmissionController.updateStatus);

module.exports = router;
