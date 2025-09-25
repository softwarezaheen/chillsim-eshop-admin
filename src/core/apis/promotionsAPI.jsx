import { api } from "./apiInstance";
import supabase from "./supabase";

export const getPromotions = async (filters = {}, page = 0, pageSize = 10) => {
  let query = supabase
    .from("promotion")
    .select(`
      *,
      promotion_rule (
        id,
        max_usage,
        beneficiary,
        promotion_rule_action (name),
        promotion_rule_event (name)
      )
    `, { count: "exact" });

  // Apply filters
  if (filters.code) {
    query = query.ilike("code", `%${filters.code}%`);
  }
  if (filters.is_active !== undefined) {
    query = query.eq("is_active", filters.is_active);
  }
  if (filters.type) {
    query = query.eq("type", filters.type);
  }
  if (filters.valid_from) {
    query = query.gte("valid_from", filters.valid_from);
  }
  if (filters.valid_to) {
    query = query.lte("valid_to", filters.valid_to);
  }

  query = query.range(page * pageSize, (page + 1) * pageSize - 1).order("created_at", { ascending: false });

  return await api(() => query);
};

export const getPromotionUsages = async (filters = {}, page = 0, pageSize = 10) => {
  // First, get the promotion usages
  let query = supabase
    .from("promotion_usage")
    .select("*", { count: "exact" });

  // Apply filters
  if (filters.promotion_code) {
    query = query.ilike("promotion_code", `%${filters.promotion_code}%`);
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

  query = query.range(page * pageSize, (page + 1) * pageSize - 1).order("created_at", { ascending: false });

  const { data: usages, error: usagesError, count } = await api(() => query);

  if (usagesError || !usages) {
    return { data: null, error: usagesError, count: 0 };
  }

  // Get unique bundle_ids and promotion_codes
  const bundleIds = [...new Set(usages.map(u => u.bundle_id).filter(id => id))];
  const promotionCodes = [...new Set(usages.map(u => u.promotion_code).filter(code => code))];

  // Fetch bundles
  let bundles = [];
  if (bundleIds.length > 0) {
    const { data: bundleData } = await api(() => 
      supabase.from("bundle").select("id, name").in("id", bundleIds)
    );
    bundles = bundleData || [];
  }

  // Fetch promotions
  let promotions = [];
  if (promotionCodes.length > 0) {
    const { data: promoData } = await api(() => 
      supabase.from("promotion").select("code, name").in("code", promotionCodes)
    );
    promotions = promoData || [];
  }

  // Create lookup maps
  const bundleMap = bundles.reduce((acc, bundle) => {
    acc[bundle.id] = bundle;
    return acc;
  }, {});

  const promotionMap = promotions.reduce((acc, promo) => {
    acc[promo.code] = promo;
    return acc;
  }, {});

  // Enrich usages with bundle and promotion data
  const enrichedUsages = usages.map(usage => ({
    ...usage,
    bundle: usage.bundle_id ? bundleMap[usage.bundle_id] : null,
    promotion: usage.promotion_code ? promotionMap[usage.promotion_code] : null,
  }));

  return { data: enrichedUsages, error: null, count };
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