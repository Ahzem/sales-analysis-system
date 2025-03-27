import React from 'react';
import FileUploader from './components/FileUploader';
import './App.css';
import VisitorCounter from './components/VisitorCounter';

const App = () => {
    return (
        <div className="container">
            <h1>AI Sales Analytics</h1>
            <p className="subtitle">Upload your sales data for AI-powered insights</p>
            <VisitorCounter />
            <FileUploader />
        </div>
    );
};

export default App;