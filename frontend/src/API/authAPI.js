import axios from "axios";
import { API_BASE_URL } from "../Config/apiConfig";

const client = axios.create({
  baseURL: API_BASE_URL,
});

const unsupported = (feature) => {
  console.warn(`${feature} hiện chưa được backend hỗ trợ.`);
  return Promise.reject(
    new Error(`${feature} chưa khả dụng trên hệ thống hiện tại.`)
  );
};

const ensurePayload = (payload, fields) => {
  const missing = fields.filter((field) => !payload[field]);
  if (missing.length) {
    throw new Error(`Thiếu thông tin bắt buộc: ${missing.join(", ")}`);
  }
};

export const account_check = async () => Promise.resolve();

export const login = async (credentials) => {
  const email = credentials.email || credentials.username;
  ensurePayload(
    { email, password: credentials.password },
    ["email", "password"]
  );

  try {
    const response = await client.post("/login", {
      email,
      password: credentials.password,
    });
    const { token, data, role } = response.data;

    return {
      access: token,
      refresh: token,
      user: data,
      role: role ?? data?.role,
    };
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message;
    console.error("Lỗi khi đăng nhập:", message);
    throw new Error(message);
  }
};

export const verifyOTP = async () => unsupported("Xác minh OTP");

export const sendOrResendOTP = async () => unsupported("Gửi OTP");

export const register = async (userData) => {
  const payload = {
    email: userData.email,
    name: userData.name ?? userData.full_name ?? userData.username,
    phone: userData.phone ?? userData.phone_number,
    address: userData.address ?? "",
    gender: userData.gender ?? "other",
    date_of_birth:
      userData.date_of_birth ?? userData.dob ?? userData.dateOfBirth,
    password: userData.password,
    confirm_password:
      userData.confirm_password ?? userData.confirmPassword ?? userData.password,
  };

  ensurePayload(payload, [
    "email",
    "name",
    "phone",
    "address",
    "gender",
    "date_of_birth",
    "password",
    "confirm_password",
  ]);

  try {
    const response = await client.post("/register", payload);
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message;
    console.error("Lỗi khi đăng ký:", message);
    throw new Error(message);
  }
};

export const forgotPassword = async () => unsupported("Quên mật khẩu");

export const resetPassword = async () => unsupported("Đặt lại mật khẩu");

export const refreshToken = async (token) => {
  if (!token) {
    throw new Error("Thiếu token để làm mới.");
  }
  return { access: token };
};

export const logout = async (_refreshToken, token) => {
  if (!token) {
    throw new Error("Thiếu token xác thực.");
  }

  try {
    const response = await client.post(
      "/logout",
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message;
    console.error("Lỗi khi đăng xuất:", message);
    throw new Error(message);
  }
};

