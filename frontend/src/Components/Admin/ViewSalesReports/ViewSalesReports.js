import React, { useState, useEffect, useRef } from "react";
import { Line, Bar } from "react-chartjs-2";
import { useNavigate } from "react-router-dom";
import { getInvoice, getRevenueStats } from "../../../API/AdminAPI";
import { refreshToken } from "../../../API/authAPI";
import { isTokenExpired } from "../../../utils/tokenHelper.mjs";
import { useAuth } from "../../Auth/AuthContext";
import style from "./../../../Style/AdminStyle/ViewSalesReports.module.css"; // Import CSS
import {
  Chart,
  LineElement,
  BarElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  Tooltip,
} from "chart.js";

// Đăng ký các thành phần của Chart.js
Chart.register(
  LineElement,
  BarElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  Tooltip
);

function ViewSalesReports() {
  const { accessToken, setAccessToken } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date()); // Thời gian hiện tại
  const [reportType, setReportType] = useState("Ngày"); // Chế độ xem
  const [chartData, setChartData] = useState({}); // Dữ liệu biểu đồ
  const [error, setError] = useState(null); // Lưu lỗi nếu có
  const [loading, setLoading] = useState(true); // Trạng thái loading
  const [stats, setStats] = useState(null); // Thống kê tổng hợp
  const navigate = useNavigate();
  const paidInvoices = useRef([]); // Lưu danh sách hóa đơn đã thanh toán
  const chartRef = useRef(null);

  const ensureActiveToken = async () => {

    let activeToken = accessToken;
    if (isTokenExpired(accessToken)) {
      try {
        const refresh = localStorage.getItem("refreshToken");
        if (!refresh || isTokenExpired(refresh)) {
          navigate('/', { replace: true });
          window.location.reload();
          throw 'Phiên đăng nhập hết hạn';
        }
        const refreshed = await refreshToken(refresh);
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
    const fetchInvoices = async () => {
      setLoading(true);
      try {
        const token = await ensureActiveToken();
        
        // Fetch cả invoices và stats
        const [invoiceResponse, statsResponse] = await Promise.all([
          getInvoice(token),
          getRevenueStats(token).catch(() => null)
        ]);

        // Set stats nếu có
        if (statsResponse?.data) {
          setStats(statsResponse.data);
        }

        let response = invoiceResponse;
        if (!response || !Array.isArray(response)) {
          // Nếu không có dữ liệu, tạo mảng rỗng
          response = [];
        }

        paidInvoices.current = response.filter(
          (invoice) => invoice.status === "P"
        );

        if (paidInvoices.current.length === 0) {
          setError("Chưa có dữ liệu doanh thu. Hãy hoàn thành đơn hàng để xem báo cáo.");
          setChartData({});
        } else {
          setError(null);
          switch (reportType) {
            case "Ngày":
              generateDailyData(paidInvoices.current);
              break;
            case "Tháng":
              generateMonthlyData(paidInvoices.current);
              break;
            case "Quý":
              generateQuarterlyData(paidInvoices.current);
              break;
            case "Năm":
              generateYearlyData(paidInvoices.current);
              break;
            default:
              setChartData({});
          }
        }
      } catch (err) {
        console.error("Error fetching invoices:", err);
        setError("Không thể tải dữ liệu. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [reportType, currentDate]);

  const generateDailyData = (invoices) => {
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const revenueByDay = {};

    invoices.forEach((invoice) => {
      const invoiceDate = new Date(invoice.datetime);
      const invoiceDay = invoiceDate.getDate();
      const invoiceMonth = invoiceDate.getMonth();
      const invoiceYear = invoiceDate.getFullYear();

      if (invoiceMonth === currentMonth && invoiceYear === currentYear) {
        if (!revenueByDay[invoiceDay]) {
          revenueByDay[invoiceDay] = 0;
        }
        revenueByDay[invoiceDay] += invoice.final_price;
      }
    });

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const labels = Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(currentYear, currentMonth, i + 1);
      const isToday =
        i + 1 === new Date().getDate() &&
        currentMonth === new Date().getMonth() &&
        currentYear === new Date().getFullYear();

      // Chỉ hiển thị nhãn cách 2 ngày và luôn hiển thị "Hôm nay"
      return isToday
        ? `${date.toLocaleDateString("vi-VN", {
            day: "numeric",
            month: "numeric",
          })} (Hôm nay)`
        : i % 2 === 0
        ? date.toLocaleDateString("vi-VN", { day: "numeric", month: "numeric" })
        : "";
    });

    const data = Array.from({ length: daysInMonth }, (_, i) => {
      const value = revenueByDay[i + 1] || 0;
      const isToday =
        i + 1 === new Date().getDate() &&
        currentMonth === new Date().getMonth() &&
        currentYear === new Date().getFullYear();

      return {
        x: labels[i],
        y: value,
        backgroundColor: isToday
          ? "rgba(255, 99, 132, 0.8)"
          : "rgba(75, 192, 192, 0.5)",
        borderColor: isToday ? "red" : "rgba(75, 192, 192, 1)",
      };
    });

    setChartData({
      labels: labels,
      datasets: [
        {
          label: "Doanh thu (VNĐ)",
          data: data,
          borderColor: "#ff6384",
          backgroundColor: "rgba(255, 99, 132, 0.2)",
          type: "line",
        },
      ],
    });
  };

  const generateMonthlyData = (invoices) => {
    const currentYear = currentDate.getFullYear();
    const revenueByMonth = Array(12).fill(0);

    invoices.forEach((invoice) => {
      const invoiceDate = new Date(invoice.datetime);
      const invoiceMonth = invoiceDate.getMonth();
      const invoiceYear = invoiceDate.getFullYear();

      if (invoiceYear === currentYear) {
        revenueByMonth[invoiceMonth] += invoice.final_price;
      }
    });

    const labels = Array.from({ length: 12 }, (_, i) =>
      i === new Date().getMonth() && currentYear === new Date().getFullYear()
        ? `Tháng ${i + 1} (Tháng này)`
        : `Tháng ${i + 1}`
    );

    setChartData({
      labels: labels,
      datasets: [
        {
          label: "Doanh thu (VNĐ)",
          data: revenueByMonth,
          backgroundColor: "rgba(62, 149, 205, 0.8)",
          borderWidth: 1,
        },
      ],
    });
  };

  const generateQuarterlyData = (invoices) => {
    const currentYear = currentDate.getFullYear();
    const currentQuarter = Math.floor(new Date().getMonth() / 3);
    const revenueByQuarter = Array(4).fill(0);

    invoices.forEach((invoice) => {
      const invoiceDate = new Date(invoice.datetime);
      const invoiceMonth = invoiceDate.getMonth();
      const invoiceYear = invoiceDate.getFullYear();

      if (invoiceYear === currentYear) {
        const quarter = Math.floor(invoiceMonth / 3);
        revenueByQuarter[quarter] += invoice.final_price;
      }
    });

    setChartData({
      labels: ["Quý 1", "Quý 2", "Quý 3", "Quý 4"].map((label, index) =>
        index === currentQuarter && currentYear === new Date().getFullYear()
          ? `${label} (Quý này)`
          : label
      ),
      datasets: [
        {
          label: "Doanh thu (VNĐ)",
          data: revenueByQuarter,
          backgroundColor: "rgba(142, 94, 162, 0.8)",
          borderWidth: 2,
          borderColor: "rgba(142, 94, 162, 0.8)",
        },
      ],
    });
  };

  const generateYearlyData = (invoices) => {
    const today = new Date(); // Lấy ngày hiện tại thực tế
    const currentYear = today.getFullYear(); // Lấy năm thực tế hiện tại
    const revenueByYear = {};
    invoices.forEach((invoice) => {
      const invoiceDate = new Date(invoice.datetime);
      const invoiceYear = invoiceDate.getFullYear();

      if (!revenueByYear[invoiceYear]) {
        revenueByYear[invoiceYear] = 0;
      }
      revenueByYear[invoiceYear] += invoice.final_price;
    });

    setChartData({
      labels: Object.keys(revenueByYear).map((year) =>
        parseInt(year) === currentYear ? `${year} (Năm nay)` : year
      ),
      datasets: [
        {
          label: "Doanh thu (VNĐ)",
          data: Object.values(revenueByYear),
          backgroundColor: "rgba(60, 186, 159, 0.8)",
          borderWidth: 1,
        },
      ],
    });
  };

  const previousPeriod = () => {
    const newDate = new Date(currentDate);
    if (reportType === "Ngày") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (reportType === "Tháng") {
      newDate.setFullYear(newDate.getFullYear() - 1);
    } else if (reportType === "Năm" || reportType === "Quý") {
      newDate.setFullYear(newDate.getFullYear() - 1);
    }
    setCurrentDate(newDate);
  };

  const nextPeriod = () => {
    const newDate = new Date(currentDate);
    const today = new Date();

    if (reportType === "Ngày") {
      if (
        newDate.getFullYear() === today.getFullYear() &&
        newDate.getMonth() >= today.getMonth()
      ) {
        return;
      }
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (reportType === "Tháng") {
      if (newDate.getFullYear() >= today.getFullYear()) {
        return;
      }
      newDate.setFullYear(newDate.getFullYear() + 1);
    } else if (reportType === "Năm" || reportType === "Quý") {
      if (newDate.getFullYear() >= today.getFullYear()) {
        return;
      }
      newDate.setFullYear(newDate.getFullYear() + 1);
    }
    setCurrentDate(newDate);
  };

  const isNextDisabled = () => {
    const today = new Date();

    if (reportType === "Ngày" || reportType === "Quý") {
      return (
        currentDate.getFullYear() === today.getFullYear() &&
        currentDate.getMonth() >= today.getMonth()
      );
    } else if (reportType === "Tháng" || reportType === "Năm") {
      return currentDate.getFullYear() >= today.getFullYear();
    }
    return false;
  };

  const isPreviousDisabled = () => {
    if (paidInvoices.current.length === 0) return true;

    const minDate = new Date(
      Math.min(
        ...paidInvoices.current.map((invoice) => new Date(invoice.datetime))
      )
    );

    if (reportType === "Ngày") {
      return (
        currentDate.getFullYear() < minDate.getFullYear() ||
        (currentDate.getFullYear() === minDate.getFullYear() &&
          currentDate.getMonth() <= minDate.getMonth())
      );
    } else if (
      reportType === "Tháng" ||
      reportType === "Năm" ||
      reportType === "Quý"
    ) {
      return currentDate.getFullYear() <= minDate.getFullYear();
    }
    return false;
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      tooltip: {
        enabled: true,
        mode: "nearest",
        intersect: false,
        backgroundColor: "#333", // Màu nền tooltip
        titleColor: "#ffcc00", // Màu vàng nổi bật cho ngày
        titleFont: {
          size: 20, // Tăng kích thước ngày
          weight: "bold", // Làm tiêu đề in đậm
        },
        bodyColor: "#fff", // Màu nội dung
        bodyFont: {
          size: 14, // Kích thước chữ nội dung
        },
        borderColor: "#fff", // Màu viền
        borderWidth: 1, // Độ rộng viền
        padding: 10, // Khoảng cách bên trong
        displayColors: false, // Ẩn màu dataset
        callbacks: {
          title: function (tooltipItems) {
            const index = tooltipItems[0].dataIndex;
            if (reportType === "Ngày") {
              const currentYear = currentDate.getFullYear();
              const currentMonth = currentDate.getMonth();
              const date = new Date(currentYear, currentMonth, index + 1);
              return `📅 ${date.toLocaleDateString("vi-VN", {
                weekday: "long",
                day: "numeric",
                month: "numeric",
                year: "numeric",
              })}`;
            } else if (reportType === "Tháng") {
              return `📅 Tháng ${index + 1}/${currentDate.getFullYear()}`;
            } else if (reportType === "Quý") {
              return `📅 Quý ${index + 1}/${currentDate.getFullYear()}`;
            } else if (reportType === "Năm") {
              return `📅 Năm ${tooltipItems[0].label}`;
            }
          },
          label: function (context) {
            const index = context.dataIndex;
            const dataset = context.dataset.data;
            const currentYear = currentDate.getFullYear(); // Lấy từ currentDate
            const currentMonth = currentDate.getMonth(); // Lấy từ currentDate
            const currentValue =
              typeof context.raw === "number"
                ? context.raw
                : context.raw.y || 0;
            const previousValue =
              index > 0
                ? typeof dataset[index - 1] === "number"
                  ? dataset[index - 1]
                  : dataset[index - 1].y || 0
                : null;

            const isToday =
              index + 1 === new Date().getDate() &&
              currentMonth === new Date().getMonth() &&
              currentYear === new Date().getFullYear();

            let changeText = "";
            if (previousValue !== null) {
              const change = currentValue - previousValue;
              const changeType =
                reportType === "Ngày"
                  ? "ngày trước"
                  : reportType === "Tháng"
                  ? "tháng trước"
                  : reportType === "Quý"
                  ? "quý trước"
                  : "năm trước";
              changeText =
                change > 0
                  ? `🟢 Tăng ${change.toLocaleString("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    })} so với ${changeType}`
                  : `🔴 Giảm ${Math.abs(change).toLocaleString("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    })} so với ${changeType}`;
            } else {
              changeText = "⚪ Không có dữ liệu trước đó.";
            }

            return [
              `💰 Doanh thu: ${currentValue.toLocaleString("vi-VN", {
                style: "currency",
                currency: "VND",
              })}`,
              `${changeText}`,
            ];
          },
        },
      },
      legend: {
        display: true,
        position: "bottom",
      },
    },
    hover: {
      mode: "nearest",
      intersect: false,
    },
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
  };

  return (
    <div
      className={`${style["viewsalesreport-container"]} ${
        loading ? style["loading"] : ""
      }`}
    >
      {loading && (
        <div className={style["loading-overlay"]}>
          <div className={style["spinner"]}></div>
        </div>
      )}
      <h2 className={style["viewsalesreport-title"]}>Báo cáo doanh thu</h2>

      {/* Stats Cards */}
      {stats && (
        <div className={style["stats-cards"]}>
          <div className={style["stat-card"]}>
            <div className={style["stat-icon"]}>📅</div>
            <div className={style["stat-info"]}>
              <span className={style["stat-label"]}>Hôm nay</span>
              <span className={style["stat-value"]}>{formatCurrency(stats.today_revenue)}</span>
              <span className={style["stat-count"]}>{stats.today_orders} đơn hàng</span>
            </div>
          </div>
          <div className={style["stat-card"]}>
            <div className={style["stat-icon"]}>📆</div>
            <div className={style["stat-info"]}>
              <span className={style["stat-label"]}>Tháng này</span>
              <span className={style["stat-value"]}>{formatCurrency(stats.monthly_revenue)}</span>
              <span className={style["stat-count"]}>{stats.monthly_orders} đơn hàng</span>
            </div>
          </div>
          <div className={style["stat-card"]}>
            <div className={style["stat-icon"]}>💰</div>
            <div className={style["stat-info"]}>
              <span className={style["stat-label"]}>Tổng doanh thu</span>
              <span className={style["stat-value"]}>{formatCurrency(stats.total_revenue)}</span>
              <span className={style["stat-count"]}>{stats.total_orders} đơn hàng</span>
            </div>
          </div>
          <div className={style["stat-card"]}>
            <div className={style["stat-icon"]}>🎁</div>
            <div className={style["stat-info"]}>
              <span className={style["stat-label"]}>Tổng giảm giá</span>
              <span className={style["stat-value"]}>{formatCurrency(stats.total_discount)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Nút chọn chế độ xem */}
      <div className={style["viewsalesreport-button-group"]}>
        <button
          className={`${style["button"]} ${
            reportType === "Ngày" ? style["selected"] : ""
          }`}
          onClick={() => setReportType("Ngày")}
        >
          Ngày
        </button>
        <button
          className={`${style["button"]} ${
            reportType === "Tháng" ? style["selected"] : ""
          }`}
          onClick={() => setReportType("Tháng")}
        >
          Tháng
        </button>
        <button
          className={`${style["button"]} ${
            reportType === "Quý" ? style["selected"] : ""
          }`}
          onClick={() => setReportType("Quý")}
        >
          Quý
        </button>
        <button
          className={`${style["button"]} ${
            reportType === "Năm" ? style["selected"] : ""
          }`}
          onClick={() => setReportType("Năm")}
        >
          Năm
        </button>
      </div>

      {/* Nút chuyển đổi thời gian */}
      <div className={style["viewsalesreport-navigation"]}>
        <button onClick={previousPeriod} disabled={isPreviousDisabled()}>
          &lt;
        </button>
        <span>
          {reportType === "Ngày"
            ? `Tháng ${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`
            : reportType === "Tháng"
            ? `Năm ${currentDate.getFullYear()}`
            : reportType === "Quý"
            ? `Năm ${currentDate.getFullYear()}`
            : `Năm ${currentDate.getFullYear()}`}
        </span>
        <button onClick={nextPeriod} disabled={isNextDisabled()}>
          &gt;
        </button>
      </div>

      {/* Hiển thị biểu đồ */}
      {loading ? (
        <p className={style["viewsalesreport-error-message"]}>
          Đang tải dữ liệu...
        </p>
      ) : error ? (
        <p className={style["viewsalesreport-error-message"]}>{error}</p>
      ) : (
        <>
          <div className={style["chart-container"]}>
            {reportType === "Ngày" || reportType === "Quý" ? (
              <Line
                ref={chartRef}
                data={chartData} // Dữ liệu biểu đồ
                options={chartOptions} // Cấu hình chartOptions
              />
            ) : (
              <Bar
                ref={chartRef}
                data={chartData} // Dữ liệu biểu đồ
                options={chartOptions} // Thêm cấu hình chartOptions vào đây
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default ViewSalesReports;
