// src/hooks/use-api.ts
import { useState, useCallback } from 'react';
import { ApiError } from '@/lib/axios';
import { toast } from 'react-hot-toast';

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: ApiError) => void;
  successMessage?: string;
  loadingMessage?: string;
}

export function useApi<T>(
  apiCall: (...args: any[]) => Promise<T>,
  options: UseApiOptions<T> = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(
    async (...args: any[]) => {
      setIsLoading(true);
      setError(null);

      // Show loading toast if specified
      let loadingToastId;
      if (options.loadingMessage) {
        loadingToastId = toast.loading(options.loadingMessage);
      }

      try {
        const result = await apiCall(...args);
        setData(result);
        
        // Dismiss loading toast if it exists
        if (loadingToastId) {
          toast.dismiss(loadingToastId);
        }
        
        // Show success message if specified
        if (options.successMessage) {
          toast.success(options.successMessage);
        }
        
        // Call onSuccess callback if provided
        if (options.onSuccess) {
          options.onSuccess(result);
        }
        
        return result;
      } catch (err) {
        // Dismiss loading toast if it exists
        if (loadingToastId) {
          toast.dismiss(loadingToastId);
        }
        
        const apiError = err as ApiError;
        setError(apiError);
        
        // Call onError callback if provided
        if (options.onError) {
          options.onError(apiError);
        }
        
        throw apiError;
      } finally {
        setIsLoading(false);
      }
    },
    [apiCall, options]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    data,
    error,
    isLoading,
    execute,
    reset,
    setData,
  };
}