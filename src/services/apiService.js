import axios from 'axios';

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  timeout: 10000,
});

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    if (
      (error.response?.status === 503 || 
       error.response?.data?.error?.includes('closed state')) &&
      !originalRequest._retry &&
      originalRequest._retryCount < MAX_RETRIES
    ) {
      originalRequest._retry = true;
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

      // Wait before retrying
      await sleep(RETRY_DELAY);

      // Check database health before retrying
      try {
        await api.get('/api/health');
        return api(originalRequest);
      } catch (healthError) {
        throw error;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
