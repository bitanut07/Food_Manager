import axios from "axios";
import { API_BASE_URL } from "../Config/apiConfig";

const client = axios.create({
  baseURL: API_BASE_URL,
});

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Lấy tất cả danh mục (public)
export const getCategories = async () => {
  try {
    const response = await client.get("/categories");
    return response.data?.data ?? [];
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
};

// Tạo danh mục mới (Admin)
export const createCategory = async (category) => {
  try {
    const response = await client.post("/categories", category, {
      headers: getAuthHeader(),
    });
    return response.data?.data;
  } catch (error) {
    console.error("Error creating category:", error);
    throw error;
  }
};

// Cập nhật danh mục (Admin)
export const updateCategory = async (id, category) => {
  try {
    const response = await client.put(`/categories/${id}`, category, {
      headers: getAuthHeader(),
    });
    return response.data?.data;
  } catch (error) {
    console.error("Error updating category:", error);
    throw error;
  }
};

// Xóa danh mục (Admin)
export const deleteCategory = async (id) => {
  try {
    const response = await client.delete(`/categories/${id}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting category:", error);
    throw error;
  }
};
