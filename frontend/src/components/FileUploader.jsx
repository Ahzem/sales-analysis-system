import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import useFileUpload from '../hooks/useFileUpload';
import { 
  FaCloudUploadAlt, 
  FaFolderOpen, 
  FaFileAlt, 
  FaFileCsv,
  FaTrash,
  FaSync
} from 'react-icons/fa';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import Toast from '../components/Toast';
import ProgressBar from '../components/ProgressBar';
import ChatPage from '../components/ChatPage';
import api from '../utils/api';
import '../styles/FileUploader.css';
import { getChatHistory } from '../utils/chatHistoryUtils';
import SampleDataDownload from './SampleDataDownload';

const FileUploader = () => {
    const { isUploading, error, progress } = useFileUpload();
    const [selectedFile, setSelectedFile] = useState(null);
    const [toast, setToast] = useState({ visible: false, message: '', url: '', type: 'success' });
    const [uploadHistory, setUploadHistory] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [currentCsvFile, setCurrentCsvFile] = useState(null);
    const [currentFileId, setCurrentFileId] = useState(null);

    const fetchFileHistory = async () => {
        setIsLoadingHistory(true);
        try {
            const response = await api.getFilesByBrowserId();
            if (response && response.files) {
                setUploadHistory(response.files);
            }
        } catch (err) {
            console.error('Failed to fetch file history:', err);
            setToast({
                visible: true,
                message: 'Failed to load your file history.',
                type: 'error'
            });
        } finally {
            setIsLoadingHistory(false);
        }
    };

    useEffect(() => {
        fetchFileHistory();
    }, []);

    const getFileIcon = (filename) => {
        const extension = filename.split('.').pop().toLowerCase();
        if (['csv'].includes(extension)) return <FaFileCsv />;
        return <FaFileAlt />;
    };

    const onDrop = async (acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
            setSelectedFile(file);
            try {
                const result = await api.uploadFile(file);
                
                // Show success toast
                setToast({
                    visible: true,
                    message: 'File uploaded successfully! 🎉',
                    url: result.url,
                    type: 'success'
                });
                
                // Refresh file history
                fetchFileHistory();
                
                // Set the current CSV file and fileId for the chat page
                setCurrentCsvFile(file.name);
                setCurrentFileId(result.fileId);  // This should be returned from your backend
                
                // Navigate to chat after a short delay
                setTimeout(() => {
                    setShowChat(true);
                }, 1500);
                
                setSelectedFile(null);
            } catch (err) {
                console.error(err);
                setToast({
                    visible: true,
                    message: 'Upload failed. Please try again.',
                    type: 'error'
                });
            }
        }
    };

    const formatBytes = (bytes, decimals = 2) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
        onDrop,
        multiple: false,
        accept: {
            'text/csv': ['.csv']
        }
    });

    const handleDeleteFile = async (fileId) => {
        try {
            await api.deleteFile(fileId);
            
            // Update the local state to remove the file
            setUploadHistory(prev => prev.filter(file => file._id !== fileId));
            
            setToast({
                visible: true,
                message: 'File deleted successfully.',
                type: 'success'
            });
        } catch (err) {
            console.error('Failed to delete file:', err);
            setToast({
                visible: true,
                message: 'Failed to delete file. Please try again.',
                type: 'error'
            });
        }
    };

    const handleChatWithFile = (file) => {
        setCurrentCsvFile(file.file_name);
        setCurrentFileId(file._id);
        setShowChat(true);
    };

    if (showChat) {
        return <ChatPage 
            onBack={() => setShowChat(false)} 
            csvFilename={currentCsvFile} 
            fileId={currentFileId}
        />;
    }

    return (
        <div className="file-uploader-container">
            <SampleDataDownload />
            <div 
                {...getRootProps()} 
                className={`dropzone ${isUploading ? 'uploading' : ''} ${isDragActive ? 'active' : ''}`}
            >
                <input {...getInputProps()} />
                <div className="dropzone-content">
                    <div className="upload-icon">
                        {isUploading ? 
                            <AiOutlineLoading3Quarters className="spinning" /> : 
                            isDragActive ? <FaFolderOpen /> : <FaCloudUploadAlt />}
                    </div>
                    
                    {isUploading ? (
                        <>
                            <p className="upload-text">Uploading your file...</p>
                            <ProgressBar progress={progress} />
                        </>
                    ) : isDragActive ? (
                        <p className="upload-text">Drop your file here!</p>
                    ) : (
                        <>
                            <p className="upload-text">
                                Drag & drop a file here, or click to select
                            </p>
                            <p className="upload-hint">
                                Supported formats: CSV
                            </p>
                        </>
                    )}

                    {selectedFile && !isUploading && (
                        <div className="file-preview">
                            <span className="file-icon">{getFileIcon(selectedFile.name)}</span>
                            <div className="file-details">
                                <span className="file-name">{selectedFile.name}</span>
                                <span className="file-size">{formatBytes(selectedFile.size)}</span>
                            </div>
                        </div>
                    )}

                    {error && <p className="error-message">{error}</p>}
                </div>
            </div>

            <div className="upload-history">
                <div className="history-header">
                    <h3>Your Uploaded Files</h3>
                    <button 
                        className="refresh-history" 
                        onClick={fetchFileHistory} 
                        disabled={isLoadingHistory}
                    >
                        <FaSync className={isLoadingHistory ? "spinning" : ""} />
                    </button>
                </div>
                
                {isLoadingHistory ? (
                    <div className="loading-history">
                        <AiOutlineLoading3Quarters className="spinning" />
                        <p>Loading your files...</p>
                    </div>
                ) : uploadHistory.length > 0 ? (
                    <div className="history-list">
                        {uploadHistory.map((file) => {
                            const hasHistory = getChatHistory(file._id).length > 0;
                            return (
                            <div key={file._id} className="history-item">
                                <div className="history-icon">
                                    {getFileIcon(file.file_name)}
                                </div>
                                <div className="history-details">
                                    <div className="history-name">
                                        {file.file_name}
                                        {hasHistory && <span className="has-chat-badge">Chat history</span>}
                                    </div>
                                    <div className="history-meta">
                                        <span>{formatBytes(file.size || 0)}</span>
                                        <span>•</span>
                                        <span>{formatDate(file.uploaded_at)}</span>
                                    </div>
                                </div>
                                <div className="history-actions">
                                    <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="view-btn">View</a>
                                    <button 
                                            className="chat-btn" 
                                            onClick={() => handleChatWithFile(file)}
                                        >
                                            {hasHistory ? 'Continue Chat' : 'Chat'}
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteFile(file._id)} 
                                        className="delete-btn"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="empty-history">
                        <p>You haven't uploaded any files yet.</p>
                    </div>
                )}
            </div>

            <Toast 
                message={toast.message}
                url={toast.url}
                type={toast.type}
                isVisible={toast.visible}
                onClose={() => setToast(prev => ({ ...prev, visible: false }))}
            />
        </div>
    );
};

export default FileUploader;