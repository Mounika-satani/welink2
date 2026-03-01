const { Service } = require('../models');

exports.createService = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Service name is required' });
        }

        const service = await Service.create({
            name,
            description
        });

        res.status(201).json(service);
    } catch (error) {
        console.error('Create Service Error:', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ error: 'Service already exists' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getAllServices = async (req, res) => {
    try {
        const services = await Service.findAll({
            where: { is_active: true }
        });
        res.json(services);
    } catch (error) {
        console.error('Get Services Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.updateService = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        const service = await Service.findByPk(id);
        if (!service) {
            return res.status(404).json({ error: 'Service not found' });
        }

        await service.update({
            name: name || service.name,
            description: description !== undefined ? description : service.description
        });

        res.json({ message: 'Service updated successfully', service });
    } catch (error) {
        console.error('Update Service Error:', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ error: 'Service name already exists' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.deleteService = async (req, res) => {
    try {
        const { id } = req.params;

        const service = await Service.findByPk(id);
        if (!service) {
            return res.status(404).json({ error: 'Service not found' });
        }

        // Soft delete — consistent with getAllServices filtering on is_active
        await service.update({ is_active: false });

        res.json({ message: 'Service deleted successfully' });
    } catch (error) {
        console.error('Delete Service Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
