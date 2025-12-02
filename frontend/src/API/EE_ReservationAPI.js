import axios from "axios";
import { API_BASE_URL } from "../Config/apiConfig";

const client = axios.create({
  baseURL: API_BASE_URL,
});

const getAuthHeader = (token) => {
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Lấy danh sách bàn
export const fetchTablesData = async (token) => {
  try {
    const response = await client.get("/tables", {
      headers: {
        ...getAuthHeader(token),
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Lấy danh sách đặt bàn theo ngày hiện tại
export const fetchReservationData = async (token) => {
  try {
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    const response = await client.get(`/reservations/date/${formattedDate}`, {
      headers: {
        ...getAuthHeader(token),
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Lấy danh sách đặt bàn theo ngày
export const fetchDateData = async (token, date) => {
  try {
    let formattedDate;
    if (!date) {
      const today = new Date();
      const day = today.getDate();
      const month = today.getMonth() + 1;
      const year = today.getFullYear();
      formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    } else {
      formattedDate = date;
    }
    
    const response = await client.get(`/reservations/date/${formattedDate}`, {
      headers: {
        ...getAuthHeader(token),
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Lấy đặt bàn theo số điện thoại
export const getReservationByNumber = async (token, phone_number) => {
  try {
    const response = await client.get(`/reservations/phone/${phone_number}`, {
      headers: {
        ...getAuthHeader(token),
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Cập nhật thông tin đặt bàn (Backend chưa hỗ trợ)
export const patchReservation = async (token, rID, data) => {
  console.warn("patchReservation: Backend chưa hỗ trợ cập nhật đặt bàn.");
  throw new Error("Chức năng chưa được hỗ trợ");
};

// Lấy lịch sử đặt bàn theo SĐT
export const fetchReservationDataByPhoneNumber = async (token, phone_number) => {
  try {
    const response = await client.get(`/reservations/phone/${phone_number}`, {
      headers: {
        ...getAuthHeader(token),
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Gán bàn cho đặt chỗ (Backend chưa hỗ trợ)
export const assignTableAPI = async (token, rID, tID) => {
  console.warn("assignTableAPI: Backend chưa hỗ trợ gán bàn.");
  throw new Error("Chức năng chưa được hỗ trợ");
};

// Đánh dấu đặt bàn hoàn thành (Backend chưa hỗ trợ)
export const markDoneReservationAPI = async (token, rID) => {
  console.warn("markDoneReservationAPI: Backend chưa hỗ trợ.");
  throw new Error("Chức năng chưa được hỗ trợ");
};

// Đánh dấu đặt bàn bị hủy (Backend chưa hỗ trợ)
export const markCancelReservationAPI = async (token, rID) => {
  console.warn("markCancelReservationAPI: Backend chưa hỗ trợ.");
  throw new Error("Chức năng chưa được hỗ trợ");
};

// Hủy gán bàn (Backend chưa hỗ trợ)
export const unsignTableAPI = async (token, rID) => {
  console.warn("unsignTableAPI: Backend chưa hỗ trợ.");
  throw new Error("Chức năng chưa được hỗ trợ");
};

// Tạo order cho bàn (Backend chưa hỗ trợ - dùng /orders cho đơn hàng online)
export const createOrder = async (token, tID) => {
  console.warn("createOrder (reservation): Backend chưa hỗ trợ.");
  throw new Error("Chức năng chưa được hỗ trợ");
};

// Lấy order hiện tại của bàn (Backend chưa hỗ trợ)
export const fetchOrderData = async (token, tID) => {
  console.warn("fetchOrderData: Backend chưa hỗ trợ.");
  throw new Error("Chức năng chưa được hỗ trợ");
};

// Lấy order items (Backend chưa hỗ trợ)
export const fetchOrderItemData = async (token, oID) => {
  console.warn("fetchOrderItemData: Backend chưa hỗ trợ.");
  throw new Error("Chức năng chưa được hỗ trợ");
};

// Thêm món vào order (Backend chưa hỗ trợ)
export const addFood = async (token, oID, fID, q, n) => {
  console.warn("addFood: Backend chưa hỗ trợ.");
  throw new Error("Chức năng chưa được hỗ trợ");
};

// Cập nhật order item (Backend chưa hỗ trợ)
export const updateItem = async (token, iID, q, n) => {
  console.warn("updateItem: Backend chưa hỗ trợ.");
  throw new Error("Chức năng chưa được hỗ trợ");
};

// Cập nhật trạng thái order item (Backend chưa hỗ trợ)
export const updateItemStatus = async (token, iID) => {
  console.warn("updateItemStatus: Backend chưa hỗ trợ.");
  throw new Error("Chức năng chưa được hỗ trợ");
};

// Xóa order item (Backend chưa hỗ trợ)
export const removeItem = async (token, iID) => {
  console.warn("removeItem: Backend chưa hỗ trợ.");
  throw new Error("Chức năng chưa được hỗ trợ");
};

// Kiểm tra số điện thoại tồn tại (Backend chưa hỗ trợ)
export const checkPhoneNumber = async (token, number) => {
  console.warn("checkPhoneNumber: Backend chưa hỗ trợ.");
  throw new Error("Chức năng chưa được hỗ trợ");
};

// Thêm khuyến mãi vào hóa đơn (Backend chưa hỗ trợ)
export const addPromotionToInvoice = async (token, iID, pID) => {
  console.warn("addPromotionToInvoice: Backend chưa hỗ trợ.");
  throw new Error("Chức năng chưa được hỗ trợ");
};

// Đánh dấu đã thanh toán (Backend chưa hỗ trợ)
export const markPaid = async (token, iID) => {
  console.warn("markPaid: Backend chưa hỗ trợ.");
  throw new Error("Chức năng chưa được hỗ trợ");
};
