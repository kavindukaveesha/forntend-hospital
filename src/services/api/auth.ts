// src/services/api/auth.ts
import api from '@/lib/axios';
import { LoginUserDto, RegisterUserDto } from '@/lib/types/drugImporter';
import { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';
import { tokenService } from '@/lib/axios';

export const authService = {
  login: async (loginData: LoginUserDto): Promise<string> => {
    try {
      const response = await api.post<any>('/login', loginData);
      
      // Extract token and ID from response
      let token = '';
      let drugImporterId = null;
      
      // Check different response formats
      if (typeof response.data === 'string') {
        // If response is just a string token
        token = response.data;
      } else if (response.data && typeof response.data === 'object') {
        if (response.data.token) {
          // If response is { token: "...", ... }
          token = response.data.token;
          
          // Extract importer ID if available
          if (response.data.drugImporterId) {
            drugImporterId = response.data.drugImporterId;
          } else if (response.data.user && response.data.user.id) {
            drugImporterId = response.data.user.id;
          }
        } else if (response.data.accessToken) {
          // If response is { accessToken: "...", ... }
          token = response.data.accessToken;
          
          // Extract importer ID if available
          if (response.data.userId) {
            drugImporterId = response.data.userId;
          }
        }
      }
      
      if (!token) {
        throw new Error('No token received from server');
      }
      
      // Store token
      tokenService.setToken(token);
      
      // Store drug importer ID if available
      if (drugImporterId) {
        tokenService.setDrugImporterId(drugImporterId);
      }
      
      toast.success('Login successful!');
      return token;
    } catch (error) {
      const axiosError = error as AxiosError;
      const errorMessage = (axiosError.response?.data as any)?.message || 'Login failed. Please check your credentials.';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },
  
  register: async (registerData: RegisterUserDto): Promise<string> => {
    try {
      const response = await api.post<string>('/register', registerData);
      toast.success('Registration successful! Please check your email to activate your account.');
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      const errorMessage = (axiosError.response?.data as any)?.message || 'Registration failed. Please try again.';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },
  
  activate: async (token: string): Promise<object> => {
    try {
      const response = await api.get<object>(`/activate?token=${token}`);
      toast.success('Account activated successfully!');
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      const errorMessage = (axiosError.response?.data as any)?.message || 'Account activation failed.';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },
  
  forgotPassword: async (email: string): Promise<object> => {
    try {
      const response = await api.get<object>(`/forgotten-password?email=${email}`);
      toast.success('Password reset instructions have been sent to your email.');
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      const errorMessage = (axiosError.response?.data as any)?.message || 'Failed to send password reset instructions.';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },
  
  resetPasswordToken: async (token: string, body: string): Promise<object> => {
    try {
      const response = await api.get<object>(`/reset-password-Token?token=${token}`, {
        data: body
      });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      const errorMessage = (axiosError.response?.data as any)?.message || 'Invalid or expired reset token.';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },
  
  resetPassword: async (resetData: Record<string, string>): Promise<object> => {
    try {
      const response = await api.post<object>('/reset-password', resetData);
      toast.success('Password has been reset successfully!');
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      const errorMessage = (axiosError.response?.data as any)?.message || 'Failed to reset password.';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },
  
  validateToken: async (): Promise<boolean> => {
    try {
      // Get token from storage
      const token = tokenService.getToken();
      
      // If no token, return false
      if (!token) {
        return false;
      }
      
      // Send token in the body as per API spec
      const response = await api.post<object>('/validate', { token });
      return true;
    } catch (error) {
      // If validation fails, clear the auth data
      tokenService.clearToken();
      return false;
    }
  },

  logout: async (): Promise<void> => {
    try {
      // Clear all authentication data
      tokenService.clearToken();
      toast.success('Logged out successfully!');
    } catch (error) {
      const errorMessage = 'Failed to logout properly.';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },
  
  isAuthenticated: (): boolean => {
    return tokenService.isAuthenticated();
  }
};

export default authService;