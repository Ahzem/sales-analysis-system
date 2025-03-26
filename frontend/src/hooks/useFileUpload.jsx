import { useState } from 'react';
import api from '../utils/api';

const useFileUpload = () => {
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);

    const uploadFile = async (file) => {
        setIsUploading(true);
        setProgress(0);
        setError(null);

        try {
            // Simulate progress updates
            const progressInterval = setInterval(() => {
                setProgress(prev => {
                    const increment = Math.random() * 10;
                    const newProgress = Math.min(prev + increment, 90); // Max 90% for simulation
                    return newProgress;
                });
            }, 500);

            // Upload file
            const response = await api.upload(file);
            
            // Complete progress
            clearInterval(progressInterval);
            setProgress(100);
            
            return response.data;
        } catch (err) {
            setError(err.response?.data?.message || 'Upload failed. Please try again.');
            throw err;
        } finally {
            // Small delay before completing to make UI feel smoother
            setTimeout(() => {
                setIsUploading(false);
                setProgress(0);
            }, 500);
        }
    };

    return { uploadFile, isUploading, progress, error };
};

export default useFileUpload;