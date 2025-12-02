import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createVoucher } from "../../../API/VoucherAPI";
import style from "./AddPromotion.module.css";
import { ModalGeneral } from "../../ModalGeneral";

function AddVoucher() {
  const [voucher, setVoucher] = useState({
    code: "",
    description: "",
    image: "",
    discount_type: "percent",
    discount_value: 0,
    min_order: 0,
    max_discount: 0,
    start_date: "",
    end_date: "",
    usage_limit_per_user: 1,
    usage_limit_global: 100,
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [modal, setModal] = useState({
    isOpen: false,
    text: "",
    type: "",
    onConfirm: null,
  });

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (name === "image" && files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewImage(reader.result);
        setVoucher((prev) => ({
          ...prev,
          image: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    } else {
      setVoucher((prev) => ({
        ...prev,
        [name]: type === "number" ? Number(value) : value,
      }));
    }
  };

  const handleCloseModal = () => {
    setModal({ isOpen: false });
    navigate("/admin-dashboard/manage-promotions");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!voucher.code.trim()) {
      setError("Vui lòng nhập mã voucher.");
      return;
    }

    if (!voucher.description.trim()) {
      setError("Vui lòng nhập mô tả voucher.");
      return;
    }

    if (voucher.discount_value <= 0) {
      setError("Giá trị giảm phải lớn hơn 0.");
      return;
    }

    if (voucher.discount_type === "percent" && voucher.discount_value > 100) {
      setError("Phần trăm giảm không được vượt quá 100%.");
      return;
    }

    if (!voucher.start_date || !voucher.end_date) {
      setError("Vui lòng chọn ngày bắt đầu và kết thúc.");
      return;
    }

    if (new Date(voucher.start_date) >= new Date(voucher.end_date)) {
      setError("Ngày bắt đầu phải trước ngày kết thúc.");
      return;
    }

    setLoading(true);
    try {
      await createVoucher(voucher);
      setModal({
        isOpen: true,
        text: "Thêm voucher thành công!",
        type: "success",
        onConfirm: handleCloseModal,
      });
    } catch (error) {
      console.error("Lỗi khi tạo voucher:", error);
      const message = error.response?.data?.message || "Đã có lỗi xảy ra, vui lòng thử lại.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`${style["add-promotion"]} ${loading ? style["loading"] : ""}`}
    >
      {loading && (
        <div className={style["loading-overlay"]}>
          <div className={style["spinner"]}></div>
        </div>
      )}
      <h2>THÊM VOUCHER MỚI</h2>
      <div className={style["add-voucher-container"]}>
        {error && <p className={style["error-message"]}>{error}</p>}
        <form onSubmit={handleSubmit} className={style["voucher-form"]}>
          <div className={style["form-row"]}>
            <div className={style["form-group"]}>
              <label htmlFor="code">Mã voucher *</label>
              <input
                type="text"
                id="code"
                name="code"
                value={voucher.code}
                onChange={handleChange}
                placeholder="VD: GIAM20K"
                required
                maxLength={20}
              />
            </div>
            <div className={style["form-group"]}>
              <label htmlFor="discount_type">Loại giảm giá *</label>
              <select
                name="discount_type"
                value={voucher.discount_type}
                onChange={handleChange}
                required
              >
                <option value="percent">Phần trăm (%)</option>
                <option value="fixed">Số tiền cố định (VND)</option>
              </select>
            </div>
          </div>

          <div className={style["form-group"]}>
            <label htmlFor="description">Mô tả *</label>
            <textarea
              id="description"
              name="description"
              value={voucher.description}
              onChange={handleChange}
              placeholder="Nhập mô tả voucher"
              required
              rows={3}
            />
          </div>

          <div className={style["form-group"]}>
            <label htmlFor="image">Hình ảnh voucher</label>
            <div className={style["image-upload-container"]}>
              {previewImage && (
                <img src={previewImage} alt="Preview" className={style["voucher-preview"]} />
              )}
              <input
                type="file"
                id="image"
                name="image"
                accept="image/jpeg,image/png"
                onChange={handleChange}
              />
            </div>
          </div>

          <div className={style["form-row"]}>
            <div className={style["form-group"]}>
              <label htmlFor="discount_value">
                Giá trị giảm {voucher.discount_type === "percent" ? "(%)" : "(VND)"} *
              </label>
              <input
                type="number"
                id="discount_value"
                name="discount_value"
                value={voucher.discount_value}
                onChange={handleChange}
                placeholder={voucher.discount_type === "percent" ? "0-100" : "Nhập số tiền"}
                required
                min={1}
                max={voucher.discount_type === "percent" ? 100 : 999999999}
              />
            </div>
            <div className={style["form-group"]}>
              <label htmlFor="min_order">Đơn hàng tối thiểu (VND)</label>
              <input
                type="number"
                id="min_order"
                name="min_order"
                value={voucher.min_order}
                onChange={handleChange}
                placeholder="0"
                min={0}
              />
            </div>
          </div>

          {voucher.discount_type === "percent" && (
            <div className={style["form-group"]}>
              <label htmlFor="max_discount">Giảm tối đa (VND)</label>
              <input
                type="number"
                id="max_discount"
                name="max_discount"
                value={voucher.max_discount}
                onChange={handleChange}
                placeholder="0 = không giới hạn"
                min={0}
              />
            </div>
          )}

          <div className={style["form-row"]}>
            <div className={style["form-group"]}>
              <label htmlFor="start_date">Ngày bắt đầu *</label>
              <input
                type="date"
                id="start_date"
                name="start_date"
                value={voucher.start_date}
                onChange={handleChange}
                required
              />
            </div>
            <div className={style["form-group"]}>
              <label htmlFor="end_date">Ngày kết thúc *</label>
              <input
                type="date"
                id="end_date"
                name="end_date"
                value={voucher.end_date}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className={style["form-row"]}>
            <div className={style["form-group"]}>
              <label htmlFor="usage_limit_per_user">Giới hạn/người dùng</label>
              <input
                type="number"
                id="usage_limit_per_user"
                name="usage_limit_per_user"
                value={voucher.usage_limit_per_user}
                onChange={handleChange}
                min={1}
              />
            </div>
            <div className={style["form-group"]}>
              <label htmlFor="usage_limit_global">Tổng số lượng</label>
              <input
                type="number"
                id="usage_limit_global"
                name="usage_limit_global"
                value={voucher.usage_limit_global}
                onChange={handleChange}
                min={1}
              />
            </div>
          </div>

          <div className={style["button-container"]}>
            <button className={style["submit-button"]} type="submit">
              Thêm voucher
            </button>
            <button
              className={style["cancel-button"]}
              type="button"
              onClick={() => navigate("/admin-dashboard/manage-promotions")}
            >
              Hủy
            </button>
          </div>
        </form>

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
    </div>
  );
}

export default AddVoucher;

