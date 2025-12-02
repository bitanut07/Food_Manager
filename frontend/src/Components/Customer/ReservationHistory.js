import React, { useEffect, useState } from "react";
import style from "../../Style/CustomerStyle/ReservationHistory.module.css";
import { fetchReservationDataByPhoneNumber } from "../../API/EE_ReservationAPI";
import { useAuth } from "../Auth/AuthContext";
import { isTokenExpired } from "../../utils/tokenHelper.mjs";
import { refreshToken } from "../../API/authAPI";
import { useNavigate } from "react-router-dom";
import { GetInfoCus } from "../../API/FixInfoAPI";

function ReservationHistory() {
  const [reservationData, setReservationData] = useState([]);
  const [error, setError] = useState("");
  const { accessToken, setAccessToken } = useAuth();
  const navigate = useNavigate();
  const id = localStorage.getItem("userId");
  const [loading, setLoading] = useState(false);

  const ensureActiveToken = async () => {
    const refresh = localStorage.getItem('refreshToken');
    if (!refresh || isTokenExpired(refresh)) {
              navigate('/', { replace: true });
              window.location.reload();
              throw 'Phiên đăng nhập hết hạn';
            }
    let activeToken = accessToken;
    if (isTokenExpired(accessToken)) {
      try {
        const refreshed = await refreshToken(
          localStorage.getItem("refreshToken")
        );
        activeToken = refreshed.access;
        setAccessToken(activeToken);
      } catch (error) {
        console.error("Error refreshing token:", error);
        navigate("/login");
        throw error;
      }
    }
    return activeToken;
  };

  useEffect(() => {
    const fetchReservations = async () => {
      if (!id) {
        setError("User ID is missing");
        navigate("/login");
        return;
      }
      setLoading(true);

      try {
        const activeToken = await ensureActiveToken();
        const customerData = await GetInfoCus(id, activeToken);
        if (!customerData.phone_number) {
          setError("Customer phone number is missing");
          return;
        }
        const data = await fetchReservationDataByPhoneNumber(
          activeToken,
          customerData.phone_number
        );
        setReservationData(data);
      } catch (error) {
        console.error("Error fetching reservations:", error.message);
        setError(error.message || "Failed to fetch reservations");
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, [id]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(":");
    return `${hours}:${minutes}`;
  };

  return (
    <div
      className={`${style["reservation-detail-container"]} ${
        loading ? style["loading"] : ""
      }`}
    >
      {loading && (
        <div className={style["loading-overlay"]}>
          <div className={style["spinner"]}></div>
        </div>
      )}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {reservationData.length > 0 ? (
        <div className={style["reservation-info"]}>
          <h1 className={style["reservation-guest-name"]}>Lịch sử đặt bàn</h1>
          <div className={style["table-container"]}>
            <table className={style["reservation-table"]}>
              <colgroup>
                <col style={{ width: "15%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "40%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Mã đặt bàn</th>
                  <th>Ngày</th>
                  <th>Giờ</th>
                  <th>Số khách</th>
                  <th>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {reservationData.map((reservation, index) => (
                  <tr key={index}>
                    <td>{reservation.id}</td>
                    <td>{formatDate(reservation.date)}</td>
                    <td>{formatTime(reservation.time)}</td>
                    <td>{reservation.number_of_guests}</td>
                    <td>{reservation.note || "Không có ghi chú"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className={style["no-reservation-container"]}>
          <p className={style["no-reservation-message"]}>
            Khách chưa từng đặt bàn.
          </p>
          <button
            onClick={() => navigate("/reservation")}
            className={style["reserve-now-button"]}
          >
            Đặt bàn ngay!
          </button>
        </div>
      )}
    </div>
  );
}

export default ReservationHistory;
