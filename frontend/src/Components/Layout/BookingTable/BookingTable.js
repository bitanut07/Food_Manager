import React, { useState, useEffect, useContext } from "react";
import { GetInfoCus, GetEmailCus } from "../../../API/FixInfoAPI";
import { isTokenExpired } from "../../../utils/tokenHelper.mjs";
import { refreshToken } from "../../../API/authAPI";
import style from "./BookingTable.module.css";
import {
  AddBookingTable,
  GetBookingTableByPhone,
} from "../../../API/BookingTableApi";
import { ModalGeneral } from "../../ModalGeneral";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { RestaurantContext } from "../../../Config/RestaurantContext";

function BookingTable() {
  const { restaurantInfo, loading, error, setRestaurantInfo } =
    useContext(RestaurantContext);
  const [isLoading, setIsLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(""); // Số điện thoại
  const [islogin, setIslogin] = useState(false);
  const [bookingInfo, setBookingInfo] = useState({
    guest_name: "",
    email: "",
    date: "",
    time: "",
    phone_number: "",
    number_of_guests: 1,
    note: "",
  });

  const [openingHours, setOpeningHours] = useState({
    open: "8:00", // Giá trị mặc định
    close: "23:00", // Giá trị mặc định
  });

  // Cập nhật `openingHours` sau khi `restaurantInfo` sẵn sàng
  useEffect(() => {
    if (restaurantInfo) {
      const dayOfWeek = new Date(bookingInfo.date || new Date()).getDay(); // Ngày hiện tại hoặc ngày đặt
      const hours = getOpeningHours(dayOfWeek);
      setOpeningHours(hours);
    }
  }, [restaurantInfo, bookingInfo.date]);

  const navigate = useNavigate();
  let userName;
  let userPhone;
  let userEmail;

  const [modal, setModal] = useState({
    isOpen: false,
    text: "",
    type: "", // "confirm" hoặc "success"
    onConfirm: null, // Hàm được gọi khi xác nhận
  });
  const [errorbooking, seterrorbooking] = useState("");
  const [loadingbooking, setloadingbooking] = useState(false); // loadingbooking trạng thái
  const UserID = localStorage.getItem("userId");

  useEffect(() => {
    const accountType = localStorage.getItem("accountType");
    if (accountType) {
      setIslogin(true);
    } else {
      setIslogin(false);
    }
  }, []);

  useEffect(() => {
    if (islogin) {
      checkLoginStatus();
    }
  }, [islogin]);

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(now.getDate()).padStart(2, "0")}`;
  useEffect(() => {
    setBookingInfo((prevInfo) => ({
      ...prevInfo,
      date: prevInfo.date || today, // Đặt ngày mặc định là hôm nay nếu chưa có giá trị
    }));
  }, []);

  const ensureActiveToken = async () => {
    const refresh = localStorage.getItem("refreshToken");
    if (!refresh || isTokenExpired(refresh)) {
      navigate("/", { replace: true });
      window.location.reload();
      throw "Phiên đăng nhập hết hạn";
    }
    let activeToken = localStorage.getItem("accessToken");

    if (isTokenExpired(activeToken)) {
      const refreshed = await refreshToken(refresh);
      activeToken = refreshed.access;
      localStorage.setItem("accessToken", activeToken);
    }
    return activeToken;
  };

  const checkLoginStatus = async () => {
    setIsLoading(true);
    try {
      const token = await ensureActiveToken();
      const responseIn4 = await GetInfoCus(UserID, token); // Lấy thông tin người dùng từ API
      const responseEmail = await GetEmailCus(UserID, token); // Lấy email người dùng từ API

      if (responseIn4 && responseEmail) {
        userPhone = responseIn4.phone_number;
        userName = responseIn4.full_name;
        userEmail = responseEmail.email;

        // Nếu người dùng có số điện thoại, tự động điền vào form
        if (userPhone) {
          setPhoneNumber(userPhone);
          setBookingInfo((prevInfo) => ({
            ...prevInfo,
            phone_number: userPhone,
            guest_name: userName,
            email: userEmail,
          }));

          // Kiểm tra thông tin đặt bàn qua số điện thoại
          fetchBookingData(userPhone, userName);
        } else {
          // Không có số điện thoại, cho phép người dùng tự nhập
          setBookingInfo((prevInfo) => ({
            ...prevInfo,
            guest_name: userName, // Chỉ điền tên
            email: userEmail,
          }));
        }
      }
    } catch (err) {
      // Nếu xảy ra lỗi (ví dụ: người dùng chưa đăng nhập), để trống thông tin
      setPhoneNumber("");
      setBookingInfo((prevInfo) => ({
        ...prevInfo,
        phone_number: "",
        guest_name: "",
        email: "",
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const validatePhoneNumber = (phone) => {
    if (phone.length === 0) {
      return "Số điện thoại không được để trống.";
    }
    if (!/^[0-9]+$/.test(phone)) {
      return "Số điện thoại chỉ được chứa chữ số.";
    }
    if (phone.length !== 10) {
      return "Số điện thoại phải đủ 10 chữ số.";
    }
    if (!/^0/.test(phone)) {
      return "Số điện thoại không hợp lệ.";
    }
    return null; // Hợp lệ
  };

  const fetchBookingData = async (phone, name) => {
    if (!phone) return;
    setIsLoading(true);
    try {
      const response = await GetBookingTableByPhone(phone);
      if (response) {
        // Load thông tin đặt bàn nếu có
        setBookingInfo({
          guest_name: response.guest_name,
          date: today,
          time: "",
          email: response.email,
          phone_number: phone,
          number_of_guests: response.number_of_guests,
          note: response.note,
        });
      } else {
        // Nếu không có thông tin đặt bàn, giữ nguyên thông tin người dùng
        setBookingInfo((prevInfo) => ({
          ...prevInfo,
          phone_number: phone,
          guest_name: name,
        }));
      }
    } catch (err) {
      // Nếu không có thông tin đặt bàn, giữ nguyên thông tin người dùng
      setBookingInfo((prevInfo) => ({
        ...prevInfo,
        phone_number: phone,
        guest_name: name,
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneChange = (e) => {
    const phone = e.target.value;

    // Gọi hàm kiểm tra số điện thoại
    const errorbooking = validatePhoneNumber(phone);

    if (errorbooking) {
      seterrorbooking(errorbooking); // Cập nhật lỗi
    } else {
      seterrorbooking(""); // Xóa lỗi nếu hợp lệ
    }

    setPhoneNumber(phone);

    if (!errorbooking && phone.trim() !== "") {
      fetchBookingData(phone, bookingInfo.guest_name); // Tải dữ liệu đặt bàn qua số điện thoại mới
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingInfo((prevInfo) => ({ ...prevInfo, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const phoneerrorbooking = validatePhoneNumber(phoneNumber);
    if (phoneerrorbooking) {
      seterrorbooking(phoneerrorbooking);
      return; // Dừng form nếu số điện thoại không hợp lệ
    }
    const now = new Date();
    const bookingDate = new Date(bookingInfo.date); // Khởi tạo `bookingDate` từ `bookingInfo.date`
    const nowDateOnly = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const bookingDateOnly = new Date(
      bookingDate.getFullYear(),
      bookingDate.getMonth(),
      bookingDate.getDate()
    );

    if (bookingDateOnly < nowDateOnly) {
      seterrorbooking(
        "Không thể đặt bàn vào ngày trong quá khứ. Vui lòng sửa lại ngày đến!"
      );
      return;
    }

    const day = bookingDate.getDay(); // 0 -> Chủ nhật, 1 -> Thứ 2, ..., 6 -> Thứ 7
    const { open, close } = getOpeningHours(day);

    if (!isValidBookingTime(bookingInfo.time, open, close)) {
      setModal({
        isOpen: true,
        text: `Vui lòng chọn thời gian đặt bàn trong khung giờ mở cửa: ${open} - ${close}`,
        type: "error",
        onClose: () => setModal({ isOpen: false }),
      });
      return;
    }
    const [hours, minutes] = bookingInfo.time.split(":").map(Number);
    bookingDate.setHours(hours, minutes, 0);

    // 1. Kiểm tra nếu thời gian đặt nhỏ hơn 1 tiếng so với hiện tại
    const timeDifference = bookingDate.getTime() - now.getTime(); // Sự khác biệt thời gian (ms)
    if (timeDifference < 60 * 60 * 1000) {
      // 1 tiếng = 60 phút = 3600 giây
      setModal({
        isOpen: true,
        text: "Khách cần đặt bàn trước ít nhất 1 tiếng. Vui lòng sửa lại thời gian!",
        type: "error",
        onClose: () => setModal({ isOpen: false }),
      });
      return;
    }

    setIsLoading(true);
    try {
      const requestData = {
        ...bookingInfo,
        date: bookingInfo.date, // Ngày đã ở đúng định dạng
      };
      await AddBookingTable(requestData);
      setModal({
        isOpen: true,
        text: "Đặt bàn thành công!",
        type: "success",
        onClose: handleOpenModalQuestion,
      });

      seterrorbooking("");
      setBookingInfo({
        guest_name: "",
        date: "",
        time: "",
        phone_number: "",
        email: "",
        number_of_guests: 1,
        note: "",
      });
    } catch (err) {
      seterrorbooking("Không thể đặt bàn. Vui lòng thử lại.");
      seterrorbooking("Không thể đặt bàn. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModalQuestion = () => {
    // Đóng modal đầu tiên và mở modal thứ hai nếu cần
    if (islogin === false) {
      setModal({
        isOpen: true,
        text: "Bạn có muốn đăng ký tài khoản để nhận thêm nhiều khuyến mãi không?",
        type: "confirm",
        onClose: () => {
          setModal({ isOpen: false }); // Đóng modal nếu người dùng từ chối
        },
        onConfirm: () => {
          navigate("/SignUp"); // Điều hướng đến trang đăng ký
          setModal({ isOpen: false });
        },
      });
    } else {
      setModal({ isOpen: false });
    }
  };

  const getOpeningHours = (day) => {
    if (day >= 1 && day < 5) {
      // Thứ 2 -> Thứ 5
      return {
        open: restaurantInfo.onweek_openhour,
        close: restaurantInfo.onweek_closehour,
      };
    } else {
      // Thứ 7 -> Chủ Nhật
      return {
        open: restaurantInfo.weekend_openhour,
        close: restaurantInfo.weekend_closehour,
      };
    }
  };

  const isValidBookingTime = (time, openTime, closeTime) => {
    const [hours, minutes] = time.split(":").map(Number);
    const [openHours, openMinutes] = openTime.split(":").map(Number);
    const [closeHours, closeMinutes] = closeTime.split(":").map(Number);

    const bookingTime = hours * 60 + minutes;
    const openingTime = openHours * 60 + openMinutes;
    const closingTime = closeHours * 60 + closeMinutes;

    return bookingTime >= openingTime && bookingTime <= closingTime;
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!restaurantInfo) return <p>No restaurant info available.</p>; // Xử lý nếu dữ liệu trống

  return (
    <div
      className={`${style["booking-form-container"]} ${
        isLoading ? style["loading"] : ""
      }`}
    >
      {isLoading && (
        <div className={style["loading-overlay"]}>
          <div className={style["spinner"]}></div>
        </div>
      )}

      <h2>Đặt Bàn</h2>
      {loadingbooking && <p>Đang tải...</p>}

      <p className={style["opening-hours"]}>
        {bookingInfo.date
          ? `Giờ mở cửa ngày bạn đặt: ${openingHours.open} - ${openingHours.close}`
          : "Vui lòng chọn ngày đặt để hiển thị giờ mở cửa!"}
      </p>

      <form onSubmit={handleSubmit}>
        <label>
          Số điện thoại:
          <input
            type="text"
            name="phone_number"
            value={phoneNumber}
            onChange={handlePhoneChange}
            required
          />
          {errorbooking && (
            <p className={style["errorbooking-message"]}>{errorbooking}</p>
          )}
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
            type="email"
            name="email"
            value={bookingInfo.email}
            onChange={handleInputChange}
            required
          />
        </label>
        {error && <p className={style["errorbooking-message"]}>{error}</p>}
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
        <div className={style["warning"]}>
          <FontAwesomeIcon
            icon={faExclamationTriangle}
            className={style["warning-icon"]}
          />
          <h3 className={style["warning-text"]}>
            Khách hàng cần đặt bàn trước ít nhất 01 tiếng so với thời gian dự
            định tới nhà hàng, và thời gian thực tế tới nhà hàng chênh lệch
            không quá 20 phút so với thời gian theo thông tin đặt bàn, để được
            áp dụng ưu đãi và phục vụ tốt nhất.
          </h3>
        </div>
        <button type="submit">Đặt bàn</button>
      </form>

      {modal.isOpen && (
        <ModalGeneral
          isOpen={modal.isOpen}
          text={modal.text}
          type={modal.type}
          onClose={modal.onClose}
          onConfirm={modal.onConfirm}
        />
      )}
    </div>
  );
}

export default BookingTable;
