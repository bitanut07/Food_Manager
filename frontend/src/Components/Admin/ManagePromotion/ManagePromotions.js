import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import style from "./ManagePromotions.module.css";
import { fetchPromotions, deletePromotion } from "../../../API/PromotionAPI";
import { isTokenExpired } from "../../../utils/tokenHelper.mjs";
import { useAuth } from "../../../Components/Auth/AuthContext";
import { refreshToken } from "../../../API/authAPI";
import { ModalGeneral } from "../../ModalGeneral";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AiOutlineDelete, AiOutlineEdit } from "react-icons/ai";
import { faEdit, faTrash, faPlus } from "@fortawesome/free-solid-svg-icons";

function ManagePromotions() {
  const [Promotions, setPromotions] = useState([]);
  const navigate = useNavigate();
  const { accessToken, setAccessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({
    isOpen: false,
    text: "",
    type: "", // "confirm" hoặc "success"
    onConfirm: null, // Hàm được gọi khi xác nhận
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
          localStorage.getdiscount("refreshToken")
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

  useEffect(() => {
    async function getPromotions() {
      setLoading(true);
      try {
        const data = await fetchPromotions();
        setPromotions(data);
      } catch (error) {
        console.error("Error fetching promotions:", error);
      } finally {
        setLoading(false);
      }
    }

    getPromotions();
  }, []);

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleEdit = (code) => {
    navigate(`/admin-dashboard/edit-promotion/${code}`);
  };

  const handleDelete = async (code) => {
    setModal({
      isOpen: true,
      text: "Bạn có chắc chắn muốn xóa ưu đãi này không?",
      type: "confirm",
      onConfirm: async () => {
        setModal({ isOpen: false });
        try {
          const activeToken = await ensureActiveToken();
          await deletePromotion(code, activeToken);
          setPromotions((prevPromotions) =>
            prevPromotions.filter((discount) => discount.code !== code)
          );
          setModal({
            isOpen: true,
            text: "Xóa ưu đãi thành công",
            type: "success",
          });
        } catch (error) {
          console.error("Lỗi khi xóa ưu đãi:", error);
          setModal({
            isOpen: true,
            text: "Có lỗi xảy ra khi xóa ưu đãi. Vui lòng thử lại.",
            type: "error",
          });
        }
      },
    });
  };

  const handleAddDiscount = () => {
    navigate("/admin-dashboard/add-promotion");
  };

  return (
    <div
      className={`${style["manage-Promotions"]} ${
        loading ? style["loading"] : ""
      }`}
    >
      {loading && (
        <div className={style["loading-overlay"]}>
          <div className={style["spinner"]}></div>
        </div>
      )}
      <h2>QUẢN LÝ ƯU ĐÃI</h2>
      <div className={style["button-container"]}>
        <button
          onClick={handleAddDiscount}
          className={style["add-discount-button"]}
        >
          Tạo ưu đãi mới <FontAwesomeIcon icon={faPlus} />
        </button>
      </div>
      {/* Kiểm tra nếu không có ưu đãi */}
      {Promotions.length === 0 ? (
        <div className={style["no-promotions"]}>
          <p>Chưa có ưu đãi nào, hãy tạo mới ưu đãi!</p>
        </div>
      ) : (
        <div className={style["discount-cards"]}>
          {Promotions.map((discount) => (
            <div key={discount.code} className={style["discount-card"]}>
              <img
                src={discount.image}
                alt={discount.title}
                className={style["discount-image"]}
              />
              <h3 className={style["discount-code"]}>{discount.code}</h3>
              <div className={style["button-group"]}>
                <div className={style["tooltip-container"]}>
                  <button
                    onClick={() => handleEdit(discount.code)}
                    className={style["edit-button"]}
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                  <span className={style["tooltip"]}>Chỉnh sửa</span>
                </div>
                <div className={style["tooltip-container"]}>
                  <button
                    onClick={() => handleDelete(discount.code)}
                    className={style["delete-button"]}
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

export default ManagePromotions;
