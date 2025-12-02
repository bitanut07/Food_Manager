import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import style from "./ManagePromotions.module.css";
import { getAllVouchers, deleteVoucher } from "../../../API/VoucherAPI";
import { ModalGeneral } from "../../ModalGeneral";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash, faPlus, faPercent, faTag } from "@fortawesome/free-solid-svg-icons";

function ManageVouchers() {
  const [vouchers, setVouchers] = useState([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({
    isOpen: false,
    text: "",
    type: "",
    onConfirm: null,
  });

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const response = await getAllVouchers();
      setVouchers(response.data || []);
    } catch (error) {
      console.error("Error fetching vouchers:", error);
      setModal({
        isOpen: true,
        text: "Không thể tải danh sách voucher",
        type: "error",
      });
    } finally {
      setLoading(false);
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

  const handleEdit = (id) => {
    navigate(`/admin-dashboard/edit-voucher/${id}`);
  };

  const handleDelete = async (id) => {
    setModal({
      isOpen: true,
      text: "Bạn có chắc chắn muốn xóa voucher này không?",
      type: "confirm",
      onConfirm: async () => {
        setModal({ isOpen: false });
        try {
          await deleteVoucher(id);
          setVouchers((prev) => prev.filter((v) => v.id !== id));
          setModal({
            isOpen: true,
            text: "Xóa voucher thành công",
            type: "success",
          });
        } catch (error) {
          console.error("Lỗi khi xóa voucher:", error);
          setModal({
            isOpen: true,
            text: "Có lỗi xảy ra khi xóa voucher. Vui lòng thử lại.",
            type: "error",
          });
        }
      },
    });
  };

  const handleAddVoucher = () => {
    navigate("/admin-dashboard/add-voucher");
  };

  const isExpired = (endDate) => {
    return new Date(endDate) < new Date();
  };

  return (
    <div
      className={`${style["manage-Promotions"]} ${
        loading ? style["loading"] : ""
      }`}
    >
      {loading && (
        <div className={style["loading-overlay"]}>
          <div className={style["spinner"]}></div>
        </div>
      )}
      <h2>QUẢN LÝ VOUCHER</h2>
      <div className={style["button-container"]}>
        <button
          onClick={handleAddVoucher}
          className={style["add-discount-button"]}
        >
          Tạo voucher mới <FontAwesomeIcon icon={faPlus} />
        </button>
      </div>

      {vouchers.length === 0 ? (
        <div className={style["no-promotions"]}>
          <p>Chưa có voucher nào, hãy tạo mới!</p>
        </div>
      ) : (
        <div className={style["voucher-list"]}>
          {vouchers.map((voucher) => (
            <div 
              key={voucher.id} 
              className={`${style["voucher-card"]} ${isExpired(voucher.end_date) ? style["expired"] : ""}`}
            >
              {voucher.image && (
                <div className={style["voucher-image"]}>
                  <img src={voucher.image} alt={voucher.code} />
                </div>
              )}
              <div className={style["voucher-header"]}>
                <span className={style["voucher-code"]}>
                  <FontAwesomeIcon icon={faTag} /> {voucher.code}
                </span>
                {isExpired(voucher.end_date) && (
                  <span className={style["expired-badge"]}>Hết hạn</span>
                )}
              </div>
              
              <div className={style["voucher-body"]}>
                <p className={style["voucher-desc"]}>{voucher.description}</p>
                
                <div className={style["voucher-discount"]}>
                  <FontAwesomeIcon icon={faPercent} />
                  <span>
                    {voucher.discount_type === "percent" 
                      ? `Giảm ${voucher.discount_value}%` 
                      : `Giảm ${formatPrice(voucher.discount_value)}`}
                  </span>
                </div>
                
                <div className={style["voucher-info"]}>
                  <p>Đơn tối thiểu: {formatPrice(voucher.min_order)}</p>
                  {voucher.discount_type === "percent" && voucher.max_discount > 0 && (
                    <p>Giảm tối đa: {formatPrice(voucher.max_discount)}</p>
                  )}
                </div>
                
                <div className={style["voucher-dates"]}>
                  <span>Từ: {formatDate(voucher.start_date)}</span>
                  <span>Đến: {formatDate(voucher.end_date)}</span>
                </div>
              </div>

              <div className={style["button-group"]}>
                <div className={style["tooltip-container"]}>
                  <button
                    onClick={() => handleEdit(voucher.id)}
                    className={style["edit-button"]}
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                  <span className={style["tooltip"]}>Chỉnh sửa</span>
                </div>
                <div className={style["tooltip-container"]}>
                  <button
                    onClick={() => handleDelete(voucher.id)}
                    className={style["delete-button"]}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                  <span className={style["tooltip"]}>Xóa</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal.isOpen && (
        <ModalGeneral
          isOpen={modal.isOpen}
          text={modal.text}
          type={modal.type}
          onClose={() => setModal({ isOpen: false })}
          onConfirm={modal.onConfirm}
        />
      )}
    </div>
  );
}

export default ManageVouchers;

