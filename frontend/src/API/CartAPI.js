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

// Khởi tạo hoặc lấy cart của user (gọi khi login)
export const initCart = async () => {
  try {
    const response = await client.post("/cart/init", {}, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Error initializing cart:", error);
    throw error;
  }
};

// Lấy giỏ hàng của user
export const getCart = async () => {
  try {
    const response = await client.get("/cart", {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching cart:", error);
    throw error;
  }
};

// Thêm sản phẩm vào giỏ hàng
export const addToCart = async (productId, quantity = 1) => {
  try {
    const response = await client.post(
      "/cart/add-item",
      {
        product_id: productId,
        quantity: quantity,
      },
      {
        headers: getAuthHeader(),
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error adding to cart:", error);
    throw error;
  }
};

// Cập nhật số lượng sản phẩm trong giỏ hàng
export const updateCartItem = async (cartItemId, quantity) => {
  try {
    const response = await client.put(
      "/cart/update-item",
      {
        cart_item_id: cartItemId,
        quantity: quantity,
      },
      {
        headers: getAuthHeader(),
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating cart item:", error);
    throw error;
  }
};

// Xóa sản phẩm khỏi giỏ hàng
export const removeFromCart = async (cartItemId) => {
  try {
    const response = await client.delete(`/cart/remove-item/${cartItemId}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Error removing from cart:", error);
    throw error;
  }
};

// Lấy số lượng sản phẩm trong giỏ hàng
export const getCartCount = async () => {
  try {
    const response = await client.get("/cart", {
      headers: getAuthHeader(),
    });
    return response.data?.data?.length || 0;
  } catch (error) {
    console.error("Error fetching cart count:", error);
    return 0;
  }
};
