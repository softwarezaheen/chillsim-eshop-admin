import { api } from "./apiInstance";
import supabase from "./supabase";

export const getAllDevices = async ({ page, pageSize, user }) => {
  const from = page * pageSize;
  const to = from + pageSize - 1;
  try {
    const res = await api(() => {
      let query = supabase
        .from("device")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      if (user) {
        query = query.eq("user_id", user);
      }

      query = query.range(from, to);

      return query;
    });

    return res;
  } catch (error) {
    throw error;
  }
};

export const getAllUserDevices = async ({ page, pageSize, id }) => {
  const from = page * pageSize;
  const to = from + pageSize - 1;
  try {
    const res = await api(() => {
      let query = supabase
        .from("device")
        .select("*", { count: "exact" })
        .eq("user_id", id)
        .order("created_at", { ascending: false })
        .range(from, to);

      return query;
    });

    return res;
  } catch (error) {
    throw error;
  }
};
