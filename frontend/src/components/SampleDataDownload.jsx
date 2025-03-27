import React from 'react';
import { FaFileCsv, FaDownload, FaChartLine, FaTable, FaUserFriends } from 'react-icons/fa';
import '../styles/SampleDataDownload.css';

const SampleDataDownload = () => {
  // Sample CSV file URL
  const sampleCsvUrl = "https://data-analyst-ai-agent.s3.us-east-1.amazonaws.com/FanBudget.csv";

  return (
    <div className="sample-data-container">
      <div className="sample-data-card">
        <div className="sample-data-icon">
          <FaFileCsv />
        </div>
        <div className="sample-data-content">
          <h3>New to Sales Analysis? Try our sample data</h3>
          <p>
            Download this sample CSV file to explore our AI chatbot's capabilities. 
            Upload it to instantly analyze sales patterns, customer demographics, and financial metrics without using your own data.
          </p>
          
          <div className="sample-data-features">
            <div className="feature-item">
              <FaChartLine />
              <span>Sales metrics</span>
            </div>
            <div className="feature-item">
              <FaUserFriends />
              <span>Customer segments</span>
            </div>
            <div className="feature-item">
              <FaTable />
              <span>Product categories</span>
            </div>
          </div>
          
          <a 
            href={sampleCsvUrl} 
            download="FanBudget.csv"
            className="sample-download-btn"
          >
            <FaDownload /> Download Sample CSV
          </a>
        </div>
      </div>
    </div>
  );
};

export default SampleDataDownload;