const { uploadFileToS3 } = require('../services/s3Service');
const File = require('../models/FileModel');

const uploadFile = async (req, res, next) => {
    try {
        const file = req.file;
        const browserId = req.body.browserId; // Get browser ID from request body

        if (!file) {
            return res.status(400).json({ message: 'File is required.' });
        }

        // Validate file type
        if (!file.mimetype.includes('csv')) {
            return res.status(400).json({ message: 'Only CSV files are allowed.' });
        }

        // Upload file to S3
        const result = await uploadFileToS3(file);

        // Save file metadata to MongoDB
        const newFile = new File({
            file_name: file.originalname,
            file_url: result.Location,
            file_type: file.mimetype,
            browser_id: browserId,
        });
        await newFile.save();

        res.status(200).json({ 
            message: 'File uploaded successfully!', 
            url: result.Location,
            fileId: newFile._id
        });
    } catch (err) {
        next(err);
    }
};

module.exports = { uploadFile };