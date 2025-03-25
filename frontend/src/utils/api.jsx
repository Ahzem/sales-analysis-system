import axios from 'axios';

// Create two API instances - one for file uploads, one for AI chat
const fileApi = axios.create({
    baseURL: 'http://localhost:5000/api', // Node.js backend
    headers: {
        'Content-Type': 'application/json',
    },
});

const chatApi = axios.create({
    baseURL: 'http://localhost:5003', // Correct port for FastAPI backend
    headers: {
        'Content-Type': 'application/json',
    },
});

// Export a combined API object
const api = {
    // File upload operations (Node.js backend)
    upload: (formData) => {
        return fileApi.post('/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
    getUrls: () => fileApi.get('/urls'),
    
    // Chat operations (FastAPI backend)
    post: (endpoint, data) => {
        if (endpoint === '/chat') {
            return chatApi.post('/chat', data);
        }
        return fileApi.post(endpoint, data);
    }
};

export default api;