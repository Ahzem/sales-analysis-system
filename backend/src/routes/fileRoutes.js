const express = require('express');
const multer = require('multer');
const { uploadFile } = require('../controllers/fileController');
const { 
    getFileUrls, 
    getFileUrlById, 
    getFilesByBrowserId, 
    deleteFileById 
} = require('../services/fileService');

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

router.get('/url/:id', async (req, res) => {
    try {
        const fileId = req.params.id;
        const url = await getFileUrlById(fileId);
        res.json({ url });
    } catch (error) {
        console.error('Error in /url/:id route:', error);
        if (error.message === 'File not found') {
            return res.status(404).json({ error: 'File not found' });
        }
        res.status(500).json({ error: 'Failed to fetch file URL', details: error.message });
    }
});

// New route to get files by browser ID
router.get('/files/browser/:browserId', async (req, res) => {
    try {
        const browserId = req.params.browserId;
        const files = await getFilesByBrowserId(browserId);
        res.json({ files });
    } catch (error) {
        console.error('Error fetching files by browser ID:', error);
        res.status(500).json({ error: 'Failed to fetch files', details: error.message });
    }
});

// New route to delete a file by ID
router.delete('/files/:id', async (req, res) => {
    try {
        const fileId = req.params.id;
        const deletedFile = await deleteFileById(fileId);
        res.json({ 
            message: 'File deleted successfully',
            file: deletedFile
        });
    } catch (error) {
        console.error('Error deleting file:', error);
        if (error.message === 'File not found') {
            return res.status(404).json({ error: 'File not found' });
        }
        res.status(500).json({ error: 'Failed to delete file', details: error.message });
    }
});

router.get('/test', (req, res) => {
    res.json({ message: 'API is working' });
});

module.exports = router;