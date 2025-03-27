import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for sending/receiving cookies
  timeout: 30000,
});

// Create two API instances - one for file uploads, one for AI chat
const fileApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api', // Node.js backend
  headers: {
    'Content-Type': 'application/json',
  },
});

const chatApi = axios.create({
  baseURL: import.meta.env.VITE_CHAT_API_URL || 'http://localhost:5002', // FastAPI backend
  headers: {
    'Content-Type': 'application/json',
  },
});

// Generate or retrieve browser ID
const getBrowserId = () => {
  let browserId = localStorage.getItem('browserId');
  if (!browserId) {
    browserId = 'browser_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('browserId', browserId);
  }
  return browserId;
};

// File upload operations
const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('browserId', getBrowserId()); // Add browser ID
  
  const response = await fileApi.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

const getUrls = async () => {
  const response = await fileApi.get('/urls');
  return response.data;
};

// Browser history operations
const getFilesByBrowserId = async () => {
  const response = await fileApi.get(`/files/browser/${getBrowserId()}`);
  return response.data;
};

const deleteFile = async (fileId) => {
  const response = await fileApi.delete(`/files/${fileId}`);
  return response.data;
};

// Chat operations
const chatWithAI = async (endpoint, data) => {
  if (endpoint === '/chat') {
    return chatApi.post(endpoint, data);
  }
  return fileApi.post(endpoint, data);
};

// Get file URL by ID
const getFileUrlById = async (fileId) => {
  const response = await fileApi.get(`/url/${fileId}`);
  return response.data;
};

// Visitor tracking
const trackVisit = async () => {
  try {
    const response = await apiClient.post('/visits/track');
    return response.data;
  } catch (error) {
    console.error('Error tracking visit:', error);
    
    // Fallback to local mock if API fails
    return mockTrackVisit();
  }
};

// Mock implementation for visitor tracking
const mockTrackVisit = () => {
  // Generate a browser ID if not exists
  const browserId = localStorage.getItem('mockBrowserId') || 
    `mock-${Math.random().toString(36).substring(2, 10)}`;
  
  // Store the browser ID
  if (!localStorage.getItem('mockBrowserId')) {
    localStorage.setItem('mockBrowserId', browserId);
  }
  
  // Get or initialize visitor counts
  const storedData = localStorage.getItem('mockVisitorStats');
  let stats = storedData ? JSON.parse(storedData) : { total: 0, today: 0 };
  
  // Check if this browser was already counted as total
  if (!localStorage.getItem('mockCounted')) {
    stats.total += 1;
    localStorage.setItem('mockCounted', 'true');
  }
  
  // Check if already counted today
  const today = new Date().toDateString();
  const lastVisitDate = localStorage.getItem('mockLastVisitDate');
  
  if (lastVisitDate !== today) {
    stats.today = 1; // Reset for new day
  } else if (!localStorage.getItem('mockCountedToday')) {
    stats.today += 1;
  }
  
  // Update storage
  localStorage.setItem('mockLastVisitDate', today);
  localStorage.setItem('mockCountedToday', 'true');
  localStorage.setItem('mockVisitorStats', JSON.stringify(stats));
  
  return {
    success: true,
    data: {
      totalVisitors: stats.total,
      activeToday: stats.today
    }
  };
};

// Export all methods
export default {
  uploadFile,
  getUrls,
  getFilesByBrowserId,
  deleteFile,
  chatWithAI,
  getFileUrlById,
  trackVisit
};