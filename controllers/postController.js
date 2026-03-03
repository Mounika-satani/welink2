const { StartupPost, Startup } = require('../models');
const { uploadImageToS3, getSignedUrlForView, isS3Value } = require('../services/s3Service');
const { v4: uuidv4 } = require('uuid');

const signPostUrls = async (post) => {
    // media_url can be a plain string OR a JSON array of strings
    if (post.media_url) {
        try {
            const parsed = JSON.parse(post.media_url);
            if (Array.isArray(parsed)) {
                post.media_urls = await Promise.all(
                    parsed.map(u => isS3Value(u) ? getSignedUrlForView(u) : u)
                );
                post.media_url = post.media_urls[0]; // keep first as primary
            } else {
                throw new Error('not array');
            }
        } catch {
            // plain string (legacy single upload)
            if (isS3Value(post.media_url)) {
                post.media_url = await getSignedUrlForView(post.media_url);
            }
            post.media_urls = [post.media_url];
        }
    }
    if (post.thumbnail_url && isS3Value(post.thumbnail_url)) {
        post.thumbnail_url = await getSignedUrlForView(post.thumbnail_url);
    }
    if (post.startup && post.startup.logo_url && isS3Value(post.startup.logo_url)) {
        post.startup.logo_url = await getSignedUrlForView(post.startup.logo_url);
    }
    return post;
};

