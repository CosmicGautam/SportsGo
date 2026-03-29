import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const recAPI = axios.create({
  baseURL: `${API_BASE_URL}/recommendations`,
  headers: { "Content-Type": "application/json" },
});

recAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (!token) {
    const auth = JSON.parse(localStorage.getItem("auth") || "{}");
    if (auth.token) config.headers.Authorization = `Bearer ${auth.token}`;
  } else {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getCourtRecommendations = async (limit = 8) => {
  const { data } = await recAPI.get("/courts", { params: { limit } });
  return data;
};
