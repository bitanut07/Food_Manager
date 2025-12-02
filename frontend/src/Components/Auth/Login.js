import React, { useState } from "react";
import style from "../../Style/AuthStyle/Login.module.css";
import { useNavigate, useLocation } from "react-router-dom";
import { login } from "../../API/authAPI";
import { initCart } from "../../API/CartAPI";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { decodeToken } from "../../utils/tokenHelper.mjs";
import { useAuth } from "./AuthContext";

function Login({ setIsLoggedIn, setUserRole }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(null);
  const { setAccessToken } = useAuth();

    const navigate = useNavigate();
  const location = useLocation();

  // Get redirect path from location state (if user was redirected to login)
  const from = location.state?.from || null;

    const handleLoginSubmit = async (event) => {
        event.preventDefault();
    setError(null);

        try {
      const response = await login({ email, password });
      const { access, refresh, role, user } = response;

      setAccessToken(access);
      localStorage.setItem("token", access);
      localStorage.setItem("refreshToken", refresh);

      const decoded = decodeToken(access);
      const userId = user?.id ?? decoded?.user_id;
      const resolvedRole = role ?? decoded?.role ?? "user";

      if (userId) {
        localStorage.setItem("userId", userId);
      }

      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userRole", resolvedRole);

      setIsLoggedIn(true);
      setUserRole(resolvedRole);

      // Initialize cart for user (create if not exists, or get existing)
      try {
        await initCart();
        // Dispatch event to update cart count in Header
        window.dispatchEvent(new Event("cartUpdated"));
      } catch (cartErr) {
        console.error("Error initializing cart:", cartErr);
        // Don't block login if cart init fails
      }

      // Redirect based on role or previous location
      if (from) {
        // If user was redirected to login, go back to where they were
        navigate(from);
      } else if (resolvedRole === "Admin" || resolvedRole === "admin") {
        // Admin goes to admin dashboard
        navigate("/admin-dashboard/manage-restaurant-info");
      } else if (resolvedRole === "Employee" || resolvedRole === "employee") {
        // Employee goes to employee dashboard
        navigate("/employee-dashboard");
            } else {
        // Regular user goes to home
        navigate("/");
            }
    } catch (err) {
      const message = err.message || "Email hoặc mật khẩu không đúng";
      setError(message);
          }
    };

    return (
        <div className={style["login-container"]}>
            <div className={style["login-box"]}>
        <h2 className={style["title"]}>Đăng nhập</h2>
                <form onSubmit={handleLoginSubmit} className={style["login-form"]}>
          {error && <p className={style["error-message"]}>{error}</p>}
          <label htmlFor="email" className={style["login-form-label"]}>
            Email
          </label>
                    <div>
                        <input
              type="email"
              id="email"
              name="email"
              className={style["login-form-input"]}
              placeholder="Nhập email"
                            required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
          <label htmlFor="password" className={style["login-form-label"]}>
            Mật khẩu
          </label>
          <div className={style["password-input-container"]}>
                        <input
                            type={showPassword ? "text" : "password"}
                            id="password"
                            name="password"
              className={style["login-form-input"]}
                            placeholder="Nhập mật khẩu"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <span
                            className={style["password-toggle-icon"]}
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            <FontAwesomeIcon icon={showPassword ? "eye-slash" : "eye"} />
                        </span>
                    </div>
          <button type="submit" className={style["button"]}>
            Đăng nhập
          </button>

                    <button
                        type="button"
            onClick={() => navigate("/forgotpassword")}
                        className={style["forgot-password"]}
                    >
                        Quên mật khẩu?
                    </button>
                </form>
            </div>

            <div className={style["register-box"]}>
        <p className={style["text-register"]}>
          Bạn chưa có tài khoản? <br /> Ấn vào nút bên dưới để đăng ký ngay!
        </p>
                <button
                    type="button"
          onClick={() => navigate("/SignUp")}
                    className={style["button"]}
                >
                    Đăng ký
                </button>
            </div>
        </div>
    );
}

export default Login;
