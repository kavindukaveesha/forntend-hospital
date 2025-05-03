import api from '@/lib/axios';
import { 
  DrugImporterRegisterRequest,
  DrugImporterUpdateRequest,
  ApiResponse,
  DrugImporterResponse,
  DrugImporterRequestDetailDto,
} from '@/lib/types/drugImporter';
import { toast } from 'react-hot-toast';
import { AxiosError } from 'axios';

// Maximum number of retries for API calls
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 second delay between retries

// Sleep function for retry delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const drugImporterService = {
  /**
   * Registers a new drug importer
   * @param data Registration data including personal info and document URLs
   * @returns Promise with API response
   */
  register: async (data: DrugImporterRegisterRequest): Promise<ApiResponse<void>> => {
    try {
      const response = await api.post<ApiResponse<void>>('/drug-importer/register', data);
      toast.success('Drug importer registered successfully. Account activation email has been sent.');
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('Error registering drug importer:', axiosError);
      const errorMessage = (axiosError.response?.data as any)?.message || 'Failed to register drug importer.';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },
  
  /**
   * Retrieves the profile of the currently authenticated drug importer
   * @returns Promise with API response containing the drug importer profile
   */
  getCurrentProfile: async (): Promise<ApiResponse<DrugImporterResponse>> => {
    let retries = 0;
    
    while (retries <= MAX_RETRIES) {
      try {
        const response = await api.get<ApiResponse<DrugImporterResponse>>('/drug-importer/profile');
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError;
        console.error('Error fetching profile:', axiosError);
        
        // If this is the last retry, show error to user
        if (retries === MAX_RETRIES) {
          // Check for specific error status
          if (axiosError.response?.status === 401) {
            toast.error('Your session has expired. Please log in again.');
            // Clear token on unauthorized
            localStorage.removeItem('authToken');
            localStorage.removeItem('tokenExpiry');
            localStorage.removeItem('drugImporterId');
            // This error will be caught by the component to redirect
            throw new Error('Authentication error');
          } else {
            const errorMessage = (axiosError.response?.data as any)?.message || 'Failed to fetch profile.';
            toast.error(errorMessage);
            throw new Error(errorMessage);
          }
        }
        
        // Wait before retrying
        await sleep(RETRY_DELAY);
        retries++;
      }
    }
    
    // This should never be reached due to the throw in the catch block
    throw new Error('Failed to fetch profile after retries');
  },
  
  /**
   * Updates the current drug importer's profile
   * @param data The update data with document URLs
   * @returns Promise with API response containing the updated profile
   */
  updateProfile: async (data: DrugImporterUpdateRequest): Promise<ApiResponse<DrugImporterResponse>> => {
    try {
      const response = await api.put<ApiResponse<DrugImporterResponse>>('/drug-importer/profile', data);
      toast.success('Profile updated successfully!');
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('Error updating profile:', axiosError);
      const errorMessage = (axiosError.response?.data as any)?.message || 'Failed to update profile.';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },
  
  /**
   * Deletes the current drug importer's account
   * @returns Promise with API response confirming deletion
   */
  deleteAccount: async (): Promise<ApiResponse<void>> => {
    try {
      const response = await api.delete<ApiResponse<void>>('/drug-importer/profile');
      
      // Clear all auth data on account deletion
      localStorage.removeItem('authToken');
      localStorage.removeItem('tokenExpiry');
      localStorage.removeItem('drugImporterId');
      
      toast.success('Your account has been deleted successfully.');
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('Error deleting account:', axiosError);
      const errorMessage = (axiosError.response?.data as any)?.message || 'Failed to delete account.';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  },
  
  // Drug Importer Donation Requests endpoints
  
  /**
   * Gets all donation requests for the authenticated drug importer
   * @returns Promise with list of donation requests
   */
  getAllDonationRequests: async (): Promise<DrugImporterRequestDetailDto[]> => {
    try {
      const response = await api.get<DrugImporterRequestDetailDto[]>('/drug-importer/donation-requests');
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('Error fetching donation requests:', axiosError);
      const errorMessage = (axiosError.response?.data as any)?.message || 'Failed to fetch donation requests.';
      toast.error(errorMessage);
      return []; // Return empty array instead of throwing
    }
  },
  
  /**
   * Gets a donation request by ID
   * @param requestId The ID of the donation request
   * @returns Promise with donation request details
   */
  getDonationRequestById: async (requestId: number): Promise<DrugImporterRequestDetailDto | null> => {
    try {
      const response = await api.get<DrugImporterRequestDetailDto>(`/drug-importer/donation-requests/${requestId}`);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error(`Error fetching donation request ${requestId}:`, axiosError);
      const errorMessage = (axiosError.response?.data as any)?.message || 'Failed to fetch donation request.';
      toast.error(errorMessage);
      return null; // Return null instead of throwing
    }
  }
};

export default drugImporterService;