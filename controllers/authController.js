const { User } = require('../models');
const { uploadProfileImageToS3, getSignedUrlForView, uploadFileBufferToS3, isS3Value, extractS3Key } = require('../services/s3Service');

exports.login = async (req, res) => {
    try {
        const { uid, email, picture, firebase: { sign_in_provider } } = req.user;

        if (!uid || !email) {
            return res.status(400).json({ error: 'Missing firebase_uid or email from token' });
        }

        let user = req.dbUser;

        // Upload pic to S3 if user doesn't have one yet
        if (picture && !isS3Value(user.photo_url)) {
            try {
                const key = await uploadProfileImageToS3(picture, uid);
                if (key) {
                    user.photo_url = key; // store short S3 key
                    await user.save();
                }
            } catch (err) {
                console.error("Failed to upload profile pic to S3:", err);
            }
        }

        // Sign the photo for the response (works with short key or legacy full URL)
        const userJson = user.toJSON();
        if (isS3Value(userJson.photo_url)) {
            userJson.photo_url = await getSignedUrlForView(userJson.photo_url);
        }

        return res.json({ message: 'Login successful', user: userJson });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const { firebase_uid } = req.params;

        const user = await User.findOne({
            where: { firebase_uid },
            include: 'startup'
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userJson = user.toJSON();

        // Sign the photo for the response (works with short key or legacy full URL)
        if (isS3Value(userJson.photo_url)) {
            userJson.photo_url = await getSignedUrlForView(userJson.photo_url);
        }

        res.json(userJson);

    } catch (error) {
        console.error('Get Profile Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { firebase_uid } = req.params;
        const { is_active } = req.body;
        const file = req.file;

        if (req.user.uid !== firebase_uid) {
            return res.status(403).json({ error: 'Unauthorized to update this profile' });
        }

        const user = await User.findOne({ where: { firebase_uid } });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // File upload → store short S3 key
        if (file) {
            try {
                const key = await uploadFileBufferToS3(file.buffer, firebase_uid, file.mimetype);
                user.photo_url = key;
            } catch (err) {
                console.error("Failed to upload new profile pic to S3:", err);
                return res.status(500).json({ error: 'Failed to upload image' });
            }
        }
        // URL in body → extract key if it's a full S3 URL, store as short key
        else if (req.body.photoURL) {
            const key = extractS3Key(req.body.photoURL) || req.body.photoURL;
            if (key !== user.photo_url) {
                user.photo_url = key;
            }
        }

        if (typeof is_active !== 'undefined') {
            user.is_active = is_active;
        }

        await user.save();

        const userJson = user.toJSON();
        if (isS3Value(userJson.photo_url)) {
            userJson.photo_url = await getSignedUrlForView(userJson.photo_url);
        }

        res.json({ message: 'Profile updated successfully', user: userJson });
    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.deleteProfilePhoto = async (req, res) => {
    try {
        const { firebase_uid } = req.params;

        if (req.user.uid !== firebase_uid) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const user = await User.findOne({ where: { firebase_uid } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.photo_url = null;
        await user.save();

        res.json({ message: 'Profile photo removed successfully', user });
    } catch (error) {
        console.error('Delete Profile Photo Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
