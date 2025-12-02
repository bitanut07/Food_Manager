import axios from "axios";
import { API_BASE_URL } from "../Config/apiConfig";

const client = axios.create({
  baseURL: API_BASE_URL,
});

const getAuthHeader = (token) => {
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Lấy thông tin nhân viên (dùng chung endpoint user/profile)
export const GetInfoEmp = async (EmpId, token) => {
  try {
    const response = await client.get("/user/profile", {
      headers: {
        ...getAuthHeader(token),
        "Content-Type": "application/json",
      },
    });
    // Backend trả về: { message: "...", data: { id, email, full_name, phone, ... } }
    const data = response.data?.data || response.data;
    return {
      id: data?.id,
      full_name: data?.full_name,
      gender: data?.gender,
      phone_number: data?.phone,
      phone: data?.phone,
      address: data?.address,
      date_of_birth: data?.date_of_birth,
      role: data?.role,
      email: data?.email,
    };
  } catch (error) {
    console.error(
      "Lỗi khi lấy thông tin nhân viên:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

// Lấy email của nhân viên (dùng chung endpoint user/profile)
export const GetEmailEmp = async (EmpId, token) => {
  try {
    const response = await client.get("/user/profile", {
      headers: {
        ...getAuthHeader(token),
        "Content-Type": "application/json",
      },
    });
    const data = response.data?.data || response.data;
    return {
      email: data?.email,
    };
  } catch (error) {
    console.error(
      "Lỗi khi lấy thông tin email:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

// Cập nhật thông tin nhân viên
export const ChangeInfoEmp = async (EmpId, InfoChange, token) => {
  try {
    const response = await client.post(
      "/update-profile",
      {
        user_id: parseInt(EmpId),
        name: InfoChange.full_name || InfoChange.name,
        phone: InfoChange.phone_number || InfoChange.phone,
        address: InfoChange.address || "",
        gender: InfoChange.gender,
        date_of_birth: InfoChange.date_of_birth || "",
      },
      {
        headers: {
          ...getAuthHeader(token),
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      "Lỗi khi cập nhật thông tin nhân viên:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

// Thay đổi thông tin đăng nhập (email/password)
// Backend hiện tại chưa hỗ trợ endpoint riêng cho việc này
export const ChangeInfoLogEmp = async (EmpId, InfoChange, token) => {
  console.warn("ChangeInfoLogEmp: Backend chưa hỗ trợ thay đổi email/password riêng.");
  throw new Error("Chức năng thay đổi email/mật khẩu chưa được hỗ trợ");
};
