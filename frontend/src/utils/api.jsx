import axios from 'axios';

// Create two API instances - one for file uploads, one for AI chat
const fileApi = axios.create({
    baseURL: 'http://localhost:5000/api', // Node.js backend
    headers: {
        'Content-Type': 'application/json',
    },
});

const chatApi = axios.create({
    baseURL: 'http://localhost:5002', // FastAPI backend
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

// Export a combined API object
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

export default api;