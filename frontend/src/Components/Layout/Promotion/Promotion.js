import React, { useState, useEffect } from "react";
import style from "./Promotion.module.css";
import { useNavigate } from "react-router-dom";
import { fetchValidPromotions } from "../../../API/PromotionAPI";
import { FaTag, FaPercent, FaTicketAlt } from "react-icons/fa";

function Promotion() {
  const [promotions, setPromotions] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadPromotions = async () => {
      setLoading(true);
      try {
        const data = await fetchValidPromotions();
        setPromotions(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    loadPromotions();
  }, []);

  const formatPrice = (price) => {
    if (price === undefined || price === null) return "0 VND";
    return `${Number(price).toLocaleString("vi-VN")} VND`;
  };

  return (
    <div
      className={`${style["promotions-container"]} ${
        loading ? style["loading"] : ""
      }`}
    >
      {loading && (
        <div className={style["loading-overlay"]}>
          <div className={style["spinner"]}></div>
        </div>
      )}
      <div className={style["content"]}>
        <div className={style["title-row"]}>
          <h1>
            <FaTicketAlt /> Khuyến mãi
          </h1>
        </div>
        <div className={style["image"]}>
          <img
            src="assets/images/chuong-trinh-khuyen-mai-trong-kinh-doanh-scaled.jpg"
            alt="Khuyến mãi"
          />
        </div>
        {error ? (
          <div className={style["error-message"]}>
            <p>
              Có lỗi xảy ra:{" "}
              {error.response ? error.response.data : error.message}
            </p>
          </div>
        ) : !loading && promotions.length === 0 ? (
          <div className={style["no-promotions-message"]}>
            <FaTicketAlt className={style["no-promotions-icon"]} />
            <p>Oops... Hiện tại chưa có khuyến mãi!</p>
          </div>
        ) : (
          <div className={style["promotions-list"]}>
            {promotions.map((promotion) => (
              <div
                key={promotion.id || promotion.code}
                className={style["promotion-card"]}
                onClick={() => navigate(`/promotion/${promotion.code}`)}
              >
                {promotion.image ? (
                  <img
                    src={promotion.image}
                    alt={promotion.code}
                    className={style["promotion-image"]}
                  />
                ) : (
                  <div className={style["promotion-placeholder"]}>
                    <FaTicketAlt />
                  </div>
                )}
                <div className={style["promotion-content"]}>
                  <div className={style["promotion-code-badge"]}>
                    <FaTag /> {promotion.code}
                  </div>
                  <h3 className={style["promotion-title"]}>
                    {promotion.description || promotion.code}
                  </h3>
                  <div className={style["promotion-discount"]}>
                    <FaPercent />
                    <span>
                      {promotion.discount_type === "percent"
                        ? `Giảm ${promotion.discount_value}%`
                        : `Giảm ${formatPrice(promotion.discount_value)}`}
                    </span>
                  </div>
                  {promotion.min_order > 0 && (
                    <p className={style["promotion-condition"]}>
                      Đơn tối thiểu: {formatPrice(promotion.min_order)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Promotion;
