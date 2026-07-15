import api from "./api";

export const getCheckins = async () => {
  const response = await api.get("/checkins");
  return response.data;
};

export const createCheckin = async (payload) => {
  const response = await api.post("/checkins", payload);
  return response.data;
};

export const deleteCheckin = async (id) => {
  const response = await api.delete(`/checkins/${id}`);
  return response.data;
};