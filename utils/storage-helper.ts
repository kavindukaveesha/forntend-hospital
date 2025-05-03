// src/utils/storage-helper.ts

// Constants for localStorage keys
const TOKEN_KEY = 'authToken';
const DRUG_IMPORTER_ID_KEY = 'drugImporterId';

/**
 * Get token from localStorage
 * @returns Token string or null if not found
 */
export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Set token in localStorage
 * @param token Token string to store
 */
export const setToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
};

/**
 * Remove token from localStorage
 */
export const removeToken = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
};

/**
 * Get drug importer ID from localStorage
 * @param defaultValue Optional default value if ID not found
 * @returns Drug importer ID or default value
 */
export const getDrugImporterId = (defaultValue: number = 1): number => {
  if (typeof window === 'undefined') return defaultValue;
  
  const storedId = localStorage.getItem(DRUG_IMPORTER_ID_KEY);
  if (!storedId) return defaultValue;
  
  try {
    return parseInt(storedId, 10);
  } catch (error) {
    console.error('Error parsing drug importer ID:', error);
    return defaultValue;
  }
};

/**
 * Set drug importer ID in localStorage
 * @param id Drug importer ID to store
 */
export const setDrugImporterId = (id: number): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DRUG_IMPORTER_ID_KEY, id.toString());
};

/**
 * Remove drug importer ID from localStorage
 */
export const removeDrugImporterId = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(DRUG_IMPORTER_ID_KEY);
};

/**
 * Check if token exists in localStorage
 * @returns True if token exists
 */
export const hasToken = (): boolean => {
  return !!getToken();
};

/**
 * Clear all authentication data from localStorage
 */
export const clearAuthData = (): void => {
  removeToken();
  removeDrugImporterId();
};