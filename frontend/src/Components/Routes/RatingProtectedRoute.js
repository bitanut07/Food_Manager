import React from 'react';
import { Navigate } from 'react-router-dom';

const RatingProtectedRoute = ({  }) => {
    const decryptData = (encryptedData, secretKey) => {
        // Đưa dữ liệu mã hóa trở lại dạng chuẩn Base64
        const base64String =
          encryptedData
            .replace(/-/g, "+") // Thay '-' bằng '+'
            .replace(/_/g, "/") + // Thay '_' bằng '/'
          "=".repeat((4 - (encryptedData.length % 4)) % 4); // Thêm dấu '=' nếu cần
    
        // Giải mã
        const bytes = CryptoJS.AES.decrypt(base64String, secretKey);
        return bytes.toString(CryptoJS.enc.Utf8);
      };
      const { invoice } = useParams();
      const invoiceID = parseInt(decryptData(invoice, PRIVATE_KEY), 10); // Lấy phần cuối của URL
    if (!isLoggedIn) {
        return <Navigate to="/" />;
    }

    // Nếu vai trò của người dùng không được phép, chuyển hướng về trang chủ
    if (allowedRoles && !allowedRoles.includes(userRole)) {
        return <Navigate to="/" />;
    }

    // Hiển thị nội dung được bảo vệ nếu tất cả điều kiện được đáp ứng
    return children;
};

export default RatingProtectedRoute;
