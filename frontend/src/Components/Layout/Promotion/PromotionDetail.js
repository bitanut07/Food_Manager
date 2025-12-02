import React, { useState, useEffect } from "react";
import style from "./PromotionDetail.module.css";
import { useNavigate, useParams } from "react-router-dom";
import { fetchPromotionByCode } from "../../../API/PromotionAPI";
import { saveVoucher } from "../../../API/VoucherAPI";
import { FaTag, FaCalendarAlt, FaPercent, FaTicketAlt, FaPlus, FaCheck } from "react-icons/fa";

function PromotionDetail() {
  const { code } = useParams();
  const [promotion, setPromotion] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const navigate = useNavigate();

  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  useEffect(() => {
    const loadPromotionDetail = async () => {
      setLoading(true);
      try {
        const data = await fetchPromotionByCode(code);
        if (data) {
          setPromotion(data);
        } else {
          setError("Không tìm thấy voucher");
        }
      } catch (err) {
        setError(err.message || "Có lỗi xảy ra");
      } finally {
        setLoading(false);
      }
    };

    loadPromotionDetail();
  }, [code]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return "N/A";
    }
  };

  const formatPrice = (price) => {
    if (price === undefined || price === null) return "0 VND";
    return `${Number(price).toLocaleString("vi-VN")} VND`;
  };

  const handleSaveVoucher = async () => {
    if (!isLoggedIn) {
      navigate("/login", { state: { from: `/promotion/${code}` } });
      return;
    }

    try {
      setSaving(true);
      setSaveError(null);
      await saveVoucher(promotion.code);
      setSaveSuccess(true);
    } catch (err) {
      setSaveError(err.response?.data?.message || "Không thể lưu voucher");
    } finally {
      setSaving(false);
    }
  };

  const isExpired = () => {
    if (!promotion?.end_date) return false;
    return new Date(promotion.end_date) < new Date();
  };

  const isNotStarted = () => {
    if (!promotion?.start_date) return false;
    return new Date(promotion.start_date) > new Date();
  };

  if (loading) {
    return (
      <div className={style["promotion-detail"]}>
        <div className={style["loading-overlay"]}>
          <div className={style["spinner"]}></div>
        </div>
      </div>
    );
  }

  if (error || !promotion) {
    return (
      <div className={style["promotion-detail"]}>
        <div className={style["error-container"]}>
          <p>{error || "Không tìm thấy voucher"}</p>
          <button onClick={() => navigate("/promotion")}>Quay lại</button>
        </div>
      </div>
    );
  }

  return (
    <div className={style["promotion-detail"]}>
      <div className={style["promotion-container"]}>
        <div className={style["promotion-image"]}>
          {promotion.image ? (
            <img src={promotion.image} alt={promotion.code} />
          ) : (
            <div className={style["placeholder-image"]}>
              <FaTicketAlt />
            </div>
          )}
        </div>

        <div className={style["promotion-info"]}>
          <div className={style["voucher-code-badge"]}>
            <FaTag /> {promotion.code}
          </div>

          <h2 className={style["promotion-title"]}>
            {promotion.description || promotion.code}
          </h2>

          <div className={style["discount-highlight"]}>
            <FaPercent />
            <span>
              {promotion.discount_type === "percent"
                ? `Giảm ${promotion.discount_value}%`
                : `Giảm ${formatPrice(promotion.discount_value)}`}
            </span>
          </div>

          <div className={style["promotion-conditions"]}>
            <p>
              <strong>Đơn hàng tối thiểu:</strong> {formatPrice(promotion.min_order)}
            </p>
            {promotion.discount_type === "percent" && promotion.max_discount > 0 && (
              <p>
                <strong>Giảm tối đa:</strong> {formatPrice(promotion.max_discount)}
              </p>
            )}
          </div>

          <hr className={style["divider"]} />

          <div className={style["date-info"]}>
            <p>
              <FaCalendarAlt />
              <span>Bắt đầu: <strong>{formatDate(promotion.start_date)}</strong></span>
            </p>
            <p>
              <FaCalendarAlt />
              <span>Kết thúc: <strong>{formatDate(promotion.end_date)}</strong></span>
            </p>
          </div>

          {isExpired() && (
            <div className={style["status-badge"] + " " + style["expired"]}>
              Voucher đã hết hạn
            </div>
          )}

          {isNotStarted() && (
            <div className={style["status-badge"] + " " + style["not-started"]}>
              Voucher chưa bắt đầu
            </div>
          )}

          <hr className={style["divider"]} />

          {/* Save Voucher Button */}
          {!isExpired() && !isNotStarted() && (
            <div className={style["action-section"]}>
              {saveSuccess ? (
                <div className={style["success-message"]}>
                  <FaCheck /> Đã lưu voucher vào tài khoản!
                </div>
              ) : (
                <>
                  <button
                    className={style["save-voucher-btn"]}
                    onClick={handleSaveVoucher}
                    disabled={saving}
                  >
                    {saving ? (
                      "Đang lưu..."
                    ) : (
                      <>
                        <FaPlus /> Lưu voucher vào tài khoản
                      </>
                    )}
                  </button>
                  {!isLoggedIn && (
                    <p className={style["login-hint"]}>
                      Đăng nhập để lưu voucher
                    </p>
                  )}
                  {saveError && (
                    <div className={style["error-message"]}>{saveError}</div>
                  )}
                </>
              )}
            </div>
          )}

          <div className={style["use-code-section"]}>
            <p className={style["use-code-text"]}>
              <FaTag /> Hoặc sử dụng mã: <strong>{promotion.code}</strong>
            </p>
            <p className={style["use-code-hint"]}>
              Nhập mã này khi thanh toán để được giảm giá
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PromotionDetail;
