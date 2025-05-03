import api from '@/lib/axios';
import { UpdateRequest, RequestStatusResponse } from '@/lib/types/drugImporter';
import { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';

export const requestStatusService = {
  updateRequestStatus: async (id: number, updateRequest: UpdateRequest): Promise<RequestStatusResponse | null> => {
    try {
      const response = await api.put<RequestStatusResponse>(`/request-status/${id}`, updateRequest);
      
      // Display appropriate toast message based on status
      const status = updateRequest.status.toLowerCase();
      if (status === 'accepted') {
        toast.success('Request has been accepted successfully!');
      } else if (status === 'reject') {
        toast.success('Request has been rejected.');
      } else if (status === 'send') {
        toast.success('Request has been sent successfully!');
      } else {
        toast.success('Request status updated successfully!');
      }
      
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error(`Error updating request status ${id}:`, axiosError);
      const errorMessage = (axiosError.response?.data as any)?.message || 'Failed to update request status.';
      toast.error(errorMessage);
      return null;
    }
  }
};

export default requestStatusService;