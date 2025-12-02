import React, { useEffect, useState } from "react";
import { useAuth } from "../../Auth/AuthContext";
import { isTokenExpired } from "../../../utils/tokenHelper.mjs";
import { refreshToken } from "../../../API/authAPI";
import style from "./ExportInvoice.module.css";
import QRCodeGenerator from "../../Customer/QRReview";
import {
  fetchPromotionByCode,
  fetchPromotions,
} from "../../../API/PromotionAPI";
import { markPaid } from "../../../API/EE_ReservationAPI";
import SuccessMessage from "./SuccessMessage";
import { QRCodeSVG } from "qrcode.react";

function ExportInvoice({
  setShow,
  foodData,
  invoiceData,
  pID,
  iID,
  setShowInvoice,
}) {
  const { accessToken, setAccessToken } = useAuth();
  const [promotion, setPromotion] = useState({
    code: null,
    title: null,
    type: null,
    min_order: null,
    enddate: null,
  });
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState();
  const momoQRUrl = `https://momo.vn/qr/${invoiceData?.id || "defaultID"}`;
  const NumberWithSpaces = ({ number }) => {
    const formattedNumber = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
      .format(number)
      .replace(/,/g, " ");

    return <p>{formattedNumber} .VNĐ</p>;
  };
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

  const fetchData = async () => {
    try {
      const data = await fetchPromotions();
      const filteredData = data.filter((item) => item.code === pID);
      setPromotion(filteredData[0]);
      setErrorMessage();
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePay = async () => {
    try {
      const activeToken = await ensureActiveToken();
      await markPaid(activeToken, iID);
      setSuccess(true);
    } catch (error) {
      if (error.status === 404) {
        setErrorMessage("Lỗi kết nối với server");
      } else if (
        error.response.data.message ===
        "Cannot mark order as paid because there are items are preparing"
      ) {
        setErrorMessage("Không thể thanh toán vì có món đang phục vụ");
      }
    }
  };
  const handlePrint = () => {
    window.print(); // Thực hiện in
  };

  return (
    <div className={style["ctn"]}>
      <div className={style["container"]}>
        <div className={style["export-invoice-ctn"]}>
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
              <div className={style["title"]}>
                <h2>Hóa đơn</h2>
              </div>
              <div className={style["order-food-ctn"]}>
                <h4>Danh sách các món ăn</h4>
                <div className={style["table-food"]}>
                  <div
                    className={style["my-row"] + " " + style["my-title-row"]}
                  >
                    <ul>
                      <li className={style["food-col-1"]}>Tên món ăn</li>
                      <li className={style["food-col-2"]}>Số lượng</li>
                      <li className={style["food-col-3"]}>Tổng tiền</li>
                    </ul>
                  </div>
                  {foodData.map((item) => (
                    <div className={style["content-row-section"]} key={item.id}>
                      <article
                        className={
                          style["my-row"] + " " + style["my-content-row"]
                        }
                      >
                        <ul>
                          <li className={style["food-col-1"]}>
                            {item.menu_item_details.name}
                          </li>
                          <li className={style["food-col-2"]}>
                            {item.quantity}
                          </li>
                          <li className={style["food-col-3"]}>
                            {item.total} .VNĐ
                          </li>
                        </ul>
                      </article>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4>Khuyến mãi</h4>
                <div className={style["promotion-table"]}>
                  <div
                    className={style["my-row"] + " " + style["my-title-row"]}
                  >
                    <ul>
                      <li className={style["my-col-1"]}>Mã KH</li>
                      <li className={style["my-col-2"]}>Tên khuyến mãi</li>
                      <li className={style["my-col-3"]}>Loại</li>
                      <li className={style["my-col-4"]}>Ngày kết thúc</li>
                      <li className={style["my-col-5"]}>Điều kiện</li>
                    </ul>
                  </div>
                  {promotion && (
                    <div className={style["my-row"]}>
                      <ul>
                        <li className={style["my-col-1"]}>{promotion.code}</li>
                        <li className={style["my-col-2"]}>{promotion.title}</li>
                        <li className={style["my-col-3"]}>{promotion.type}</li>
                        <li className={style["my-col-4"]}>
                          {promotion.enddate}
                        </li>
                        <li className={style["my-col-5"]}>
                          {promotion.min_order} .VNĐ
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              <div className={style["row"]}>
                <div className={style["col-lg-6"]}>
                  <div className={style["total-money-ctn"]}>
                    <div className={style["width-100"]}>
                      <div className={style["money-format"]}>
                        <label>Tổng tiền:</label>
                        <NumberWithSpaces
                          number={invoiceData.total_price}
                        ></NumberWithSpaces>
                      </div>
                      <div className={style["money-format"]}>
                        <label>Ưu đãi:</label>
                        <NumberWithSpaces
                          number={invoiceData.total_discount}
                        ></NumberWithSpaces>
                      </div>
                      <div
                        className={
                          style["money-format"] + " " + style["final_price"]
                        }
                      >
                        <label>Tổng thanh toán:</label>
                        <NumberWithSpaces
                          number={invoiceData.final_price}
                        ></NumberWithSpaces>
                      </div>
                    </div>
                  </div>
                </div>
                <div className={style["col-lg-6"]}>
                  <div>
                    <QRCodeGenerator
                      invoiceID={invoiceData.id}
                    ></QRCodeGenerator>
                  </div>
                  <div className={style["momo-qr"]}>
                    <h4>Chuyển khoản MoMo</h4>
                    <QRCodeSVG value={momoQRUrl} size={200} />
                  </div>
                </div>
              </div>
              <div className={style["col-lg-12"]}>
                <div className={style["error-ctn"]}>
                  {errorMessage ? (
                    <p className={style["error"]}>{errorMessage}</p>
                  ) : (
                    <p></p>
                  )}
                </div>
                <div className={style["btn-ctn"]}>
                  <button
                    className={style["my-btn"]}
                    onClick={() => handlePay()}
                  >
                    Thanh toán
                  </button>
                  <button
                    className={style["my-btn"]}
                    onClick={() => handlePrint()}
                  >
                    In hóa đơn
                  </button>
                </div>
              </div>
            </div>
            <SuccessMessage
              setShow={setSuccess}
              setShowExInvoice={setShow}
              setShowInvoice={setShowInvoice}
            ></SuccessMessage>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExportInvoice;
