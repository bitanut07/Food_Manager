import React, { useEffect, useState } from "react";
import {
  getMenuTabs,
  getFoodItems,
  createNewMenuTab,
  deleteFoodItem,
  deleteMenuTab,
  updateMenuTab,
} from "../../../API/MenuAPI";
import style from "./ManageMenu.module.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../Components/Auth/AuthContext";
import { isTokenExpired } from "../../../utils/tokenHelper.mjs";
import { refreshToken } from "../../../API/authAPI";
import { ModalGeneral } from "../../ModalGeneral";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash, faPlus } from "@fortawesome/free-solid-svg-icons";

const ManageMenu = () => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [foodItems, setFoodItems] = useState([]);
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const navigate = useNavigate();
  const { accessToken, setAccessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modal, setModal] = useState({
    isOpen: false,
    text: "",
    type: "", // "confirm" hoặc "success"
    onConfirm: null, // Hàm được gọi khi xác nhận
  });

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const data = await getMenuTabs();
        setCategories(data);
        if (data.length > 0) setSelectedCategory(data[0]?.id);
      } catch (error) {
        console.error("Error fetching menu categories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchFoodItems = async () => {
      setLoading(true);
      try {
        if (selectedCategory) {
          const data = await getFoodItems();
          const filteredItems = data.filter(
            (item) => item.category_id === selectedCategory
          );
          setFoodItems(filteredItems);
        }
      } catch (error) {
        console.error("Error fetching food items:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFoodItems();
  }, [selectedCategory]);

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

  const formatPrice = (price) => {
    return `${price.toLocaleString("vi-VN")} VND`;
  };

  const handleDelete = async (id) => {
    setModal({
      isOpen: true,
      text: "Bạn có chắc chắn muốn xóa món ăn này không?",
      type: "confirm",
      onConfirm: async () => {
        setModal({ isOpen: false });
        try {
          const activeToken = await ensureActiveToken();
          await deleteFoodItem(id, activeToken);
          setFoodItems((prevFoodItems) =>
            prevFoodItems.filter((item) => item.id !== id)
          );
          setModal({
            isOpen: true,
            text: "Xóa món ăn thành công",
            type: "success",
          });
        } catch (error) {
          console.error("Lỗi khi xóa món ăn:", error);
          setModal({
            isOpen: true,
            text: "Có lỗi xảy ra khi xóa món ăn. Vui lòng thử lại.",
            type: "error",
          });
        }
      },
    });
  };

  const updateCategories = async () => {
    try {
      const updatedCategories = await getMenuTabs();
      setCategories(updatedCategories);
      if (updatedCategories.length > 0) {
        setSelectedCategory(updatedCategories[updatedCategories.length - 1].id);
      }
    } catch (error) {
      console.error("Error updating categories:", error);
    }
  };

  const handleCreateNewCategory = async () => {
    try {
      const activeToken = await ensureActiveToken();
      const newCategory = await createNewMenuTab(
        { name: newCategoryName },
        activeToken
      );

      setNewCategoryName("");
      setShowNewCategoryForm(false);

      await updateCategories();
      setModal({
        isOpen: true,
        text: "Tạo mục mới thành công!",
        type: "success",
      });
    } catch (error) {
      console.error("Lỗi khi tạo mục mới:", error);
      setModal({
        isOpen: true,
        text: "Tạo mục mới thất bại. Vui lòng thử lại!",
        type: "error",
      });
    }
  };

  const [editCategoryModal, setEditCategoryModal] = useState({
    isOpen: false,
    category: null,
  });

  const handleEditCategoryClick = (category) => {
    setEditCategoryModal({ isOpen: true, category });
  };

  const handleUpdateCategory = async (updatedName) => {
    try {
      const activeToken = await ensureActiveToken();
      await updateMenuTab(
        editCategoryModal.category.id,
        { name: updatedName },
        activeToken
      );

      setEditCategoryModal({ isOpen: false, category: null });

      // Cập nhật danh sách danh mục và chọn lại mục đó sau khi sửa
      const updatedCategories = await getMenuTabs();
      setCategories(updatedCategories);

      // Giữ mục đã sửa được chọn
      setSelectedCategory(editCategoryModal.category.id);

      setModal({
        isOpen: true,
        text: "Chỉnh sửa mục thành công!",
        type: "success",
      });
    } catch (error) {
      console.error("Lỗi khi chỉnh sửa mục:", error);
      setModal({
        isOpen: true,
        text: "Chỉnh sửa mục thất bại. Vui lòng thử lại!",
        type: "error",
      });
    }
  };

  const handleDeleteCategory = async (id) => {
    // Kiểm tra xem danh mục có món ăn nào không
    const foodInCategory = foodItems.filter((item) => item.category_id === id);

    if (foodInCategory.length > 0) {
      setModal({
        isOpen: true,
        text: "Danh mục này không thể xóa vì vẫn còn món ăn.",
        type: "error",
      });
      return;
    }

    setModal({
      isOpen: true,
      text: "Bạn có chắc chắn muốn xóa danh mục này không?",
      type: "confirm",
      onConfirm: async () => {
        setModal({ isOpen: false }); // Đóng modal xác nhận
        try {
          const activeToken = await ensureActiveToken();
          await deleteMenuTab(id, activeToken); // Gọi API để xóa danh mục

          // Cập nhật danh sách danh mục sau khi xóa
          const updatedCategories = await getMenuTabs();
          setCategories(updatedCategories);

          // Chọn mục đầu tiên trong danh sách sau khi xóa
          if (updatedCategories.length > 0) {
            setSelectedCategory(updatedCategories[0].id);
          }

          // Hiển thị thông báo thành công
          setModal({
            isOpen: true,
            text: "Xóa danh mục thành công",
            type: "success",
          });
        } catch (error) {
          console.error("Lỗi khi xóa danh mục:", error);
          // Hiển thị thông báo lỗi
          setModal({
            isOpen: true,
            text: "Có lỗi xảy ra khi xóa danh mục. Vui lòng thử lại.",
            type: "error",
          });
        }
      },
    });
  };

  const handleAddFoodClick = () => {
    if (categories.length === 0) {
      setModal({
        isOpen: true,
        text: "Chưa có danh mục nào. Bạn cần tạo ít nhất một danh mục trước khi thêm món ăn.",
        type: "error",
      });
    } else {
      navigate("/admin-dashboard/add-food");
    }
  };

  return (
    <div
      className={`${style["manage-menu-container"]} ${
        loading ? style["loading"] : ""
      }`}
    >
      {loading && (
        <div className={style["loading-overlay"]}>
          <div className={style["spinner"]}></div>
        </div>
      )}
      <div className={style["menu-sidebar"]}>
        <h3>Thực đơn hiện tại</h3>
        <h4>Danh sách mục có sẵn</h4>

        <button
          className={style["add-category-button"]}
          onClick={() => setShowNewCategoryForm(true)}
        >
          Tạo mục mới <FontAwesomeIcon icon={faPlus} />
        </button>
        {categories.length > 0 ? (
          categories.map((category) => (
            <div key={category.id} className={style["menu-tab-container"]}>
              <button
                className={`${style["menu-tab"]} ${
                  selectedCategory === category.id ? style["active"] : ""
                }`}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </button>

              {selectedCategory === category.id && (
                <div className={style["category-buttons"]}>
                  <div className={style["tooltip-container"]}>
                    <button
                      className={style["edit-category-button"]}
                      onClick={() => handleEditCategoryClick(category)}
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <span className={style["tooltip"]}>Chỉnh sửa</span>
                  </div>
                  <div className={style["tooltip-container"]}>
                    <button
                      className={style["delete-category-button"]}
                      onClick={() => handleDeleteCategory(category.id)}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                    <span className={style["tooltip"]}>Xóa</span>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className={style["no-menutab-message"]}>
            Chưa có mục nào, hãy thêm mới!
          </p>
        )}
      </div>

      <div className={style["menu-content"]}>
        <h2>QUẢN LÝ THỰC ĐƠN</h2>
        <div className={style["button-container"]}>
          <button
            className={style["add-food-button"]}
            onClick={handleAddFoodClick}
          >
            Tạo món ăn mới +
          </button>
        </div>
        {foodItems.length === 0 ? (
          <p className={style["no-food-message"]}>
            Chưa có món ăn nào, hãy thêm mới!
          </p>
        ) : (
          <div className={style["food-items-container"]}>
            {foodItems.map((item) => (
              <div key={item.id} className={style["food-item-card"]}>
                <img
                  src={item.thumbnail || item.image || "https://via.placeholder.com/150"}
                  alt={item.name}
                  className={style["food-image"]}
                />
                <h5>{item.name}</h5>
                <p className={style["food-price"]}>{formatPrice(item.price)}</p>
                <div className={style["food-card-buttons"]}>
                  <div className={style["tooltip-container"]}>
                    <button
                      className={style["edit-button"]}
                      onClick={() =>
                        navigate(`/admin-dashboard/edit-fooditem/${item.id}`)
                      }
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <span className={style["tooltip"]}>Chỉnh sửa</span>
                  </div>
                  <div className={style["tooltip-container"]}>
                    <button
                      className={style["delete-button"]}
                      onClick={() => handleDelete(item.id)}
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
      </div>

      {modal.isOpen && (
        <ModalGeneral
          isOpen={modal.isOpen}
          text={modal.text}
          type={modal.type}
          onClose={() => setModal({ isOpen: false })}
          onConfirm={modal.onConfirm}
        />
      )}

      {editCategoryModal.isOpen && (
        <div className={style["modal-overlay"]}>
          <div className={style["modal-content"]}>
            <h3>Chỉnh sửa mục</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const updatedName = e.target.categoryName.value;
                handleUpdateCategory(updatedName);
              }}
            >
              <input
                type="text"
                name="categoryName"
                defaultValue={editCategoryModal.category.name}
                required
              />
              <div>
                <button className={style["save-button"]} type="submit">
                  Lưu
                </button>
                <button
                  className={style["cancel-button"]}
                  type="button"
                  onClick={() =>
                    setEditCategoryModal({ isOpen: false, category: null })
                  }
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showNewCategoryForm && (
        <div className={style["modal-overlay"]}>
          <div className={style["modal-content"]}>
            <h3>Tạo mục mới</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateNewCategory();
              }}
            >
              <input
                type="text"
                placeholder="Tên mục mới"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                required
              />
              <div>
                <button className={style["save-button"]} type="submit">
                  Lưu
                </button>
                <button
                  className={style["cancel-button"]}
                  type="button"
                  onClick={() => setShowNewCategoryForm(false)}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageMenu;
