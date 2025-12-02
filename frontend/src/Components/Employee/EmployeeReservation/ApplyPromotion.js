import React, { useEffect, useState } from "react";
import { useAuth } from "../../Auth/AuthContext";
import { isTokenExpired } from "../../../utils/tokenHelper.mjs";
import { refreshToken } from "../../../API/authAPI";
import style from "./ApplyPromotion.module.css";
import { addPromotion, fetchValidPromotions } from "../../../API/PromotionAPI";
import { IoAdd, IoRemove } from "react-icons/io5";
import {
  addPromotionToInvoice,
  checkPhoneNumber,
} from "../../../API/EE_ReservationAPI";
import { useNavigate } from "react-router-dom";

function ApplyPromotion({ setShow, setInvoice, invoice }) {
  const navigate = useNavigate();
  const { accessToken, setAccessToken } = useAuth();
  const [promotionData, setPromotionData] = useState([{ isSelected: false }]);
  const [choosenPromotion, setChoosenPromotion] = useState({ code: null });
  const [canSelected, setCanSelected] = useState(true);
  const [errorMessage, setErrorMessage] = useState();
  const [successMessage, setSuccessMessage] = useState();
  const [phoneNum, setPhoneNum] = useState();
  const ensureActiveToken = async () => {
    const refresh = localStorage.getItem("refreshToken");
    if (!refresh || isTokenExpired(refresh)) {
              navigate('/', { replace: true });
              window.location.reload();
              throw 'Phiên đăng nhập hết hạn';
            }
    let activeToken = accessToken;

    if (!accessToken || isTokenExpired(accessToken)) {
      const refreshed = await refreshToken(refresh);
      activeToken = refreshed.access;
      setAccessToken(activeToken);
    }
    return activeToken;
  };

  function sortPromotions(promotions) {
    return promotions.sort((a, b) => {
      // So sánh theo loại (KMT trước KMTV)
      if (a.type !== b.type) {
        return a.type === "KMT" ? -1 : 1;
      }
      // Nếu cùng loại, sắp xếp theo ngày hết hạn (enddate)
      const dateA = new Date(a.enddate);
      const dateB = new Date(b.enddate);
      return dateA - dateB;
    });
  }

  const fetchData = async () => {
    try {
      const data = await fetchValidPromotions();
      let updateData;
      if (invoice.promotion) {
        setCanSelected(false);
        const tempPromotion = {code: invoice.promotion}
        setChoosenPromotion(tempPromotion);
        updateData = data.map((item) => ({ ...item, isSelected: item.code === invoice.promotion, }));
      }
      else {
        updateData = data.map((item) => ({ ...item, isSelected: false, }));
      }
      setPromotionData(sortPromotions(updateData));
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);

  const handleAddPromotion = (promotion) => {
    if (promotion.isSelected) {
      setChoosenPromotion({ code: null });
      setCanSelected(true);
      setPromotionData((preItem) =>
        preItem.map((i) =>
          i.code === promotion.code ? { ...i, isSelected: false } : i
        )
      );
    } else {
      setChoosenPromotion(promotion);
      setCanSelected(false);
      setPromotionData((preItem) =>
        preItem.map((i) =>
          i.code === promotion.code ? { ...i, isSelected: true } : i
        )
      );
    }
  };

  const handleDisable = (promotion) => {
    if (!canSelected && promotion.code !== choosenPromotion.code) {
      return true;
    }
    return false;
  };

  const handleSavePromotion = async (number) => {
    try {
      const activeToken = await ensureActiveToken();
      if (choosenPromotion.type === "KMTV") {
        const checkPhoneNum = await checkPhoneNumber(activeToken, number);
      }
      const newInvoice = await addPromotionToInvoice(
        activeToken,
        invoice.id,
        choosenPromotion.code
      );
      setInvoice(newInvoice.data);
      setErrorMessage();
      if (choosenPromotion.code === null) {
        setSuccessMessage("Hủy khuyến mãi thành công");
      } else {
        setSuccessMessage("Áp dụng khuyến mãi thành công");
      }
    } catch (error) {
      console.log(error);
      setSuccessMessage();
      if (error.response.data.status === "error") {
        setErrorMessage("Vui lòng nhập số điện thoại khi sử dụng KMTV");
      } else if (error.response.data.status === "invalid") {
        setErrorMessage("Số điện thoại không hợp lệ");
      } else if (error.response.data.status === "not_exists") {
        setErrorMessage("Số điện thoại không tồn tại");
      } else if (error.response.data.status === "not_meet_requirement") {
        setErrorMessage("Hóa đơn không đủ điều kiện");
      }
      else if (error.response.status === 404) {
        setErrorMessage('Không tìm thấy hóa đơn');
      }
      else {
        setErrorMessage("Có lỗi xảy ra không thể sử dụng khuyễn mãi");
      }
    }
  };

  return (
    <div className={style["ctn"]}>
      <div className={style["container"]}>
        <div className={style["promotion-ctn"]}>
          <div className={style["row"]}>
            <div className={style["col-lg-12"]}>
              <div className={style["close-ctn"]}>
                <button
                  className={style["close-modal"]}
                  onClick={() => setShow(false)}
                >
                  &times;
                </button>
              </div>
              <div></div>
              <div className={style["promotion-list"]}>
                <h2>Khuyến mãi</h2>
                <p>Danh sách các khuyến mãi</p>
                <div className={style["promotion-table"]}>
                  <div
                    className={style["my-row"] + " " + style["my-title-row"]}
                    key="-9999"
                  >
                    <ul>
                      <li className={style["my-col-1"]}>Mã KH</li>
                      <li className={style["my-col-2"]}>Tên khuyến mãi</li>
                      <li className={style["my-col-3"]}>Loại</li>
                      <li className={style["my-col-4"]}>Giảm giá (%)</li>
                      <li className={style["my-col-5"]}>Điều kiện</li>
                    </ul>
                  </div>
                  {promotionData.map((item) => (
                    <div
                      className={
                        style["my-row"] +
                        " " +
                        style[handleDisable(item) ? "row-inactive" : ""] + ' ' +style['point-input']
                      }
                      key={item.code}
                      onClick={() => {if(!handleDisable(item)){handleAddPromotion(item) } }}
                    >
                      <ul >
                        <li className={style["my-col-1"]}>{item.code}</li>
                        <li className={style["my-col-2"]}>{item.title}</li>
                        <li className={style["my-col-3"]}>{item.type}</li>
                        <li className={style["my-col-4"]}>{item.discount}</li>
                        <li className={style["my-col-5"]}>{item.min_order}</li>
                        <li className={style["add-button"]}>
                          <label>
                            <input
                              type="checkbox"
                              checked={item.isSelected}
                              disabled={handleDisable(item)}
                              onChange={() => handleAddPromotion(item)}
                            ></input>
                          </label>
                        </li>
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className={style["col-lg-12"]}>
              <div className={style["sdt-input"]}>
                <label for="sdt">SĐT đăng ký tài khoản:</label>
                <input type="text" name="sdt" id="sdt" onChange={(e) => setPhoneNum(e.target.value)}></input>
              </div>
            </div>
            <div className={style["col-lg-12"]}>
              <div className={style["error-ctn"]}>
                {errorMessage ? (
                  <p className={style["error"]}>{errorMessage}</p>
                ) : (
                  <p></p>
                )}
                {successMessage ? (
                  <p className={style["success"]}>{successMessage}</p>
                ) : (
                  <p></p>
                )}
              </div>
              <div className={style["btn-ctn"]}>
                <button
                  className={style["my-btn"]}
                  onClick={() => handleSavePromotion(phoneNum)}
                >
                  Lưu
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ApplyPromotion;
