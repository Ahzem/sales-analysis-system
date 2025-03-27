import React, { useEffect } from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';
import '../styles/CustomAlert.css';

const CustomAlert = ({ isVisible, title, message, onConfirm, onCancel }) => {
  useEffect(() => {
    if (isVisible) {
      // Prevent scrolling on the background when alert is open
      document.body.style.overflow = 'hidden';
      
      // Handle escape key to cancel
      const handleEscape = (e) => {
        if (e.key === 'Escape') onCancel();
      };
      
      window.addEventListener('keydown', handleEscape);
      return () => {
        window.removeEventListener('keydown', handleEscape);
      };
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [isVisible, onCancel]);

  if (!isVisible) return null;

  return (
    <div className="custom-alert-overlay">
      <div className="custom-alert">
        <div className="custom-alert-header">
          <FaExclamationTriangle className="alert-icon" />
          <h3>{title}</h3>
        </div>
        <div className="custom-alert-content">
          <p>{message}</p>
        </div>
        <div className="custom-alert-actions">
          <button 
            className="cancel-button" 
            onClick={onCancel}
            autoFocus
          >
            Cancel
          </button>
          <button 
            className="confirm-button" 
            onClick={onConfirm}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomAlert;