import { api } from "./apiInstance";
import supabase from "./supabase";

// Get filtered count for pagination adjustment
const getFilteredCount = async (filters) => {
  let countQuery = supabase.from("promotion").select("*", { count: "exact", head: true });
  
  if (filters.code) {
    countQuery = countQuery.ilike("code", `%${filters.code}%`);
  }
  if (filters.is_active !== undefined && filters.is_active !== "") {
    countQuery = countQuery.eq("is_active", filters.is_active);
  }
  if (filters.promo_type) {
    countQuery = countQuery.eq("type", filters.promo_type);
  }
  if (filters.valid_from) {
    countQuery = countQuery.gte("valid_from", filters.valid_from);
  }
  if (filters.valid_to) {
    countQuery = countQuery.lte("valid_to", filters.valid_to);
  }
  if (filters.created_from) {
    countQuery = countQuery.gte("created_at", filters.created_from);
  }
  if (filters.created_to) {
    countQuery = countQuery.lte("created_at", filters.created_to);
  }
  
  const { count } = await api(() => countQuery);
  return count || 0;
};

export const getPromotions = async (filters = {}, page = 0, pageSize = 10) => {
  // First get filtered count to check if we need to adjust page offset
  const filteredCount = await getFilteredCount(filters);

  // Adjust page if offset exceeds available filtered rows
  let adjustedPage = page;
  if (filteredCount && page * pageSize >= filteredCount) {
    adjustedPage = Math.max(0, Math.floor((filteredCount - 1) / pageSize));
  }

  let query = supabase
    .from("promotion")
    .select(`
      *,
      promotion_rule (
        id,
        max_usage,
        beneficiary,
        rule_description,
        promotion_rule_action (name),
        promotion_rule_event (name)
      )
    `, { count: "exact" });

  // Apply filters
  if (filters.code) {
    query = query.ilike("code", `%${filters.code}%`);
  }
  if (filters.is_active !== undefined && filters.is_active !== "") {
    query = query.eq("is_active", filters.is_active);
  }
  if (filters.promo_type) {
    query = query.eq("type", filters.promo_type);
  }
  if (filters.valid_from) {
    query = query.gte("valid_from", filters.valid_from);
  }
  if (filters.valid_to) {
    query = query.lte("valid_to", filters.valid_to);
  }
  if (filters.created_from) {
    query = query.gte("created_at", filters.created_from);
  }
  if (filters.created_to) {
    query = query.lte("created_at", filters.created_to);
  }

  query = query.range(adjustedPage * pageSize, (adjustedPage + 1) * pageSize - 1).order("created_at", { ascending: false });

  const result = await api(() => query);
  return { ...result, adjustedPage };
};

