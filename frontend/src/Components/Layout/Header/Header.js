import React, { useState, useRef, useEffect, useContext } from "react";
import style from "./Header.module.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { logout } from "../../../API/authAPI";
import { RestaurantContext } from "../../../Config/RestaurantContext";
import { BsCart3 } from "react-icons/bs";
import { getCart } from "../../../API/CartAPI";

function Header({ isLoggedIn, setIsLoggedIn }) {
  const { restaurantInfo, loading, error } = useContext(RestaurantContext);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const userRole = localStorage.getItem("userRole");

  // Fetch cart count
  const fetchCartCount = async () => {
    if (!isLoggedIn) {
      setCartCount(0);
      return;
    }
    try {
      const response = await getCart();
      setCartCount(response.data?.length || 0);
    } catch (err) {
      console.error("Error fetching cart count:", err);
                }
  };

  useEffect(() => {
    fetchCartCount();
  }, [isLoggedIn]);

  // Listen for cart updates
  useEffect(() => {
    const handleCartUpdate = () => {
      fetchCartCount();
    };
    window.addEventListener("cartUpdated", handleCartUpdate);
    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdate);
    };
  }, [isLoggedIn]);

  const handleLogout = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      localStorage.clear();
      localStorage.setItem("isLoggedIn", "false");
      setIsLoggedIn(false);
      navigate("/");
      return;
    }

    try {
      await logout(null, token);
    } catch (error) {
      console.error("Đăng xuất thất bại:", error.message);
    } finally {
      setIsLoggedIn(false);
      localStorage.clear();
      localStorage.setItem("isLoggedIn", "false");
      navigate("/");
    }
  };

  const handleLogoutBtn = () => {
    setIsMenuOpen(false);
    handleLogout();
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const restaurantName = restaurantInfo?.name ?? "Food Manager";

  return (
    <header className={style["site-header"]}>
      <div className={style["container"]} style={{ maxWidth: "1600px" }}>
        <div className={style["row"]}>
          <div className={style["col-lg-2"]}>
            <div className={style["header-logo"]}>
              <Link to="/" className={style["logo-text"]}>
                {restaurantName}
              </Link>
            </div>
          </div>
          <div className={style["col-lg-10"]}>
            <div className={style["main-navigation"]}>
              <nav className={style["header-menu"]}>
                <ul className={style["food-nav-menu"]}>
                  <li>
                    <Link
                      to="/about"
                      className={
                        location.pathname === "/about" ? style.active : ""
                      }
                    >
                      Giới Thiệu
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/menu"
                      className={
                        location.pathname.startsWith("/menu")
                          ? style.active
                          : ""
                      }
                    >
                      Thực Đơn
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/reservation"
                      className={
                        location.pathname === "/reservation" ? style.active : ""
                      }
                    >
                      Đặt Bàn
                    </Link>
                  </li>
                  
                  <li>
                    <Link
                      to="/review"
                      className={
                        location.pathname === "/review" ? style.active : ""
                      }
                    >
                      Đánh Giá
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/promotion"
                      className={
                        location.pathname.startsWith("/promotion")
                          ? style.active
                          : ""
                      }
                    >
                      Khuyến Mãi
                    </Link>
                  </li>
                  <li>
                    <Link className={style["cart-icon"]} to="/cart">
                      <BsCart3 style={{ fontSize: "22px" }}/>
                      {cartCount > 0 && (
                        <span className={style["cart-badge"]}>{cartCount}</span>
                      )}
                    </Link>
                  </li>

                  {/* Điều kiện hiển thị các trang dựa trên userRole */}

                  {isLoggedIn ? (
                    <li className={style["user-menu"]} ref={menuRef}>
                      <button onClick={toggleMenu} title="user-icon">
                        <FontAwesomeIcon icon={faUser} size="lg" />
                      </button>
                      {isMenuOpen && (
                        <div className={style["user-dropdown"]}>
                          <ul className={style["dropdown-list"]}>
                            {/* Show only the Logout option for admin */}
                            {userRole === "Admin" ? (
                              <>            
                                <li onClick={()=>setIsMenuOpen(false)}>
                                  <Link
                                    to="/employee-dashboard"
                                  >
                                    Trang Nhân Viên
                                  </Link>
                                </li>
                                <li onClick={()=>setIsMenuOpen(false)}>
                                  <Link
                                    to="/admin-dashboard/manage-restaurant-info"
                                  >
                                    Quản Trị
                                  </Link>
                                </li>
                                <li onClick={()=>setIsMenuOpen(false)}>
                                  <Link to="/profile">Thông tin cá nhân</Link>
                                </li>
                                <li onClick={()=>setIsMenuOpen(false)}>
                                  <Link to="/orders">Đơn hàng của tôi</Link>
                                </li>
                                <li onClick={()=>setIsMenuOpen(false)}>
                                  <Link to="/vouchers">Kho voucher</Link>
                                </li>
                                <li>
                                <div className={style["logout-section"]}>
                                    <button
                                      onClick={handleLogoutBtn}
                                      className={style["logout-button"]}
                                    >
                                      Đăng xuất
                                  </button>
                                </div>
                              </li>
                              </>
                              
                            ) : userRole === "Employee" ? (
                                <>
                                   <li onClick={()=>setIsMenuOpen(false)}>
                                  <Link
                                    to="/employee-dashboard"
                                  >
                                    Trang Nhân Viên
                                  </Link>
                                </li>
                                <li onClick={()=>setIsMenuOpen(false)}>
                                  {/* Nhân viên chỉ có Chỉnh sửa thông tin cá nhân và Đăng xuất */}
                                  <Link to="/profile">Thông tin cá nhân</Link>
                                </li>
                                <li>
                                  {" "}
                                  <div className={style["logout-section"]}>
                                    <button
                                      onClick={handleLogoutBtn}
                                      className={style["logout-button"]}
                                    >
                                      Đăng xuất
                                    </button>
                                  </div>
                                </li>
                              </>
                            ) : (
                              <>
                                 <li onClick={()=>setIsMenuOpen(false)}>
                                  <Link to="/profile" onClick={closeMenu}>
                                    Thông tin cá nhân
                                  </Link>
                                </li>
                                <li onClick={()=>setIsMenuOpen(false)}>
                                  <Link
                                    to="/orders"
                                    onClick={closeMenu}
                                  >
                                    Đơn hàng của tôi
                                  </Link>
                                </li>
                                <li onClick={()=>setIsMenuOpen(false)}>
                                  <Link
                                    to="/vouchers"
                                    onClick={closeMenu}
                                  >
                                    Kho voucher
                                  </Link>
                                </li>
                                <li onClick={()=>setIsMenuOpen(false)}>
                                  <Link
                                    to="/reservation-history"
                                    onClick={closeMenu}
                                  >
                                    Lịch sử đặt bàn
                                  </Link>
                                </li>
                                <li>
                                  <div className={style["logout-section"]}>
                                    <button
                                      onClick={handleLogoutBtn}
                                      className={style["logout-button"]}
                                    >
                                      Đăng xuất
                                    </button>
                                  </div>
                                </li>
                              </>
                            )}
                          </ul>
                        </div>
                      )}
                    </li>
                  ) : (
                    <div className={style["login-signup"]}>
                      <li>
                        <Link to="/login" className={style["login-btn"]}>
                          Đăng Nhập
                        </Link>
                      </li>
                      <li>
                        <Link to="/signup" className={style["signup-btn"]}>
                          Đăng Ký
                        </Link>
                      </li>
                    </div>
                  )}
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
