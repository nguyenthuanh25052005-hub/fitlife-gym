import api from "./api";

export const getClasses = async () => {
  const response = await api.get("/classes");
  return response.data;
};

export const createClass = async (payload) => {
  const response = await api.post("/classes", payload);
  return response.data;
};

export const updateClass = async (id, payload) => {
  const response = await api.put(`/classes/${id}`, payload);
  return response.data;
};

export const deleteClass = async (id) => {
  const response = await api.delete(`/classes/${id}`);
  return response.data;
};