import { api } from "./apiInstance";
import supabase from "./supabase";

export const getAllUsers = async ({ page, pageSize, name }) => {
  const from = page * pageSize;
  const to = from + pageSize - 1;
  try {
    const res = await api(() => {
      let query = supabase.from("users_copy").select("*", { count: "exact" });

      if (name?.trim()) {
        query = query.ilike("email", `%${name}%`);
      }

      query = query.range(from, to);

      return query;
    });
    console.log(res, "resss");
    return res;
  } catch (error) {
    throw error;
  }
};

export const getAllUsersDropdown = async ({
  page = 1,
  pageSize = 10,
  name = "",
} = {}) => {
  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const res = await api(() => {
      let query = supabase.from("users_copy").select("id, email, metadata");
      if (name.trim() !== "") {
        query = query.or(
          `email.ilike.%${name}%,metadata->>email.ilike.%${name}%`
        );
      }

      query = query.range(from, to).order("email", { ascending: true });
      return query;
    });
    return res;
  } catch (err) {
    return { data: null, error: err, count: 0 };
  }
};

export const userSignout = async () => {
  api(() => supabase.auth.signOut())
    .then((result) => {
      return result;
    })
    .catch((err) => {
      throw err;
    });
};
