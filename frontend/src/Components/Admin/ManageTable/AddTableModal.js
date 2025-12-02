import React, { useState } from "react";
import style from "./../../../Style/AdminStyle/AddTableModal.module.css";

function AddTableModal({ isOpen, onClose, onAddTable }) {
  const [numberOfSeats, setNumberOfSeats] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleAddTable = () => {
    if (numberOfSeats === "") {
      setErrorMessage("Vui lòng nhập số ghế!");
      return;
    }
    onAddTable({ table_size: numberOfSeats, status: "A" });
    setNumberOfSeats(""); // Reset input
    setErrorMessage(""); // Reset lỗi
    onClose(); // Đóng modal
  };

  if (!isOpen) return null;

  return (
    <div className={style["AddTablemodal"]}>
      <div className={style["AddTablemodal-content"]}>
        <button className={style.close} onClick={onClose}>
          &times;
        </button>
        <h3>THÊM BÀN MỚI</h3>
        <div className={style["AddTable-form-group"]}>
          <label htmlFor="seats">Số lượng ghế:</label>
          <input
            type="number"
            id="seats"
            placeholder="Nhập số ghế"
            value={numberOfSeats}
            min={1}
            onChange={(e) => setNumberOfSeats(e.target.value)}
          />
        </div>
        {errorMessage && <p className={style["AddTable-error"]}>{errorMessage}</p>}
        <div className={style["AddTablemodal-actions"]}>
          <button className={style["AddTable-add-button"]} onClick={handleAddTable}>
            Thêm bàn
          </button>
          <button className={style["AddTable-cancel-button"]} onClick={onClose}>
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddTableModal;
