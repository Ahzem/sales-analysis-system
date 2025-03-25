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
            const response = await api.post('/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    setProgress(percentCompleted);
                },
            });
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