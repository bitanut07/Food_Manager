import React, { useState, useEffect } from "react";
import { getAllVouchers, getUserVouchers, saveVoucher } from "../../API/VoucherAPI";
import style from "./UserVouchers.module.css";
import { FaTag, FaPercent, FaPlus, FaCheck, FaClock, FaTicketAlt } from "react-icons/fa";

function UserVouchers() {
  const [availableVouchers, setAvailableVouchers] = useState([]);
  const [myVouchers, setMyVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState("available");

  useEffect(() => {
    loadVouchers();
  }, []);

  const loadVouchers = async () => {
    try {
      setLoading(true);
      const [allRes, userRes] = await Promise.all([
        getAllVouchers(),
        getUserVouchers(),
      ]);
      
      const allVouchers = allRes.data || [];
      const userVoucherData = userRes.data || [];
      
      // Filter available vouchers (not expired and not already saved by user)
      const userVoucherIds = userVoucherData.map(uv => uv.voucher_id);
      const now = new Date();
      const available = allVouchers.filter(v => 
        !userVoucherIds.includes(v.id) && 
        new Date(v.end_date) >= now &&
        new Date(v.start_date) <= now
      );
      
      setAvailableVouchers(available);
      setMyVouchers(userVoucherData);
    } catch (err) {
      setError("Không thể tải danh sách voucher");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVoucher = async (voucherCode) => {
    try {
      setSaving(voucherCode);
      setError(null);
      setSuccess(null);
      
      await saveVoucher(voucherCode);
      
      setSuccess(`Đã lưu voucher ${voucherCode} thành công!`);
      await loadVouchers();
    } catch (err) {
      setError(err.response?.data?.message || "Không thể lưu voucher");
    } finally {
      setSaving(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatPrice = (price) => {
    if (price === undefined || price === null) return "0 VND";
    return `${Number(price).toLocaleString("vi-VN")} VND`;
  };

  const isExpired = (endDate) => new Date(endDate) < new Date();

  const renderVoucherCard = (voucher, isMine = false, userVoucher = null) => {
    const v = isMine ? voucher.voucher || voucher : voucher;
    if (!v) return null;
    
    const expired = isExpired(v.end_date);
    const used = userVoucher?.used || false;
    
    return (
      <div 
        key={isMine ? userVoucher?.id : v.id} 
        className={`${style["voucher-card"]} ${expired ? style["expired"] : ""} ${used ? style["used"] : ""}`}
      >
        {v.image ? (
          <div className={style["voucher-image"]}>
            <img src={v.image} alt={v.code} />
          </div>
        ) : (
          <div className={style["voucher-icon"]}>
            <FaTicketAlt />
          </div>
        )}
        
        <div className={style["voucher-content"]}>
          <div className={style["voucher-header"]}>
            <span className={style["voucher-code"]}>
              <FaTag /> {v.code}
            </span>
            {expired && <span className={style["status-badge"] + " " + style["expired-badge"]}>Hết hạn</span>}
            {used && <span className={style["status-badge"] + " " + style["used-badge"]}>Đã dùng</span>}
            {isMine && !expired && !used && (
              <span className={style["status-badge"] + " " + style["ready-badge"]}>Sẵn sàng</span>
            )}
          </div>
          
          <p className={style["voucher-desc"]}>{v.description}</p>
          
          <div className={style["voucher-discount"]}>
            <FaPercent />
            <span>
              {v.discount_type === "percent" 
                ? `Giảm ${v.discount_value}%` 
                : `Giảm ${formatPrice(v.discount_value)}`}
            </span>
          </div>
          
          <div className={style["voucher-conditions"]}>
            <span>Đơn tối thiểu: {formatPrice(v.min_order)}</span>
            {v.discount_type === "percent" && v.max_discount > 0 && (
              <span>Giảm tối đa: {formatPrice(v.max_discount)}</span>
            )}
          </div>
          
          <div className={style["voucher-dates"]}>
            <FaClock />
            <span>HSD: {formatDate(v.start_date)} - {formatDate(v.end_date)}</span>
          </div>
        </div>
        
        {!isMine && !expired && (
          <button
            className={style["save-btn"]}
            onClick={() => handleSaveVoucher(v.code)}
            disabled={saving === v.code}
          >
            {saving === v.code ? (
              "Đang lưu..."
            ) : (
              <>
                <FaPlus /> Lưu voucher
              </>
            )}
          </button>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={style["vouchers-container"]}>
        <div className={style["loading"]}>
          <div className={style["spinner"]}></div>
          <p>Đang tải voucher...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={style["vouchers-container"]}>
      <h1 className={style["page-title"]}>
        <FaTicketAlt /> Kho Voucher
      </h1>

      {error && <div className={style["error-message"]}>{error}</div>}
      {success && <div className={style["success-message"]}><FaCheck /> {success}</div>}

      <div className={style["tabs"]}>
        <button
          className={`${style["tab"]} ${activeTab === "available" ? style["active"] : ""}`}
          onClick={() => setActiveTab("available")}
        >
          Voucher có sẵn ({availableVouchers.length})
        </button>
        <button
          className={`${style["tab"]} ${activeTab === "my" ? style["active"] : ""}`}
          onClick={() => setActiveTab("my")}
        >
          Voucher của tôi ({myVouchers.length})
        </button>
      </div>

      <div className={style["vouchers-list"]}>
        {activeTab === "available" ? (
          availableVouchers.length === 0 ? (
            <div className={style["empty"]}>
              <FaTicketAlt className={style["empty-icon"]} />
              <p>Không có voucher nào khả dụng</p>
            </div>
          ) : (
            availableVouchers.map(v => renderVoucherCard(v, false))
          )
        ) : (
          myVouchers.length === 0 ? (
            <div className={style["empty"]}>
              <FaTicketAlt className={style["empty-icon"]} />
              <p>Bạn chưa có voucher nào</p>
              <button 
                className={style["browse-btn"]}
                onClick={() => setActiveTab("available")}
              >
                Xem voucher có sẵn
              </button>
            </div>
          ) : (
            myVouchers.map(uv => renderVoucherCard(uv, true, uv))
          )
        )}
      </div>
    </div>
  );
}

export default UserVouchers;

