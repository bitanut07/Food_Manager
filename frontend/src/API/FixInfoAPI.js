import axios from "axios";
import { API_BASE_URL } from "../Config/apiConfig";

const client = axios.create({
  baseURL: API_BASE_URL,
});

const getAuthHeader = (token) => {
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Lấy thông tin user hiện tại từ token
export const GetInfoCus = async (CusId, token) => {
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
      "Lỗi khi lấy thông tin khách hàng:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

// Lấy email của khách hàng (dùng chung endpoint profile)
export const GetEmailCus = async (CusId, token) => {
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

// Tạo thông tin khách hàng mới (dùng register)
export const PostInfoCus = async (InfoCus, token) => {
  try {
    const response = await client.post("/register", InfoCus, {
      headers: {
        ...getAuthHeader(token),
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Lỗi khi tạo thông tin khách hàng:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

// Cập nhật thông tin khách hàng
export const ChangeInfoCus = async (CusId, InfoChange, token) => {
  try {
    const response = await client.post(
      "/update-profile",
      {
        user_id: parseInt(CusId),
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
      "Lỗi khi cập nhật thông tin khách hàng:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

// Thay đổi thông tin đăng nhập (email/password)
// Backend hiện tại chưa hỗ trợ endpoint riêng cho việc này
export const ChangeInfoLogCus = async (CusId, InfoChange, token) => {
  console.warn("ChangeInfoLogCus: Backend chưa hỗ trợ thay đổi email/password riêng.");
  throw new Error("Chức năng thay đổi email/mật khẩu chưa được hỗ trợ");
};

// Kiểm tra mật khẩu
// Backend hiện tại chưa hỗ trợ endpoint kiểm tra password riêng
export const CheckPassword = async (CusID, Pass, token) => {
  console.warn("CheckPassword: Backend chưa hỗ trợ kiểm tra mật khẩu riêng.");
  throw new Error("Chức năng kiểm tra mật khẩu chưa được hỗ trợ");
};
