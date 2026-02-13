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
 * @param {string} [params.profile_status] - Filter by status (delivered/active/expired)
 * @returns {Promise<{data: Array, error: null, count: number, total_pages: number}>}
 */
export const getEsimProfiles = async ({
  page = 1,
  pageSize = 20,
  iccid,
  user_id,
  profile_status
}) => {
  try {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('page_size', pageSize);
    if (iccid) params.append('iccid', iccid);
    if (user_id) params.append('user_id', user_id);
    if (profile_status) params.append('profile_status', profile_status);

    const response = await esimProfilesAPI.get(`/admin/esim-profiles?${params.toString()}`);
    
    const responseData = response.data.data;
    
    return {
      data: responseData.profiles || [],
      error: null,
      count: responseData.total || 0,
      page: responseData.page || 1,
      total_pages: responseData.total_pages || 1
    };
  } catch (error) {
    return {
      data: [],
      error: error.response?.data?.error || error.message,
      count: 0,
      page: 1,
      total_pages: 1
    };
  }
};

/**
 * Manually trigger consumption data sync for a specific eSIM profile
 * @param {string} iccid - eSIM ICCID
 * @returns {Promise<{success: boolean, message: string, error: null|string}>}
 */
export const syncConsumption = async (iccid) => {
  try {
    const response = await esimProfilesAPI.post(`/admin/consumption/sync/${iccid}`);
    return {
      success: true,
      message: response.data.data?.message || 'Consumption sync completed',
      error: null
    };
  } catch (error) {
    // Backend returns standard error format: {status, title, message, error, responseCode}
    const errorData = error.response?.data;
    const errorMessage = errorData?.error || errorData?.message || error.message;
    
    return {
      success: false,
      message: '',
      error: errorMessage
    };
  }
};

export default esimProfilesAPI;
