import api from '@/lib/axios';
import { QuotationDTO } from '@/lib/types/drugImporter';
import { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';

/**
 * Service for interacting with Quotations API
 */
export const quotationService = {
  /**
   * Get all quotations for the authenticated drug importer
   * @param drugImporterId Drug importer ID (required by backend)
   * @returns Promise with list of quotations
   */
  getAllQuotations: async (drugImporterId: number): Promise<QuotationDTO[]> => {
    try {
      // According to OpenAPI spec, drugImporterId is required as query parameter
      const response = await api.get<QuotationDTO[]>('/quotations', {
        params: { drugImporterId }
      });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('Error fetching quotations:', axiosError);
      const errorMessage = (axiosError.response?.data as any)?.message || 'Failed to fetch quotations.';
      toast.error(errorMessage);
      return [];
    }
  },
  
  /**
   * Get quotation by ID
   * @param id The ID of the quotation
   * @param drugImporterId Drug importer ID (required by backend)
   * @returns Promise with quotation details
   */
  getQuotationById: async (id: number, drugImporterId: number): Promise<QuotationDTO | null> => {
    try {
      const response = await api.get<QuotationDTO>(`/quotations/${id}`, {
        params: { drugImporterId }
      });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error(`Error fetching quotation ${id}:`, axiosError);
      const errorMessage = (axiosError.response?.data as any)?.message || `Failed to fetch quotation #${id}.`;
      toast.error(errorMessage);
      return null;
    }
  },
  
  /**
   * Create a new quotation
   * @param quotation The quotation data to create
   * @returns Promise with created quotation
   */
  createQuotation: async (quotation: QuotationDTO): Promise<QuotationDTO | null> => {
    try {
      const response = await api.post<QuotationDTO>('/quotations', quotation);
      
      toast.success('Quotation created successfully!');
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('Error creating quotation:', axiosError);
      const errorMessage = (axiosError.response?.data as any)?.message || 'Failed to create quotation.';
      toast.error(errorMessage);
      return null;
    }
  },
  
  /**
   * Update an existing quotation
   * @param id The ID of the quotation to update
   * @param quotation The updated quotation data
   * @returns Promise with updated quotation
   */
  updateQuotation: async (id: number, quotation: QuotationDTO): Promise<QuotationDTO | null> => {
    try {
      const response = await api.put<QuotationDTO>(`/quotations/${id}`, quotation);
      
      toast.success('Quotation updated successfully!');
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error(`Error updating quotation ${id}:`, axiosError);
      const errorMessage = (axiosError.response?.data as any)?.message || 'Failed to update quotation.';
      toast.error(errorMessage);
      return null;
    }
  },
  
  /**
   * Delete a quotation
   * @param id The ID of the quotation to delete
   * @param drugImporterId Drug importer ID (required by backend)
   * @returns Promise indicating success
   */
  deleteQuotation: async (id: number, drugImporterId: number): Promise<boolean> => {
    try {
      await api.delete(`/quotations/${id}`, {
        params: { drugImporterId }
      });
      
      toast.success('Quotation deleted successfully!');
      return true;
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error(`Error deleting quotation ${id}:`, axiosError);
      const errorMessage = (axiosError.response?.data as any)?.message || 'Failed to delete quotation.';
      toast.error(errorMessage);
      return false;
    }
  },
  
  /**
   * Send a quotation
   * @param id The ID of the quotation to send
   * @param drugImporterId Drug importer ID (required by backend)
   * @returns Promise with the sent quotation
   */
  sendQuotation: async (id: number, drugImporterId: number): Promise<QuotationDTO | null> => {
    try {
      const response = await api.post<QuotationDTO>(`/quotations/${id}/send`, null, {
        params: { drugImporterId }
      });
      
      toast.success('Quotation sent successfully!');
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error(`Error sending quotation ${id}:`, axiosError);
      const errorMessage = (axiosError.response?.data as any)?.message || 'Failed to send quotation.';
      toast.error(errorMessage);
      return null;
    }
  }
};

export default quotationService;