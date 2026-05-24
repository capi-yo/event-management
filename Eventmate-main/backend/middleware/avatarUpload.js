const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure the upload directory exists on startup
const uploadDir = path.join(__dirname, '../../uploads/profile-images');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        // Sanitised filename: avatar_<userId>_<timestamp>.<ext>
        const filename = `avatar_${req.user.id}_${Date.now()}${ext}`;
        cb(null, filename);
    }
});

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

const fileFilter = (_req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPG, JPEG, PNG, and WEBP are allowed.'));
    }
};

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter
});

module.exports = upload;
