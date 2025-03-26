const File = require('../models/FileModel');

/**
 * Get files by browser ID
 * @param {string} browserId - The browser ID to filter files by
 * @returns {Promise<Array>} - List of files uploaded by this browser
 */
const getFilesByBrowserId = async (browserId) => {
    try {
        const files = await File.find({ browser_id: browserId })
            .select('_id file_name file_url file_type uploaded_at')
            .sort({ uploaded_at: -1 });
        return files;
    } catch (error) {
        console.error('Error fetching files by browser ID:', error);
        throw error;
    }
};

/**
 * Delete a file by ID
 * @param {string} fileId - The ID of the file to delete
 * @returns {Promise<Object>} - The deleted file
 */
const deleteFileById = async (fileId) => {
    try {
        // Soft delete by updating is_active to false
        const deletedFile = await File.findByIdAndUpdate(
            fileId, 
            { new: true }
        );
        
        if (!deletedFile) {
            throw new Error('File not found');
        }
        
        return deletedFile;
    } catch (error) {
        console.error('Error deleting file:', error);
        throw error;
    }
};

/**
 * Get a file URL by ID
 * @param {string} fileId - The ID of the file
 * @returns {Promise<string>} - The file URL
 */
const getFileUrlById = async (fileId) => {
    try {
        const file = await File.findById(fileId);
        
        if (!file) {
            throw new Error('File not found');
        }
        
        return file.file_url;
    } catch (error) {
        console.error('Error getting file URL by ID:', error);
        throw error;
    }
};

/**
 * Get URLs of files from MongoDB
 */
const getFileUrls = async () => {
    try {
        // Using proper projection syntax - empty filter object followed by projection
        const files = await File.find({}, { file_url: 1, _id: 0 });
        return files.map(file => file.file_url);
    } catch (error) {
        console.error('Error fetching file URLs:', error);
        throw error;
    }
};

module.exports = { 
    getFileUrls, 
    getFileUrlById, 
    getFilesByBrowserId, 
    deleteFileById 
};