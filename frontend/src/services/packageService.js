import api from "./api";

export const getPackages = async () => {
  const response = await api.get("/plans");
  return response.data;
};

export const createPackage = async (payload) => {
  const response = await api.post("/plans", payload);
  return response.data;
};

export const updatePackage = async (id, payload) => {
  const response = await api.put(`/plans/${id}`, payload);
  return response.data;
};

export const deletePackage = async (id) => {
  const response = await api.delete(`/plans/${id}`);
  return response.data;
};