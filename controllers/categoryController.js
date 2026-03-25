const { Category, Startup, sequelize } = require('../models');
const { uploadImageToS3, getSignedUrlForView, isS3Value } = require('../services/s3Service');
const { v4: uuidv4 } = require('uuid');

exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Category.findAll({
            where: { is_active: true },
            attributes: {
                include: [
                    [
                        sequelize.literal(`(
                            SELECT COUNT(*)
                            FROM startups AS s
                            WHERE s.industry_id = "Category".id
                        )`),
                        'startupCount'
                    ]
                ]
            },
            order: [['name', 'ASC']]
        });

        const categoriesWithUrls = await Promise.all(categories.map(async (catInstance) => {
            const cat = catInstance.get({ plain: true });

            console.log(`Checking category: ${cat.name}, imageUrl: ${cat.imageUrl}`);
            const isS3 = isS3Value(cat.imageUrl);
            console.log(`isS3Value: ${isS3}`);

            if (cat.imageUrl && isS3) {
                try {
                    const signedUrl = await getSignedUrlForView(cat.imageUrl);
                    console.log(`Generated signedUrl: ${signedUrl ? 'SUCCESS' : 'FAILED'}`);
                    if (signedUrl) {
                        cat.imageUrl = signedUrl;
                    }
                } catch (err) {
                    console.error(`Failed to sign URL for ${cat.name}:`, err.message);
                }
            }
            return cat;
        }));

        res.json(categoriesWithUrls);
    } catch (error) {
        console.error('Get Categories Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.createCategory = async (req, res) => {
    try {
        const { name, description, type } = req.body;
        let imageUrl = req.body.imageUrl || req.body.image_url;

        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        // Handle file upload to S3 if a file is present
        if (req.file) {
            const fileName = `cat_${uuidv4()}`;
            imageUrl = await uploadImageToS3(
                req.file.buffer,
                'categories',
                fileName,
                req.file.mimetype
            );
        }

        const category = await Category.create({
            name,
            imageUrl,
            description,
            type: type || 'INDUSTRY'
        });
        res.status(201).json(category);
    } catch (error) {
        console.error('Create Category Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, type } = req.body;

        const category = await Category.findByPk(id);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        let imageUrl = req.body.imageUrl || req.body.image_url || category.imageUrl;

        // Handle new file upload to S3 if a file is provided
        if (req.file) {
            const fileName = `cat_${uuidv4()}`;
            imageUrl = await uploadImageToS3(
                req.file.buffer,
                'categories',
                fileName,
                req.file.mimetype
            );
        }

        await category.update({
            name: name || category.name,
            description: description !== undefined ? description : category.description,
            imageUrl,
            type: type || category.type
        });

        res.json({ message: 'Category updated successfully', category });
    } catch (error) {
        console.error('Update Category Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await Category.findByPk(id);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        // Soft delete — mark as inactive rather than removing from DB
        await category.update({ is_active: false });

        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Delete Category Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
