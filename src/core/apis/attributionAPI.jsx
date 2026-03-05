import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
const ADMIN_API_KEY = import.meta.env.VITE_ADMIN_API_KEY;

const attributionAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "X-Admin-Key": ADMIN_API_KEY,
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// Customer Sources
// ═══════════════════════════════════════════════════════════════════════════════

export const getCustomerSources = async () => {
  try {
    const response = await attributionAPI.get("/admin/customer-sources");
    return { data: response.data.data || [], error: null };
  } catch (error) {
    console.error("Error fetching customer sources:", error);
    return { data: [], error: error.response?.data?.detail || error.message };
  }
};

export const createCustomerSource = async (sourceData) => {
  try {
    const response = await attributionAPI.post(
      "/admin/customer-sources",
      sourceData
    );
    return { data: response.data.data, error: null };
  } catch (error) {
    console.error("Error creating customer source:", error);
    return { data: null, error: error.response?.data?.detail || error.message };
  }
};

export const updateCustomerSource = async (sourceId, sourceData) => {
  try {
    const response = await attributionAPI.put(
      `/admin/customer-sources/${sourceId}`,
      sourceData
    );
    return { data: response.data.data, error: null };
  } catch (error) {
    console.error("Error updating customer source:", error);
    return { data: null, error: error.response?.data?.detail || error.message };
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// Customer Attributions
// ═══════════════════════════════════════════════════════════════════════════════

export const getCustomerAttributions = async ({
  page = 1,
  pageSize = 25,
  sourceId = null,
  search = null,
} = {}) => {
  try {
    const params = new URLSearchParams();
    params.append("page", page);
    params.append("page_size", pageSize);
    if (sourceId) params.append("source_id", sourceId);
    if (search) params.append("search", search);

    const response = await attributionAPI.get(
      `/admin/customer-attributions?${params.toString()}`
    );
    return {
      data: response.data.data?.items || [],
      count: response.data.data?.total_count || 0,
      error: null,
    };
  } catch (error) {
    console.error("Error fetching attributions:", error);
    return {
      data: [],
      count: 0,
      error: error.response?.data?.detail || error.message,
    };
  }
};

export const getUserAttribution = async (userId) => {
  try {
    const response = await attributionAPI.get(
      `/admin/customer-attributions/${userId}`
    );
    return { data: response.data.data, error: null };
  } catch (error) {
    console.error("Error fetching user attribution:", error);
    return { data: null, error: error.response?.data?.detail || error.message };
  }
};

export const updateUserAttribution = async (userId, { source_id }) => {
  try {
    const response = await attributionAPI.patch(
      `/admin/customer-attributions/${userId}`,
      { source_id }
    );
    return { data: response.data.data, error: null };
  } catch (error) {
    console.error("Error updating user attribution:", error);
    return { data: null, error: error.response?.data?.detail || error.message };
  }
};

/**
 * Batch-fetch attribution source names for a list of user_ids.
 * Returns { data: { user_id: { source_name, source_slug, ... }, ... } }
 */
export const getBatchUserAttributions = async (userIds) => {
  try {
    if (!userIds || userIds.length === 0) return { data: {}, error: null };
    const response = await attributionAPI.post(
      "/admin/customer-attributions/batch",
      { user_ids: userIds }
    );
    return { data: response.data.data || {}, error: null };
  } catch (error) {
    console.error("Error fetching batch attributions:", error);
    return { data: {}, error: error.response?.data?.detail || error.message };
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// Attribution Reports
// ═══════════════════════════════════════════════════════════════════════════════

export const getAttributionReport = async ({
  groupBy = "month",
  dateFrom = null,
  dateTo = null,
  sourceId = null,
} = {}) => {
  try {
    const params = new URLSearchParams();
    params.append("group_by", groupBy);
    if (dateFrom) params.append("date_from", dateFrom);
    if (dateTo) params.append("date_to", dateTo);
    if (sourceId) params.append("source_id", sourceId);

    const response = await attributionAPI.get(
      `/admin/attribution-report?${params.toString()}`
    );
    return { data: response.data.data || [], error: null };
  } catch (error) {
    console.error("Error fetching attribution report:", error);
    return { data: [], error: error.response?.data?.detail || error.message };
  }
};

export const getAttributionSummary = async () => {
  try {
    const response = await attributionAPI.get("/admin/attribution-summary");
    return { data: response.data.data || {}, error: null };
  } catch (error) {
    console.error("Error fetching attribution summary:", error);
    return { data: {}, error: error.response?.data?.detail || error.message };
  }
};

export const runAttributionBackfill = async ({ dryRun = false, forceReattribute = false, batchSize = 100 } = {}) => {
  try {
    const params = new URLSearchParams();
    params.append("dry_run", dryRun);
    params.append("force_reattribute", forceReattribute);
    params.append("batch_size", batchSize);
    const response = await attributionAPI.post(`/admin/attribution-backfill?${params.toString()}`);
    return { data: response.data.data || {}, error: null };
  } catch (error) {
    console.error("Error starting attribution backfill:", error);
    return { data: {}, error: error.response?.data?.detail || error.message };
  }
};

export const recalculateClv = async () => {
  try {
    const response = await attributionAPI.post("/admin/attribution-recalculate-clv");
    return { data: response.data.data || {}, error: null };
  } catch (error) {
    console.error("Error triggering CLV recalculation:", error);
    return { data: {}, error: error.response?.data?.detail || error.message };
  }
};
