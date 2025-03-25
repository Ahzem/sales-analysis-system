const express = require('express');
const multer = require('multer');
const { getFileUrls } = require('../services/fileService');
const { uploadFile, getFile } = require('../controllers/fileController');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('file'), uploadFile);
router.get('/urls', async (req, res) => {
    try {
        const urls = await getFileUrls();
        console.log('Sending URLs:', urls);
        res.json({ urls });
    } catch (error) {
        console.error('Error in /urls route:', error);
        res.status(500).json({ error: 'Failed to fetch URLs', details: error.message });
    }
});
router.get('/test', (req, res) => {
    res.json({ message: 'API is working' });
});

router.get('/file', getFile);

module.exports = router;