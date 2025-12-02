// src/Components/ManageEmployees.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import style from "./ManageEmployees.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faPlus } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "./../../Auth/AuthContext";
import { getEmployee, deleteEmployee } from "../../../API/AdminAPI";
import { isTokenExpired } from "../../../utils/tokenHelper.mjs";
import { refreshToken } from "../../../API/authAPI";
import { ModalGeneral } from "../../ModalGeneral";

function ManageEmployees() {
  const [employees, setEmployee] = useState([]); // Danh sách nhân viên
  const [loading, setLoading] = useState(true); // Trạng thái tải dữ liệu
  const [error, setError] = useState(null); // Trạng thái lỗi
  const { accessToken, setAccessToken } = useAuth();
  const navigate = useNavigate();

  const [modal, setModal] = useState({
    isOpen: false,
    text: "",
    type: "", // "confirm" hoặc "success"
    onConfirm: null, // Hàm được gọi khi xác nhận
  });

  // Hàm đảm bảo token hợp lệ
  const ensureActiveToken = async () => {
    let activeToken = accessToken;
    const refresh = localStorage.getItem("refreshToken");
            if (!refresh || isTokenExpired(refresh)) {
                  navigate('/', { replace: true });
                  window.location.reload();
                  throw 'Phiên đăng nhập hết hạn';
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

  // Hàm lấy danh sách bộ phận
  const fetchEmployees = async () => {
    setLoading(true);
    setError(null); // Xóa lỗi cũ
    try {
      const activeToken = await ensureActiveToken();
      const data = await getEmployee(activeToken);
      if (Array.isArray(data)) {
        setEmployee(data);
      } else {
        throw new Error("Dữ liệu API không hợp lệ");
      }
    } catch (error) {
      console.error("Error fetching Employees:", error);
      setError("Không thể tải danh sách bộ phận. Vui lòng thử lại sau.");
      setEmployee([]); // Đặt mảng rỗng nếu lỗi xảy ra
    } finally {
      setLoading(false);
    }
  };

  // Hàm xóa nhân viên với xác nhận
  const handleDeleteEmployee = async (id) => {
    setModal({
      isOpen: true,
      text: "Bạn có chắc chắn muốn xóa nhân viên này không?",
      type: "confirm",
      onConfirm: async () => {
        setModal({ isOpen: false });
        try {
          const activeToken = await ensureActiveToken();
          await deleteEmployee(id, activeToken);
          setEmployee(employees.filter((emps) => emps.account_id !== id));
          setModal({
            isOpen: true,
            text: "Xóa nhân viên thành công!",
            type: "success",
          });
          await fetchEmployees();
        } catch (error) {
          console.error("Error deleting Employee:", error);
          setModal({
            isOpen: true,
            text: "Không thể xóa nhân viên. Vui lòng thử lại sau.",
            type: "error",
          });
        }
      },
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Tự động tải danh sách nhân viên khi component được render
  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      setLoading(true);
      try {
        const activeToken = await ensureActiveToken();
        const data = await getEmployee(activeToken, {
          signal: controller.signal,
        });
        if (Array.isArray(data)) {
          setEmployee(data);
        } else {
          throw new Error("Dữ liệu API không hợp lệ");
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Error fetching Employee:", error);
          setError("Không thể tải danh sách nhân viên. Vui lòng thử lại sau.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    return () => controller.abort(); // Dọn dẹp khi component bị hủy
  }, [accessToken]);

  return (
    <div
      className={`${style["manage-employees"]} ${
        loading ? style["loading"] : ""
      }`}
    >
      {loading && (
        <div className={style["loading-overlay"]}>
          <div className={style["spinner"]}></div>
        </div>
      )}
      <div className={style["header"]}>
        <h2>Quản lý nhân viên</h2>
      </div>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {loading ? (
        <p>Đang tải dữ liệu...</p>
      ) : employees.length === 0 ? (
        <div className={style["no-employee"]}>
          <p>Hiện tại chưa có nhân viên nào!</p>
          <div className={style["button-container"]}>
            <button
              className={style["manage-employee-button"]}
              onClick={() =>
                navigate("/admin-dashboard/register-employee-account")
              }
            >
              Thêm nhân viên mới <FontAwesomeIcon icon={faPlus} />
            </button>
          </div>
        </div>
      ) : (
        <div className={style["employee-table-container"]}>
          <div className={style["button-container"]}>
            <button
              className={style["manage-employee-button"]}
              onClick={() =>
                navigate("/admin-dashboard/register-employee-account")
              }
            >
              Thêm nhân viên mới <FontAwesomeIcon icon={faPlus} />
            </button>
          </div>
          <table className={style["employee-table"]}>
            <thead>
              <tr>
                <th>STT</th>
                <th>Tên nhân viên</th>
                <th>Ngày sinh</th>
                <th>Số điện thoại</th>
                <th>Địa chỉ</th>
                <th>Ngày bắt đầu</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emps, id) => (
                <tr key={emps.account_id}>
                  <td>{id + 1}</td>
                  <td>{emps.full_name}</td>
                  <td>{formatDate(emps.date_of_birth)}</td>
                  <td>{emps.phone_number}</td>
                  <td>{emps.address}</td>
                  <td>{formatDate(emps.start_working_date)}</td>
                  <td>
                    <div className={style["tooltip-container"]}>
                      <button
                        className={style["delete-button"]}
                        onClick={() => handleDeleteEmployee(emps.account_id)}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                      <span className={style["tooltip"]}>Xóa</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

export default ManageEmployees;
