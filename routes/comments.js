const express = require('express');
const router = express.Router();
const { getComments, addComment } = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

router.get('/:videoId', getComments);
router.post('/:videoId', protect, addComment);

module.exports = router;
