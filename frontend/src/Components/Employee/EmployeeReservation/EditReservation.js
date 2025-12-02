import React, { useEffect, useState } from "react";
import { useAuth } from "../../Auth/AuthContext";
import { isTokenExpired } from "../../../utils/tokenHelper.mjs";
import { refreshToken } from "../../../API/authAPI";
import style from "./EditReservation.module.css";
import {
  fetchReservationDataByPhoneNumber,
  getReservationByNumber,
  patchReservation,
} from "../../../API/EE_ReservationAPI";
import {
  AddBookingTable,
  GetBookingTableByPhone,
} from "../../../API/BookingTableApi";
import { ModalGeneral } from "../../ModalGeneral";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationTriangle, faL } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { RestaurantContext } from "../../../Config/RestaurantContext";

function EditReservation({ setShow, info }) {
  const [bookingInfo, setBookingInfo] = useState(info);
  const { accessToken, setAccessToken } = useAuth();
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(now.getDate()).padStart(2, "0")}`;
  const [rData, setRData] = useState();
  const [phoneNumber, setPhoneNumber] = useState(""); // Số điện thoại
  const [islogin, setIslogin] = useState(false);
  const [errorMessage, setErrorMessage] = useState();
  const navigate = useNavigate();

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

  const validatePhoneNumber = (phone) => {
    if (phone.length === 0) {
      return false;
    }
    if (!/^[0-9]+$/.test(phone)) {
      return false;
    }
    if (phone.length !== 10) {
      return false;
    }
    if (!/^0/.test(phone)) {
      return false;
    }
    return true; // Hợp lệ
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e) => {
    const email = e.target.value;

    // Gọi hàm kiểm tra số điện thoại
    const errorbooking = validateEmail(email);

    if (!errorbooking) {
      setErrorMessage("Email không hợp lệ");
    } else {
      setErrorMessage();
    }
    setBookingInfo((prevInfo) => ({ ...prevInfo, email: email }));
  };

  const handlePhoneChange = (e) => {
    const phone = e.target.value;

    // Gọi hàm kiểm tra số điện thoại
    const errorbooking = validatePhoneNumber(phone);

    if (errorbooking) {
      setErrorMessage(errorbooking); // Cập nhật lỗi
    } else {
      setErrorMessage(); // Xóa lỗi nếu hợp lệ
    }
    setBookingInfo((prevInfo) => ({ ...prevInfo, phone_number: phone }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!validatePhoneNumber(bookingInfo.phone_number)) {
        setErrorMessage("Số điện thoại không hợp lệ");
        return;
      } else if (!validateEmail(bookingInfo.email)) {
        setErrorMessage("Email không hợp lệ");
        return;
      }
      const activeToken = await ensureActiveToken();
      const data = await patchReservation(
        activeToken,
        bookingInfo.id,
        bookingInfo
      );
      setBookingInfo(data);
      window.location.reload();
    } catch (error) {
      console.log(error);
      if (error.response.data.time) {
        setErrorMessage("Thời gian phải lớn hơn thời gian hiện tại");
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingInfo((prevInfo) => ({ ...prevInfo, [name]: value }));
  };

  return (
    <div className={style["ctn"]}>
      <div className={style["container"]}>
        <div className={style["edit-invoice-ctn"]}>
          <div className={style["row"]}>
            <div className={style["col-lg-12"]}>
              <div className={style["close-ctn"]}>
                <button
                  className={style["close-modal"]}
                  onClick={() => setShow()}
                >
                  &times;
                </button>
              </div>
              <div className={style["booking-form-container"]}>
                <h2>Thông tin đặt bàn</h2>

                <form onSubmit={handleSubmit}>
                  <label>
                    Số điện thoại:
                    <input
                      type="text"
                      name="phone_number"
                      value={bookingInfo.phone_number}
                      onChange={handleInputChange}
                      required
                    />
                  </label>

                  <label>
                    Họ và Tên:
                    <input
                      type="text"
                      name="guest_name"
                      value={bookingInfo.guest_name}
                      onChange={handleInputChange}
                      required
                    />
                  </label>
                  <label>
                    Email:
                    <input
                      type="text"
                      name="email"
                      value={bookingInfo.email}
                      onChange={handleInputChange}
                      required
                    />
                  </label>
                  <label>
                    Ngày đến:
                    <input
                      type="date"
                      name="date"
                      value={bookingInfo.date}
                      onChange={(e) => {
                        handleInputChange({
                          target: { name: "date", value: e.target.value },
                        });
                      }}
                      min={today}
                      required
                    />
                  </label>
                  <label>
                    Thời gian:
                    <input
                      type="time"
                      name="time"
                      value={bookingInfo.time}
                      onChange={handleInputChange}
                      required
                    />
                  </label>
                  <label>
                    Số khách:
                    <input
                      type="number"
                      name="number_of_guests"
                      value={bookingInfo.number_of_guests}
                      onChange={handleInputChange}
                      min="1"
                      required
                    />
                  </label>
                  <label>
                    Ghi chú:
                    <textarea
                      name="note"
                      value={bookingInfo.note}
                      onChange={handleInputChange}
                    />
                  </label>
                  <div className={style["error-ctn"]}>
                    {errorMessage ? (
                      <p className={style["errorbooking-message"]}>
                        {errorMessage}
                      </p>
                    ) : (
                      <p></p>
                    )}
                  </div>
                  <button type="submit">Lưu</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditReservation;
