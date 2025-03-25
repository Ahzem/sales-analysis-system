const { uploadFileToS3 } = require('../services/s3Service');
const File = require('../models/FileModel');

const uploadFile = async (req, res, next) => {
    try {
        const file = req.file;

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

const getFile = async (req, res, next) => {
    try {
        const { fileName, fileUrl, fileId } = req.query;
        let query = {};

        // Build query based on provided parameters
        if (fileName) {
            query.file_name = fileName;
        }
        if (fileUrl) {
            query.file_url = fileUrl;
        }
        if (fileId) {
            query._id = fileId;
        }

        // If no parameters provided, return error
        if (Object.keys(query).length === 0) {
            return res.status(400).json({
                message: 'At least one search parameter (fileName, fileUrl, or fileId) is required'
            });
        }

        const file = await File.findOne(query);

        if (!file) {
            return res.status(404).json({
                message: 'File not found'
            });
        }

        res.status(200).json({
            success: true,
            data: file
        });
    } catch (err) {
        next(err);
    }
};

module.exports = { uploadFile, getFile };
