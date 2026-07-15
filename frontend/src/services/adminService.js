import api from "./api";

export const getNotifications = async () => {
  const response = await api.get("/admin/notifications");
  return response.data;
};

export const markNotificationRead = async (id) => {
  const response = await api.put(`/admin/notifications/${id}/read`);
  return response.data;
};

export const getMemberManagement = async (params = {}) => {
  const response = await api.get("/admin/members", { params });
  return response.data;
};

export const lockMember = async (id) => {
  const response = await api.put(`/admin/members/${id}/lock`);
  return response.data;
};

export const unlockMember = async (id) => {
  const response = await api.put(`/admin/members/${id}/unlock`);
  return response.data;
};

export const deleteMemberAccount = async (id) => {
  const response = await api.delete(`/admin/members/${id}`);
  return response.data;
};