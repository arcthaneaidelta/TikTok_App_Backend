const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const { spawn } = require('child_process');

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');
const VIDEOS_DIR = path.join(UPLOAD_DIR, 'videos');
const THUMBS_DIR = path.join(UPLOAD_DIR, 'thumbs');

fs.mkdirSync(VIDEOS_DIR, { recursive: true });
fs.mkdirSync(THUMBS_DIR, { recursive: true });

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

const buildBaseUrl = (req) => {
  const envBase = process.env.PUBLIC_URL && process.env.PUBLIC_URL.trim();
  if (envBase) return envBase.replace(/\/$/, '');
  const proto = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.get('host');
  return `${proto}://${host}`;
};

const buildPublicUrl = (req, filename) =>
  `${buildBaseUrl(req)}/uploads/videos/${filename}`;

const buildThumbUrl = (req, filename) =>
  `${buildBaseUrl(req)}/uploads/thumbs/${filename}`;

const removeStoredFile = (filename) => {
  if (!filename) return;
  fs.unlink(path.join(VIDEOS_DIR, filename), () => {});
};

const removeStoredThumb = (filename) => {
  if (!filename) return;
  fs.unlink(path.join(THUMBS_DIR, filename), () => {});
};

const _runFfmpeg = (videoPath, thumbPath, seekTime) => {
  return new Promise((resolve) => {
    const args = [
      '-y',
      '-ss', seekTime,
      '-i', videoPath,
      '-vframes', '1',
      '-vf', "scale='min(640,iw)':-2",
      '-q:v', '4',
      thumbPath,
    ];
    let stderr = '';
    let settled = false;
    const finish = (ok, reason) => {
      if (settled) return;
      settled = true;
      resolve({ ok, reason });
    };
    try {
      const ff = spawn('ffmpeg', args);
      ff.stderr.on('data', (d) => { stderr += d.toString(); });
      ff.on('error', (err) => finish(false, `spawn error: ${err.message}`));
      ff.on('close', (code) => {
        if (code === 0 && fs.existsSync(thumbPath)) finish(true, null);
        else finish(false, `exit ${code}: ${stderr.slice(-400)}`);
      });
    } catch (err) {
      finish(false, `sync error: ${err.message}`);
    }
  });
};

// Generate a JPEG thumbnail from a video using ffmpeg. Resolves to the
// thumbnail filename on success, or null if ffmpeg is unavailable / fails.
// Tries 0.5s into the video first, falls back to frame 0 for very short clips.
const generateThumbnail = async (videoFilename) => {
  const videoPath = path.join(VIDEOS_DIR, videoFilename);
  if (!fs.existsSync(videoPath)) {
    console.warn(`[thumb] source missing: ${videoPath}`);
    return null;
  }
  const thumbFilename = `${path.parse(videoFilename).name}.jpg`;
  const thumbPath = path.join(THUMBS_DIR, thumbFilename);

  let result = await _runFfmpeg(videoPath, thumbPath, '00:00:00.5');
  if (!result.ok) {
    console.warn(`[thumb] first attempt failed for ${videoFilename}: ${result.reason}`);
    result = await _runFfmpeg(videoPath, thumbPath, '00:00:00');
  }
  if (!result.ok) {
    console.error(`[thumb] both attempts failed for ${videoFilename}: ${result.reason}`);
    return null;
  }
  console.log(`[thumb] generated ${thumbFilename}`);
  return thumbFilename;
};

module.exports = {
  upload,
  UPLOAD_DIR,
  VIDEOS_DIR,
  THUMBS_DIR,
  buildPublicUrl,
  buildThumbUrl,
  removeStoredFile,
  removeStoredThumb,
  generateThumbnail,
};
