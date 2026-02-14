import { api } from "./apiInstance";
import supabase from "./supabase";

export const getAllBundles = async (page, pageSize, name, tags) => {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  try {
    if (name?.trim() === "" && tags?.length === 0) {
      const res = await api(() => {
        let query = supabase.from("bundle").select("*", { count: "exact" });
        query = query.range(from, to).order("created_at", { ascending: true });

        return query;
      });

      return res;
    } else {
      const res = await api(() => {
        let query = supabase.rpc("search_bundles", {
          p_page: page,
          p_page_size: pageSize,
          p_search_term: name?.trim(),
          p_tag_ids: tags,
        });

        return query;
      });
      return {
        data: res?.data?.items,
        count: res?.data?.total_count,
        error: res?.error,
      };
    }
  } catch (error) {
    console.error("error in getAllBundles:", error);
    throw error;
  }
};

export const toggleBundleStatus = async ({ id, currentValue }) => {
  try {
    const res = await api(() => {
      let query = supabase
        .from("bundle")
        .update({ is_active: !currentValue })
        .eq("id", id)
        .select();

      return query;
    });
    console.log(res, "wwwwwwwwwwww");
    return res;
  } catch (error) {
    console.error("error in toggleBundleStatus:", error);
    throw error;
  }
};
export const updateBundleTitle = async (payload) => {
  try {
    const res = await api(() => {
      let query = supabase
        .from("bundle")
        .update({ bundle_name: payload?.bundle_name })
        .eq("id", payload?.id)
        .select();

      return query;
    });
    console.log(res, "wwwwwwwwwwww");
    return res;
  } catch (error) {
    console.error("error in updateBundleTitle:", error);
    throw error;
  }
};

export const getBundleTagsAndGroups = async (bundleId) => {
  try {
    if (!bundleId) {
      throw new Error("Bundle ID is required");
    }
    const bundleRes = await api(() => {
      let query = supabase
        .from("bundle")
        .select("bundle_name")
        .eq("id", bundleId)
        .single();

      return query;
    });

    console.log(bundleRes, "checkkk1", bundleId);

    if (bundleRes?.error) {
      return bundleRes;
    }

    const tagRes = await api(() => {
      return supabase
        .from("bundle_tag")
        .select(
          `
          id,
          tag:tag_id (
            id,
            name,
            icon,
            tag_group:tag_group_id (
              id,
              name,
              type,
              group_category
            )
          )
        `
        )
        .eq("bundle_id", bundleId);
    });
    console.log(tagRes, "checkkk2");

    return {
      bundleName: bundleRes?.data?.bundle_name || null,
      data: tagRes?.data || null,
      error: tagRes?.error || bundleRes?.error,
    };
  } catch (error) {
    console.error("error in getBundleTagsAndGroups:", error);
    throw error;
  }
};

export const assignTagsToBundle = async (bundleId, tagIds) => {
  if (!bundleId || !Array.isArray(tagIds)) {
    throw new Error("Invalid bundleId or tagIds");
  }

  const insertData = tagIds.map((tagId) => ({
    bundle_id: bundleId,
    tag_id: tagId,
    is_active: true,
  }));

  // 1. Upsert selected tags
  const upsertRes = await api(() => {
    let query = supabase.from("bundle_tag").upsert(insertData, {
      onConflict: ["bundle_id", "tag_id"],
    });

    return query;
  });
  if (upsertRes?.error) {
    console.error("Error upserting tags:", upsertRes?.error);
    return upsertRes;
  }

  // 2. Delete relations not in the selected list
  const deleteRes = await api(() => {
    let query = supabase
      .from("bundle_tag")
      .delete()
      .eq("bundle_id", bundleId)
      .not("tag_id", "in", `(${tagIds.join(",")})`);
    return query;
  });

  return { error: deleteRes?.error || upsertRes?.error };
};

export const getAllBundlesDropdown = async ({
  page = 1,
  pageSize = 10,
  search = "",
} = {}) => {
  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const res = await api(() => {
      let query = supabase.from("bundle").select(`data`, { count: "exact" });
      if (search.trim() !== "") {
        query = query.ilike("data->>bundle_code", `%${search}%`);
      }

      query = query.range(from, to).order("created_at", { ascending: true });
      return query;
    });
    return res;
  } catch (err) {
    return { data: null, error: err, count: 0 };
  }
};

