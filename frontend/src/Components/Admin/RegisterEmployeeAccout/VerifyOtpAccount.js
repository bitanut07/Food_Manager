import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import style from "../../../Style/AuthStyle/VerifyOTP.module.css";
import {
  verifyOTP,
  register,
  sendOrResendOTP,
  refreshToken,
} from "../../../API/authAPI";
import { isTokenExpired } from "./../../../utils/tokenHelper.mjs";
import { ModalGeneral } from "../../ModalGeneral";

function VerifyOtpAccount() {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const [modal, setModal] = useState({
    isOpen: false,
    text: "",
    type: "", // "confirm" hoặc "success"
    onConfirm: null, // Hàm được gọi khi xác nhận
  });
  // Lấy mode, email, và signupData từ location.state
  const { email, signupData } = location.state || {};

  const handleInputChange = (e) => {
    setOtp(e.target.value);
    setError(""); // Xóa thông báo lỗi khi người dùng nhập lại
    setSuccessMessage("");
  };

  const handleCloseModal = (id, refresh_employee, token_employee) => {
    setModal({ isOpen: false }); // Đóng modal
    navigate("/admin-dashboard/fill-info-emp", {
      state: { email, id, refresh_employee, token_employee },
    }); // Điều hướng
  };

  const handleVerify = async () => {
    if (!email) {
      setError("Không tìm thấy email. Vui lòng thử lại.");
      return;
    }

    if (otp.trim() === "") {
      setError("Vui lòng nhập mã OTP.");
      return;
    }

    setError("");
    setSuccessMessage("");

    try {
      // Gửi yêu cầu xác minh OTP
      let response = await verifyOTP({ email, otp });
      const token_employee = response.access_token;
      const refresh_employee = response.refresh_token;

      //gửi thông tin đăng ký
      if (!signupData) {
        setError("Không tìm thấy thông tin đăng ký. Vui lòng thử lại.");
        return;
      }

      const userData = {
        username: signupData.username,
        email: signupData.email,
        password: signupData.password,
        account_type: signupData.account_type,
      };

      if (isTokenExpired(token_employee)) {
        let newresponse = await refreshToken(refresh_employee, token_employee);
        token_employee = newresponse.access;
      }

      // Đăng ký tài khoản
      const responseRegister = await register(userData, token_employee);
      const id = responseRegister.id;

      setModal({
        isOpen: true,
        text: "Đăng ký thành công",
        type: "success",
      });
      handleCloseModal(id, refresh_employee, token_employee);
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail || "Mã OTP không hợp lệ. Vui lòng thử lại.";
      setError(errorMessage);
    }
  };

  const handleReSendOTP = async () => {
    try {
      // Gửi lại mã OTP
      await sendOrResendOTP({ email });
      setSuccessMessage(
        "Mã OTP đã được gửi lại, vui lòng kiểm tra email của bạn."
      );
    } catch (err) {
      const errorMessage = err.response?.data?.detail || "Email không hợp lệ";
      setError(errorMessage);
    }
  };

  return (
    <div className={style["OTP-container"]}>
      <div className={style["verify-otp-container"]}>
        <h2>Xác Minh OTP</h2>
        <h3>Nhập mã OTP đã được gửi về gmail của nhân viên</h3>
        <input
          type="text"
          placeholder="Nhập mã OTP"
          value={otp}
          onChange={handleInputChange}
          className={style["otp-input"]}
        />
        {error && <p className={style["error-message"]}>{error}</p>}

        {successMessage && <p className="success-message">{successMessage}</p>}

        <button onClick={handleVerify} className={style["verify-button"]}>
          Xác Minh
        </button>

        <button onClick={handleReSendOTP} className={style["re-verify-button"]}>
          Gửi lại mã xác minh
        </button>
      </div>
      {modal.isOpen && (
        <ModalGeneral
          isOpen={modal.isOpen}
          text={modal.text}
          type={modal.type}
          onClose={() => setModal({ isOpen: false })}
          onConfirm={modal.onConfirm}
        />
      )}
    </div>
  );
}

export default VerifyOtpAccount;
