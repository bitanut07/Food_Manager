import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import style from "./Cart.module.css";
import { getCart, updateCartItem, removeFromCart } from "../../../API/CartAPI";
import { getUserVouchers } from "../../../API/VoucherAPI";
import { FaTrash, FaMinus, FaPlus, FaShoppingCart, FaTag, FaPercent } from "react-icons/fa";

function Cart() {
  const [cartData, setCartData] = useState(null);
  const [userVouchers, setUserVouchers] = useState([]);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }
    fetchData();
  }, [isLoggedIn]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cartRes, vouchersRes] = await Promise.all([
        getCart(),
        getUserVouchers().catch(() => ({ data: [] })),
      ]);
      setCartData(cartRes.data);
      setUserVouchers(vouchersRes.data || []);
    } catch (err) {
      setError("Không thể tải giỏ hàng");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      await updateCartItem(itemId, newQuantity);
      fetchData();
    } catch (err) {
      console.error("Lỗi cập nhật số lượng:", err);
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await removeFromCart(itemId);
      fetchData();
    } catch (err) {
      console.error("Lỗi xóa sản phẩm:", err);
    }
  };

  const formatPrice = (price) => {
    if (price === undefined || price === null) return "0 VND";
    return `${Number(price).toLocaleString("vi-VN")} VND`;
  };

  const handleVoucherChange = (e) => {
    const voucherCode = e.target.value;
    if (!voucherCode) {
      setSelectedVoucher(null);
      return;
    }
    const voucher = userVouchers.find((v) => v.voucher?.code === voucherCode);
    setSelectedVoucher(voucher);
  };

  const calculateDiscount = () => {
    if (!selectedVoucher || !cartData?.total) return 0;
    const { discount_type, discount_value, max_discount, min_order } = selectedVoucher.voucher;
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
  const total = cartData?.total || 0;
  const finalTotal = Math.max(0, total - discount);

  // Nếu chưa đăng nhập
  if (!isLoggedIn) {
    return (
      <div className={style["cart-container"]}>
        <div className={style["empty-cart"]}>
          <FaShoppingCart className={style["empty-cart-icon"]} />
          <h2>Vui lòng đăng nhập</h2>
          <p>Bạn cần đăng nhập để xem giỏ hàng</p>
          <button
            className={style["login-btn"]}
            onClick={() => navigate("/login", { state: { from: "/cart" } })}
          >
            Đăng nhập ngay
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={style["cart-container"]}>
        <div className={style["loading"]}>
          <div className={style["spinner"]}></div>
          <p>Đang tải giỏ hàng...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={style["cart-container"]}>
        <div className={style["error"]}>{error}</div>
      </div>
    );
  }

  const items = cartData?.items || [];

  if (items.length === 0) {
    return (
      <div className={style["cart-container"]}>
        <div className={style["empty-cart"]}>
          <FaShoppingCart className={style["empty-cart-icon"]} />
          <h2>Giỏ hàng trống</h2>
          <p>Hãy thêm món ăn yêu thích vào giỏ hàng</p>
          <button
            className={style["continue-shopping-btn"]}
            onClick={() => navigate("/menu")}
          >
            Xem thực đơn
          </button>
        </div>
      </div>
    );
  }

  // Filter available vouchers (not used, valid dates, meets minimum order)
  const availableVouchers = userVouchers.filter((v) => {
    if (v.used) return false;
    const voucher = v.voucher;
    if (!voucher) return false;
    const now = new Date();
    const startDate = new Date(voucher.start_date);
    const endDate = new Date(voucher.end_date);
    return now >= startDate && now <= endDate;
  });

  return (
    <div className={style["cart-container"]}>
      <div className={style["cart-header"]}>
        <h1>Giỏ hàng của bạn</h1>
        <span className={style["item-count"]}>{items.length} sản phẩm</span>
      </div>

      <div className={style["cart-content"]}>
        <div className={style["cart-items"]}>
          {items.map((item) => (
            <div key={item.id} className={style["cart-item"]}>
              <div className={style["item-image"]}>
                <img
                  src={item.product?.thumbnail || "/assets/images/menu.jpg"}
                  alt={item.product?.name}
                />
              </div>
              <div className={style["item-details"]}>
                <h3 className={style["item-name"]}>{item.product?.name}</h3>
                <p className={style["item-price"]}>
                  {formatPrice(item.product?.price)}
                </p>
              </div>
              <div className={style["item-quantity"]}>
                <button
                  className={style["qty-btn"]}
                  onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                >
                  <FaMinus />
                </button>
                <span className={style["qty-value"]}>{item.quantity}</span>
                <button
                  className={style["qty-btn"]}
                  onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                >
                  <FaPlus />
                </button>
              </div>
              <div className={style["item-total"]}>
                {formatPrice(item.product?.price * item.quantity)}
              </div>
              <button
                className={style["remove-btn"]}
                onClick={() => handleRemoveItem(item.id)}
              >
                <FaTrash />
              </button>
            </div>
          ))}
        </div>

        <div className={style["cart-summary"]}>
          <h2>Tổng đơn hàng</h2>

          {/* Voucher Selection */}
          {availableVouchers.length > 0 && (
            <div className={style["voucher-section"]}>
              <label className={style["voucher-label"]}>
                <FaTag /> Mã giảm giá
              </label>
              <select
                className={style["voucher-select"]}
                value={selectedVoucher?.voucher?.code || ""}
                onChange={handleVoucherChange}
              >
                <option value="">-- Chọn voucher --</option>
                {availableVouchers.map((v) => (
                  <option 
                    key={v.id} 
                    value={v.voucher?.code}
                    disabled={total < v.voucher?.min_order}
                  >
                    {v.voucher?.code} - {v.voucher?.discount_type === "percent" 
                      ? `Giảm ${v.voucher?.discount_value}%` 
                      : `Giảm ${formatPrice(v.voucher?.discount_value)}`}
                    {total < v.voucher?.min_order && ` (Đơn tối thiểu ${formatPrice(v.voucher?.min_order)})`}
                  </option>
                ))}
              </select>
              {selectedVoucher && total < selectedVoucher.voucher?.min_order && (
                <p className={style["voucher-warning"]}>
                  Đơn hàng chưa đạt giá trị tối thiểu {formatPrice(selectedVoucher.voucher?.min_order)}
                </p>
              )}
              {selectedVoucher && discount > 0 && (
                <div className={style["voucher-applied"]}>
                  <FaPercent /> Giảm {formatPrice(discount)}
                </div>
              )}
            </div>
          )}

          {availableVouchers.length === 0 && (
            <div className={style["no-voucher"]}>
              <p>Bạn chưa có voucher nào</p>
              <button
                className={style["get-voucher-btn"]}
                onClick={() => navigate("/vouchers")}
              >
                <FaTag /> Lấy voucher
              </button>
            </div>
          )}

          <div className={style["summary-row"]}>
            <span>Tạm tính:</span>
            <span>{formatPrice(total)}</span>
          </div>
          {discount > 0 && (
            <div className={style["summary-row"] + " " + style["discount-row"]}>
              <span>Giảm giá:</span>
              <span className={style["discount-value"]}>-{formatPrice(discount)}</span>
            </div>
          )}
          <div className={style["summary-row"]}>
            <span>Phí vận chuyển:</span>
            <span>Miễn phí</span>
          </div>
          <div className={style["summary-total"]}>
            <span>Tổng cộng:</span>
            <span className={style["total-price"]}>{formatPrice(finalTotal)}</span>
          </div>
          <button
            className={style["checkout-btn"]}
            onClick={() => navigate("/checkout", { 
              state: { selectedVoucherCode: selectedVoucher?.voucher?.code } 
            })}
          >
            Tiến hành đặt hàng
          </button>
          <button
            className={style["continue-btn"]}
            onClick={() => navigate("/menu")}
          >
            Tiếp tục mua sắm
          </button>
        </div>
      </div>
    </div>
  );
}

export default Cart;
