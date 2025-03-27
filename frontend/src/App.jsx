import React from 'react';
import FileUploader from './components/FileUploader';
import './App.css';

const App = () => {
    return (
        <div className="container">
            <h1>Sales Analytics</h1>
            <p className="subtitle">Upload your sales data for AI-powered insights</p>
            <FileUploader />
        </div>
    );
};

export default App;