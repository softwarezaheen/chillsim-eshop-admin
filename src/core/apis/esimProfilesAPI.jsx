import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
const ADMIN_API_KEY = import.meta.env.VITE_ADMIN_API_KEY;

const esimProfilesAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Admin-Key': ADMIN_API_KEY,
  },
});

// Error interceptor
esimProfilesAPI.interceptors.response.use(
  response => response,
  error => {
    console.error('eSIM Profiles API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

/**
 * Get paginated list of eSIM profiles with bundles
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (1-indexed)
 * @param {number} params.pageSize - Items per page
 * @param {string} [params.iccid] - Filter by ICCID (partial match)
 * @param {string} [params.user_id] - Filter by user_id
 * @param {string} [params.user_email] - Filter by user email (partial match)
 * @param {string} [params.profile_status] - Filter by status (delivered/active/expired)
 * @param {string} [params.created_from] - Filter by creation date from (ISO format)
 * @param {string} [params.created_to] - Filter by creation date to (ISO format)
 * @returns {Promise<{data: Array, error: null, count: number, total_pages: number, statistics: Object}>}
 */
export const getEsimProfiles = async ({
  page = 1,
  pageSize = 20,
  iccid,
  user_id,
  user_email,
  profile_status,
  created_from,
  created_to
}) => {
  try {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('page_size', pageSize);
    if (iccid) params.append('iccid', iccid);
    if (user_id) params.append('user_id', user_id);
    if (user_email) params.append('user_email', user_email);
    if (profile_status) params.append('profile_status', profile_status);
    if (created_from) params.append('created_from', created_from);
    if (created_to) params.append('created_to', created_to);

    const response = await esimProfilesAPI.get(`/admin/esim-profiles?${params.toString()}`);
    
    const responseData = response.data.data;
    
    return {
      data: responseData.profiles || [],
      error: null,
      count: responseData.total || 0,
      page: responseData.page || 1,
      total_pages: responseData.total_pages || 1,
      statistics: responseData.statistics || {}
    };
  } catch (error) {
    return {
      data: [],
      error: error.response?.data?.error || error.message,
      count: 0,
      page: 1,
      total_pages: 1,
      statistics: {}
    };
  }
};

/**
 * Manually trigger consumption data sync for a specific eSIM profile
 * @param {string} iccid - eSIM ICCID
 * @returns {Promise<{success: boolean, message: string, profile: object|null, bundles: array, error: null|string}>}
 */
export const syncConsumption = async (iccid) => {
  try {
    const response = await esimProfilesAPI.post(`/admin/consumption/sync/${iccid}`);
    const data = response.data.data;
    
    return {
      success: true,
      message: data?.message || 'Consumption sync completed',
      profile: data?.profile || null,
      bundles: data?.bundles || [],
      error: null
    };
  } catch (error) {
    // Backend returns standard error format: {status, title, message, error, responseCode}
    const errorData = error.response?.data;
    const errorMessage = errorData?.error || errorData?.message || error.message;
    
    return {
      success: false,
      message: '',
      profile: null,
      bundles: [],
      error: errorMessage
    };
  }
};

/**
 * Bulk sync consumption data for all filtered eSIM profiles
 * WARNING: This is a long-running operation!
 * @param {Object} filters - Filter parameters (same as getEsimProfiles)
 * @param {string} [filters.iccid] - Filter by ICCID
 * @param {string} [filters.user_id] - Filter by user_id
 * @param {string} [filters.user_email] - Filter by user email
 * @param {string} [filters.profile_status] - Filter by status
 * @param {string} [filters.created_from] - Filter by creation date from (ISO)
 * @param {string} [filters.created_to] - Filter by creation date to (ISO)
 * @returns {Promise<{success: boolean, data: object, error: null|string}>}
 */
export const syncAllConsumption = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.iccid) params.append('iccid', filters.iccid);
    if (filters.user_id) params.append('user_id', filters.user_id);
    if (filters.user_email) params.append('user_email', filters.user_email);
    if (filters.profile_status) params.append('profile_status', filters.profile_status);
    if (filters.created_from) params.append('created_from', filters.created_from);
    if (filters.created_to) params.append('created_to', filters.created_to);

    const response = await esimProfilesAPI.post(`/admin/consumption/sync-all?${params.toString()}`);
    return {
      success: true,
      data: response.data.data || {},
      error: null
    };
  } catch (error) {
    const errorData = error.response?.data;
    const errorMessage = errorData?.error || errorData?.message || error.message;
    
    return {
      success: false,
      data: {},
      error: errorMessage
    };
  }
};

export default esimProfilesAPI;
