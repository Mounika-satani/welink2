const { Founder } = require('../models');
const { uploadImageToS3 } = require('../services/s3Service');
const { v4: uuidv4 } = require('uuid');

exports.addFounder = async (req, res) => {
    try {
        const { startup_id, name, role, linkedin_url } = req.body;

        if (!startup_id || !name) {
            return res.status(400).json({ error: 'Missing startup_id or name' });
        }

        // Upload founder photo to S3 if provided
        let photo_url = null;
        if (req.file) {
            const photoId = uuidv4();
            photo_url = await uploadImageToS3(
                req.file.buffer,
                'founder-photos',
                photoId,
                req.file.mimetype
            );
        }

        const founder = await Founder.create({
            startup_id,
            name,
            role,
            linkedin_url: linkedin_url || null,
            photo_url
        });

        res.status(201).json(founder);
    } catch (error) {
        console.error('Add Founder Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getFoundersByStartup = async (req, res) => {
    try {
        const { startup_id } = req.params;
        const founders = await Founder.findAll({
            where: { startup_id }
        });
        res.json(founders);
    } catch (error) {
        console.error('Get Founders Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.updateFounder = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, role, linkedin_url } = req.body;

        const founder = await Founder.findByPk(id);
        if (!founder) {
            return res.status(404).json({ error: 'Founder not found' });
        }

        // Upload new photo to S3 if a new file is provided
        let photo_url = founder.photo_url;
        if (req.file) {
            const photoId = uuidv4();
            photo_url = await uploadImageToS3(
                req.file.buffer,
                'founder-photos',
                photoId,
                req.file.mimetype
            );
        }

        await founder.update({
            name: name || founder.name,
            role: role !== undefined ? role : founder.role,
            linkedin_url: linkedin_url !== undefined ? linkedin_url : founder.linkedin_url,
            photo_url
        });

        res.json({ message: 'Founder updated successfully', founder });
    } catch (error) {
        console.error('Update Founder Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
