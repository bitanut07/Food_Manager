import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getFoodItemByID,
  updateFoodItem,
  getMenuTabs,
} from "../../../API/MenuAPI";
import { useAuth } from "../../../Components/Auth/AuthContext";
import { isTokenExpired } from "../../../utils/tokenHelper.mjs";
import { refreshToken } from "../../../API/authAPI";
import style from "./EditFoodItem.module.css";
import { ModalGeneral } from "../../ModalGeneral";

function EditFoodItem() {
  const { id } = useParams();
  const [fooditem, setFoodItem] = useState({
    name: "",
    price: "",
    description: "",
    thumbnail: "",
    category_id: "",
    status: true,
  });
  const [originalFoodItem, setOriginalFoodItem] = useState({});
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({
    isOpen: false,
    text: "",
    type: "",
    onConfirm: null,
  });
  const [previewImage, setPreviewImage] = useState(null);
  const navigate = useNavigate();
  const { accessToken, setAccessToken } = useAuth();

  useEffect(() => {
    const fetchFoodItem = async () => {
      setLoading(true);
      try {
        const data = await getFoodItemByID(id);
        const itemData = {
          name: data.name || "",
          price: data.price || "",
          description: data.description || "",
          thumbnail: data.thumbnail || "",
          category_id: data.category_id || "",
          status: data.status !== undefined ? data.status : true,
        };
        setFoodItem(itemData);
        setOriginalFoodItem(itemData);
        if (data.thumbnail) {
          setPreviewImage(data.thumbnail);
        }
      } catch (error) {
        console.error("Error fetching food item:", error);
        setError("Không thể tải dữ liệu món ăn.");
      } finally {
        setLoading(false);
      }
    };

    const fetchCategories = async () => {
      try {
        const categoriesData = await getMenuTabs();
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchFoodItem();
    fetchCategories();
  }, [id]);

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

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === "thumbnail" && files && files.length > 0) {
      const file = files[0];
      
      const allowedExtensions = /(\.jpg|\.jpeg|\.png)$/i;
      if (!allowedExtensions.exec(file.name)) {
        setError("Chỉ chấp nhận file ảnh với định dạng jpg và png.");
        return;
      }

      const maxSize = 2 * 1024 * 1024;
      if (file.size > maxSize) {
        setError("Ảnh quá lớn. Vui lòng chọn ảnh dưới 2MB.");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.src = reader.result;

        img.onload = () => {
          const aspectRatio = img.width / img.height;

          if (aspectRatio < 0.5 || aspectRatio > 2) {
            setError(
              "Ảnh phải có tỷ lệ chiều rộng/chiều cao trong khoảng 1:2 và 2:1."
            );
            return;
          }

          setError("");
          setPreviewImage(reader.result);
          setFoodItem((prev) => ({
            ...prev,
            thumbnail: reader.result,
          }));
        };
      };
      reader.readAsDataURL(file);
    } else if (name !== "thumbnail") {
      setFoodItem((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, price, description, thumbnail, category_id, status } = fooditem;

    // Kiểm tra thay đổi
    const hasChanges =
      fooditem.name !== originalFoodItem.name ||
      fooditem.price !== originalFoodItem.price ||
      fooditem.description !== originalFoodItem.description ||
      fooditem.category_id !== originalFoodItem.category_id ||
      fooditem.thumbnail !== originalFoodItem.thumbnail ||
      fooditem.status !== originalFoodItem.status;

    if (!hasChanges) {
      setError("Chưa có thay đổi gì để cập nhật.");
      return;
    }

    if (name.length > 255) {
      setError("Tên món ăn không được quá 255 ký tự.");
      return;
    }

    if (isNaN(price) || price < 0) {
      setError("Giá phải là số nguyên và lớn hơn hoặc bằng 0.");
      return;
    }

    setLoading(true);
    try {
      const activeToken = await ensureActiveToken();
      
      // Tạo object - MenuAPI sẽ đảm bảo đúng kiểu dữ liệu
      const productData = {
        id: id,
        name: name,
        description: description,
        price: price,
        thumbnail: thumbnail,
        category_id: category_id,
        status: status === true || status === "true",
      };
      
      console.log("Update product data:", productData);
      
      await updateFoodItem(id, productData, activeToken);
      setModal({
        isOpen: true,
        text: "Món ăn được cập nhật thành công!",
        type: "success",
        onConfirm: handleCloseModal,
      });
    } catch (error) {
      console.error("Lỗi khi cập nhật món ăn:", error.message);
      setError("Đã có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setModal({ isOpen: false });
    navigate("/admin-dashboard/manage-menu");
  };

  return (
    <div
      className={`${style["edit-fooditem"]} ${loading ? style["loading"] : ""}`}
    >
      {loading && (
        <div className={style["loading-overlay"]}>
          <div className={style["spinner"]}></div>
        </div>
      )}
      <h2>CHỈNH SỬA MÓN ĂN</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className={style["left-side"]}>
          <div className={style["form-img"]}>
            {previewImage ? (
              <img src={previewImage} alt="Preview" />
            ) : (
              <img src="/assets/images/menu.jpg" alt="Default" />
            )}

            {previewImage && previewImage === originalFoodItem.thumbnail && (
              <p className={style["placeholder"]}>Ảnh hiện tại</p>
            )}

            <label htmlFor="thumbnail" className={style["image-upload-button"]}>
              Chọn ảnh mới
              <input
                type="file"
                id="thumbnail"
                name="thumbnail"
                accept="image/jpeg,image/png"
                style={{ display: "none" }}
                onChange={handleChange}
              />
            </label>
            <p className={style["instructions"]}>
              Dung lượng file tối đa 2MB <br />
              Định dạng: JPEG, PNG <br />
              Nên sử dụng hình ảnh có tỉ lệ 1:1 <br />
              Ảnh cần có tỉ lệ kích thước chiều rộng và chiều cao không quá 1:2
              và không nhỏ hơn 2:1
            </p>
          </div>
        </div>

        <div className={style["right-side"]}>
          <div className={style["form-group"]}>
            <label htmlFor="name">Tên món ăn</label>
            <input
              type="text"
              id="name"
              name="name"
              value={fooditem.name}
              onChange={handleChange}
              maxLength={255}
              required
            />
          </div>

          <div className={style["form-group"]}>
            <label htmlFor="price">Giá</label>
            <input
              type="number"
              id="price"
              name="price"
              value={fooditem.price}
              onChange={handleChange}
              min={0}
              max={999999999}
              required
            />
          </div>

          <div className={style["form-group"]}>
            <label htmlFor="description">Mô tả</label>
            <textarea
              id="description"
              name="description"
              value={fooditem.description}
              onChange={handleChange}
              required
            />
          </div>

          <div className={style["form-group"]}>
            <label htmlFor="category_id">Danh mục</label>
            <select
              id="category_id"
              name="category_id"
              value={fooditem.category_id}
              onChange={handleChange}
              required
            >
              <option value="">Chọn danh mục</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className={style["form-group"]}>
            <label htmlFor="status">Trạng thái</label>
            <select
              id="status"
              name="status"
              value={fooditem.status}
              onChange={handleChange}
            >
              <option value={true}>Đang kinh doanh</option>
              <option value={false}>Ngừng kinh doanh</option>
            </select>
          </div>

          <div className={style["button-container"]}>
            <button type="submit" className={style["submit-button"]}>
              Cập nhật
            </button>
            <button
              type="button"
              className={style["cancel-button"]}
              onClick={() => navigate("/admin-dashboard/manage-menu")}
            >
              Hủy
            </button>
          </div>
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
  );
}

export default EditFoodItem;