exports.addPost = async (req, res) => {
    try {
        const { startup_id, title, content, media_type, post_type, demo_link, external_link, comments_enabled } = req.body;

        if (!startup_id) {
            return res.status(400).json({ error: 'startup_id is required' });
        }

        let media_url = req.body.media_url || null;
        let thumbnail_url = req.body.thumbnail_url || null;
        // auto-detect media_type from first file if not provided
        let media_type_resolved = media_type;

        // Handle file uploads to S3
        if (req.files) {
            // Support multiple media files (up to 10)
            if (req.files.media && req.files.media.length > 0) {
                const mediaFiles = req.files.media;
                const uploadedUrls = await Promise.all(
                    mediaFiles.map(async (mediaFile) => {
                        const mediaId = uuidv4();
                        return uploadImageToS3(
                            mediaFile.buffer,
                            'startup-posts',
                            mediaId,
                            mediaFile.mimetype
                        );
                    })
                );
                // Store as JSON array; single file stored as plain string for compat
                media_url = uploadedUrls.length === 1
                    ? uploadedUrls[0]
                    : JSON.stringify(uploadedUrls);

                // auto-detect type from first file
                if (!media_type_resolved) {
                    media_type_resolved = mediaFiles[0].mimetype.startsWith('video') ? 'VIDEO' : 'IMAGE';
                }
            }

            // Optional thumbnail (for video)
            if (req.files.thumbnail?.[0]) {
                const thumbFile = req.files.thumbnail[0];
                const thumbId = uuidv4();
                thumbnail_url = await uploadImageToS3(
                    thumbFile.buffer,
                    'startup-post-thumbnails',
                    thumbId,
                    thumbFile.mimetype
                );
            }
        }

        const post = await StartupPost.create({
            startup_id,
            title,
            content,
            media_url,
            media_type: media_type_resolved || media_type || 'IMAGE',
            thumbnail_url,
            post_type: post_type || 'UPDATE',
            demo_link,
            external_link,
            comments_enabled: comments_enabled === 'false' || comments_enabled === false ? false : true,
            status: 'PENDING'
        });

        res.status(201).json(post);
    } catch (error) {
        console.error('Add Post Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getPostsByStartup = async (req, res) => {
    try {
        const { startup_id } = req.params;
        const posts = await StartupPost.findAll({
            where: { startup_id, status: 'APPROVED' },
            order: [['created_at', 'DESC']]
        });
        const signedPosts = await Promise.all(posts.map(p => signPostUrls(p.toJSON())));
        res.json(signedPosts);
    } catch (error) {
        console.error('Get Posts Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getAllPosts = async (req, res) => {
    try {
        let whereClause = { status: 'APPROVED' };

        // If user is authenticated, find their startup and exclude its posts
        if (req.dbUser) {
            const userStartup = await Startup.findOne({ where: { owner_user_id: req.dbUser.id } });
            if (userStartup) {
                const { Op } = require('sequelize');
                whereClause.startup_id = { [Op.ne]: userStartup.id };
            }
        }

        const posts = await StartupPost.findAll({
            where: whereClause,
            include: [{ model: Startup, as: 'startup', attributes: ['name', 'logo_url', 'tagline', 'owner_user_id'] }],
            order: [['created_at', 'DESC']]
        });
        const signedPosts = await Promise.all(posts.map(p => signPostUrls(p.toJSON())));
        res.json(signedPosts);
    } catch (error) {
        console.error('Get All Posts Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.updatePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, media_type, post_type, demo_link, external_link, comments_enabled, keep_media } = req.body;

        const post = await StartupPost.findByPk(id);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        // ── Resolve existing media URLs to keep ──────────────────────────────
        // `keep_media` is a JSON-stringified array of existing S3 keys/URLs
        // that the frontend wants to preserve. If omitted, all existing media
        // is kept unless new files are uploaded that fully replace it.
        let keptUrls = [];
        if (keep_media !== undefined) {
            try {
                const parsed = JSON.parse(keep_media);
                keptUrls = Array.isArray(parsed) ? parsed : [parsed];
            } catch {
                // keep_media sent as plain string (single URL)
                if (keep_media) keptUrls = [keep_media];
            }
        } else {
            // No keep_media field → preserve whatever is currently stored
            if (post.media_url) {
                try {
                    const parsed = JSON.parse(post.media_url);
                    keptUrls = Array.isArray(parsed) ? parsed : [post.media_url];
                } catch {
                    keptUrls = [post.media_url];
                }
            }
        }

        // ── Upload any new media files ────────────────────────────────────────
        let newlyUploadedUrls = [];
        let detectedMediaType = null;

        if (req.files && req.files.media && req.files.media.length > 0) {
            const mediaFiles = req.files.media;
            newlyUploadedUrls = await Promise.all(
                mediaFiles.map(async (mediaFile) => {
                    const mediaId = uuidv4();
                    return uploadImageToS3(
                        mediaFile.buffer,
                        'startup-posts',
                        mediaId,
                        mediaFile.mimetype
                    );
                })
            );
            // Auto-detect type from first new file when not explicitly provided
            if (!media_type) {
                detectedMediaType = mediaFiles[0].mimetype.startsWith('video') ? 'VIDEO' : 'IMAGE';
            }
        }

        // ── Merge kept + newly uploaded URLs ─────────────────────────────────
        const allUrls = [...keptUrls, ...newlyUploadedUrls];
        let media_url;
        if (allUrls.length === 0) {
            media_url = null;
        } else if (allUrls.length === 1) {
            media_url = allUrls[0]; // plain string for backward compat
        } else {
            media_url = JSON.stringify(allUrls); // JSON array for multi-media
        }

        // ── Optional thumbnail upload ─────────────────────────────────────────
        let thumbnail_url = post.thumbnail_url;
        if (req.files && req.files.thumbnail?.[0]) {
            const thumbFile = req.files.thumbnail[0];
            const thumbId = uuidv4();
            thumbnail_url = await uploadImageToS3(
                thumbFile.buffer,
                'startup-post-thumbnails',
                thumbId,
                thumbFile.mimetype
            );
        }

        await post.update({
            title: title !== undefined ? title : post.title,
            content: content !== undefined ? content : post.content,
            media_url,
            media_type: media_type !== undefined ? media_type : (detectedMediaType || post.media_type),
            thumbnail_url,
            post_type: post_type !== undefined ? post_type : post.post_type,
            demo_link: demo_link !== undefined ? demo_link : post.demo_link,
            external_link: external_link !== undefined ? external_link : post.external_link,
            comments_enabled: comments_enabled !== undefined
                ? (comments_enabled === 'false' || comments_enabled === false ? false : true)
                : post.comments_enabled,
            status: 'PENDING' // reset to pending for re-approval after edit
        });

        // Re-fetch to return the latest snapshot
        const updated = await StartupPost.findByPk(id);
        res.json({ message: 'Post updated successfully', post: updated });
    } catch (error) {
        console.error('Update Post Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.deletePost = async (req, res) => {
    try {
        const { id } = req.params;

        const post = await StartupPost.findByPk(id);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        await post.destroy();

        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Delete Post Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
