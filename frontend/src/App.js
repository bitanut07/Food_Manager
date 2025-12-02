import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";
import Header from "./Components/Layout/Header/Header";
import Footer from "./Components/Layout/Footer/Footer";
import HomePage from "./Components/Layout/HomePage/HomePage";
import About from "./Components/Layout/About/About";
import Menu from "./Components/Layout/Menu/Menu";
import FoodDetail from "./Components/Layout/Menu/FoodDetail";
import Promotion from "./Components/Layout/Promotion/Promotion";
import PromotionDetail from "./Components/Layout/Promotion/PromotionDetail";
import BookingTable from "./Components/Layout/BookingTable/BookingTable";
import Login from "./Components/Auth/Login";
import SignUp from "./Components/Auth/SignUp";
import ForgotPassword from "./Components/Auth/ForgotPassword";
import ResetPassword from "./Components/Auth/ResetPassword";
import ProtectedRoute from "./Components/Routes/ProtectedRoute";
import Profile from "./Components/Auth/Profile";
import ManageMenu from "./Components/Admin/ManageMenu/ManageMenu";
import AddFoodItem from "./Components/Admin/ManageMenu/AddFoodItem";
import EditFoodItem from "./Components/Admin/ManageMenu/EditFoodItem";
import ManageVouchers from "./Components/Admin/ManagePromotion/ManageVouchers";
import AddVoucher from "./Components/Admin/ManagePromotion/AddVoucher";
import EditVoucher from "./Components/Admin/ManagePromotion/EditVoucher";
import ViewSalesReports from "./Components/Admin/ViewSalesReports/ViewSalesReports";
import ManageRestaurantInfo from "./Components/Admin/ManageRestaurantInfo/ManageRestaurantInfo";
import ReservationHistory from "./Components/Customer/ReservationHistory";
import ScrollToTop from "./Style/scrollToTop";
import "./App.css";
import { isTokenExpired } from "./utils/tokenHelper.mjs";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { AuthProvider } from "./Components/Auth/AuthContext";
import EmployeeReservation from "./Components/Employee/EmployeeReservation/EmployeeReservation";
import ManageTable from "./Components/Admin/ManageTable/ManageTable";
import ManageOrders from "./Components/Admin/ManageOrders/ManageOrders";
import AdminLayout from "./Components/Admin/AdminLayout";
import Review from "./Components/Customer/Review";
import Rating from "./Components/Customer/Rating";
import SnowEffect from "./Components/UI/SnowEffect";
import HotlineIcon from "./Components/UI/HotLineIcon";
import { RestaurantProvider } from "./Config/RestaurantContext";
import Cart from "./Components/Layout/Cart/Cart";
import Checkout from "./Components/Layout/Checkout/Checkout";
import Orders from "./Components/Customer/Orders";
import UserVouchers from "./Components/Customer/UserVouchers";

library.add(faEye, faEyeSlash);

