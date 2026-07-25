
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const UPLOADS_ORIGIN =
  import.meta.env.VITE_UPLOADS_ORIGIN ||
  import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") ||
  "http://localhost:5000";

export const courtImageUrl = (filename) =>
  filename ? `${UPLOADS_ORIGIN}/uploads/${filename}` : "";

const courtsAPI = axios.create({
  baseURL: `${API_BASE_URL}`,
  headers: {
    "Content-Type": "application/json",
  },
});

courtsAPI.interceptors.request.use(
  (config) => {
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }
    const token = localStorage.getItem("token");
    if (!token) {
      const auth = JSON.parse(localStorage.getItem("auth") || "{}");
      if (auth.token) config.headers.Authorization = `Bearer ${auth.token}`;
    } else {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/** Strip empty query params */
function cleanParams(params) {
  if (!params) return {};
  const out = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === "" || v === undefined || v === null) continue;
    if (k === "type" && v === "All") continue;
    if (k === "district" && v === "All") continue;
    out[k] = v;
  }
  return out;
}

// Get all courts (filters, sort, optional page/limit)
export const getAllCourts = async (params = {}) => {
  try {
    const response = await courtsAPI.get("/courts", { params: cleanParams(params) });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch courts" };
  }
};

export const getCourtById = async (courtId) => {
  try {
    const response = await courtsAPI.get(`/courts/${courtId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch court" };
  }
};

export const getMyCourts = async () => {
  try {
    const response = await courtsAPI.get("/courts/provider/my-courts");
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch your courts" };
  }
};

export const createCourt = async (formData) => {
  try {
    const response = await courtsAPI.post("/courts", formData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to create court" };
  }
};

export const updateCourt = async (courtId, formData) => {
  try {
    const response = await courtsAPI.put(`/courts/${courtId}`, formData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to update court" };
  }
};

export const deleteCourt = async (courtId) => {
  try {
    const response = await courtsAPI.delete(`/courts/${courtId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to delete court" };
  }
};

export default courtsAPI;
