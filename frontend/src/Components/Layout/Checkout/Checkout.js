import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import style from "./Checkout.module.css";
import { getCart } from "../../../API/CartAPI";
import { createOrder, getPaymentMethods } from "../../../API/OrderAPI";
import { getUserVouchers } from "../../../API/VoucherAPI";
import { FaCheckCircle, FaClock, FaTruck, FaMoneyBillWave } from "react-icons/fa";

function Checkout() {
  const [cartData, setCartData] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [userVouchers, setUserVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  // Get selected voucher from Cart page
  const selectedVoucherFromCart = location.state?.selectedVoucherCode || "";

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    address: "",
    note: "",
    payment_method: "COD",
    voucher_code: selectedVoucherFromCart,
  });

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login", { state: { from: "/checkout" } });
      return;
    }
    loadData();
  }, [isLoggedIn, navigate]);

  // Update voucher_code when selectedVoucherFromCart changes
  useEffect(() => {
    if (selectedVoucherFromCart) {
      setFormData(prev => ({ ...prev, voucher_code: selectedVoucherFromCart }));
    }
  }, [selectedVoucherFromCart]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cartRes, methodsRes, vouchersRes] = await Promise.all([
        getCart(),
        getPaymentMethods(),
        getUserVouchers(),
      ]);
      setCartData(cartRes.data);
      setPaymentMethods(methodsRes.data || []);
      setUserVouchers(vouchersRes.data || []);
    } catch (err) {
      setError("Không thể tải dữ liệu");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.full_name || !formData.phone || !formData.address) {
      setError("Vui lòng điền đầy đủ thông tin");
      return;
    }

    try {
      setSubmitting(true);
      const response = await createOrder(formData);
      setSuccess(true);
      setOrderId(response.data?.order_id);
      
      // Dispatch event to update cart count in Header (cart is now empty)
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (err) {
      setError(err.response?.data?.message || "Không thể đặt hàng");
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price) => {
    if (price === undefined || price === null) return "0 VND";
    return `${Number(price).toLocaleString("vi-VN")} VND`;
  };

  const calculateDiscount = () => {
    if (!formData.voucher_code || !cartData?.total) return 0;
    const voucher = userVouchers.find(
      (v) => v.voucher?.code === formData.voucher_code && !v.used
    );
    if (!voucher) return 0;

    const { discount_type, discount_value, max_discount, min_order } = voucher.voucher;
    if (cartData.total < min_order) return 0;

    let discount = 0;
    if (discount_type === "percent") {
      discount = (cartData.total * discount_value) / 100;
      if (max_discount > 0 && discount > max_discount) {
        discount = max_discount;
      }
    } else {
      discount = discount_value;
    }
    return discount;
  };

  const discount = calculateDiscount();
  const finalTotal = Math.max(0, (cartData?.total || 0) - discount);

  if (loading) {
    return (
      <div className={style["checkout-container"]}>
        <div className={style["loading"]}>
          <div className={style["spinner"]}></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className={style["checkout-container"]}>
        <div className={style["success-container"]}>
          <FaCheckCircle className={style["success-icon"]} />
          <h2>Đặt hàng thành công!</h2>
          <p>Mã đơn hàng của bạn: <strong>#{orderId}</strong></p>
          <p>Chúng tôi sẽ liên hệ với bạn sớm nhất</p>
          <div className={style["success-actions"]}>
            <button onClick={() => navigate("/orders")} className={style["view-order-btn"]}>
              Xem đơn hàng
            </button>
            <button onClick={() => navigate("/menu")} className={style["continue-btn"]}>
              Tiếp tục mua sắm
            </button>
          </div>
        </div>
      </div>
    );
  }

  const items = cartData?.items || [];

  if (items.length === 0) {
    return (
      <div className={style["checkout-container"]}>
        <div className={style["empty"]}>
          <h2>Giỏ hàng trống</h2>
          <p>Vui lòng thêm sản phẩm trước khi thanh toán</p>
          <button onClick={() => navigate("/menu")} className={style["continue-btn"]}>
            Xem thực đơn
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={style["checkout-container"]}>
      <h1 className={style["page-title"]}>Thanh toán</h1>

      <div className={style["checkout-content"]}>
        <div className={style["checkout-form-section"]}>
          <form onSubmit={handleSubmit}>
            {/* Thông tin giao hàng */}
            <div className={style["form-section"]}>
              <h2><FaTruck /> Thông tin giao hàng</h2>
              <div className={style["form-group"]}>
                <label>Họ và tên *</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  placeholder="Nhập họ và tên"
                  required
                />
              </div>
              <div className={style["form-group"]}>
                <label>Số điện thoại *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Nhập số điện thoại"
                  required
                />
              </div>
              <div className={style["form-group"]}>
                <label>Địa chỉ giao hàng *</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Nhập địa chỉ chi tiết"
                  rows={3}
                  required
                />
              </div>
              <div className={style["form-group"]}>
                <label>Ghi chú</label>
                <textarea
                  name="note"
                  value={formData.note}
                  onChange={handleInputChange}
                  placeholder="Ghi chú cho đơn hàng (không bắt buộc)"
                  rows={2}
                />
              </div>
            </div>

            {/* Phương thức thanh toán */}
            <div className={style["form-section"]}>
              <h2><FaMoneyBillWave /> Phương thức thanh toán</h2>
              <div className={style["payment-methods"]}>
                {paymentMethods.map((method) => (
                  <label
                    key={method.code}
                    className={`${style["payment-option"]} ${
                      !method.available ? style["disabled"] : ""
                    } ${formData.payment_method === method.code ? style["selected"] : ""}`}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value={method.code}
                      checked={formData.payment_method === method.code}
                      onChange={handleInputChange}
                      disabled={!method.available}
                    />
                    <div className={style["payment-info"]}>
                      <span className={style["payment-name"]}>{method.name}</span>
                      <span className={style["payment-desc"]}>{method.description}</span>
                      {method.coming_soon && (
                        <span className={style["coming-soon"]}>
                          <FaClock /> Sắp ra mắt
                        </span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Mã giảm giá */}
            {userVouchers.length > 0 && (
              <div className={style["form-section"]}>
                <h2>Mã giảm giá</h2>
                <select
                  name="voucher_code"
                  value={formData.voucher_code}
                  onChange={handleInputChange}
                  className={style["voucher-select"]}
                >
                  <option value="">-- Chọn mã giảm giá --</option>
                  {userVouchers
                    .filter((v) => !v.used)
                    .map((v) => (
                      <option key={v.id} value={v.voucher?.code}>
                        {v.voucher?.code} - {v.voucher?.description}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {error && <div className={style["error-message"]}>{error}</div>}

            <button
              type="submit"
              className={style["submit-btn"]}
              disabled={submitting}
            >
              {submitting ? "Đang xử lý..." : "Xác nhận đặt hàng"}
            </button>
          </form>
        </div>

        {/* Tóm tắt đơn hàng */}
        <div className={style["order-summary"]}>
          <h2>Đơn hàng của bạn</h2>
          <div className={style["order-items"]}>
            {items.map((item) => (
              <div key={item.id} className={style["order-item"]}>
                <img
                  src={item.product?.thumbnail || "/assets/images/menu.jpg"}
                  alt={item.product?.name}
                />
                <div className={style["order-item-info"]}>
                  <span className={style["order-item-name"]}>{item.product?.name}</span>
                  <span className={style["order-item-qty"]}>x{item.quantity}</span>
                </div>
                <span className={style["order-item-price"]}>
                  {formatPrice(item.product?.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className={style["order-totals"]}>
            <div className={style["total-row"]}>
              <span>Tạm tính:</span>
              <span>{formatPrice(cartData?.total)}</span>
            </div>
            {discount > 0 && (
              <div className={style["total-row"] + " " + style["discount"]}>
                <span>Giảm giá:</span>
                <span>-{formatPrice(discount)}</span>
              </div>
            )}
            <div className={style["total-row"]}>
              <span>Phí vận chuyển:</span>
              <span>Miễn phí</span>
            </div>
            <div className={style["total-row"] + " " + style["final-total"]}>
              <span>Tổng cộng:</span>
              <span>{formatPrice(finalTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;

