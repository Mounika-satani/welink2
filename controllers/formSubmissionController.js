const { FormSubmission, Service } = require('../models');

exports.submitForm = async (req, res) => {
    try {
        const { name, email, phone, company_name, general_details, service_id } = req.body;

        if (!name || !email || !service_id) {
            return res.status(400).json({ error: 'Name, email, and service are required' });
        }

        // Validate service exists
        const service = await Service.findByPk(service_id);
        if (!service) {
            return res.status(404).json({ error: 'Selected service not found' });
        }

        const submission = await FormSubmission.create({
            name,
            email,
            phone,
            company_name,
            general_details,
            service_id
        });

        res.status(201).json({ message: 'Form submitted successfully', submission });
    } catch (error) {
        console.error('Submit Form Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getAllSubmissions = async (req, res) => {
    try {
        const submissions = await FormSubmission.findAll({
            include: [{ model: Service, as: 'service' }],
            order: [['createdAt', 'DESC']]
        });
        res.json(submissions);
    } catch (error) {
        console.error('Get Submissions Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const submission = await FormSubmission.findByPk(id);
        if (!submission) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        submission.status = status;
        await submission.save();

        res.json({ message: 'Status updated successfully', submission });
    } catch (error) {
        console.error('Update Status Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
