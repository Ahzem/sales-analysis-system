import { useState } from 'react';
import api from '../utils/api';

const useFileUpload = () => {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState(null);
    const [progress, setProgress] = useState(0);

    const uploadFile = async (file) => {
        setIsUploading(true);
        setError(null);
        setProgress(0);

        const formData = new FormData();
        formData.append('file', file);

        try {
            // Use the upload method from the updated api object
            const response = await api.upload(formData);
            return response.data;
        } catch (err) {
            setError(err.response?.data?.message || 'Error uploading file');
            throw err;
        } finally {
            setIsUploading(false);
        }
    };

    return { uploadFile, isUploading, error, progress };
};

export default useFileUpload;