// Component wrapper để check location và ẩn Header/Footer cho Admin
function AppContent({ isLoggedIn, setIsLoggedIn, userRole, setUserRole }) {
  const location = useLocation();
  
  // Ẩn Header và Footer khi ở trang admin-dashboard hoặc employee-dashboard
  const isAdminPage = location.pathname.startsWith("/admin-dashboard") || 
                      location.pathname.startsWith("/employee-dashboard");

  return (
    <>
          <ScrollToTop />
      {!isAdminPage && <Header isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />}
      {!isAdminPage && <SnowEffect />}
      {!isAdminPage && <HotlineIcon />}
          <Routes>
            {/* Trang công khai */}
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<About />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/menu/:id" element={<FoodDetail />} />
            <Route path="/review" element={<Review />} />
            <Route path="/review/:invoice" element={<Rating />} />
            <Route
              path="/reservation"
              element={<BookingTable isLoggedIn={isLoggedIn} />}
            />
            <Route path="/promotion" element={<Promotion />} />
            <Route path="/promotion/:code" element={<PromotionDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route
          path="/orders"
          element={
            <ProtectedRoute
              isLoggedIn={isLoggedIn}
              allowedRoles={["user", "admin", "Admin", "User"]}
              userRole={userRole}
            >
              <Orders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vouchers"
          element={
            <ProtectedRoute
              isLoggedIn={isLoggedIn}
              allowedRoles={["user", "admin", "Admin", "User"]}
              userRole={userRole}
            >
              <UserVouchers />
            </ProtectedRoute>
          }
        />

            {/* Đăng nhập và đăng ký */}
            <Route
              path="/login"
              element={
                <Login
                  setIsLoggedIn={setIsLoggedIn}
                  setUserRole={setUserRole}
                />
              }
            />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgotpassword" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Trang khách hàng */}
            <Route
              path="/reservation-history"
              element={
                <ProtectedRoute
                  isLoggedIn={isLoggedIn}
              allowedRoles={["user", "admin"]}
                  userRole={userRole}
                >
                  <ReservationHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute
                  isLoggedIn={isLoggedIn}
              allowedRoles={["user", "admin"]}
                  userRole={userRole}
                >
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Trang admin */}
            <Route
              path="/admin-dashboard"
              element={
                <ProtectedRoute
                  isLoggedIn={isLoggedIn}
              allowedRoles={["admin"]}
                  userRole={userRole}
                >
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route
                path="manage-restaurant-info"
                element={
                  <ProtectedRoute
                    isLoggedIn={isLoggedIn}
                allowedRoles={["admin"]}
                    userRole={userRole}
                  >
                    <ManageRestaurantInfo />
                  </ProtectedRoute>
                }
              />
              <Route
                path="manage-menu"
                element={
                  <ProtectedRoute
                    isLoggedIn={isLoggedIn}
                allowedRoles={["admin"]}
                    userRole={userRole}
                  >
                    <ManageMenu />
                  </ProtectedRoute>
                }
              />
              <Route
                path="add-food"
                element={
                  <ProtectedRoute
                    isLoggedIn={isLoggedIn}
                allowedRoles={["admin"]}
                    userRole={userRole}
                  >
                    <AddFoodItem />
                  </ProtectedRoute>
                }
              />
              <Route
                path="edit-fooditem/:id"
                element={
                  <ProtectedRoute
                    isLoggedIn={isLoggedIn}
                allowedRoles={["admin"]}
                    userRole={userRole}
                  >
                    <EditFoodItem />
                  </ProtectedRoute>
                }
              />
              <Route
                path="manage-promotions"
                element={
                  <ProtectedRoute
                    isLoggedIn={isLoggedIn}
                allowedRoles={["admin"]}
                    userRole={userRole}
                  >
                    <ManageVouchers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="add-voucher"
                element={
                  <ProtectedRoute
                    isLoggedIn={isLoggedIn}
                allowedRoles={["admin"]}
                    userRole={userRole}
                  >
                    <AddVoucher />
                  </ProtectedRoute>
                }
              />
              <Route
                path="edit-voucher/:id"
                element={
                  <ProtectedRoute
                    isLoggedIn={isLoggedIn}
                allowedRoles={["admin"]}
                    userRole={userRole}
                  >
                    <EditVoucher />
                  </ProtectedRoute>
                }
              />
              <Route
                path="view-sales-reports"
                element={
                  <ProtectedRoute
                    isLoggedIn={isLoggedIn}
                allowedRoles={["admin"]}
                    userRole={userRole}
                  >
                    <ViewSalesReports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="manage-table"
                element={
                  <ProtectedRoute
                    isLoggedIn={isLoggedIn}
                allowedRoles={["admin"]}
                    userRole={userRole}
                  >
                    <ManageTable />
                  </ProtectedRoute>
                }
              />
              <Route
                path="manage-orders"
                element={
                  <ProtectedRoute
                    isLoggedIn={isLoggedIn}
                allowedRoles={["admin"]}
                    userRole={userRole}
                  >
                    <ManageOrders />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Trang nhân viên */}
            <Route
              path="/employee-dashboard"
              element={
                <ProtectedRoute
                  isLoggedIn={isLoggedIn}
              allowedRoles={["admin"]}
                  userRole={userRole}
                >
                  <EmployeeReservation />
                </ProtectedRoute>
              }
            />
          </Routes>
      {!isAdminPage && <Footer />}
    </>
  );
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => localStorage.getItem("isLoggedIn") === "true"
  );
  const [userRole, setUserRole] = useState(localStorage.getItem("userRole"));

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || isTokenExpired(token)) {
      localStorage.clear();
      localStorage.setItem("isLoggedIn", "false");
      setIsLoggedIn(false);
      setUserRole(null);
      return;
    }
    setIsLoggedIn(true);
    setUserRole(localStorage.getItem("userRole"));
  }, []);

  return (
    <AuthProvider>
      <RestaurantProvider>
        <Router>
          <AppContent 
            isLoggedIn={isLoggedIn} 
            setIsLoggedIn={setIsLoggedIn}
            userRole={userRole}
            setUserRole={setUserRole}
          />
        </Router>
      </RestaurantProvider>
    </AuthProvider>
  );
}
export default App;
