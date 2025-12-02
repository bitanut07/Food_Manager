import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import style from "../../Style/AuthStyle/VerifyOTP.module.css";
import {
  verifyOTP,
  register,
  sendOrResendOTP,
  forgotPassword,
  refreshToken,
} from "../../API/authAPI";
import { isTokenExpired } from "../../utils/tokenHelper.mjs";
import { ModalGeneral } from "../ModalGeneral";
import { PostInfoCus } from "../../API/FixInfoAPI";

function VerifyOTP() {
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
  const {
    mode = "register",
    email,
    signupData,
    CusInfo,
  } = location.state || {};

  const handleInputChange = (e) => {
    setOtp(e.target.value);
    setError(""); // Xóa thông báo lỗi khi người dùng nhập lại
    setSuccessMessage("");
  };

  const handleCloseModalForgotPassword = (token) => {
    setModal({ isOpen: false }); // Đóng modal
    navigate("/reset-password", { state: { email, token } }); // Điều hướng
  };

  const handleCloseModalSignUp = () => {
    setModal({ isOpen: false }); // Đóng modal
    navigate("/"); // Điều hướng
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
      const token = response.access_token;
      const refresh = response.refresh_token;

      if (mode === "register") {
        // Nếu ở chế độ đăng ký, gửi thông tin đăng ký
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

        if (isTokenExpired(token)) {
          let newresponse = await refreshToken(refresh, token);
          token = newresponse.access;
        }

        // Đăng ký tài khoản
        const response = await register(userData, token);
        const InfoCus = {
          account_id: response.id,
          full_name: CusInfo.full_name,
          email: CusInfo.email,
          gender: CusInfo.gender,
          phone_number: CusInfo.phone_number,
        };
        await PostInfoCus(InfoCus, token);
        setModal({
          isOpen: true,
          text: "Đăng ký tài khoản thành công!",
          type: "success",
          onConfirm: handleCloseModalSignUp,
        });
      } else if (mode === "forgotPassword") {
        // Nếu ở chế độ quên mật khẩu, điều hướng đến trang đặt lại mật khẩu
        setModal({
          isOpen: true,
          text: "OTP xác minh thành công. Vui lòng đặt lại mật khẩu!",
          type: "success",
          onConfirm: handleCloseModalForgotPassword,
        });
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail || "Mã OTP không hợp lệ. Vui lòng thử lại.";
      setError(errorMessage);
    }
  };

  const handleReSendOTP = async () => {
    try {
      if (mode === "register") {
        // Gửi lại mã OTP
        await sendOrResendOTP({ email });
      } else if (mode === "forgotPassword") {
        await forgotPassword({ email });
      }
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
        <h3>Nhập mã OTP đã được gửi về gmail của bạn</h3>
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
          onClose={modal.onConfirm || (() => setModal({ isOpen: false }))}
          onConfirm={modal.onConfirm}
        />
      )}
    </div>
  );
}

export default VerifyOTP;
