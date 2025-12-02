import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import style from "./../../../Style/AdminStyle/ManageTable.module.css";
import {
  GetTable,
  DeleteTable,
  UpdateTable,
  addTable,
} from "../../../API/AdminAPI";
import { useAuth } from "../../Auth/AuthContext";
import { isTokenExpired } from "../../../utils/tokenHelper.mjs";
import { refreshToken } from "../../../API/authAPI";
import { faEdit, faTrash, faPlus } from "@fortawesome/free-solid-svg-icons";
import TableIcon from "./../../Employee/EmployeeReservation/tableIcon";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ModalGeneral } from "../../ModalGeneral";
import AddTableModal from "./AddTableModal";

function ManageTable() {
  const { accessToken, setAccessToken } = useAuth();
  const navigate = useNavigate();
  const [tables, setTables] = useState([]);
  const [editingTableId, setEditingTableId] = useState(null);
  const [editedSeats, setEditedSeats] = useState({});
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({
    isOpen: false,
    text: "",
    type: "",
    onConfirm: null,
  });
  const [isAddTableModalOpen, setAddTableModalOpen] = useState(false);

  // Ensure token is valid
  const ensureActiveToken = async () => {
    let activeToken = accessToken;
    const refresh = localStorage.getItem("refreshToken");
    if (!refresh || isTokenExpired(refresh)) {
              navigate('/', { replace: true });
              window.location.reload();
              throw 'Phiên đăng nhập hết hạn';
            }

    if (!accessToken || isTokenExpired(accessToken)) {
      const refreshed = await refreshToken(refresh);
      activeToken = refreshed.access;
      setAccessToken(activeToken);
    }
    return activeToken;
  };

  const fetchData = async () => {

    setLoading(true);
    try {
      const activeToken = await ensureActiveToken();
      const tablesData = await GetTable(activeToken);
      setTables(Array.isArray(tablesData) ? tablesData : tablesData?.data || []);
      console.log("hi",tablesData);
    } catch (error) {
      console.error("Error fetching table data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddTable = async (newTable) => {
    try {
      const activeToken = await ensureActiveToken();
      await addTable(newTable, activeToken);
      fetchData(); // Cập nhật lại danh sách bàn sau khi thêm thành công
      setAddTableModalOpen(false); // Đóng modal thêm bàn
      setModal({
        isOpen: true,
        text: "Thêm bàn thành công!",
        type: "success",
      });
    } catch (error) {
      console.error("Error adding table:", error);
      setModal({
        isOpen: true,
        text: "Không thể thêm bàn. Vui lòng thử lại!",
        type: "error",
      });
    }
  };

  const handleEditTable = (id, currentSeats) => {
    setEditingTableId(id); // Chuyển sang chế độ chỉnh sửa
    setEditedSeats({ [id]: currentSeats }); // Lưu số ghế hiện tại
  };

  const handleCancelEdit = () => {
    setEditingTableId(null); // Thoát chế độ chỉnh sửa
    setEditedSeats({});
  };

  const handleSaveEdit = async (id) => {
    setLoading(true);
    try {
      const activeToken = await ensureActiveToken();
      await UpdateTable(id, { table_size: editedSeats[id] }, activeToken);
      setEditingTableId(null); // Thoát chế độ chỉnh sửa
      setEditedSeats({});
      fetchData(); // Làm mới danh sách bàn
      setModal({
        isOpen: true,
        text: "Chỉnh sửa bàn thành công!",
        type: "success",
      });
    } catch (error) {
      console.error("Error updating table:", error);
      setModal({
        isOpen: true,
        text: "Không thể chỉnh sửa bàn. Vui lòng thử lại sau!",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTable = async (id) => {
    const table = tables.find((table) => table.id === id);
    if (!table || table.status !== "A") {
      setModal({
        isOpen: true,
        text: "Bàn này đang trong quá trình phục vụ không thể xóa!",
        type: "error",
      });
      return;
    }

    setModal({
      isOpen: true,
      text: "Bạn có chắc chắn muốn xóa bàn này không?",
      type: "confirm",
      onConfirm: async () => {
        try {
          const activeToken = await ensureActiveToken();
          await DeleteTable(id, activeToken);
          setTables(tables.filter((table) => table.id !== id));
          setModal({
            isOpen: true,
            text: "Xóa bàn thành công!",
            type: "success",
          });
        } catch (error) {
          console.error("Error deleting Table:", error);
          setModal({
            isOpen: true,
            text: "Không thể xóa bàn. Vui lòng thử lại sau.",
            type: "error",
          });
        }
      },
    });
  };

  const handleAddTableClick = () => {
    setAddTableModalOpen(true);
  };

  return (
    <div
      className={`${style["ManageTable-container"]} ${
        loading ? style["loading"] : ""
      }`}
    >
      {loading && (
        <div className={style["loading-overlay"]}>
          <div className={style["spinner"]}></div>
        </div>
      )}
      {/* Header Section */}
      <div className={style["header"]}>
        <h2>Quản lý bàn</h2>
      </div>
      <div className={style["header-controls"]}>
        <p>Tổng số bàn: {tables.length}</p>
        <button
          className={style["add-table-btn"]}
          onClick={handleAddTableClick}
        >
          Thêm bàn mới <FontAwesomeIcon icon={faPlus} />
        </button>
      </div>

      <div className={style["content"]}>
        {tables.length === 0 ? (
          <div className={style["no-tables"]}>
            <p>Hiện tại chưa có bàn nào!</p>
          </div>
        ) : (
          <div className={style["table-list"]}>
            {tables.map((table) => (
              <div key={table.id} className={style["table-item"]}>
                <TableIcon
                  w={64}
                  h={64}
                  c={
                    table.status === "A"
                      ? "#000000"
                      : table.status === "D"
                      ? "#28A745"
                      : table.status === "S"
                      ? "#007BFF"
                      : table.status === "R"
                      ? "#FFC107"
                      : "brown"
                  }
                />
                <p>Bàn số: {table.id}</p>
                {editingTableId === table.id ? (
                  <div className={style["edit-seats-container"]}>
                    <label htmlFor={`edit-seats-${table.id}`}>Số ghế:</label>
                    <input
                      id={`edit-seats-${table.id}`}
                      type="number"
                      value={editedSeats[table.id]}
                      onChange={(e) =>
                        setEditedSeats({
                          ...editedSeats,
                          [table.id]: e.target.value,
                        })
                      }
                    />
                    <FontAwesomeIcon icon={faEdit} />
                  </div>
                ) : (
                  <p>Số ghế: {table.table_size}</p>
                )}
                <p>
                  Trạng thái:{" "}
                  {table.status === "A"
                    ? "Trống"
                    : table.status === "D"
                    ? "Chờ thanh toán"
                    : table.status === "S"
                    ? "Đang phục vụ"
                    : table.status === "R"
                    ? "Bàn được đặt trước"
                    : "Không xác định"}
                </p>
                <div className={style["table-actions"]}>
                  {editingTableId === table.id ? (
                    <>
                      <button
                        className={style["table-actions-save"]}
                        onClick={() => handleSaveEdit(table.id)}
                      >
                        Lưu
                      </button>
                      <button
                        className={style["table-actions-cancel"]}
                        onClick={handleCancelEdit}
                      >
                        Hủy
                      </button>
                    </>
                  ) : (
                    <>
                      <div className={style["button-container"]}>
                        <div className={style["tooltip-container"]}>
                          <button
                            className={style["table-actions-edit"]}
                            onClick={() =>
                              handleEditTable(table.id, table.table_size)
                            }
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <span className={style["tooltip"]}>Chỉnh sửa</span>
                        </div>

                        <div className={style["tooltip-container"]}>
                          <button
                            className={style["table-actions-delete"]}
                            onClick={() => handleDeleteTable(table.id)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                          <span className={style["tooltip"]}>Xóa</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hiển thị modal thêm bàn */}
      <AddTableModal
        isOpen={isAddTableModalOpen}
        onClose={() => setAddTableModalOpen(false)}
        onAddTable={handleAddTable}
      />

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

export default ManageTable;
