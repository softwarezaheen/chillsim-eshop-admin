import { api } from "./apiInstance";
import supabase from "./supabase";

export const getAllBundles = async (page, pageSize, name, tags) => {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  try {
    if (name.trim() === "" && tags?.length === 0) {
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
          p_search_term: name.trim(),
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
