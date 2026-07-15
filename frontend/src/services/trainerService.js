import api from "./api";

export const getTrainers = async () => {
  const response = await api.get("/trainers");
  return response.data;
};

export const createTrainer = async (trainerData) => {
  const response = await api.post("/trainers", trainerData);
  return response.data;
};

export const updateTrainer = async (id, trainerData) => {
  const response = await api.put(`/trainers/${id}`, trainerData);
  return response.data;
};

export const deleteTrainer = async (id) => {
  const response = await api.delete(`/trainers/${id}`);
  return response.data;
};
