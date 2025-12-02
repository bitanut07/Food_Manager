import React, { createContext, useState, useEffect } from "react";
import { GetResInfo } from "../API/AdminAPI"; // Hàm gọi API

// Tạo Context
export const RestaurantContext = createContext();

// Tạo Provider
export const RestaurantProvider = ({ children }) => {
  const [restaurantInfo, setRestaurantInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRestaurantData = async () => {
      try {
        const data = await GetResInfo();
        setRestaurantInfo((prevInfo) => ({
          ...prevInfo, // Giữ lại dữ liệu cũ
          ...data, // Ghi đè hoặc thêm dữ liệu mới
        }));
      } catch (err) {
        setError("Không thể tải thông tin nhà hàng.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantData();
  }, []);

  return (
    <RestaurantContext.Provider
      value={{ restaurantInfo, setRestaurantInfo, loading, error }}
    >
      {children}
    </RestaurantContext.Provider>
  );
};
