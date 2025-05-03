import axios from 'axios';
import { toast } from 'react-hot-toast';

// Token constants
const TOKEN_KEY = 'authToken';
const TOKEN_EXPIRY_KEY = 'tokenExpiry';
const DRUG_IMPORTER_ID_KEY = 'drugImporterId';
const TOKEN_EXPIRY_TIME = 60 * 60 * 1000; // 1 hour in milliseconds

// Token management functions
export const tokenService = {
  setToken: (token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    // Set token expiry time - 1 hour from now
    const expiryTime = new Date().getTime() + TOKEN_EXPIRY_TIME;
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
  },
  
  getToken: () => {
    const token = localStorage.getItem(TOKEN_KEY);
    const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY);
    
    // If no token or expiry, return null
    if (!token || !expiryTime) return null;
    
    // Check if token is expired
    const now = new Date().getTime();
    if (now > parseInt(expiryTime)) {
      // Token expired, clear it and notify user if not already on login page
      tokenService.clearToken();
      
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/login')) {
        toast.error('Your session has expired. Please log in again.');
        setTimeout(() => {
          window.location.href = '/auth/login';
        }, 1500); // Delay to allow user to see the toast message
      }
      
      return null;
    }
    
    // Refresh expiry time on each use to maintain the session
    // Only refresh if at least 5 minutes have passed to avoid excessive writes
    const timeRemaining = parseInt(expiryTime) - now;
    if (timeRemaining < TOKEN_EXPIRY_TIME - (5 * 60 * 1000)) {
      const newExpiryTime = new Date().getTime() + TOKEN_EXPIRY_TIME;
      localStorage.setItem(TOKEN_EXPIRY_KEY, newExpiryTime.toString());
    }
    
    return token;
  },
  
  clearToken: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    localStorage.removeItem(DRUG_IMPORTER_ID_KEY);
  },
  
  isAuthenticated: () => {
    return !!tokenService.getToken();
  },
  
  // Drug importer ID functions
  setDrugImporterId: (id: number | string) => {
    localStorage.setItem(DRUG_IMPORTER_ID_KEY, id.toString());
  },
  
  getDrugImporterId: () => {
    const id = localStorage.getItem(DRUG_IMPORTER_ID_KEY);
    return id ? parseInt(id) : null;
  }
};

// Create axios instance with base URL
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor to add authorization token
api.interceptors.request.use(
  (config) => {
    // Get token using our token service
    const token = tokenService.getToken();
    
    // If token exists, add it to the request headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add drugImporterId to all requests that might need it
    if (config.url?.includes('/quotations') || 
        config.url?.includes('/request-status')) {
      const drugImporterId = tokenService.getDrugImporterId();
      if (drugImporterId && !config.params?.drugImporterId) {
        // Only add if not already in params
        config.params = {
          ...config.params,
          drugImporterId
        };
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Flag to prevent multiple auth error messages
let authErrorDisplayed = false;

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Prevent redirect loops when already on login page
    const isLoginPage = typeof window !== 'undefined' && window.location.pathname.includes('/auth/login');
    
    // Handle specific error cases
    if (error.response) {
      // Server responded with an error status
      const { status, data } = error.response;
      // Log the error for debugging
      console.error('Server Error:', data?.message || 'Unknown server error');
      
      switch (status) {
        case 401: // Unauthorized - token is invalid or expired
          // Prevent infinite loops for refresh token attempts
          if (!originalRequest._retry && !isLoginPage && !authErrorDisplayed) {
            originalRequest._retry = true;
            authErrorDisplayed = true; // Prevent multiple messages
            
            // Clear invalid tokens
            tokenService.clearToken();
            
            // Redirect to login page with delay to show toast
            if (typeof window !== 'undefined') {
              toast.error('Your session has expired. Please log in again.');
              setTimeout(() => {
                window.location.href = '/auth/login';
                // Reset the flag after navigation
                setTimeout(() => {
                  authErrorDisplayed = false;
                }, 1000);
              }, 1500);
            }
          }
          break;
        case 403: // Forbidden - user doesn't have permission
          toast.error(data?.message || 'You do not have permission to perform this action.');
          break;
        case 404: // Not Found
          toast.error(data?.message || 'Resource not found.');
          break;
        case 500: // Server error
          // For server errors, especially token-related ones
          if ((data?.message?.includes('Invalid') || data?.message?.includes('Expired') || data?.message?.includes('Token')) 
                && !isLoginPage && !authErrorDisplayed) {
            authErrorDisplayed = true; // Prevent multiple messages
            
            // Clear tokens as they're invalid
            tokenService.clearToken();
            
            // Redirect to login page
            if (typeof window !== 'undefined') {
              toast.error('Your session has expired. Please log in again.');
              setTimeout(() => {
                window.location.href = '/auth/login';
                // Reset the flag after navigation
                setTimeout(() => {
                  authErrorDisplayed = false;
                }, 1000);
              }, 1500);
            }
          } else {
            toast.error(data?.message || 'An unexpected server error occurred. Please try again later.');
          }
          break;
        default:
          // Handle any other status codes
          toast.error(data?.message || `An error occurred (${status}). Please try again later.`);
          break;
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Network Error:', error.request);
      toast.error('Network error. Please check your internet connection and try again.');
    } else {
      // Something happened in setting up the request
      console.error('Request Error:', error.message);
      toast.error('An error occurred while setting up the request. Please try again.');
    }
    return Promise.reject(error);
  }
);

// Function to check token validity and refresh if needed
export const checkTokenValidity = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY);
  
  if (token && expiryTime) {
    const now = new Date().getTime();
    const expiry = parseInt(expiryTime);
    
    // If token is expired and user is not on login page
    if (now > expiry && typeof window !== 'undefined' && !window.location.pathname.includes('/auth/login')) {
      // Clear token
      tokenService.clearToken();
      
      // Show notification and redirect
      if (!authErrorDisplayed) {
        authErrorDisplayed = true;
        toast.error('Your session has expired. Please log in again.');
        setTimeout(() => {
          window.location.href = '/auth/login';
          setTimeout(() => {
            authErrorDisplayed = false;
          }, 1000);
        }, 1500);
      }
      
      return false;
    }
    
    // If token will expire in next 5 minutes, extend it
    if (expiry - now < 5 * 60 * 1000) {
      const newExpiryTime = now + TOKEN_EXPIRY_TIME;
      localStorage.setItem(TOKEN_EXPIRY_KEY, newExpiryTime.toString());
    }
  }
  
  return !!token;
};

export default api;