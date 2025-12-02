import React, { useContext, useState ,useRef } from "react";
import { RestaurantContext } from "../../../Config/RestaurantContext";
import { useAuth } from "../../Auth/AuthContext";
import { isTokenExpired } from "../../../utils/tokenHelper.mjs";
import { refreshToken } from "../../../API/authAPI";
import { markPaid } from "../../../API/EE_ReservationAPI";
import SuccessMessage from "./SuccessMessage";
import InvoicePrintable from "./InvoicePrintable";
import style from "./PrintInvoice.module.css";
import { useNavigate } from "react-router-dom";

function PrintInvoice({ setShow, foodData, invoiceData, pID, iID, setIsPrintInvoice }) {
    const { restaurantInfo } = useContext(RestaurantContext);
    const { accessToken, setAccessToken } = useAuth();
    const [success, setSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
  const printRef = useRef();
  const navigate = useNavigate();

  const ensureActiveToken = async () => {
    const refresh = localStorage.getItem("refreshToken");
    if (!refresh || isTokenExpired(refresh)) {
                  navigate('/', { replace: true });
                  window.location.reload();
                  throw 'Phiên đăng nhập hết hạn';
                }
    let activeToken = accessToken;

    if (!accessToken || isTokenExpired(accessToken)) {
      const refreshed = await refreshToken(refresh);
      activeToken = refreshed.access;
      setAccessToken(activeToken);
    }
    return activeToken;
  };

  const handlePrint = () => {
    const printContent = printRef.current; // Lấy nội dung cần in từ ref
    const printWindow = window.open("", "_printInvoice"); // Tạo cửa sổ in mới

    // Lấy style hiện tại từ tài liệu gốc
    const styles = Array.from(document.styleSheets)
      .map((styleSheet) => {
        try {
          return Array.from(styleSheet.cssRules)
            .map((rule) => rule.cssText)
            .join("");
        } catch (err) {
          console.error("Error reading CSS rules", err);
          return "";
        }
      })
      .join("");

    // Viết nội dung cần in vào tài liệu của cửa sổ mới
    printWindow.document.write(`
      <html>
        <head>
          <title>Hóa Đơn</title>
          <style>${styles}</style> <!-- Thêm CSS vào tài liệu in -->
        </head>
        <body>
          ${printContent.outerHTML} <!-- Chèn nội dung cần in -->
        </body>
      </html>
    `);

    printWindow.document.close(); // Đóng tài liệu mới
    // Đợi tất cả hình ảnh trong tài liệu được tải
    const images = printWindow.document.querySelectorAll("img");
    let imagesLoaded = 0;

    images.forEach((img) => {
      img.onload = () => {
        imagesLoaded++;
        if (imagesLoaded === images.length) {
          printWindow.print(); // Chỉ in khi tất cả hình ảnh được tải
        }
      };
      img.onerror = () => {
        console.error("Không thể tải hình ảnh:", img.src);
        imagesLoaded++;
        if (imagesLoaded === images.length) {
          printWindow.print();
        }
      };
    });

    if (images.length === 0) {
      printWindow.print(); // Nếu không có ảnh, in ngay lập tức
    }
  };

  const handlePay = async () => {
    try {
      const activeToken = await ensureActiveToken();
      await markPaid(activeToken, iID); // API đánh dấu thanh toán
      setSuccess(true); // Hiển thị thông báo thành công
    } catch (error) {
      setErrorMessage("Có lỗi xảy ra khi thanh toán. Vui lòng thử lại!");
    }
  };

  return (
    <div className={style["Invoice-modal"]}>
      <div className={style["Invoice-modal-content"]}>
        <button className={style["Invoice-close-modal"]} onClick={() => setShow(false)}>
          &times;
        </button>

        <div ref={printRef}>
          <InvoicePrintable
            restaurantInfo={restaurantInfo}
            foodData={foodData}
            invoiceData={invoiceData}
            QR={restaurantInfo.QR}
          />
        </div>

        <div className={style["Invoice-action-buttons"]}>
          <button className={style["Invoice-btn"]} onClick={handlePrint}>
            In hóa đơn
          </button>
          <button className={style["Invoice-btn"]} onClick={handlePay}>
            Thanh toán
          </button>
        </div>

        {errorMessage && <p className={style["Invoice-error"]}>{errorMessage}</p>}
        {success && (
          <SuccessMessage
            setShow={setSuccess}
            setShowExInvoice={setShow}
            setShowInvoice={setIsPrintInvoice}
          />
        )}
      </div>
    </div>
  );
}

export default PrintInvoice;
