import axios, { type InternalAxiosRequestConfig } from 'axios';
import { redirect } from 'react-router-dom';


const baseURL = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api';
const rootUrl = import.meta.env.VITE_ROOT_URL;

const axiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance;

// Add a response interceptor to handle expired tokens
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid, redirect to login
      localStorage.removeItem('token');
      redirect(`/${rootUrl}/login`);
    }
    return Promise.reject(error);
  }
); 