import api from "./api";

export const getMembers = async () => {
  const response = await api.get("/members");
  return response.data;
};

export const createMember = async (payload) => {
  const response = await api.post("/members", payload);
  return response.data;
};

export const updateMember = async (id, payload) => {
  const response = await api.put(`/members/${id}`, payload);
  return response.data;
};

export const deleteMember = async (id) => {
  const response = await api.delete(`/members/${id}`);
  return response.data;
};