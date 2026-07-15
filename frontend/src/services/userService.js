import api from "./api";

export const getUserDashboard = async () => {
  const response = await api.get("/user/dashboard");
  return response.data;
};

export const getMyProfile = async () => {
  const response = await api.get("/user/profile");
  return response.data;
};

export const updateMyProfile = async (data) => {
  const response = await api.put("/user/profile", data);
  return response.data;
};

export const changePassword = async (data) => {
  const response = await api.put("/user/change-password", data);
  return response.data;
};

export const getMyBodyMetrics = async () => {
  const response = await api.get("/user/body-metrics");
  return response.data;
};

export const updateBodyMetrics = async (data) => {
  const response = await api.put("/user/body-metrics", data);
  return response.data;
};

export const getHealthAdvice = async () => {
  const response = await api.get("/user/health-advice");
  return response.data;
};

export const getMyMemberships = async () => {
  const response = await api.get("/user/memberships");
  return response.data;
};

export const buyPlan = async (data) => {
  const response = await api.post("/user/buy-plan", data);
  return response.data;
};

export const cancelMyMembership = async (id, data = {}) => {
  const response = await api.put(`/user/memberships/${id}/cancel`, data);
  return response.data;
};

export const upgradeMembership = async (id, data) => {
  const response = await api.put(`/user/memberships/${id}/upgrade`, data);
  return response.data;
};

export const getMyCoach = async () => {
  const response = await api.get("/user/coach");
  return response.data;
};

export const changeCoach = async (data) => {
  const response = await api.put("/user/coach", data);
  return response.data;
};

export const getMyBookings = async () => {
  const response = await api.get("/user/bookings");
  return response.data;
};

export const bookClass = async (data) => {
  const response = await api.post("/user/book-class", data);
  return response.data;
};

export const cancelBooking = async (id) => {
  const response = await api.put(`/user/bookings/${id}/cancel`);
  return response.data;
};

export const createPaymentQR = async (data) => {
  const response = await api.post("/user/create-qr", data);
  return response.data;
};

export const submitPaymentConfirmation = async (data) => (await api.post('/user/payment-confirmation', data)).data;
export const cancelPaymentConfirmation = async (membershipId) => (await api.put(`/user/payment-confirmation/${membershipId}/cancel`)).data;
