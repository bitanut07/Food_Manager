import React, { useContext, useState } from "react";
import { RestaurantContext } from "../../../Config/RestaurantContext"; // Import Context
import { UpdateResInfo } from "../../../API/AdminAPI"; // Hàm cập nhật thông tin API
import style from "./ManageRestaurantInfo.module.css";
import { AiOutlineEdit } from "react-icons/ai";
import { useAuth } from "../../../Components/Auth/AuthContext";
import { isTokenExpired } from "../../../utils/tokenHelper.mjs";
import { refreshToken } from "../../../API/authAPI";
import { ModalGeneral } from "../../ModalGeneral";
import { useNavigate } from "react-router-dom";

function ManageRestaurantInfo() {
  const [previewQR, setPreviewQR] = useState(null);

  const { restaurantInfo, loading, error, setRestaurantInfo } =
    useContext(RestaurantContext); // Sử dụng context
  const [editMode, setEditMode] = useState(false); // Quản lý trạng thái chỉnh sửa
  const [updatedInfo, setUpdatedInfo] = useState({}); // Thông tin cập nhật
  const { accessToken, setAccessToken } = useAuth();
  const navigate = useNavigate();
  const [modal, setModal] = useState({
    isOpen: false,
    text: "",
    type: "",
    onConfirm: null,
  });
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

  // Khi bật chế độ chỉnh sửa, đồng bộ dữ liệu từ context vào updatedInfo
  const enableEditMode = () => {
    setUpdatedInfo(restaurantInfo); // Lấy dữ liệu từ context
    setEditMode(true); // Bật chế độ chỉnh sửa
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUpdatedInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNestedChange = (e, parentKey) => {
    const { name, value } = e.target;
    setUpdatedInfo((prev) => ({
      ...prev,
      [parentKey]: {
        ...prev[parentKey],
        [name]: value,
      },
    }));
  };

  const handleQRUpload = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const allowedExtensions = /(\.jpg|\.jpeg|\.png)$/i;
    if (!allowedExtensions.exec(file.name)) {
      alert("Chỉ chấp nhận file ảnh với định dạng jpg, jpeg, hoặc png.");
      return;
    }

    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("Ảnh quá lớn. Vui lòng chọn ảnh dưới 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setPreviewQR(reader.result);
    reader.readAsDataURL(file);

    setUpdatedInfo((prev) => ({
      ...prev,
      QR: file, // Đưa file vào updatedInfo để gửi lên server
    }));
  };
  

  const handleSave = async () => {
    try {
      const activeToken = await ensureActiveToken();

      await UpdateResInfo(activeToken, updatedInfo); // Gửi dữ liệu cập nhật đến API
      setRestaurantInfo(updatedInfo); // Cập nhật lại context
      console.log (updatedInfo);
      setEditMode(false); // Tắt chế độ chỉnh sửa
      setModal({
        isOpen: true,
        text: "Cập nhật thông tin nhà hàng thành công!",
        type: "success",
      });
    } catch (err) {
      console.error("Cập nhật thông tin thất bại:", err);
    }
  };

  if (loading) return <p className={style["ManageRes"]}>Loading...</p>;
  if (error) return <p className={style["ManageRes"]}>{error}</p>;

  return (
    <div className={style["ManageRes-container"]}>
      {editMode ? (
        <h1>CHỈNH SỬA THÔNG TIN NHÀ HÀNG</h1>
      ) : (
        <h1>QUẢN LÝ THÔNG TIN NHÀ HÀNG</h1>
      )}
      <div className={style["ManageRes-actions"]}>
        {editMode ? (
          <>
            <button className={style["save-button"]} onClick={handleSave}>
              Lưu
            </button>
            <button
              className={style["cancel-button"]}
              onClick={() => setEditMode(false)}
            >
              Hủy
            </button>
          </>
        ) : (
          <button className={style["edit-button"]} onClick={enableEditMode}>
            Chỉnh Sửa
          </button>
        )}
      </div>
      <div className={style["ManageRes-form"]}>
        <div className={style["ManageRes-field"]}>
          <label>Tên nhà hàng:</label>
          {editMode ? (
            <div className={style["ManageRes-input"]}>
              <input
                type="text"
                name="name"
                value={updatedInfo.name || ""}
                onChange={handleChange}
              />
              <AiOutlineEdit size={20} />
            </div>
          ) : (
            <p>{restaurantInfo.name}</p>
          )}
        </div>

        <div className={style["ManageRes-field"]}>
          <label>Giờ mở trong tuần:</label>
          {editMode ? (
            <div className={style["ManageRes-input"]}>
              <div className={style["ManageRes-input-input"]}>
                <input
                  type="text"
                  name="onweek_openhour"
                  value={updatedInfo.onweek_openhour || ""}
                  onChange={handleChange}
                />
                <AiOutlineEdit size={20} />
              </div>
              <div className={style["ManageRes-input-input"]}>
                <input
                  type="text"
                  name="onweek_closehour"
                  value={updatedInfo.onweek_closehour || ""}
                  onChange={handleChange}
                />
                <AiOutlineEdit size={20} />
              </div>
            </div>
          ) : (
            <p>
              {restaurantInfo.onweek_openhour} -{" "}
              {restaurantInfo.onweek_closehour}
            </p>
          )}
        </div>

        <div className={style["ManageRes-field"]}>
          <label>Giờ mở cuối tuần:</label>
          {editMode ? (
            <div className={style["ManageRes-input"]}>
              <div className={style["ManageRes-input-input"]}>
                <input
                  type="text"
                  name="weekend_openhour"
                  value={updatedInfo.weekend_openhour || ""}
                  onChange={handleChange}
                />
                <AiOutlineEdit size={20} />
              </div>
              <div className={style["ManageRes-input-input"]}>
                <input
                  type="text"
                  name="weekend_closehour"
                  value={updatedInfo.weekend_closehour || ""}
                  onChange={handleChange}
                />
                <AiOutlineEdit size={20} />
              </div>
            </div>
          ) : (
            <p>
              {restaurantInfo.weekend_openhour} -{" "}
              {restaurantInfo.weekend_closehour}
            </p>
          )}
        </div>

        <div className={style["ManageRes-field"]}>
          <label>Địa chỉ:</label>
          {editMode ? (
            <div className={style["ManageRes-input"]}>
              <input
                type="text"
                name="address"
                value={updatedInfo.address || ""}
                onChange={handleChange}
              />
              <AiOutlineEdit size={20} />
            </div>
          ) : (
            <p>{restaurantInfo.address}</p>
          )}
        </div>

        <div className={style["ManageRes-field"]}>
          <label>Số điện thoại:</label>
          {editMode ? (
            <div className={style["ManageRes-input"]}>
              <input
                type="text"
                name="phone"
                value={updatedInfo.phone || ""}
                onChange={handleChange}
              />
              <AiOutlineEdit size={20} />
            </div>
          ) : (
            <p>{restaurantInfo.phone}</p>
          )}
        </div>

        <div className={style["ManageRes-field"]}>
          <label>Google Map:</label>
          {editMode ? (
            <div className={style["ManageRes-input"]}>
              <input
                type="text"
                name="google_map"
                value={updatedInfo.google_map || ""}
                onChange={handleChange}
              />
              <AiOutlineEdit size={20} />
            </div>
          ) : (
            <a
              href={restaurantInfo.google_map}
              target="_blank"
              rel="noopener noreferrer"
            >
              {restaurantInfo.google_map}
            </a>
          )}
        </div>

        <div className={style["ManageRes-field"]}>
          <label>Email:</label>
          {editMode ? (
            <div className={style["ManageRes-input"]}>
              <input
                type="text"
                name="link_momo"
                value={updatedInfo.email || ""}
                onChange={handleChange}
              />
              <AiOutlineEdit size={20} />
            </div>
          ) : (
            <p>{restaurantInfo.email}</p>
          )}
        </div>
      
        <div className={style["ManageRes-field-image"]}>
          <div>
            <label>Ảnh QR chuyển tiền:</label>
            {editMode && (
              <input
                type="file"
                name="QR"
                accept="image/*"
                onChange={handleQRUpload}
              />
            )}
          </div>
          {previewQR ? (
            <img src={previewQR} alt="QR Preview" />
          ) : (
            restaurantInfo.QR && (
              <img
                src={restaurantInfo.QR}
                alt="QR Code"
                className={style["qr-preview"]}
              />
            )
          )}
        </div>



        <div className={style["ManageRes-field-social"]}>
          <label>Social Links:</label>
          {editMode ? (
            <div className={style["social-links"]}>
              <div className={style["social-item"]}>
                <label>Facebook:</label>
                <input
                  type="text"
                  name="facebook"
                  value={updatedInfo.social?.facebook || ""}
                  onChange={(e) => handleNestedChange(e, "social")}
                />
                <AiOutlineEdit size={20} />
              </div>
              <div className={style["social-item"]}>
                <label>Instagram:</label>
                <input
                  type="text"
                  name="instagram"
                  value={updatedInfo.social?.instagram || ""}
                  onChange={(e) => handleNestedChange(e, "social")}
                />
                <AiOutlineEdit size={20} />
              </div>
              <div className={style["social-item"]}>
                <label>YouTube:</label>
                <input
                  type="text"
                  name="youtube"
                  value={updatedInfo.social?.youtube || ""}
                  onChange={(e) => handleNestedChange(e, "social")}
                />
                <AiOutlineEdit size={20} />
              </div>
              <div className={style["social-item"]}>
                <label>Chat Box:</label>
                <input
                  type="text"
                  name="chatbox"
                  value={updatedInfo.social?.chatbox || ""}
                  onChange={(e) => handleNestedChange(e, "social")}
                />
                <AiOutlineEdit size={20} />
              </div>
            </div>
          ) : (
            <div className={style["social-links"]}>
              <div className={style["social-item"]}>
                <label>Facebook:</label>
                <a
                  href={restaurantInfo.social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {restaurantInfo.social.facebook}
                </a>
              </div>
              <div className={style["social-item"]}>
                <label>Instagram:</label>
                <a
                  href={restaurantInfo.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {restaurantInfo.social.instagram}
                </a>
              </div>
              <div className={style["social-item"]}>
                <label>YouTube:</label>
                <a
                  href={restaurantInfo.social.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {restaurantInfo.social.youtube}
                </a>
              </div>
              <div className={style["social-item"]}>
                <label>Chat Box:</label>
                <a
                  href={restaurantInfo.social.chatbox}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {restaurantInfo.social.chatbox}
                </a>
              </div>
            </div>
          )}
        </div>
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
    </div>
  );
}

export default ManageRestaurantInfo;
