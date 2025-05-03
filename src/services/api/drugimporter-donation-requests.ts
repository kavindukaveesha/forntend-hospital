import api from '@/lib/axios';
import { DrugImporterRequestDetailDto, RequestStatus } from '@/lib/types/drugImporter';
import { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';

/**
 * Service for interacting with Drug Importer Donation Requests API
 */
export const drugImporterRequestService = {
  /**
   * Get all donation requests for the drug importer
   * @returns Promise with list of donation requests
   */
  getAllDonationRequests: async (): Promise<DrugImporterRequestDetailDto[]> => {
    try {
      // Endpoint path matches the OpenAPI spec
      const response = await api.get<DrugImporterRequestDetailDto[]>('/drug-importer/donation-requests');
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('Error fetching donation requests:', axiosError);
      
      // Check for authentication errors
      if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
        toast.error('Authentication error. Please log in again.');
        // Let the axios interceptor handle the redirect
        return [];
      }
      
      const errorMessage = (axiosError.response?.data as any)?.message || 'Failed to fetch donation requests.';
      toast.error(errorMessage);
      return [];
    }
  },
  
  /**
   * Get donation request by ID
   * @param requestId The ID of the donation request
   * @returns Promise with donation request details
   */
  getDonationRequestById: async (
    requestId: number
  ): Promise<DrugImporterRequestDetailDto | null> => {
    try {
      const response = await api.get<DrugImporterRequestDetailDto>(`/drug-importer/donation-requests/${requestId}`);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error(`Error fetching donation request ${requestId}:`, axiosError);
      
      // Check for authentication errors
      if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
        toast.error('Authentication error. Please log in again.');
        // Let the axios interceptor handle the redirect
        return null;
      }
      
      const errorMessage = (axiosError.response?.data as any)?.message || 'Failed to fetch donation request details.';
      toast.error(errorMessage);
      return null;
    }
  },
  
  /**
   * Update the status of a request
   * @param requestId The ID of the donation request
   * @param status The new status value
   * @returns Promise with updated request status
   */
  updateRequestStatus: async (
    requestId: number,
    status: 'PENDING' | 'ACCEPTED' | 'REJECT' | 'SEND'
  ): Promise<RequestStatus | null> => {
    try {
      const response = await api.put<RequestStatus>(
        `/request-status/${requestId}`,
        { status }
      );
      
      let successMessage = '';
      switch (status.toLowerCase()) {
        case 'accepted':
          successMessage = 'Request has been accepted successfully!';
          break;
        case 'reject':
          successMessage = 'Request has been rejected.';
          break;
        case 'send':
          successMessage = 'Request has been sent successfully!';
          break;
        default:
          successMessage = `Request status updated to ${status.toLowerCase()}`;
      }
      
      toast.success(successMessage);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error(`Error updating request status for ${requestId}:`, axiosError);
      
      // Check for authentication errors
      if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
        toast.error('Authentication error. Please log in again.');
        // Let the axios interceptor handle the redirect
        return null;
      }
      
      const errorMessage = (axiosError.response?.data as any)?.message || 'Failed to update request status.';
      toast.error(errorMessage);
      return null;
    }
  }
};

export default drugImporterRequestService;