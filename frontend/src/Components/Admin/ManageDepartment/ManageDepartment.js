import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import style from "./../../../Style/AdminStyle/ManageDepartment.module.css";
import { useAuth } from "../../Auth/AuthContext";
import { getDepartments, deleteDepartment } from "../../../API/AdminAPI";
import { isTokenExpired } from "../../../utils/tokenHelper.mjs";
import { refreshToken } from "../../../API/authAPI";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash, faPlus } from "@fortawesome/free-solid-svg-icons";
import { ModalGeneral } from "../../ModalGeneral";

function ManageDepartment() {
  const [departments, setDepartments] = useState([]); // Danh sách bộ phận
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
    const refresh = localStorage.getItem('refreshToken');
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
  const fetchDepartments = async () => {
    setLoading(true);
    setError(null); // Xóa lỗi cũ
    try {
      const activeToken = await ensureActiveToken();
      const data = await getDepartments(activeToken);
      if (Array.isArray(data)) {
        setDepartments(data);
      } else {
        throw new Error("Dữ liệu API không hợp lệ");
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      setError("Không thể tải danh sách bộ phận. Vui lòng thử lại sau.");
      setDepartments([]); // Đặt mảng rỗng nếu lỗi xảy ra
    } finally {
      setLoading(false);
    }
  };

  //hàm chuyển hướng qua trang chỉnh sửa
  const handleEditDepartment = async (id) => {
    navigate(`/admin-dashboard/edit-department/${id}`);
  };

  // Hàm xóa bộ phận với xác nhận
  const handleDeleteDepartment = (id) => {
    setModal({
      isOpen: true,
      text: "Bạn có chắc chắn muốn xóa bộ phận này không?",
      type: "confirm",
      onConfirm: async () => {
        setModal({ isOpen: false });
        try {
          const activeToken = await ensureActiveToken();
          await deleteDepartment(id, activeToken);
          setDepartments(departments.filter((dept) => dept.id !== id));
          setModal({
            isOpen: true,
            text: "Xóa bộ phận thành công!",
            type: "success",
          });
          await fetchDepartments();
        } catch (error) {
          console.error("Error deleting Department:", error);
          setModal({
            isOpen: true,
            text: "Không thể xóa bộ phận. Vui lòng thử lại sau.",
            type: "error",
          });
        }
      },
    });
  };

  const formatPrice = (price) => {
    return `${price.toLocaleString("vi-VN")} VND`;
  };

  // Tự động tải danh sách bộ phận khi component được render
  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      setLoading(true);
      try {
        const activeToken = await ensureActiveToken();
        const data = await getDepartments(activeToken, {
          signal: controller.signal,
        });
        if (Array.isArray(data)) {
          setDepartments(data);
        } else {
          throw new Error("Dữ liệu API không hợp lệ");
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Error fetching departments:", error);
          setError("Không thể tải danh sách bộ phận. Vui lòng thử lại sau.");
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
      className={`${style["manage-department"]} ${
        loading ? style["loading"] : ""
      }`}
    >
      {loading && (
        <div className={style["loading-overlay"]}>
          <div className={style["spinner"]}></div>
        </div>
      )}
      <div className={style["manage-department-container"]}>
        <h2 className={style["manage-department-header"]}>Quản lý bộ phận</h2>

        {error && <p style={{ color: "red" }}>{error}</p>}
        {loading ? (
          <p>Đang tải dữ liệu...</p>
        ) : departments.length === 0 ? (
          <div className={style["no-department"]}>
            <p>Hiện tại chưa có bộ phận nào!</p>
            <div className={style["button-container"]}>
              <button
                className={style["manage-department-button"]}
                onClick={() => navigate("/admin-dashboard/add-department")}
              >
                Thêm bộ phận <FontAwesomeIcon icon={faPlus} />
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className={style["department-table-content"]}>
              <div className={style["button-container"]}>
                <button
                  className={style["manage-department-button"]}
                  onClick={() => navigate("/admin-dashboard/add-department")}
                >
                  Thêm bộ phận <FontAwesomeIcon icon={faPlus} />
                </button>
              </div>
              <table className={style["department-table"]}>
                <thead>
                  <tr>
                    <th>Tên bộ phận</th>
                    <th>Lương</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((dept) => (
                    <tr key={dept.id}>
                      <td>{dept.name}</td>
                      <td>{formatPrice(dept.salary)}</td>
                      <td>
                        <div className={style["tooltip-container"]}>
                          <button
                            className={style["edit-button"]}
                            onClick={() => handleEditDepartment(dept.id)}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <span className={style["tooltip"]}>Chỉnh sửa</span>
                        </div>
                        <div className={style["tooltip-container"]}>
                          <button
                            className={style["delete-button"]}
                            onClick={() => handleDeleteDepartment(dept.id)}
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
          </>
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
    </div>
  );
}

export default ManageDepartment;
