import React,{useContext} from "react";
import { useNavigate } from "react-router-dom";
import { useRef, useEffect } from "react";
import style from "./HomePage.module.css";
import { RestaurantContext } from "../../../Config/RestaurantContext";


function HomePage() {
  
  const { restaurantInfo, loading, error } = useContext(RestaurantContext);
  const navigate = useNavigate(); // Khởi tạo hook useNavigate

  const handleNavigate = () => {
    navigate("/menu"); // Điều hướng đến trang menu
  };

  const bgImg = useRef([]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      const { innerWidth, innerHeight } = window;
      const x = e.clientX / innerWidth - 0.5; // Tỷ lệ từ -0.5 đến 0.5
      const y = e.clientY / innerHeight - 0.5;

      bgImg.current.forEach((layer, index) => {
        const depth = layer.dataset.depth; // Lấy giá trị data-depth
        const translateX = x * 50 * depth;
        const translateY = y * 50 * depth;
        // Thay đổi transform của hình ảnh qua ref
        if (layer) {
          layer.style.transform = `translate(${translateX}px, ${translateY}px)`;
        }
      });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!restaurantInfo) return <p>No restaurant info available.</p>; // Xử lý nếu dữ liệu trống
  
  return (
    <div className={style["viewport"]}>
      <div className={style["scroll-content"]}>
        <section className={style["main-banner"]}>
          <div className={style["js-parallax-scene"]}>
            <div className={style["banner-shape-1"]}>
              <img
                ref={(el) => (bgImg.current[0] = el)}
                data-depth="0.3"
                src="assets/images/berry.png"
                alt=""
              />
            </div>
            <div className={style["banner-shape-2"]}>
              <img
                ref={(el) => (bgImg.current[1] = el)}
                data-depth="0.25"
                src="assets/images/leaf.png"
                alt=""
              />
            </div>
          </div>
          <div className={style["row"]}>
            <div className={style["col-lg-6"]}>
              <div className={style["banner-text"]}>
                <div>
                  <h1>
                    Welcome To <span>Citrus Royale</span> Restaurant.
                  </h1>
                </div>
                <div className={style["banner-btn"]}>
                  <button
                    onClick={handleNavigate}
                    className={style["cta-button"]}
                  >
                    Check Our Menu
                  </button>
                </div>
              </div>
            </div>
            <div className={style["col-lg-6"]}>
              <div className={style["banner-img-container"]}>
                <img
                  className={style["banner-img"]}
                  src="/assets/images/main-b.jpg"
                  alt="Sushi"
                />
                <div className={style["banner-img-text"]}>
                  <h5 className={style["h5-title"]}>Sushi</h5>
                  <p className={style["img-text"]}>
                    this is Lorem ipsum dolor sit amet consectetur adipisicing
                    elit.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default HomePage;
