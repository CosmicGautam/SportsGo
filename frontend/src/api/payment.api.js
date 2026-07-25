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

export const verifyKhalti = async (payload) => {
  const body = typeof payload === "string" ? { pidx: payload } : payload || {};
  const { data } = await paymentsAPI.post("/khalti/verify", body);
  return data;
};

/**
 * Get logged-in provider payment information
 */
export const getPaymentInformation = async () => {
  const { data } = await paymentsAPI.get("/payment-contact/me");
  return data;
};

/**
 * Update logged-in provider payment information
 */
export const updatePaymentInformation = async (paymentInfo) => {
  const { data } = await paymentsAPI.put("/payment-contact/me", paymentInfo);
  return data;
};

/**
 * Get all providers' payment information (Superadmin)
 */
export const getAllPaymentInformation = async () => {
  const { data } = await paymentsAPI.get("/admin/payment-contacts");
  return data;
};

/**
 * Verify provider payment information (Superadmin)
 */
export const verifyPaymentInformation = async (userId) => {
  const { data } = await paymentsAPI.patch(
    `/admin/payment-contacts/${userId}/verify`
  );
  return data;
};

/**
 * Reject provider payment information (Optional)
 */
export const rejectPaymentInformation = async (userId) => {
  const { data } = await paymentsAPI.patch(
    `/admin/payment-contacts/${userId}/reject`
  );
  return data;
};


export default paymentsAPI;
