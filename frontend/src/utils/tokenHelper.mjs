import { jwtDecode } from "jwt-decode";

export const decodeToken = (token) => {
    try {
    const decoded = jwtDecode(token);
        return {
      user_id: decoded.sub ?? decoded.user_id,
      role: decoded.role ?? decoded.account_type,
      exp: decoded.exp,
        };
    } catch (error) {
        console.error("Lỗi khi decode token:", error.message);
        return null;
    }
};

export const isTokenExpired = (token) => {
    try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;

    if (!decoded.exp) {
      return false;
    }

    return decoded.exp < currentTime;
    } catch (error) {
        console.error("Lỗi khi kiểm tra token:", error.message);
    return true;
    }
};

