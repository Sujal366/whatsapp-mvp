import axios from "axios";

const API_BASE_URL = "http://localhost:3000/api";

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  login: async (credentials: { username: string; password: string }) => {
    const response = await apiClient.post("/auth/login", credentials);
    return response.data;
  },
  register: async (userData: {
    username: string;
    password: string;
    email: string;
  }) => {
    const response = await apiClient.post("/auth/register", userData);
    return response.data;
  },
};

// Orders API
export const ordersAPI = {
  getAllOrders: async () => {
    const response = await apiClient.get("/orders");
    return response.data;
  },
  getOrderById: async (id: string) => {
    const response = await apiClient.get(`/orders/${id}`);
    return response.data;
  },
  updateOrderStatus: async (id: string, status: string) => {
    const response = await apiClient.patch(`/orders/${id}/status`, { status });
    return response.data;
  },
  assignDeliveryAgent: async (orderId: string, agentId: string) => {
    const response = await apiClient.patch(`/orders/${orderId}/assign`, {
      agentId,
    });
    return response.data;
  },
};

// Products API
export const productsAPI = {
  getAllProducts: async () => {
    const response = await apiClient.get("/products");
    return response.data;
  },
};

export default apiClient;
