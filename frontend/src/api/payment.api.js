import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const paymentsAPI = axios.create({
  baseURL: `${API_BASE_URL}/payments`,
  headers: { "Content-Type": "application/json" },
});

paymentsAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (!token) {
    const auth = JSON.parse(localStorage.getItem("auth") || "{}");
    if (auth.token) config.headers.Authorization = `Bearer ${auth.token}`;
  } else {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

paymentsAPI.interceptors.response.use(
  (r) => r,
  (error) =>
    Promise.reject(
      error.response?.data?.message
        ? new Error(error.response.data.message)
        : error.response?.data || error
    )
);

export const initiateKhalti = async (bookingId) => {
  const { data } = await paymentsAPI.post("/khalti/initiate", { bookingId });
  return data;
};

export const verifyKhalti = async (pidx) => {
  const { data } = await paymentsAPI.post("/khalti/verify", { pidx });
  return data;
};

export const initiateEsewa = async (bookingId) => {
  const { data } = await paymentsAPI.post("/esewa/initiate", { bookingId });
  return data;
};

export const verifyEsewa = async (body) => {
  const { data } = await paymentsAPI.post("/esewa/verify", body);
  return data;
};

export function submitEsewaForm(actionUrl, fields) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = actionUrl;
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value != null ? String(value) : "";
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}

export default paymentsAPI;
