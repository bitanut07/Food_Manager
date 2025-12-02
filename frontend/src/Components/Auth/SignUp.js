import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import style from "../../Style/AuthStyle/SignUp.module.css";
import { register } from "../../API/authAPI";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { checkPasswordRequirements } from "../../utils/checkPasswordRequirements";

function SignUp() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [requirement, setRequirement] = useState(null);
  const [gender, setGender] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  const navigate = useNavigate();

  const validatePhoneNumber = (phone) => {
    if (phone.length === 0) {
      return "Số điện thoại không được để trống.";
    }
    if (!/^[0-9]+$/.test(phone)) {
      return "Số điện thoại chỉ được chứa chữ số.";
    }
    if (phone.length !== 10) {
      return "Số điện thoại phải đủ 10 chữ số.";
    }
    return null;
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
    setErrors({});
    setSuccessMessage("");

    const phoneError = validatePhoneNumber(phoneNumber);
    if (phoneError) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        phoneNumber: phoneError,
      }));
      return;
    }

    if (password !== confirmPassword) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        confirmPassword: "Mật khẩu xác nhận không khớp.",
      }));
      return;
    }

    try {
      await register({
        name: fullName,
      email,
      password,
        confirm_password: confirmPassword,
      gender,
        phone: phoneNumber,
        address,
        date_of_birth: dateOfBirth,
      });

      setSuccessMessage("Đăng ký tài khoản thành công. Vui lòng đăng nhập!");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        message: err.message || "Không thể đăng ký. Vui lòng thử lại.",
      }));
    }
  };

  return (
    <div className={style["signup-container"]}>
      <div className={style["signup-box"]}>
        <h2 className={style["title"]}>ĐĂNG KÝ</h2>
        <form onSubmit={handleSignUpSubmit} className={style["signup-form"]}>
          {errors.message && (
            <p className={style["error-message"]}>{errors.message}</p>
          )}
          {successMessage && (
            <p className={style["error-message"]} style={{ color: "green" }}>
              {successMessage}
            </p>
          )}

          <div className={style["form-column"]}>
            <label htmlFor="full_name" className={style["form-title"]}>
              Họ và Tên
            </label>
            <input
              type="text"
              id="full_name"
              placeholder="Nhập họ và tên"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className={style["form-column"]}>
            <label htmlFor="email" className={style["form-title"]}>
              Email
            </label>
            <input
              type="email"
              id="email"
              placeholder="Nhập email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className={style["form-column"]}>
            <label htmlFor="password" className={style["form-title"]}>
              Mật khẩu
            </label>
            <div className={style["password-input-container"]}>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
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

            {requirement && (
              <div className={style["password-requirement"]}>
                <p style={{ color: "red" }}>• {requirement.text}</p>
              </div>
            )}
          </div>

          <div className={style["form-column"]}>
            <label htmlFor="confirm-password" className={style["form-title"]}>
              Xác nhận mật khẩu
            </label>
            <div className={style["password-input-container"]}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirm-password"
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
          </div>

          <div className={style["form-column"]}>
            <label htmlFor="gender" className={style["form-title"]}>
              Giới tính
            </label>
            <select
              id="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              required
            >
              <option value="" disabled>
                Chọn giới tính
              </option>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
              <option value="other">Khác</option>
            </select>
          </div>

          <div className={style["form-column"]}>
            <label htmlFor="phone-number" className={style["form-title"]}>
              Số Điện Thoại
            </label>
            <input
              id="phone-number"
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
            {errors.phoneNumber && (
              <p className={style["error-message"]}>{errors.phoneNumber}</p>
            )}
          </div>

          <div className={style["form-column"]}>
            <label htmlFor="address" className={style["form-title"]}>
              Địa chỉ
            </label>
            <input
              id="address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>

          <div className={style["form-column"]}>
            <label htmlFor="dob" className={style["form-title"]}>
              Ngày sinh
            </label>
            <input
              id="dob"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              required
            />
          </div>

          <button type="submit" className={style["signup-btn"]}>
            Đăng ký
          </button>
        </form>
        <button
          type="button"
          className={style["login-btn"]}
          onClick={() => navigate("/login")}
        >
          Đã có tài khoản? Đăng nhập
        </button>
      </div>
    </div>
  );
}

export default SignUp;
