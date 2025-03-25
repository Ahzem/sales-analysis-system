import React from 'react';
import '../styles/ProgressBar.css';

const ProgressBar = ({ progress = 0 }) => {
  return (
    <div className="progress-container">
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <span className="progress-text">{progress}%</span>
    </div>
  );
};

export default ProgressBar;