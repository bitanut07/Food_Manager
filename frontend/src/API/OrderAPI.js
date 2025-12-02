import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:3000";

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Tạo đơn hàng
export const createOrder = async (orderData) => {
  try {
    const response = await client.post("/orders", orderData, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
};

// Lấy danh sách đơn hàng của user
export const getUserOrders = async () => {
  try {
    const response = await client.get("/orders", {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw error;
  }
};

// Lấy chi tiết đơn hàng
export const getOrderById = async (orderId) => {
  try {
    const response = await client.get(`/orders/${orderId}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching order:", error);
    throw error;
  }
};

// Hủy đơn hàng
export const cancelOrder = async (orderId) => {
  try {
    const response = await client.put(`/orders/${orderId}/cancel`, {}, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Error cancelling order:", error);
    throw error;
  }
};

// Lấy danh sách phương thức thanh toán
export const getPaymentMethods = async () => {
  try {
    const response = await client.get("/payment-methods");
    return response.data;
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    throw error;
  }
};

// Admin: Lấy tất cả đơn hàng
export const getAllOrders = async () => {
  try {
    const response = await client.get("/admin/orders", {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching all orders:", error);
    throw error;
  }
};

// Admin: Cập nhật trạng thái đơn hàng
export const updateOrderStatus = async (orderId, status) => {
  try {
    const response = await client.put(
      `/admin/orders/${orderId}/status`,
      { status },
      {
        headers: getAuthHeader(),
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating order status:", error);
    throw error;
  }
};

