import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import style from "./../../../Style/AdminStyle/RegisterEmployeeAccount.module.css";
import { account_check, sendOrResendOTP } from "./../../../API/authAPI";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { checkPasswordRequirements } from "./../../../utils/checkPasswordRequirements";
import { ModalGeneral } from "../../ModalGeneral";
import { isTokenExpired } from "../../../utils/tokenHelper.mjs";
import { refreshToken } from "./../../../API/authAPI";
import { useAuth } from "../../Auth/AuthContext";
import { getDepartments } from "../../../API/AdminAPI";

function RegisterEmployeeAccount() {
  const { accessToken, setAccessToken } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [requirement, setRequirement] = useState(null);
  const [errors, setErrors] = useState({});
  const [modal, setModal] = useState({
    isOpen: false,
    text: "",
    type: "", // "confirm" hoặc "success"
    onConfirm: null, // Hàm được gọi khi xác nhận
  });

  const navigate = useNavigate();

  const account_type = "Employee";
  const handleNavigateToAddDepartment = () => {
    setModal({ isOpen: false }); // Đóng modal
    navigate("/admin-dashboard/add-department"); // Điều hướng sang trang thêm bộ phận
  };

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const activeToken = await ensureActiveToken();
        const departmentList = await getDepartments(activeToken);

        if (!departmentList || departmentList.length === 0) {
          setModal({
            isOpen: true,
            text: "Hiện tại chưa có bộ phận nào. Vui lòng thêm bộ phận trước khi thêm nhân viên!",
            type: "error",
            onConfirm: handleNavigateToAddDepartment,
          });
        }

        // Nếu có bộ phận, tiếp tục
      } catch (err) {}
    };

    loadDepartments();
  }, []);

  const ensureActiveToken = async () => {
    const refresh = localStorage.getItem("refreshToken");
    if (!refresh || isTokenExpired(refresh)) {
              navigate('/', { replace: true });
              window.location.reload();
              throw 'Phiên đăng nhập hết hạn';;
            }
    let activeToken = accessToken;
    if (isTokenExpired(accessToken)) {

      const refreshed = await refreshToken(refresh);
      activeToken = refreshed.access;
      setAccessToken(activeToken);
    }
    return activeToken;
  };

  const handlePasswordChange = (e) => {
    const inputPassword = e.target.value;
    setPassword(inputPassword);

    if (inputPassword === "") {
      setRequirement(null);
      return;
    }

    const firstUnmetRequirement = checkPasswordRequirements(inputPassword);
    setRequirement(firstUnmetRequirement);
  };

  const handleSignUpSubmit = async (event) => {
    event.preventDefault();

    // Reset lỗi trước khi kiểm tra
    setErrors({});

    if (password !== confirmPassword) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        confirmPassword: "Mật khẩu xác nhận không khớp.",
      }));
      return;
    }

    const signupData = {
      username,
      email,
      password,
      account_type,
    };

    try {
      await account_check(signupData);
    } catch (err) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        ...err,
      }));
      return;
    }

    try {
      navigate("/admin-dashboard/verify-otp-employee", {
        state: { signupData, email: signupData.email },
      });
      await sendOrResendOTP({ email: signupData.email });
    } catch (err) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        message: "Lỗi gửi OTP: " + err.message,
      }));
      return;
    }
  };

  return (
    <div className={style["signup-container"]}>
      <div className={style["signup-box"]}>
        <h2 className={style["title"]}>Đăng ký tài khoản nhân viên</h2>
        <form onSubmit={handleSignUpSubmit} className={style["signup-form"]}>
          {errors.message && (
            <p className={style["error-message"]}>{errors.message}</p>
          )}

          <label htmlFor="username" className={style["form-title"]}>
            Tài khoản
          </label>
          <input
            type="text"
            id="username"
            name="username"
            placeholder="Nhập tài khoản"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          {errors.username && (
            <p className={style["error-message"]}>
              {"Tên đăng nhập đã tồn tại"}
            </p>
          )}

          <label htmlFor="email" className={style["form-title"]}>
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="Nhập email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {errors.email && (
            <p className={style["error-message"]}>{errors.email}</p>
          )}

          <label htmlFor="password" className={style["form-title"]}>
            Mật khẩu
          </label>
          <div className={style["password-input-container"]}>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              placeholder="Nhập mật khẩu"
              required
              value={password}
              onChange={handlePasswordChange}
            />
            <span
              className={style["password-toggle-icon"]}
              onClick={() => setShowPassword(!showPassword)}
            >
              <FontAwesomeIcon icon={showPassword ? "eye-slash" : "eye"} />
            </span>
          </div>
          {errors.password && (
            <p className={style["error-message"]}>{errors.password[0]}</p>
          )}
          {requirement && (
            <div className={style["password-requirement"]}>
              <p style={{ color: "red" }}>• {requirement.text}</p>
            </div>
          )}

          <label htmlFor="confirm-password" className={style["form-title"]}>
            Xác nhận mật khẩu
          </label>
          <div className={style["password-input-container"]}>
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirm-password"
              name="confirm-password"
              placeholder="Xác nhận mật khẩu"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <span
              className={style["password-toggle-icon"]}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <FontAwesomeIcon
                icon={showConfirmPassword ? "eye-slash" : "eye"}
              />
            </span>
          </div>
          {errors.confirmPassword && (
            <p className={style["error-message"]}>{errors.confirmPassword}</p>
          )}

          <button type="submit" className={style["signup-btn"]}>
            Đăng ký
          </button>
        </form>
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

export default RegisterEmployeeAccount;
