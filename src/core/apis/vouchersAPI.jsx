export const bulkExportVouchers = async (ids) => {
  const now = new Date().toISOString();
  // Only update exported_at if not already exported
  return await api(() =>
    supabase
      .from("voucher")
      .update({ exported: true, exported_at: now })
      .in("id", ids)
      .is("exported", false)
  );
};
import { api } from "./apiInstance";
import supabase from "./supabase";

export const bulkExpireVouchers = async (ids) => {
  const now = new Date().toISOString();
  return await api(() =>
    supabase
      .from("voucher")
      .update({ updated_at: now, expired_at: now })
      .in("id", ids)
  );
};

export const bulkDeleteVouchers = async (ids) => {
  // Only delete vouchers that are not used and not exported
  return await api(() =>
    supabase
      .from("voucher")
      .delete()
      .in("id", ids)
      .is("is_used", false)
      .is("exported", false)
  );
};
