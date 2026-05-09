const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');
const VIDEOS_DIR = path.join(UPLOAD_DIR, 'videos');

fs.mkdirSync(VIDEOS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, VIDEOS_DIR),
  filename: (req, file, cb) => {
    const ext = (path.extname(file.originalname) || '.mp4').toLowerCase();
    const id = crypto.randomBytes(16).toString('hex');
    cb(null, `${Date.now()}-${id}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) cb(null, true);
    else cb(new Error('Only video files are allowed'), false);
  },
});

const buildPublicUrl = (req, filename) => {
  const envBase = process.env.PUBLIC_URL && process.env.PUBLIC_URL.trim();
  if (envBase) {
    return `${envBase.replace(/\/$/, '')}/uploads/videos/${filename}`;
  }
  const proto = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.get('host');
  return `${proto}://${host}/uploads/videos/${filename}`;
};

const removeStoredFile = (filename) => {
  if (!filename) return;
  const filePath = path.join(VIDEOS_DIR, filename);
  fs.unlink(filePath, () => {});
};

module.exports = { upload, UPLOAD_DIR, VIDEOS_DIR, buildPublicUrl, removeStoredFile };
