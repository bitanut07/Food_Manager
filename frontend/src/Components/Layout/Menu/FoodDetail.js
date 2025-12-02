import React, { useState, useEffect } from "react";
import style from "./FoodDetail.module.css";
import { useParams, useNavigate } from "react-router-dom";
import { getFoodItemByID } from "../../../API/MenuAPI";
import { addToCart } from "../../../API/CartAPI";
import { FaShoppingCart, FaMinus, FaPlus, FaCheck } from "react-icons/fa";

function FoodDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [food, setFood] = useState({
    name: "",
    description: "",
    price: 0,
    displayImage: "/assets/images/menu.jpg",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  useEffect(() => {
    const loadFoodDetail = async () => {
      setLoading(true);
      try {
        const data = await getFoodItemByID(id);
        if (data) {
          setFood({
            ...data,
            displayImage:
              data.thumbnail || data.images?.[0] || "/assets/images/menu.jpg",
          });
        }
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    loadFoodDetail();
  }, [id]);

  const formatPrice = (price) => {
    if (price === undefined || price === null) {
      return "Liên hệ";
    }
    return `${Number(price).toLocaleString("vi-VN")} VND`;
  };

  const handleQuantityChange = (delta) => {
    setQuantity((prev) => Math.max(1, prev + delta));
  };

  const handleAddToCart = async () => {
    // Kiểm tra đăng nhập
    if (!isLoggedIn) {
      // Lưu trang hiện tại để redirect sau khi đăng nhập
      navigate("/login", { state: { from: `/menu/${id}` } });
      return;
    }

    try {
      setAddingToCart(true);
      await addToCart(parseInt(id), quantity);
      setAddedToCart(true);
      
      // Dispatch event để Header cập nhật cart count
      window.dispatchEvent(new Event("cartUpdated"));
      
      // Reset trạng thái sau 2 giây
      setTimeout(() => {
        setAddedToCart(false);
      }, 2000);
    } catch (err) {
      console.error("Lỗi thêm vào giỏ hàng:", err);
      alert("Không thể thêm vào giỏ hàng. Vui lòng thử lại.");
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <div
      className={`${style["food-detail-container"]} ${
        loading ? style["loading"] : ""
      }`}
    >
      {loading && (
        <div className={style["loading-overlay"]}>
          <div className={style["spinner"]}></div>
        </div>
      )}
      {error && (
        <p className={style["error-message"]}>
          Không thể tải thông tin món ăn. Vui lòng thử lại.
        </p>
      )}
      <div className={style["food-image"]}>
        <img src={food.displayImage} alt={food.name} />
      </div>
      <div className={style["food-info"]}>
        <h1 className={style["food-name"]}>{food.name}</h1>
        <hr className={style["divider"]} />
        <p className={style["food-description"]}>{food.description}</p>
        <hr className={style["divider"]} />
        <div className={style["food-price"]}>{formatPrice(food.price)}</div>
        
        {/* Quantity selector and Add to cart button */}
        <div className={style["add-to-cart-section"]}>
          <div className={style["quantity-selector"]}>
            <button 
              className={style["qty-btn"]}
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
            >
              <FaMinus />
            </button>
            <span className={style["qty-value"]}>{quantity}</span>
            <button 
              className={style["qty-btn"]}
              onClick={() => handleQuantityChange(1)}
            >
              <FaPlus />
            </button>
          </div>
          
          <button 
            className={`${style["add-to-cart-btn"]} ${addedToCart ? style["added"] : ""}`}
            onClick={handleAddToCart}
            disabled={addingToCart || addedToCart}
          >
            {addedToCart ? (
              <>
                <FaCheck /> Đã thêm vào giỏ
              </>
            ) : addingToCart ? (
              "Đang thêm..."
            ) : (
              <>
                <FaShoppingCart /> Thêm vào giỏ hàng
              </>
            )}
          </button>
        </div>

        <button 
          className={style["view-cart-btn"]}
          onClick={() => navigate("/cart")}
        >
          Xem giỏ hàng
        </button>
      </div>
    </div>
  );
}

export default FoodDetail;
