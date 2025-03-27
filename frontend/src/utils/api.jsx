import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create two API instances - one for file uploads, one for AI chat
const apiClient = axios.create({
    baseURL: API_URL,
    withCredentials: true, // Important for sending/receiving cookies
    timeout: 30000,
  });
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

const api = {
    // File upload operations (Node.js backend)
    upload: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('browserId', getBrowserId()); // Add browser ID
        
        return fileApi.post('/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
    getUrls: () => fileApi.get('/urls'),
    
    // Browser history operations
    getFilesByBrowserId: () => fileApi.get(`/files/browser/${getBrowserId()}`),
    deleteFile: (fileId) => fileApi.delete(`/files/${fileId}`),
    
    // Chat operations (FastAPI backend)
    post: (endpoint, data) => {
        if (endpoint === '/chat') {
            return chatApi.post(endpoint, data);
        }
        return fileApi.post(endpoint, data);
    },
    
    // Add a method to get file URL by ID
    getFileUrlById: (fileId) => fileApi.get(`/url/${fileId}`)
};


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
  
  // Mock implementation for development or when API fails
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

export default {
  trackVisit,
  api
};