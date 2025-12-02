import axios from "axios";
import { API_BASE_URL } from "../Config/apiConfig";

const client = axios.create({
  baseURL: API_BASE_URL,
});

const getAuthHeader = (token) => {
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ==================== EMPLOYEE (Chưa hỗ trợ trong backend hiện tại) ====================

export const FillInfoEmp = async (InfoChange, token) => {
  console.warn("FillInfoEmp: Backend chưa hỗ trợ endpoint này.");
  throw new Error("Chức năng chưa được hỗ trợ");
};

export const getDepartments = async (token) => {
  console.warn("getDepartments: Backend chưa hỗ trợ endpoint này.");
  return [];
};

export const getDepartmentById = async (id, token) => {
  console.warn("getDepartmentById: Backend chưa hỗ trợ endpoint này.");
  return null;
};

export const addDepartment = async (department, token) => {
  console.warn("addDepartment: Backend chưa hỗ trợ endpoint này.");
  throw new Error("Chức năng chưa được hỗ trợ");
};

export const updateDepartment = async (id, updatedFields, token) => {
  console.warn("updateDepartment: Backend chưa hỗ trợ endpoint này.");
  throw new Error("Chức năng chưa được hỗ trợ");
};

export const deleteDepartment = async (id, token) => {
  console.warn("deleteDepartment: Backend chưa hỗ trợ endpoint này.");
  throw new Error("Chức năng chưa được hỗ trợ");
};

export const getEmployee = async (token) => {
  console.warn("getEmployee: Backend chưa hỗ trợ endpoint này.");
  return [];
};

export const deleteEmployee = async (id, token) => {
  console.warn("deleteEmployee: Backend chưa hỗ trợ endpoint này.");
  throw new Error("Chức năng chưa được hỗ trợ");
};

// ==================== DOANH THU ====================

// Xem danh sách hóa đơn (doanh thu từ orders)
export const getInvoice = async (token) => {
  try {
    const response = await client.get("/reservations-orders", {
      headers: getAuthHeader(token),
    });
    return response.data;
  } catch (error) {
    console.error("Error get Invoices:", error);
    throw error;
  }
};

// Lấy thống kê doanh thu tổng hợp
export const getRevenueStats = async (token) => {
  try {
    const response = await client.get("/admin/revenue-stats", {
      headers: getAuthHeader(token),
    });
    return response.data;
  } catch (error) {
    console.error("Error get Revenue Stats:", error);
    throw error;
  }
};

// ==================== BÀN ====================

// Lấy danh sách bàn
export const GetTable = async (token) => {
  try {
    const response = await client.get("/tables", {
      headers: getAuthHeader(token),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching tables:", error);
    throw error;
  }
};

// Lấy bàn theo id (Backend chưa hỗ trợ)
export const GetTableById = async (id, token) => {
  console.warn("GetTableById: Backend chưa hỗ trợ endpoint này.");
  return null;
};

// Thêm bàn mới
export const addTable = async (tableData, token) => {
  try {
    const response = await client.post("/tables", tableData, {
      headers: getAuthHeader(token),
    });
    return response.data;
  } catch (error) {
    console.error("Error adding table:", error);
    throw error;
  }
};

// Cập nhật bàn (Backend chưa hỗ trợ)
export const UpdateTable = async (id, updatedFields, token) => {
  console.warn("UpdateTable: Backend chưa hỗ trợ endpoint này.");
  throw new Error("Chức năng chưa được hỗ trợ");
};

// Xóa bàn (Backend chưa hỗ trợ)
export const DeleteTable = async (id, token) => {
  console.warn("DeleteTable: Backend chưa hỗ trợ endpoint này.");
  throw new Error("Chức năng chưa được hỗ trợ");
};

// ==================== THÔNG TIN NHÀ HÀNG ====================

// Lấy thông tin nhà hàng
export const GetResInfo = async () => {
  try {
    const response = await client.get("/config/restaurant-configs");
    return response.data;
  } catch (error) {
    console.error("Error get restaurant info:", error);
    throw error;
  }
};

// Chỉnh sửa thông tin nhà hàng (Backend chưa hỗ trợ PATCH)
export const UpdateResInfo = async (token, restaurantInfor) => {
  console.warn("UpdateResInfo: Backend chưa hỗ trợ cập nhật thông tin nhà hàng.");
  throw new Error("Chức năng chưa được hỗ trợ");
};
