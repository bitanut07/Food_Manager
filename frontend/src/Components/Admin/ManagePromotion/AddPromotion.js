import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addPromotion, fetchPromotions } from "../../../API/PromotionAPI";
import { useAuth } from "../../../Components/Auth/AuthContext";
import { isTokenExpired } from "../../../utils/tokenHelper.mjs";
import { refreshToken } from "../../../API/authAPI";
import style from "./AddPromotion.module.css";
import { ModalGeneral } from "../../ModalGeneral";

function AddPromotion() {
  const [promotion, setPromotion] = useState({
    code: "",
    title: "",
    description: "",
    image: null,
    discount: 0,
    startdate: "",
    enddate: "",
    type: "",
    min_order: 0,
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { accessToken, setAccessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({
    isOpen: false,
    text: "",
    type: "",
    onConfirm: null,
  });
  const [previewImage, setPreviewImage] = useState(null);

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

  const checkCodeExistence = async (code) => {
    try {
      const promotions = await fetchPromotions();
      return promotions.some((promo) => promo.code === code);
    } catch (error) {
      console.error("Lỗi khi kiểm tra mã ưu đãi:", error.message);
      throw error;
    }
  };

  const handleChange = (e) => {
    const { name, files } = e.target;

    if (name === "image" && files.length > 0) {
      const file = files[0];

      const allowedExtensions = /(\.jpg|\.png)$/i;
      if (!allowedExtensions.exec(file.name)) {
        setError("Chỉ chấp nhận file ảnh với định dạng jpg và png.");
        return;
      }
      setError("");

      const maxSize = 2 * 1024 * 1024;
      if (file.size > maxSize) {
        setError("Ảnh quá lớn. Vui lòng chọn ảnh dưới 2MB.");
        return;
      }
      setError("");

      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.src = reader.result;

        img.onload = () => {
          const width = img.width;
          const height = img.height;

          const aspectRatio = width / height;

          if (aspectRatio < 0.5 || aspectRatio > 2) {
            setError(
              "Ảnh phải có tỷ lệ chiều rộng/chiều cao trong khoảng 1:2 và 2:1."
            );
            return;
          }

          setError("");
          setPreviewImage(reader.result);
        };
      };
      reader.readAsDataURL(file);

      setPromotion((prevPromotion) => ({
        ...prevPromotion,
        image: file,
      }));
    } else if (name !== "image") {
      setPromotion((prevPromotion) => ({
        ...prevPromotion,
        [name]: e.target.value,
      }));
    }
  };

  const handleCloseModal = () => {
    setModal({ isOpen: false });
    navigate("/admin-dashboard/manage-promotions");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const {
      code,
      title,
      description,
      image,
      discount,
      startdate,
      enddate,
      type,
      min_order,
    } = promotion;

    if (await checkCodeExistence(code)) {
      setError("Tên món ăn đã tồn tại. Vui lòng chọn tên khác.");
      return;
    }
    setError("");

    if (!image) {
      setError("Vui lòng chọn ảnh ưu đãi.");
      return;
    }
    setError("");

    if (new Date(startdate) >= new Date(enddate)) {
      setError("Ngày bắt đầu phải trước ngày kết thúc.");
      return;
    }
    setError("");

    if (promotion.image instanceof File) {
      const allowedExtensions = /(.jpg|.jpeg|.png)$/i;
      if (!allowedExtensions.exec(promotion.image.name)) {
        setError("Chỉ chấp nhận file ảnh với định dạng jpg, jpeg, png.");
        return;
      }
    }
    setError("");

    const formattedStartDate = new Date(startdate).toISOString().split("T")[0];
    const formattedEndDate = new Date(enddate).toISOString().split("T")[0];

    const promotionData = {
      ...promotion,
      startdate: formattedStartDate,
      enddate: formattedEndDate,
    };

    setLoading(true);
    try {
      const activeToken = await ensureActiveToken();
      await addPromotion(promotionData, activeToken);
      setModal({
        isOpen: true,
        text: "Thêm ưu đãi thành công!",
        type: "success",
        onConfirm: handleCloseModal,
      });
    } catch (error) {
      if (error.response) {
        console.error("Lỗi từ server:", error.response.data);
      } else {
        console.error("Lỗi khác:", error.message);
      }
      setError("Đã có lỗi xảy ra, vui lòng thử lại.");
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
      <h2>THÊM ƯU ĐÃI MỚI</h2>
      <div className={style["add-promotion-container"]}>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className={style["left-side"]}>
            <div className={style["form-img"]}>
              {previewImage ? (
                <img src={previewImage} alt="Preview" />
              ) : (
                <>
                  <img src="/assets/images/promotion.jpg" alt="Default" />
                  <p className={style["placeholder"]}> Ảnh ví dụ</p>
                </>
              )}

              <label htmlFor="image" className={style["image-upload-button"]}>
                Chọn ảnh ưu đãi
                <input
                  type="file"
                  id="image"
                  name="image"
                  style={{ display: "none" }}
                  onChange={handleChange}
                />
              </label>

              <p className={style["instructions"]}>
                Dung lượng file tối đa 2MB <br />
                Định dạng: JPEG, PNG <br />
                Nên sử dụng hình ảnh có tỉ lệ 1:1 <br />
                Ảnh cần có tỉ lệ kích thước chiều rộng và chiều cao không quá
                1:2 và không nhỏ hơn 2:1
              </p>
            </div>
          </div>
          <div className={style["middle-side"]}>
            <div className={style["form-group"]}>
              <label htmlFor="code">Mã ưu đãi</label>
              <input
                type="text"
                id="code"
                name="code"
                value={promotion.code}
                onChange={handleChange}
                placeholder="Nhập mã ưu đãi"
                required
                maxLength={10}
              />
            </div>
            <div className={style["form-group"]}>
              <label htmlFor="title">Tiêu đề</label>
              <textarea
                className={style["title-textarea"]}
                id="title"
                name="title"
                value={promotion.title}
                onChange={handleChange}
                placeholder="Nhập tiêu đề"
                required
              />
            </div>
            <div className={style["form-group"]}>
              <label htmlFor="description">Mô tả</label>
              <textarea
                className={style["description-textarea"]}
                id="description"
                name="description"
                value={promotion.description}
                onChange={handleChange}
                placeholder="Nhập mô tả"
                required
              />
            </div>
            <div className={style["form-group"]}>
              <label htmlFor="type">Loại ưu đãi</label>
              <select
                name="type"
                value={promotion.type}
                onChange={handleChange}
                required
              >
                <option value="">Chọn ưu đãi</option>
                <option value="KMTV">Khuyến mãi thành viên</option>
                <option value="KMT">Khuyến mãi thường</option>
              </select>
            </div>
          </div>
          <div className={style["right-side"]}>
            <div className={style["form-group"]}>
              <label htmlFor="discount">Giảm giá (%)</label>
              <input
                type="number"
                id="discount"
                name="discount"
                value={promotion.discount}
                onChange={handleChange}
                placeholder="Nhập tỷ lệ giảm giá (0-100)"
                required
                min={1}
                max={100}
              />
            </div>

            <div className={style["form-group"]}>
              <label htmlFor="min_order">
                Tổng tiền tối thiểu để được áp dụng ưu đãi
              </label>
              <input
                type="number"
                id="min_order"
                name="min_order"
                value={promotion.min_order}
                onChange={handleChange}
                placeholder="Nhập tổng tiền tối thiểu"
                required
                min={0}
                max={999999999}
              />
            </div>

            <div className={style["form-group"]}>
              <label htmlFor="startdate">Ngày bắt đầu</label>
              <input
                type="date"
                id="startdate"
                name="startdate"
                value={promotion.startdate}
                onChange={handleChange}
                required
              />
            </div>

            <div className={style["form-group"]}>
              <label htmlFor="enddate">Ngày kết thúc</label>
              <input
                type="date"
                id="enddate"
                name="enddate"
                value={promotion.enddate}
                onChange={handleChange}
                required
              />
            </div>

            <div className={style["button-container"]}>
              <button className={style["submit-button"]} type="submit">
                Thêm ưu đãi
              </button>
              <button
                className={style["cancel-button"]}
                onClick={() => navigate("/admin-dashboard/manage-promotions")}
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
    </div>
  );
}

export default AddPromotion;
