import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Task API calls
export const taskAPI = {
    getAll: () => api.get('/tasks/'),
    getById: (id) => api.get(`/tasks/${id}/`),
    create: (taskData) => api.post('/tasks/', taskData),
    update: (id, taskData) => api.patch(`/tasks/${id}/`, taskData),
    delete: (id) => api.delete(`/tasks/${id}/`),

    // Dependency operations - IMPROVED ERROR HANDLING
    addDependency: async (taskId, dependsOnId) => {
        try {
            const response = await api.post(`/tasks/${taskId}/add_dependency/`, {
                depends_on_id: dependsOnId
            });
            return response;
        } catch (error) {
            // Pass through the backend error message
            throw error.response?.data || { error: 'Failed to add dependency' };
        }
    },

    getDependencies: (taskId) => api.get(`/tasks/${taskId}/dependencies/`),
    getDependents: (taskId) => api.get(`/tasks/${taskId}/dependents/`),

    // Check circular dependency (for pre-checking)
    checkCircular: async (taskId, dependsOnId) => {
        try {
            const response = await api.post(`/tasks/${taskId}/add_dependency/`, {
                depends_on_id: dependsOnId
            });
            return response;
        } catch (error) {
            // Return the error for checking
            return Promise.reject(error.response?.data || { error: 'Check failed' });
        }
    },
};

// Dependency API calls
export const dependencyAPI = {
    getAll: () => api.get('/dependencies/'),
    delete: (id) => api.delete(`/dependencies/${id}/`),
};

export default api;