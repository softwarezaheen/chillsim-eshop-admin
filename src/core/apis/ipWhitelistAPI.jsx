import { adminUsersAPI } from "./adminUsersAPI";

export const getMyIp = () =>
  adminUsersAPI.get("/admin/ip-whitelist/my-ip");

export const getWhitelistStatus = () =>
  adminUsersAPI.get("/admin/ip-whitelist/status");

export const setWhitelistStatus = (enabled) =>
  adminUsersAPI.put("/admin/ip-whitelist/status", { enabled });

export const listWhitelist = () =>
  adminUsersAPI.get("/admin/ip-whitelist");

export const createWhitelistEntry = (ip_address, description) =>
  adminUsersAPI.post("/admin/ip-whitelist", { ip_address, description });

export const updateWhitelistEntry = (id, data) =>
  adminUsersAPI.put(`/admin/ip-whitelist/${id}`, data);

export const deleteWhitelistEntry = (id) =>
  adminUsersAPI.delete(`/admin/ip-whitelist/${id}`);
