import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
const ADMIN_API_KEY = import.meta.env.VITE_ADMIN_API_KEY;

const adminUsersAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Admin-Key': ADMIN_API_KEY,
  },
});

// Error interceptor
adminUsersAPI.interceptors.response.use(
  response => response,
  error => {
    console.error('Admin Users API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

/**
 * Get paginated list of users with aggregated data (wallet, orders, revenue)
 * @param {Object} params
 * @param {number} params.page - Page number (1-indexed)
 * @param {number} params.pageSize - Items per page
 * @param {string} [params.search] - Search by email, user ID, or name
 * @param {string} [params.created_from] - Account created from (ISO 8601)
 * @param {string} [params.created_to] - Account created to (ISO 8601)
 * @param {boolean} [params.has_orders] - Filter by order presence
 * @param {string} [params.account_source] - Filter by account source (email, google, apple, facebook)
 * @param {boolean} [params.marketing_subscribed] - Filter by marketing consent
 * @param {string} [params.sort_by] - Sort column
 * @param {string} [params.sort_dir] - Sort direction (asc/desc)
 */
export const getUsers = async ({
  page = 1,
  pageSize = 25,
  search,
  created_from,
  created_to,
  has_orders,
  account_source,
  marketing_subscribed,
  sort_by = 'created_at',
  sort_dir = 'desc'
} = {}) => {
  try {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('page_size', pageSize);
    if (search) params.append('search', search);
    if (created_from) params.append('created_from', created_from);
    if (created_to) params.append('created_to', created_to);
    if (has_orders !== undefined && has_orders !== null) params.append('has_orders', has_orders);
    if (account_source) params.append('account_source', account_source);
    if (marketing_subscribed !== undefined && marketing_subscribed !== null) params.append('marketing_subscribed', marketing_subscribed);
    if (sort_by) params.append('sort_by', sort_by);
    if (sort_dir) params.append('sort_dir', sort_dir);

    const response = await adminUsersAPI.get(`/admin/users?${params.toString()}`);
    const responseData = response.data.data;

    return {
      data: responseData?.items || [],
      error: null,
      count: responseData?.total_count || 0,
      page: responseData?.page || 1,
      total_pages: responseData?.total_pages || 1,
    };
  } catch (error) {
    return {
      data: [],
      error: error.response?.data?.message || error.message,
      count: 0,
      page: 1,
      total_pages: 1,
    };
  }
};

/**
 * Get detailed user information (billing, wallet, account metadata)
 * @param {string} userId
 */
export const getUserInfo = async (userId) => {
  try {
    const response = await adminUsersAPI.get(`/admin/users/${userId}`);
    return {
      data: response.data.data,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error.response?.data?.message || error.message,
    };
  }
};

/**
 * Get paginated orders for a user with statistics
 * @param {string} userId
 * @param {Object} params
 * @param {number} [params.page] - Page number (1-indexed)
 * @param {number} [params.pageSize] - Items per page
 * @param {string} [params.orderId] - Filter by order ID (partial match)
 * @param {boolean} [params.hideIncomplete] - Hide pending/failed/canceled orders
 * @param {string} [params.sortBy] - Sort column (created_at, payment_amount)
 * @param {string} [params.sortDir] - Sort direction (asc, desc)
 */
export const getUserOrders = async (
  userId, 
  { 
    page = 1, 
    pageSize = 10,
    orderId,
    hideIncomplete = false,
    sortBy = 'created_at',
    sortDir = 'desc'
  } = {}
) => {
  try {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('page_size', pageSize);
    if (orderId) params.append('order_id', orderId);
    params.append('hide_incomplete', hideIncomplete);
    params.append('sort_by', sortBy);
    params.append('sort_dir', sortDir);

    const response = await adminUsersAPI.get(`/admin/users/${userId}/orders?${params.toString()}`);
    const responseData = response.data.data;

    return {
      data: responseData?.items || [],
      error: null,
      count: responseData?.total_count || 0,
      page: responseData?.page || 1,
      total_pages: responseData?.total_pages || 1,
      statistics: responseData?.statistics || {},
    };
  } catch (error) {
    return {
      data: [],
      error: error.response?.data?.message || error.message,
      count: 0,
      statistics: {},
    };
  }
};

/**
 * Get paginated eSIM profiles for a user with statistics
 * @param {string} userId
 * @param {Object} params
 */
export const getUserEsimProfiles = async (userId, { iccidSearch, hideExpired, page = 1, pageSize = 10 } = {}) => {
  try {
    const params = new URLSearchParams();
    if (iccidSearch) params.append('iccid_search', iccidSearch);
    if (hideExpired !== undefined && hideExpired !== null) params.append('hide_expired', hideExpired);
    params.append('page', page);
    params.append('page_size', pageSize);

    const response = await adminUsersAPI.get(`/admin/users/${userId}/esim-profiles?${params.toString()}`);
    const responseData = response.data.data;

    return {
      data: responseData?.profiles || [],
      error: null,
      count: responseData?.total || 0,
      page: responseData?.page || 1,
      total_pages: responseData?.total_pages || 1,
      statistics: responseData?.statistics || {},
    };
  } catch (error) {
    return {
      data: [],
      error: error.response?.data?.message || error.message,
      count: 0,
      statistics: {},
    };
  }
};

/**
 * Get paginated bundles purchased by a user with statistics
 * @param {string} userId
 * @param {Object} params
 */
export const getUserBundles = async (userId, { page = 1, pageSize = 10, bundleSearch, hideExpired } = {}) => {
  try {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('page_size', pageSize);
    if (bundleSearch) params.append('bundle_search', bundleSearch);
    if (hideExpired !== undefined) params.append('hide_expired', hideExpired);

    const response = await adminUsersAPI.get(`/admin/users/${userId}/bundles?${params.toString()}`);
    const responseData = response.data.data;

    return {
      data: responseData?.items || [],
      error: null,
      count: responseData?.total_count || 0,
      page: responseData?.page || 1,
      total_pages: responseData?.total_pages || 1,
      statistics: responseData?.statistics || {},
    };
  } catch (error) {
    return {
      data: [],
      error: error.response?.data?.message || error.message,
      count: 0,
      statistics: {},
    };
  }
};

/**
 * Get paginated devices for a user (LIFO)
 * @param {string} userId
 * @param {Object} params
 */
export const getUserDevices = async (userId, { page = 1, pageSize = 10 } = {}) => {
  try {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('page_size', pageSize);

    const response = await adminUsersAPI.get(`/admin/users/${userId}/devices?${params.toString()}`);
    const responseData = response.data.data;

    return {
      data: responseData?.items || [],
      error: null,
      count: responseData?.total_count || 0,
      page: responseData?.page || 1,
      total_pages: responseData?.total_pages || 1,
    };
  } catch (error) {
    return {
      data: [],
      error: error.response?.data?.message || error.message,
      count: 0,
    };
  }
};

/**
 * Get paginated wallet transactions for a user
 * @param {string} userId
 * @param {Object} params
 */
export const getUserWalletTransactions = async (userId, { page = 1, pageSize = 10 } = {}) => {
  try {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('page_size', pageSize);

    const response = await adminUsersAPI.get(`/admin/users/${userId}/wallet-transactions?${params.toString()}`);
    const responseData = response.data.data;

    return {
      data: responseData?.items || [],
      error: null,
      count: responseData?.total_count || 0,
      page: responseData?.page || 1,
      total_pages: responseData?.total_pages || 1,
    };
  } catch (error) {
    return {
      data: [],
      error: error.response?.data?.message || error.message,
      count: 0,
    };
  }
};

/**
 * Get paginated promotion usage for a user
 * @param {string} userId
 * @param {Object} params
 */
export const getUserPromoUsage = async (userId, { page = 1, pageSize = 10 } = {}) => {
  try {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('page_size', pageSize);

    const response = await adminUsersAPI.get(`/admin/users/${userId}/promo-usage?${params.toString()}`);
    const responseData = response.data.data;

    return {
      data: responseData?.items || [],
      error: null,
      count: responseData?.total_count || 0,
      page: responseData?.page || 1,
      total_pages: responseData?.total_pages || 1,
    };
  } catch (error) {
    return {
      data: [],
      error: error.response?.data?.message || error.message,
      count: 0,
    };
  }
};

/**
 * Get paginated financial documents for a user
 * @param {string} userId
 * @param {Object} params
 */
export const getUserFinancialDocs = async (userId, { page = 1, pageSize = 10 } = {}) => {
  try {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('page_size', pageSize);

    const response = await adminUsersAPI.get(`/admin/users/${userId}/financial-documents?${params.toString()}`);
    const responseData = response.data.data;

    return {
      data: responseData?.items || [],
      error: null,
      count: responseData?.total_count || 0,
      page: responseData?.page || 1,
      total_pages: responseData?.total_pages || 1,
    };
  } catch (error) {
    return {
      data: [],
      error: error.response?.data?.message || error.message,
      count: 0,
    };
  }
};

export default {
  getUsers,
  getUserInfo,
  getUserOrders,
  getUserEsimProfiles,
  getUserBundles,
  getUserDevices,
  getUserWalletTransactions,
  getUserPromoUsage,
  getUserFinancialDocs,
};
