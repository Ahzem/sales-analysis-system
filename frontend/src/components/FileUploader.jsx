import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import useFileUpload from '../hooks/useFileUpload';
import { 
  FaCloudUploadAlt, 
  FaFolder, 
  FaFolderOpen, 
  FaFileAlt, 
  FaFilePdf, 
  FaFileExcel, 
  FaFileImage, 
  FaFileWord,
  FaFileCsv,
  FaTrash
} from 'react-icons/fa';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import Toast from '../components/Toast';
import ProgressBar from '../components/ProgressBar';
import ChatPage from '../components/ChatPage';
import '../styles/FileUploader.css';

const FileUploader = () => {
    const { uploadFile, isUploading, error, progress } = useFileUpload();
    const [selectedFile, setSelectedFile] = useState(null);
    const [toast, setToast] = useState({ visible: false, message: '', url: '', type: 'success' });
    const [uploadHistory, setUploadHistory] = useState(() => {
        const saved = localStorage.getItem('uploadHistory');
        return saved ? JSON.parse(saved) : [];
    });
    const [showChat, setShowChat] = useState(false);
    const [currentCsvFile, setCurrentCsvFile] = useState(null);

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
                const result = await uploadFile(file);
                
                // Update upload history
                const newHistory = [{
                    name: file.name,
                    size: formatBytes(file.size),
                    date: new Date().toLocaleString(),
                    url: result.url
                }, ...uploadHistory.slice(0, 4)];
                
                setUploadHistory(newHistory);
                localStorage.setItem('uploadHistory', JSON.stringify(newHistory));
                
                // Show success toast
                setToast({
                    visible: true,
                    message: 'File uploaded successfully! 🎉',
                    url: result.url,
                    type: 'success'
                });
                
                // Set the current CSV file for the chat page
                setCurrentCsvFile(file.name);
                
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

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
        onDrop,
        multiple: false,
        accept: {
            'text/csv': ['.csv']
        }
    });

    const removeHistoryItem = (index) => {
        const newHistory = [...uploadHistory];
        newHistory.splice(index, 1);
        setUploadHistory(newHistory);
        localStorage.setItem('uploadHistory', JSON.stringify(newHistory));
    };

    const clearHistory = () => {
        setUploadHistory([]);
        localStorage.removeItem('uploadHistory');
    };

    const handleChatWithFile = (file) => {
        setCurrentCsvFile({
            name: file.name,
            url: file.url,
            id: file._id
        });
        setShowChat(true);
    };

    // If chat page is active, show it
    if (showChat) {
        return <ChatPage onBack={() => setShowChat(false)} csvFilename={currentCsvFile} />;
    }

    return (
        <div className="file-uploader-container">
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
                            <p className="upload-text">Uploading your sales data...</p>
                            <ProgressBar progress={progress} />
                        </>
                    ) : isDragActive ? (
                        <p className="upload-text">Drop your sales data file here!</p>
                    ) : (
                        <>
                            <p className="upload-text">
                                Drag and drop your sales data file here or click to browse
                            </p>
                            <p className="upload-hint">
                                Upload a CSV file containing your sales data with columns for dates, products, quantities, prices, etc.
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

            {uploadHistory.length > 0 && (
                <div className="upload-history">
                    <div className="history-header">
                        <h3>Recent Uploads</h3>
                        <button className="clear-history" onClick={clearHistory}>Clear All</button>
                    </div>
                    <div className="history-list">
                        {uploadHistory.map((file, index) => (
                            <div key={index} className="history-item">
                                <div className="history-icon">
                                    {getFileIcon(file.name)}
                                </div>
                                <div className="history-details">
                                    <div className="history-name">{file.name}</div>
                                    <div className="history-meta">
                                        <span>{file.size}</span>
                                        <span>•</span>
                                        <span>{file.date}</span>
                                    </div>
                                </div>
                                <div className="history-actions">
                                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="view-btn">View</a>
                                    <button 
                                        className="chat-btn" 
                                        onClick={() => handleChatWithFile(file)}
                                    >
                                        Chat
                                    </button>
                                    <button onClick={() => removeHistoryItem(index)} className="delete-btn">
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

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