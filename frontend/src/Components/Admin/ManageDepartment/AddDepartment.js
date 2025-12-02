import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addDepartment } from "../../../API/AdminAPI";
import { refreshToken } from "../../../API/authAPI";
import { useAuth } from "./../../Auth/AuthContext";
import { isTokenExpired } from "../../../utils/tokenHelper.mjs";
import style from "./../../../Style/AdminStyle/AddDepartment.module.css";
import { ModalGeneral } from "../../ModalGeneral";

function AddDepartment() {
  const [newDepartment, setNewDepartment] = useState({ name: "", salary: "" });
  const [loading, setLoading] = useState(false); // Trạng thái đang xử lý
  const [error, setError] = useState(null); // Trạng thái lỗi
  const { accessToken, setAccessToken } = useAuth();
  const navigate = useNavigate();

  const [modal, setModal] = useState({
    isOpen: false,
    text: "",
    type: "", // "confirm" hoặc "success" hoặc "error"
    onConfirm: null, // Hàm được gọi khi xác nhận
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewDepartment((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const ensureActiveToken = async () => {
    let activeToken = accessToken;
    const refresh = localStorage.getItem("refreshToken");
    if (!refresh || isTokenExpired(refresh)) {
      navigate("/", { replace: true });
      window.location.reload();
      throw "Phiên đăng nhập hết hạn";
    }
    if (isTokenExpired(accessToken)) {
      try {
        const refreshed = await refreshToken(
          localStorage.getItem("refreshToken")
        );
        activeToken = refreshed.access;
        setAccessToken(activeToken);
      } catch (error) {
        console.error("Error refreshing token:", error);
        throw error;
      }
    }
    return activeToken;
  };

  const handleCloseModal = () => {
    setModal({ isOpen: false }); // Đóng modal
    navigate("/admin-dashboard/manage-department"); // Điều hướng
  };

  const handleAddDepartment = async () => {
    if (!newDepartment.name || newDepartment.salary <= 0) {
      setError("Vui lòng nhập thông tin hợp lệ.");
      return;
    }
    setLoading(true);
    setError(null); // Xóa lỗi cũ
    try {
      const activeToken = await ensureActiveToken();
      await addDepartment(newDepartment, activeToken);
      setModal({
        isOpen: true,
        text: "Thêm bộ phận thành công!",
        type: "success",
        onConfirm: handleCloseModal,
      });
    } catch (error) {
      console.error("Error adding department:", error);
      setError("Không thể thêm bộ phận. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`${style["add-department"]} ${
        loading ? style["loading"] : ""
      }`}
    >
      {loading && (
        <div className={style["loading-overlay"]}>
          <div className={style["spinner"]}></div>
        </div>
      )}
      <div className={style["add-department-container"]}>
        <h2 className={style["add-department-header"]}>Thêm bộ phận</h2>
        {error && <p className={style["error-message"]}>{error}</p>}{" "}
        {/* Hiển thị lỗi nếu có */}
        <div>
          <label htmlFor="name">Tên bộ phận:</label>
          <input
            type="text"
            name="name"
            id="name"
            value={newDepartment.name}
            onChange={handleInputChange}
            placeholder="Tên bộ phận"
            required
          />
        </div>
        <div>
          <label htmlFor="salary">Lương:</label>
          <input
            type="number"
            name="salary"
            id="salary"
            value={newDepartment.salary}
            onChange={handleInputChange}
            placeholder="Lương"
            min={0}
            max={999999999}
            required
          />
        </div>
        <div className={style["button-container"]}>
          <button
            className={style["add-department-button"]}
            onClick={handleAddDepartment}
            disabled={loading}
          >
            {loading ? "Đang thêm..." : "Thêm mới"}
          </button>
          <button
            className={style["cancel-button"]}
            onClick={() => navigate("/admin-dashboard/manage-department")}
          >
            Hủy
          </button>
        </div>
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
export default AddDepartment;
