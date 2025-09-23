import { api } from "./apiInstance";
import supabase from "./supabase";

export const getPartners = async () => {
  return await api(() =>
    supabase.from("partners").select("id, name").order("name", { ascending: true })
  );
};

export const savePartner = async (form, partner) => {
  const contact_info = {
    contactPerson: form.contactPerson,
    email: form.email,
    phone: form.phone,
  };
  if (partner) {
    return await api(() =>
      supabase
        .from("partners")
        .update({
          name: form.name,
          code_prefix: form.code_prefix,
          description: form.description,
          contact_info,
          is_active: form.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", partner.id)
    );
  } else {
    return await api(() =>
      supabase
        .from("partners")
        .insert([
          {
            name: form.name,
            code_prefix: form.code_prefix,
            description: form.description,
            contact_info,
            is_active: true,
          },
        ])
    );
  }
};