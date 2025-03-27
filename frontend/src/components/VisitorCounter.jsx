import React, { useState, useEffect } from 'react';
import { FaUsers, FaChartLine } from 'react-icons/fa';
import api from '../utils/api';
import '../styles/VisitorCounter.css';

const VisitorCounter = () => {
  const [visitorStats, setVisitorStats] = useState({
    totalVisitors: 0,
    activeToday: 0,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    const trackVisit = async () => {
      try {
        const response = await api.trackVisit();
        if (response && response.data) {
          setVisitorStats({
            totalVisitors: response.data.totalVisitors || 0,
            activeToday: response.data.activeToday || 0,
            isLoading: false,
            error: null
          });
        }
      } catch (error) {
        console.error("Failed to track visit:", error);
        setVisitorStats(prev => ({
          ...prev,
          isLoading: false,
          error: "Failed to load visitor stats"
        }));
      }
    };

    trackVisit();
  }, []);

  if (visitorStats.isLoading) {
    return (
      <div className="visitor-counter visitor-counter-loading">
        <div className="visitor-counter-spinner"></div>
      </div>
    );
  }

  if (visitorStats.error) {
    return null; // Don't show anything if there's an error
  }

  return (
    <div className="visitor-counter">
      <div className="visitor-stat">
        <FaUsers className="visitor-icon" />
        <div className="visitor-info">
          <span className="visitor-count">{visitorStats.totalVisitors.toLocaleString()}</span>
          <span className="visitor-label">Total Users</span>
        </div>
      </div>
      
      <div className="visitor-stat">
        <FaChartLine className="visitor-icon" />
        <div className="visitor-info">
          <span className="visitor-count">{visitorStats.activeToday.toLocaleString()}</span>
          <span className="visitor-label">Active Today</span>
        </div>
      </div>
    </div>
  );
};

export default VisitorCounter;