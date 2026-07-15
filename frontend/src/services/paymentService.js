import api from "./api";

export const getPayments = async () => {
  const response = await api.get("/payments");
  return response.data;
};

export const createPayment = async (payload) => {
  const response = await api.post("/payments", payload);
  return response.data;
};

export const confirmPayment = async (id) => (await api.put(`/payments/${id}/confirm`)).data;
export const rejectPayment = async (id, note) => (await api.put(`/payments/${id}/reject`, { note })).data;