export const getPromotionUsages = async (filters = {}, page = 0, pageSize = 10) => {
  // First get promotion usages with bundle and promotion joins
  let query = supabase
    .from("promotion_usage")
    .select(`
      *,
      bundle:bundle_id (
        id,
        data
      ),
      promotion:promotion_code (
        code,
        name
      )
    `, { count: "exact" });

  // Apply filters
  if (filters.promotion_code) {
    query = query.ilike("promotion_code", `%${filters.promotion_code}%`);
  }
  if (filters.referral_code) {
    query = query.ilike("referral_code", `%${filters.referral_code}%`);
  }
  if (filters.status) {
    query = query.eq("status", filters.status);
  }
  if (filters.user_id) {
    query = query.eq("user_id", filters.user_id);
  }
  if (filters.created_from) {
    query = query.gte("created_at", filters.created_from);
  }
  if (filters.created_to) {
    query = query.lte("created_at", filters.created_to);
  }

  // Get filtered count first to check if we need to adjust page offset
  let countQuery = supabase.from("promotion_usage").select("*", { count: "exact", head: true });
  
  // Apply the same filters to count query
  if (filters.promotion_code) {
    countQuery = countQuery.ilike("promotion_code", `%${filters.promotion_code}%`);
  }
  if (filters.referral_code) {
    countQuery = countQuery.ilike("referral_code", `%${filters.referral_code}%`);
  }
  if (filters.status) {
    countQuery = countQuery.eq("status", filters.status);
  }
  if (filters.user_id) {
    countQuery = countQuery.eq("user_id", filters.user_id);
  }
  if (filters.created_from) {
    countQuery = countQuery.gte("created_at", filters.created_from);
  }
  if (filters.created_to) {
    countQuery = countQuery.lte("created_at", filters.created_to);
  }

  const { count: filteredCount } = await api(() => countQuery);

  // Adjust page if offset exceeds available filtered rows
  let adjustedPage = page;
  if (filteredCount && page * pageSize >= filteredCount) {
    adjustedPage = Math.max(0, Math.floor((filteredCount - 1) / pageSize));
  }

  query = query.range(adjustedPage * pageSize, (adjustedPage + 1) * pageSize - 1).order("created_at", { ascending: false });

  const { data: usages, error: usagesError, count } = await api(() => query);

  if (usagesError || !usages) {
    return { data: null, error: usagesError, count: 0, adjustedPage };
  }

  // Fetch user emails separately since users_copy might not support foreign key joins
  const userIds = [...new Set(usages.map(u => u.user_id).filter(id => id))];
  let users = [];
  if (userIds.length > 0) {
    const { data: userData } = await api(() => 
      supabase.from("users_copy").select("id, email").in("id", userIds)
    );
    users = userData || [];
  }

  const userMap = users.reduce((acc, user) => {
    acc[user.id] = user;
    return acc;
  }, {});

  // Process the joined data
  const enrichedUsages = usages.map(usage => ({
    ...usage,
    bundle: usage.bundle_id && usage.bundle ? {
      id: usage.bundle.id,
      bundle_name: usage.bundle.data?.bundle_name || null
    } : null,
    promotion: usage.promotion || null,
    user: usage.user_id ? userMap[usage.user_id] : null,
  }));

  return { data: enrichedUsages, error: null, count, adjustedPage };
};

export const addPromotion = async (promotionData) => {
  return await api(() => supabase.from("promotion").insert(promotionData).select());
};

export const getPromotionRuleActions = async () => {
  return await api(() => supabase.from("promotion_rule_action").select("*"));
};

export const getPromotionRuleEvents = async () => {
  return await api(() => supabase.from("promotion_rule_event").select("*"));
};

export const getPromotionRules = async () => {
  return await api(() => supabase.from("promotion_rule").select(`
    *,
    promotion_rule_action (name),
    promotion_rule_event (name)
  `));
};

export const addPromotionRule = async (ruleData) => {
  return await api(() => supabase.from("promotion_rule").insert(ruleData).select());
};

export const updatePromotionRule = async (id, ruleData) => {
  return await api(() => supabase.from("promotion_rule").update(ruleData).eq("id", id).select());
};

export const deletePromotionRule = async (id) => {
  return await api(() => supabase.from("promotion_rule").delete().eq("id", id));
};

export const expirePromotion = async (code) => {
  const currentDate = new Date().toISOString();
  return await api(() => 
    supabase
      .from("promotion")
      .update({ 
        valid_to: currentDate,
        is_active: false 
      })
      .eq("code", code)
      .select()
  );
};

