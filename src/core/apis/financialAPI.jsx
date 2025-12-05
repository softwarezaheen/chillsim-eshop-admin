import axios from 'axios';

// Get API configuration from environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1/';
const ADMIN_API_KEY = import.meta.env.VITE_ADMIN_API_KEY;

// Create axios instance with admin authentication
const financialAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Admin-Key': ADMIN_API_KEY,
  },
});

// Add response interceptor for error handling
financialAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Financial API Error:', error);
    if (error.response) {
      // Server responded with error status
      throw new Error(error.response.data.message || error.response.data.detail || 'API request failed');
    } else if (error.request) {
      // Request made but no response
      throw new Error('No response from server. Please check your connection.');
    } else {
      // Error in request setup
      throw new Error(error.message || 'Request failed');
    }
  }
);

/**
 * Get all financial documents with optional filters and pagination
 * @param {Object} params - Filter and pagination parameters
 * @param {string} params.user_email - Optional user email filter
 * @param {string} params.document_number - Optional document number filter
 * @param {string} params.start_date - Optional start date filter (ISO 8601 format)
 * @param {string} params.end_date - Optional end date filter (ISO 8601 format)
 * @param {string} params.document_type - Optional filter by 'invoice' or 'credit_note'
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.page_size - Items per page (default: 50, max: 100)
 * @returns {Promise} Response with documents list and pagination info
 */
export const getAllDocuments = async (params = {}) => {
  try {
    const response = await financialAPI.post('/admin/documents', params);
    // Return in the same format as other APIs: { data, error, count }
    // Backend returns totalCount (camelCase)
    return { 
      data: response.data.data || response.data.documents || response.data || [], 
      error: null,
      count: response.data.totalCount || response.data.total || response.data.count || (response.data.data || response.data.documents || response.data || []).length
    };
  } catch (error) {
    return { data: [], error: error.message, count: 0 };
  }
};

/**
 * Get financial documents for a specific user
 * @param {string} userId - User's UUID
 * @param {Object} params - Query parameters
 * @param {string} params.start_date - Optional start date filter (ISO 8601 format)
 * @param {string} params.end_date - Optional end date filter (ISO 8601 format)
 * @param {string} params.document_type - Optional filter by 'invoice' or 'credit_note'
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.page_size - Items per page (default: 50, max: 100)
 * @returns {Promise} Response with documents list and pagination info
 */
export const getUserDocuments = async (userId, params = {}) => {
  try {
    const response = await financialAPI.get(`/admin/user-documents/${userId}`, { params });
    // Return in the same format as other APIs: { data, error, count }
    // Backend returns totalCount (camelCase)
    return { 
      data: response.data.data || response.data.documents || response.data || [], 
      error: null,
      count: response.data.totalCount || response.data.total || response.data.count || (response.data.data || response.data.documents || response.data || []).length
    };
  } catch (error) {
    return { data: [], error: error.message, count: 0 };
  }
};

/**
 * Download invoice PDF
 * @param {string} invoiceId - Invoice ID
 * @returns {Promise} Response with PDF blob
 */
export const downloadInvoice = async (invoiceId) => {
  try {
    const response = await financialAPI.get(`/admin/invoice/${invoiceId}`, {
      responseType: 'blob',
    });
    return { data: response.data, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * Download credit note PDF
 * @param {string} creditNoteId - Credit note ID
 * @returns {Promise} Response with PDF blob
 */
export const downloadCreditNote = async (creditNoteId) => {
  try {
    const response = await financialAPI.get(`/admin/credit-note/${creditNoteId}`, {
      responseType: 'blob',
    });
    return { data: response.data, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * Resend invoice email
 * @param {string} invoiceId - Invoice ID
 * @param {Object} data - Email data
 * @param {string} data.email - Recipient email address
 * @param {string} data.language - Email language (e.g., 'en', 'ro')
 * @returns {Promise} Response
 */
export const resendInvoiceEmail = async (invoiceId, data) => {
  try {
    const response = await financialAPI.post(`/admin/resend-invoice-email/${invoiceId}`, data);
    return { data: response.data, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * Resend credit note email
 * @param {string} creditNoteId - Credit note ID
 * @param {Object} data - Email data
 * @param {string} data.email - Recipient email address
 * @param {string} data.language - Email language (e.g., 'en', 'ro')
 * @returns {Promise} Response
 */
export const resendCreditNoteEmail = async (creditNoteId, data) => {
  try {
    const response = await financialAPI.post(`/admin/resend-credit-note-email/${creditNoteId}`, data);
    return { data: response.data, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * Document type enum
 */
export const DOCUMENT_TYPES = {
  INVOICE: 'invoice',
  CREDIT_NOTE: 'credit_note',
};

export default {
  getAllDocuments,
  getUserDocuments,
  downloadInvoice,
  downloadCreditNote,
  resendInvoiceEmail,
  resendCreditNoteEmail,
  DOCUMENT_TYPES,
};
