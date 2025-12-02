import React, {useContext }from "react";
import style from "./Footer.module.css";
import { Link } from "react-router-dom";
import { RestaurantContext } from "../../../Config/RestaurantContext";

function Footer() {
  const { restaurantInfo, loading, error, setRestaurantInfo } = useContext(RestaurantContext);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!restaurantInfo) return <p>No restaurant info available.</p>; // Xử lý nếu dữ liệu trống

  return (
    <footer className={style["site-footer"]} id="contact">
      <div className={style["top-footer"] + " " + style["section"]}>
        <div className={style["sec-wp"]}>
          <div className={style["container"]}>
            <div className={style["footer-flex-box"]}>
              {/* Logo & Social Icons */}
              <div className={style["footer-info"]}>
                <div className={style["footer-logo"]}>
                  <Link to="/">
                    <img
                      src="/assets/images/logo.jpg"
                      alt="Home"
                    />
                  </Link>
                </div>
                <div className={style["social-icon"]}>
                  <ul>
                    <li>
                      <a href={restaurantInfo.social.facebook}>
                        <i className="uil uil-facebook-f"></i>
                      </a>
                    </li>
                    <li>
                      <a href={restaurantInfo.social.instagram}>
                        <i className="uil uil-instagram"></i>
                      </a>
                    </li>
                    <li>
                      <a href={restaurantInfo.social.youtube}>
                        <i className="uil uil-youtube"></i>
                      </a>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Open Hours */}
              <div
                className={
                  style["footer-table-info"] + " " + style["footer-open"]
                }
              >
                <h3 className={style["h3-title"]}>Open Hours</h3>
                <ul>
                  <li>
                    <i className="uil uil-clock"></i> Mon-Thurs : {restaurantInfo.onweek_openhour}-{restaurantInfo.onweek_closehour}
                  </li>
                  <li>
                    <i className="uil uil-clock"></i> Fri-Sun : {restaurantInfo.weekend_openhour}-{restaurantInfo.weekend_closehour}
                  </li>
                </ul>
              </div>

              {/* Links */}
              <div
                className={style["footer-menu"] + " " + style["footer-links"]}
              >
                <h3 className={style["h3-title"]}>Links</h3>
                <ul>
                  <li>
                    <Link to="/about">Giới Thiệu</Link>
                  </li>
                  <li>
                    <Link to="/menu">Thực Đơn</Link>
                  </li>
                  <li>
                    <Link to="/reservation">Đặt Bàn</Link>
                  </li>
                  <li>
                    <Link to="/promotion">Khuyến Mãi</Link>
                  </li>
                  <li>
                    <Link to="/review">Đánh giá</Link>
                  </li>
                </ul>
              </div>

              {/* Contact Us */}
              <div className={style["footer-menu"]}>
                <h3 className={style["h3-title"]}>Contact Us</h3>
                <ul>
                  <li>
                    <a
                      href={restaurantInfo.google_map}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <i className="uil uil-location-point"></i>
                      {restaurantInfo.address}
                    </a>
                  </li>
                  <li>
                    <a href={`tel:${restaurantInfo.phone}`}>
                      <i className="uil uil-phone"></i>
                      {restaurantInfo.phone}
                    </a>
                  </li>
                  <li>
                    <a href={`mailto:${restaurantInfo.email}`}>
                      <i className="uil uil-envelope"></i>
                      {restaurantInfo.email}
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={style["bottom-footer"]}>
        <div className={style["container"]}>
          <div className={style["text-center"]}>
            <div className={style["copyright-text"]}>
              <p>
                Copyright &copy; 2024{" "}
                <span className={style["name"]}>{restaurantInfo.name}.</span> All Rights
                Reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
