import { api } from "./apiInstance";
import supabase from "./supabase";

export const getAllOrders = async ({ page, pageSize, user }) => {
  const from = page * pageSize;
  const to = from + pageSize - 1;
  try {
    const res = await api(() => {
      let query = supabase
        .from("user_order")
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