// ==========================================
// Admin Bundle Pricing Management APIs
// ==========================================

/**
 * Get all bundles with admin pricing information
 * @param {Object} filters - Filter options
 * @param {boolean} filters.is_active - Filter by provider status
 * @param {boolean} filters.admin_active - Filter by admin status
 * @param {boolean} filters.below_margin - Filter bundles with negative margin
 * @param {string} filters.search - Search in bundle_code or name
 * @param {string} filters.country_code - Filter by country ISO code
 * @param {number} filters.limit - Results per page (default 100)
 * @param {number} filters.offset - Pagination offset
 */
export const getAdminBundles = async (filters = {}) => {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
  const ADMIN_API_KEY = import.meta.env.VITE_ADMIN_API_KEY;

  if (!ADMIN_API_KEY) {
    throw new Error("Admin API key not configured. Please set VITE_ADMIN_API_KEY in .env");
  }

  const params = new URLSearchParams();
  if (filters.is_active !== undefined && filters.is_active !== null) {
    params.append("is_active", filters.is_active);
  }
  if (filters.admin_active !== undefined && filters.admin_active !== null) {
    params.append("admin_active", filters.admin_active);
  }
  if (filters.margin_threshold !== undefined && filters.margin_threshold !== null) {
    params.append("margin_threshold", filters.margin_threshold);
  }
  if (filters.search) {
    params.append("search", filters.search);
  }
  if (filters.country_search) {
    params.append("country_search", filters.country_search);
  }
  if (filters.min_data_gb !== undefined && filters.min_data_gb !== null) {
    params.append("min_data_gb", filters.min_data_gb);
  }
  if (filters.max_data_gb !== undefined && filters.max_data_gb !== null) {
    params.append("max_data_gb", filters.max_data_gb);
  }
  if (filters.min_validity_days !== undefined && filters.min_validity_days !== null) {
    params.append("min_validity_days", filters.min_validity_days);
  }
  if (filters.max_validity_days !== undefined && filters.max_validity_days !== null) {
    params.append("max_validity_days", filters.max_validity_days);
  }
  if (filters.order_by) {
    params.append("order_by", filters.order_by);
  }
  if (filters.order_direction) {
    params.append("order_direction", filters.order_direction);
  }
  if (filters.limit) {
    params.append("limit", filters.limit);
  }
  if (filters.offset !== undefined) {
    params.append("offset", filters.offset);
  }

  const url = `${API_URL}admin/bundles?${params.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "X-Admin-Key": ADMIN_API_KEY,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details || "Failed to get bundles");
  }

  return await response.json();
};

/**
 * Update bundle selling price and/or admin_active status
 * @param {string} bundleId - Bundle code (e.g., 'esim_EU_7Days_1GB_')
 * @param {Object} updates - Update data
 * @param {number} updates.price - New selling price in EUR
 * @param {boolean} updates.admin_active - Admin activation status
 */
export const updateBundlePrice = async (bundleId, updates) => {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
  const ADMIN_API_KEY = import.meta.env.VITE_ADMIN_API_KEY;

  if (!ADMIN_API_KEY) {
    throw new Error("Admin API key not configured. Please set VITE_ADMIN_API_KEY in .env");
  }

  const response = await fetch(`${API_URL}admin/bundles/${encodeURIComponent(bundleId)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Key": ADMIN_API_KEY,
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details || "Failed to update bundle");
  }

  return await response.json();
};

/**
 * Export bundles to CSV file with pricing information
 * @param {Object} filters - Filter options
 * @param {boolean} filters.is_active - Filter by provider status
 * @param {boolean} filters.admin_active - Filter by admin status
 * @param {boolean} filters.below_margin - Filter bundles with negative margin
 * @param {string} filters.search - Search in bundle_code or name
 */