export const bulkGeneratePromoCodes = async (request) => {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
  const ADMIN_API_KEY = import.meta.env.VITE_ADMIN_API_KEY;
  
  if (!ADMIN_API_KEY) {
    throw new Error("Admin API key not configured. Please set VITE_ADMIN_API_KEY in .env");
  }
  
  const response = await fetch(`${API_URL}admin/promotions/bulk-generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Key": ADMIN_API_KEY,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details || "Failed to generate promo codes");
  }

  return await response.json();
};

export const exportPromoCodesCsv = async (filters = {}) => {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
  const ADMIN_API_KEY = import.meta.env.VITE_ADMIN_API_KEY;
  
  if (!ADMIN_API_KEY) {
    throw new Error("Admin API key not configured. Please set VITE_ADMIN_API_KEY in .env");
  }
  
  const params = new URLSearchParams();
  if (filters.code) {
    params.append("code", filters.code);
  }
  if (filters.is_active !== undefined) {
    params.append("is_active", filters.is_active);
  }
  if (filters.promo_type) {
    params.append("promo_type", filters.promo_type);
  }
  if (filters.valid_from) {
    params.append("valid_from", filters.valid_from);
  }
  if (filters.valid_to) {
    params.append("valid_to", filters.valid_to);
  }
  if (filters.created_from) {
    params.append("created_from", filters.created_from);
  }
  if (filters.created_to) {
    params.append("created_to", filters.created_to);
  }

  const url = `${API_URL}admin/promotions/export-csv?${params.toString()}`;
  
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "X-Admin-Key": ADMIN_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to export promo codes");
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = `promo_codes_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
};

export const bulkExpirePromotions = async (promotionIds, filters = null) => {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
  const ADMIN_API_KEY = import.meta.env.VITE_ADMIN_API_KEY;
  
  if (!ADMIN_API_KEY) {
    throw new Error("Admin API key not configured. Please set VITE_ADMIN_API_KEY in .env");
  }
  
  // If filters provided, use filters; otherwise use IDs
  const requestBody = filters || { promotion_ids: promotionIds };
  
  const response = await fetch(`${API_URL}admin/promotions/bulk-expire`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Key": ADMIN_API_KEY,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details || "Failed to expire promotions");
  }

  return await response.json();
};

export const bulkEditValidity = async (promotionIds, validFrom, validTo, filters = null) => {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
  const ADMIN_API_KEY = import.meta.env.VITE_ADMIN_API_KEY;
  
  if (!ADMIN_API_KEY) {
    throw new Error("Admin API key not configured. Please set VITE_ADMIN_API_KEY in .env");
  }
  
  // If filters provided, use filters; otherwise use IDs
  const requestBody = filters 
    ? { ...filters, valid_from: validFrom, valid_to: validTo }
    : { promotion_ids: promotionIds, valid_from: validFrom, valid_to: validTo };
  
  const response = await fetch(`${API_URL}admin/promotions/bulk-edit-validity`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Key": ADMIN_API_KEY,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details || "Failed to edit validity dates");
  }

  return await response.json();
};

export const editPromotion = async (promotionId, updates) => {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
  const ADMIN_API_KEY = import.meta.env.VITE_ADMIN_API_KEY;
  
  if (!ADMIN_API_KEY) {
    throw new Error("Admin API key not configured. Please set VITE_ADMIN_API_KEY in .env");
  }
  
  const response = await fetch(`${API_URL}admin/promotions/${promotionId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Key": ADMIN_API_KEY,
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details || "Failed to edit promotion");
  }

  return await response.json();
};

export const getPromotionsByIds = async (ids) => {
  if (!ids || ids.length === 0) {
    return { data: [], error: null };
  }
  
  return await api(() => 
    supabase
      .from("promotion")
      .select("*")
      .in("id", ids)
  );
};

export const getAllMatchingPromotions = async (filters = {}) => {
  // Get IDs of ALL promotions matching the filters (for bulk operations)
  let query = supabase.from("promotion").select("id");
  
  if (filters.code) {
    query = query.ilike("code", `%${filters.code}%`);
  }
  if (filters.is_active !== undefined) {
    query = query.eq("is_active", filters.is_active);
  }
  if (filters.promo_type) {
    query = query.eq("type", filters.promo_type);
  }
  if (filters.valid_from) {
    query = query.gte("valid_from", filters.valid_from);
  }
  if (filters.valid_to) {
    query = query.lte("valid_to", filters.valid_to);
  }
  if (filters.created_from) {
    query = query.gte("created_at", filters.created_from);
  }
  if (filters.created_to) {
    query = query.lte("created_at", filters.created_to);
  }
  
  const { data, error } = await api(() => query);
  return { data: data?.map(p => p.id) || [], error };
};