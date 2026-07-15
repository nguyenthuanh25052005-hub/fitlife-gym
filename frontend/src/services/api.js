import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("fitlife_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,

  (error) => {
    if ([401, 403, 404].includes(error.response?.status) && localStorage.getItem("fitlife_token")) {
      const code = error.response?.data?.code;
      const accountUnavailable = ["ACCOUNT_NOT_FOUND", "ACCOUNT_DISABLED"].includes(code)
        || error.response?.status === 404;

      if (accountUnavailable && window.location.pathname.startsWith("/member")) {
        window.dispatchEvent(new CustomEvent("fitlife:account-disabled"));
      } else if (error.response?.status === 401) {
        localStorage.removeItem("fitlife_token");
        localStorage.removeItem("fitlife_user");
        window.location.href = window.location.pathname.startsWith("/dashboard") ? "/login" : "/member/login";
      }
    }

    return Promise.reject(error);
  },
);

export default api;
