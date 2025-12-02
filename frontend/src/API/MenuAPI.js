import axios from "axios";
import { API_BASE_URL } from "../Config/apiConfig";

const client = axios.create({
  baseURL: API_BASE_URL,
});

const parseImages = (value) => {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length) {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const normalizeProduct = (item) => ({
  id: item.id,
  name: item.name,
  description: item.description,
  price: Number(item.price) || 0,
  thumbnail: item.thumbnail || item.image, // Hỗ trợ cả 2 field name
  image: item.thumbnail || item.image, // Backward compatibility
  images: parseImages(item.image),
  status: item.status,
  category_id: item.category_id,
  category: item.category,
});

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
};

// ==================== CATEGORIES ====================

// Lấy tất cả danh mục
export const getMenuTabs = async () => {
  try {
    const response = await client.get("/categories", {
      headers: getAuthHeader(),
    });
    return response.data?.data ?? [];
  } catch (error) {
    console.warn("Không thể lấy danh sách danh mục:", error.message);
    return [];
  }
};

// Lấy danh mục theo ID
export const getMenuTabByID = async (id) => {
  try {
    const response = await client.get(`/categories/${id}`, {
      headers: getAuthHeader(),
    });
    return response.data?.data;
  } catch (error) {
    throw error;
  }
};

// Tạo danh mục mới (Admin)
export const createNewMenuTab = async (category, accessToken) => {
  try {
    const response = await client.post("/categories", category, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi khi thêm mới danh mục:", error.message);
    throw error;
  }
};

// Cập nhật danh mục (Admin)
export const updateMenuTab = async (id, category, accessToken) => {
  try {
    const response = await client.put(`/categories/${id}`, category, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi khi sửa danh mục:", error.message);
    throw error;
  }
};

// Xóa danh mục (Admin)
export const deleteMenuTab = async (id, accessToken) => {
  try {
    await client.delete(`/categories/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch (error) {
    console.error("Lỗi khi xóa danh mục:", error.message);
    throw error;
  }
};

// ==================== PRODUCTS ====================

// Lấy tất cả sản phẩm
export const getFoodItems = async () => {
  try {
    const response = await client.get("/products");
    const data = response.data?.data ?? [];
    return data.map(normalizeProduct);
  } catch (error) {
    throw error;
  }
};

// Lấy sản phẩm theo ID
export const getFoodItemByID = async (id) => {
  try {
    const response = await client.get(`/products/${id}`);
    const data = response.data?.data;
    return data ? normalizeProduct(data) : null;
  } catch (error) {
    throw error;
  }
};

// Tạo sản phẩm mới (Admin)
export const createNewFoodItem = async (foodItem, accessToken) => {
  try {
    // Đảm bảo category_id và price là số (không phải string)
    // Goravel validator yêu cầu integer type thực sự trong JSON
    const data = {
      name: String(foodItem.name || ""),
      description: String(foodItem.description || ""),
      price: Number(foodItem.price) || 0,
      thumbnail: String(foodItem.thumbnail || ""),
      category_id: Number(foodItem.category_id) || 0,
      status: Boolean(foodItem.status),
    };
    
    console.log("Sending product data:", data); // Debug log
    
    const response = await client.post("/products", data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi khi thêm mới món ăn:", error.response?.data || error.message);
    throw error;
  }
};

// Cập nhật sản phẩm (Admin)
export const updateFoodItem = async (id, menuitem, accessToken) => {
  try {
    // Đảm bảo các giá trị đúng kiểu dữ liệu
    const data = {
      id: Number(id) || 0,
      name: String(menuitem.name || ""),
      description: String(menuitem.description || ""),
      price: Number(menuitem.price) || 0,
      thumbnail: String(menuitem.thumbnail || ""),
      category_id: Number(menuitem.category_id) || 0,
      status: Boolean(menuitem.status),
    };
    
    console.log("Updating product data:", data); // Debug log
    
    const response = await client.put(`/products/${id}`, data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi khi cập nhật món ăn:", error.response?.data || error.message);
    throw error;
  }
};

// Xóa sản phẩm (Admin)
export const deleteFoodItem = async (id, accessToken) => {
  try {
    await client.delete(`/products/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch (error) {
    console.error("Lỗi khi xóa món ăn:", error.message);
    throw error;
  }
};

// Thêm nhiều sản phẩm cùng lúc (Admin)
export const addMultipleProducts = async (products, accessToken) => {
  try {
    const response = await client.post("/products/add", { products }, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi khi thêm nhiều sản phẩm:", error.message);
    throw error;
  }
};
