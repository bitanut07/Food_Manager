import axios from "axios";
import { API_BASE_URL } from "../Config/apiConfig";

const client = axios.create({
  baseURL: API_BASE_URL,
});

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Lấy tất cả voucher (dùng làm promotions)
export const fetchPromotions = async () => {
  try {
    const response = await client.get("/vouchers");
    return response.data?.data ?? [];
  } catch (error) {
    console.error("Lỗi khi lấy danh sách ưu đãi:", error.message);
    throw error;
  }
};

// Lấy voucher còn hiệu lực
export const fetchValidPromotions = async () => {
  try {
    const response = await client.get("/vouchers");
    const vouchers = response.data?.data ?? [];
    const now = new Date();
    // Filter only valid vouchers
    return vouchers.filter(v => {
      const startDate = new Date(v.start_date);
      const endDate = new Date(v.end_date);
      return now >= startDate && now <= endDate;
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách ưu đãi:", error.message);
    throw error;
  }
};

// Lấy voucher theo code
export const fetchPromotionByCode = async (code) => {
  try {
    const response = await client.get("/vouchers");
    const vouchers = response.data?.data ?? [];
    return vouchers.find(v => v.code === code) || null;
  } catch (error) {
    console.error("Lỗi khi lấy thông tin ưu đãi:", error.message);
    throw error;
  }
};

// Xóa voucher (Admin)
export const deletePromotion = async (id, accessToken) => {
  try {
    await client.delete(`/vouchers/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch (error) {
    console.error("Lỗi khi xóa ưu đãi:", error.message);
    throw error;
  }
};

// Thêm voucher (Admin)
export const addPromotion = async (promotion, accessToken) => {
  try {
    // Map promotion fields to voucher fields
    const voucherData = {
      code: promotion.code,
      description: promotion.description || promotion.title,
      discount_type: "percent",
      discount_value: promotion.discount || 0,
      min_order: promotion.min_order || 0,
      max_discount: 0,
      start_date: promotion.startdate,
      end_date: promotion.enddate,
      usage_limit_per_user: 1,
      usage_limit_global: 100,
    };

    const response = await client.post("/vouchers", voucherData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi khi thêm mới ưu đãi:", error.message);
    throw error;
  }
};

// Cập nhật voucher (Admin)
export const updatePromotion = async (id, promotion, accessToken) => {
  try {
    const voucherData = {
      code: promotion.code,
      description: promotion.description || promotion.title,
      discount_type: "percent",
      discount_value: promotion.discount || 0,
      min_order: promotion.min_order || 0,
      max_discount: 0,
      start_date: promotion.startdate,
      end_date: promotion.enddate,
      usage_limit_per_user: 1,
      usage_limit_global: 100,
    };

    const response = await client.put(`/vouchers/${id}`, voucherData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi khi cập nhật ưu đãi:", error.message);
    throw error;
  }
};