export const exportBundlesCsv = async (filters = {}) => {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
  const ADMIN_API_KEY = import.meta.env.VITE_ADMIN_API_KEY;

  if (!ADMIN_API_KEY) {
    throw new Error("Admin API key not configured. Please set VITE_ADMIN_API_KEY in .env");
  }

  const params = new URLSearchParams();
  if (filters.is_active !== undefined && filters.is_active !== null) {
    params.append("is_active", filters.is_active);
  }
  if (filters.admin_active !== undefined && filters.admin_active !== null) {
    params.append("admin_active", filters.admin_active);
  }
  if (filters.margin_threshold !== undefined && filters.margin_threshold !== null) {
    params.append("margin_threshold", filters.margin_threshold);
  }
  if (filters.search) {
    params.append("search", filters.search);
  }
  if (filters.country_search) {
    params.append("country_search", filters.country_search);
  }

  const url = `${API_URL}admin/bundles/export-csv?${params.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "X-Admin-Key": ADMIN_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to export bundles");
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = `bundles_export_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
};

/**
 * Import bundle prices from CSV file
 * @param {File} file - CSV file with columns: bundle_id, price (optional), admin_active (optional)
 * @returns {Promise<Object>} Import result with success/failure counts
 */
export const importBundlePrices = async (file) => {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
  const ADMIN_API_KEY = import.meta.env.VITE_ADMIN_API_KEY;

  if (!ADMIN_API_KEY) {
    throw new Error("Admin API key not configured. Please set VITE_ADMIN_API_KEY in .env");
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}admin/bundles/import-prices`, {
    method: "POST",
    headers: {
      "X-Admin-Key": ADMIN_API_KEY,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details || "Failed to import bundle prices");
  }

  return await response.json();
};

/**
 * Bulk update bundles (activate, deactivate, or apply markup)
 * @param {Object} data - Bulk update data
 * @param {Array<string>} data.bundle_ids - List of bundle codes
 * @param {string} data.action - 'activate', 'deactivate', or 'markup'
 * @param {number} data.markup_percentage - Required for markup action
 * @returns {Promise<Object>} Bulk update result with success/failure counts
 */
export const bulkUpdateBundles = async (data) => {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
  const ADMIN_API_KEY = import.meta.env.VITE_ADMIN_API_KEY;

  if (!ADMIN_API_KEY) {
    throw new Error("Admin API key not configured. Please set VITE_ADMIN_API_KEY in .env");
  }

  const response = await fetch(`${API_URL}admin/bundles/bulk-update`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Key": ADMIN_API_KEY,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details || "Failed to bulk update bundles");
  }

  return await response.json();
};

/**
 * Rebuild bundle cache
 * @returns {Promise<Object>} Cache rebuild result
 */
export const rebuildBundleCache = async () => {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
  const ADMIN_API_KEY = import.meta.env.VITE_ADMIN_API_KEY;

  if (!ADMIN_API_KEY) {
    throw new Error("Admin API key not configured. Please set VITE_ADMIN_API_KEY in .env");
  }

  const response = await fetch(`${API_URL}admin/bundles/rebuild-cache`, {
    method: "POST",
    headers: {
      "X-Admin-Key": ADMIN_API_KEY,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details || "Failed to rebuild bundle cache");
  }

  return await response.json();
};

/**
 * Trigger bundle sync from eSIM Hub
 * @returns {Promise<Object>} Sync trigger result
 */
export const syncBundlesNow = async () => {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
  const ADMIN_API_KEY = import.meta.env.VITE_ADMIN_API_KEY;

  if (!ADMIN_API_KEY) {
    throw new Error("Admin API key not configured. Please set VITE_ADMIN_API_KEY in .env");
  }

  const response = await fetch(`${API_URL}admin/bundles/sync-now`, {
    method: "POST",
    headers: {
      "X-Admin-Key": ADMIN_API_KEY,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details || "Failed to trigger bundle sync");
  }

  return await response.json();
};

/**
 * Refresh tag data from eSIM Hub
 * Updates tag.data and tag_translation.data with fresh country_code, iso3_code, zone_name values
 * @returns {Promise<Object>} Refresh result
 */
export const refreshTagData = async () => {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
  const ADMIN_API_KEY = import.meta.env.VITE_ADMIN_API_KEY;

  if (!ADMIN_API_KEY) {
    throw new Error("Admin API key not configured. Please set VITE_ADMIN_API_KEY in .env");
  }

  const response = await fetch(`${API_URL}admin/tags/refresh-data`, {
    method: "POST",
    headers: {
      "X-Admin-Key": ADMIN_API_KEY,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details || "Failed to refresh tag data");
  }

  return await response.json();
};