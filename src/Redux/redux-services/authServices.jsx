import supabase from "../../core/apis/supabase";

export const fetchUserInfoFromAPI = async () => {
  try {
    return await supabase.auth.getSession();
  } catch (error) {
    return { status: 400 };
  }
};
