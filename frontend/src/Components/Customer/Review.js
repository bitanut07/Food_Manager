import React, { useEffect, useState, useRef } from "react";
import style from "../../Style/CustomerStyle/Review.module.css";
import { BsFilterLeft } from "react-icons/bs";
import { FaArrowLeft, FaArrowRight, FaStar } from "react-icons/fa";
import QRCodeGenerator from "./QRReview";
import Select from "react-select";
import { fetchFeedbacksData, getFeedBackFilter } from "../../API/ReviewAPI";
import StarDisplay from "./StarDisplay";

function Review({ iID }) {
  const itemsPerPage = 10; // Số món ăn trên mỗi trang
  const [currentPage, setCurrentPage] = useState(1);
  const selectRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const [feedbacks, setFeedbacks] = useState([]);
  const [filterType, setFilterType] = useState("Tất cả");
  const [positive, setPositive] = useState("a");
  const [date, setDate] = useState("a");
  const totalPages = Math.max(1, Math.ceil(feedbacks.length / itemsPerPage));
  function formatDate(isoString) {
    const date = new Date(isoString); // Tạo đối tượng Date từ chuỗi ISO
    const day = String(date.getUTCDate()).padStart(2, "0"); // Lấy ngày (UTC) và thêm số 0 nếu cần
    const month = String(date.getUTCMonth() + 1).padStart(2, "0"); // Lấy tháng (UTC) và thêm số 0 nếu cần
    const year = date.getUTCFullYear(); // Lấy năm (UTC)
    return `${day}-${month}-${year}`; // Trả về chuỗi định dạng dd-mm-yyyy
  }


  const options = [
    {
      value: "0",
      label: (
        <>
          <FaStar size={20} color="#FFD700" /> Tất cả
        </>
      ),
    },
    {
      value: "1",
      label: (
        <>
          <FaStar size={20} color="#FFD700" /> 0-1
        </>
      ),
    },
    {
      value: "2",
      label: (
        <>
          <FaStar size={20} color="#FFD700" /> 1-2
        </>
      ),
    },
    {
      value: "3",
      label: (
        <>
          <FaStar size={20} color="#FFD700" /> 2-3
        </>
      ),
    },
    {
      value: "4",
      label: (
        <>
          <FaStar size={20} color="#FFD700" /> 3-4
        </>
      ),
    },
    {
      value: "5",
      label: (
        <>
          <FaStar size={20} color="#FFD700" /> 4-5
        </>
      ),
    },
  ];

  const handleChange = (selectedOption) => {
    console.log(`Selected: ${selectedOption.value}`);
    const newPositive = selectedOption.value;
    setPositive(newPositive);
    fetchFilterData(newPositive, date);
    setCurrentPage(1);
  };

  const handleFilterDateChange = (event) => {
    let selectedValue = event.target.value;
    if (!selectedValue) {
      selectedValue = "a";
    }
    setDate(selectedValue);
    fetchFilterData(positive, selectedValue);
    setCurrentPage(1);
  };
  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await fetchFeedbacksData();
      setFeedbacks(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterData = async (p, d) => {
    setLoading(true);
    try {
      const data = await getFeedBackFilter(p, d);
      setFeedbacks(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const currentItems = feedbacks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleIconClick = () => {
    if (selectRef.current) {
      selectRef.current.focus(); // Hoặc selectRef.current.click();
    }
  };

  const handleChangePage = (value) => {
    if (value === "") {
      setCurrentPage(1);
      return;
    }
    if (value < totalPages) {
      setCurrentPage(value);
    } else {
      setCurrentPage(1);
    }
  };
  const preventNegative = (e) => {
    if (e.key === "-" || e.key === "e" || e.key === ".") {
      e.preventDefault(); // Ngăn nhập dấu âm hoặc ký tự không hợp lệ
    }
  };

  return (
    <div
      className={`${style["review-info-ctn"]} ${
        loading ? style["loading"] : ""
      }`}
    >
      {loading && (
        <div className={style["loading-overlay"]}>
          <div className={style["spinner"]}></div>
        </div>
      )}
      <div className={style["container"]}>
        <div className={style["row"]}>
          <div className={style["review-title-ctn"] + " " + style["col-lg-12"]}>
            <h4>BÀI ĐÁNH GIÁ</h4>
          </div>
        </div>
        <div className={style["row"] + " " + style["display-end"]}>
          <div className={style["col-lg-6"] + " " + style["page-num-top"]}>
            <span>
              Trang {currentPage}/{totalPages}
            </span>
          </div>
          <div className={style["col-lg-3"] + " " + style["page-input-ctn"]}>
            <label>
              <input
                type="number"
                min={1}
                onKeyDown={preventNegative}
                id="date-input"
                name="date"
                className={style["input-page"]}
                placeholder="Nhập số trang..."
                onChange={(e) => handleChangePage(e.target.value)}
              ></input>
            </label>
          </div>
          <div className={style["col-lg-3"] + " " + style["filter-ctn"]}>
            <div className={style["filter-category"]}>
              <Select
                options={options}
                onChange={handleChange}
                defaultValue={options[0]}
              />
            </div>
            <div className={style["filter-date"]}>
              <label>
                <input
                  type="date"
                  id="date-input"
                  name="date"
                  className={style["my-input-date"]}
                  onChange={handleFilterDateChange}
                />
              </label>
            </div>
          </div>
        </div>
        <div className={style["row"]}>
          {currentItems.map((item) => (
            <div key={item.id} className={style["col-lg-6"]}>
              <div className={style["feedback-item"]}>
                <div className={style["name-star"]}>
                  <div>
                    <h4>{item.name}</h4>
                    <p>{formatDate(item.date)}</p>
                  </div>
                  <StarDisplay point={item.overall_point}></StarDisplay>
                </div>
                <div className={style["comment-ctn"]}>
                  <p>{item.comment}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className={style["row"]}>
          <div className={style["btn-ctn"]}>
            <button
              onClick={() => {
                setCurrentPage((prev) => Math.max(prev - 1, 1));
              }}
              disabled={currentPage === 1}
            >
              <FaArrowLeft></FaArrowLeft>
            </button>

            <button
              onClick={() => {
                setCurrentPage((prev) => Math.min(prev + 1, totalPages));
              }}
              disabled={currentPage === totalPages}
            >
              <FaArrowRight></FaArrowRight>
            </button>
          </div>
        </div>
        <div className={style["page-num"]}>
          <span>
            Trang {currentPage}/{totalPages}
          </span>
        </div>
      </div>
    </div>
  );
}

export default Review;
