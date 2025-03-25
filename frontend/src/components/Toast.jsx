import React, { useEffect } from 'react';
import { FaCheck, FaTimes, FaLink, FaCopy } from 'react-icons/fa';
import { BiErrorCircle } from 'react-icons/bi';
import '../styles/Toast.css';

const Toast = ({ message, url, isVisible, onClose, type = 'success', duration = 5000 }) => {
    
    useEffect(() => {
        let timer;
        if (isVisible) {
            timer = setTimeout(() => {
                onClose();
            }, duration);
        }
        
        return () => {
            clearTimeout(timer);
        };
    }, [isVisible, onClose, duration]);
    
    const copyToClipboard = () => {
        navigator.clipboard.writeText(url);
        // You could add a small notification here that copying was successful
    };
    
    if (!isVisible) return null;
    
    return (
        <div className={`toast toast-visible ${type}`}>
            <div className="toast-content">
                <div className="toast-icon">
                    {type === 'success' ? <FaCheck /> : <BiErrorCircle />}
                </div>
                <div className="toast-message">
                    <p>{message}</p>
                    {url && (
                        +
                        <div className="url-container">
                            <FaLink className="url-icon" />
                            <span className="url-text">{url}</span>
                            <button 
                                className="copy-button" 
                                onClick={copyToClipboard}
                                aria-label="Copy link to clipboard"
                            >
                                <FaCopy className="icon" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <button className="toast-close" onClick={onClose} aria-label="Close notification">
                <FaTimes />
            </button>
        </div>
    );
};

export default Toast;