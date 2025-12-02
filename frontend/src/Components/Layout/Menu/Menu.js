// src/components/Menu.js
import React, { useState, useEffect, useRef } from "react";
import style from "./Menu.module.css";
import { getFoodItems, getMenuTabs } from "../../../API/MenuAPI";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";

function Menu() {
  const [foodItems, setFoodItems] = useState([]);

  const [selectedType, setSelectedType] = useState(0);

  const [menuTabs, setMenuTabs] = useState([]);

  const [error, setError] = useState(null);

  const [searchItem, setSearchItem] = useState("");

  const [searchPriceMin, setSearchPriceMin] = useState("");

  const [searchPriceMax, setSearchPriceMax] = useState("");

  const itemsPerPage = 12; // Số món ăn trên mỗi trang
  const [currentPage, setCurrentPage] = useState(1);
  const [showArrows, setShowArrows] = useState({ left: false, right: false });
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const targetRef = useRef(null);
  const tabListRef = useRef(null);
  const [hasPageChanged, setHasPageChanged] = useState(false);
  const checkScrollPosition = () => {
    if (tabListRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabListRef.current;
      setShowArrows({
        left: scrollLeft > 0,
        right: scrollLeft < scrollWidth - clientWidth,
      });
    }
  };

  const scrollToTarget = () => {
    if (targetRef.current) {
      targetRef.current.scrollIntoView({
        behavior: "smooth", // Cuộn mượt mà
        block: "start", // Căn phần tử ở đầu vùng hiển thị
      });
    }
  };

  useEffect(() => {
    checkScrollPosition();
    window.addEventListener("resize", checkScrollPosition);
    return () => window.removeEventListener("resize", checkScrollPosition);
  }, []);

  const scroll = (direction) => {
    if (tabListRef.current) {
      const scrollAmount = tabListRef.current.offsetWidth / 3; // Scroll một khoảng bằng 1/3 chiều rộng container
      tabListRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
      setTimeout(checkScrollPosition, 300);
    }
  };

  const handlePriceMin = (value) => {
    // Allow only positive numbers or empty string (to handle backspacing)
    if (/^\d*$/.test(value)) {
      setCurrentPage(1);
      setSearchPriceMin(value);
    }
  };

  const handlePriceMax = (value) => {
    // Allow only positive numbers or empty string (to handle backspacing)
    // if (value === '' || /^[+]?\d+(\.\d+)?$/.test(value)) {
    //   setSearchPriceMax(value);
    // }
    if (/^\d*$/.test(value)) {
      setCurrentPage(1);
      setSearchPriceMax(value);
    }
  };

  const deriveCategories = (items, categories) => {
    const map = new Map();
    items.forEach((item) => {
      if (!item.category_id) {
        return;
      }
      if (!map.has(item.category_id)) {
        const category = categories.find((category) => category.id === item.category_id);
        map.set(item.category_id, category);
      }
    });
    return Array.from(map.values());
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await getFoodItems();
        const categories = await getMenuTabs();
        setFoodItems(data);
        setMenuTabs(deriveCategories(data, categories));
      } catch (error) {
        setError(error);
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    // Chỉ cuộn khi currentPage thực sự thay đổi sau khi vào trang
    if (hasPageChanged) {
      scrollToTarget();
    } else {
      setHasPageChanged(true); // Đánh dấu lần đầu tiên currentPage được thay đổi
    }
  }, [currentPage]);

  const filter = (item, name, category, priceMin, priceMax) => {
    let addCondition =
      item.name.toLowerCase().includes(name.toLowerCase()) &&
      item.price >= priceMin;
    if (priceMax > 0) {
      addCondition = addCondition && item.price <= priceMax;
    }
    if (category !== 0) {
      addCondition = addCondition && item.category_id === category;
    }
    return addCondition;
  };

  const filteredItems = foodItems.filter((item) =>
    filter(item, searchItem, selectedType, searchPriceMin, searchPriceMax)
  );
  const totalPages = Math.max(
    1,
    Math.ceil(filteredItems.length / itemsPerPage)
  );
  const currentItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatPrice = (price) => {
    if (price === undefined || price === null) {
      return "Liên hệ";
    }
    return `${Number(price).toLocaleString("vi-VN")} VND`;
  };

  return (
    <div
      className={`${style["menu-container"]} ${
        loading ? style["loading"] : ""
      }`}
    >
      {loading && (
        <div className={style["loading-overlay"]}>
          <div className={style["spinner"]}></div>
        </div>
      )}

      <div className={style["container"]}>
        <div className={style["title-row"]}>
          <div className={style["row"]}>
            <div className={style["col-lg-12"]}>
              <div className={style["section-title"]}>
                <p>THỰC ĐƠN</p>
                <h2>Check our YUMMY Menu</h2>
              </div>
            </div>
          </div>
        </div>
        <div className={style["search-row"]}>
          <div className={style["col-lg-9"]}>
            <div className={style["search-menuitem"]}>
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchItem}
                onChange={(e) => {
                  setSearchItem(e.target.value);
                  setCurrentPage(1);
                }}
                className={style["input-search-menuitem"]}
              />
              <button type="button" className={style["input-search-btn"]}>
                <i className="fas fa-search"></i>
              </button>
            </div>
          </div>
          <div className={style["col-lg-3"]}>
            <div className={style["search-price"]}>
              <div className={style["input-price"]}>
                <input
                  type="text"
                  placeholder="Giá từ..."
                  value={searchPriceMin}
                  onChange={(e) => handlePriceMin(e.target.value)}
                ></input>
              </div>
              <div className={style["input-price"]}>
                <input
                  type="text"
                  placeholder="Đến..."
                  value={searchPriceMax}
                  onChange={(e) => handlePriceMax(e.target.value)}
                ></input>
              </div>
            </div>
          </div>
        </div>
        {error && (
          <div className={style["row"]}>
            <div className={style["Error-container"]}>
              <h2 className={style["error"]}>Error </h2>
              <p>{error.response ? error.response.data : error.message}</p>
            </div>
          </div>
        )}
        <div className={style["menu-tab-row"]} ref={targetRef}>
          <div className={style["row"]}>
            <div className={style["col-lg-12"]}>
              <div className={style["menu-tab"]}>
                <button
                  onClick={() => scroll("left")}
                  className={style["scroll-btn"]}
                >
                  <FaArrowLeft />
                </button>
                <ul
                  ref={tabListRef}
                  className={style["scroll-menu-tab"]}
                  onScroll={checkScrollPosition}
                >
                  <li key={0}>
                    <button
                      onClick={() => {
                        setSelectedType(0);
                        setCurrentPage(1);
                      }}
                      className={
                        style["menu-tab-btn"] +
                        " " +
                        style[selectedType === 0 ? "active" : ""]
                      }
                    >
                      Tất cả
                    </button>
                  </li>
                  {menuTabs.map((tab) => (
                    <li key={tab.id}>
                      <button
                        onClick={() => {
                          setSelectedType(Number(tab.id));
                          setCurrentPage(1);
                        }}
                        className={
                          style["menu-tab-btn"] +
                          " " +
                          style[selectedType === Number(tab.id) ? "active" : ""]
                        }
                      >
                        {tab.name}
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => scroll("right")}
                  className={style["scroll-btn"]}
                >
                  <FaArrowRight />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className={style["menu-list-row"]}>
          <div className={style["row"]}>
            {currentItems.map((item) => {
              const imageSrc =
                item.thumbnail ||
                item.images?.[0] ||
                "/assets/images/menu.jpg";
              return (
              <div
                key={item.id}
                className={style["col-lg-3"]}
                onClick={() => navigate(`/menu/${item.id}`)}
              >
                <div className={style["menu-item"]}>
                    <img src={imageSrc} alt={item.name} />
                  <h3>{item.name}</h3>
                  <p>{formatPrice(item.price)}</p>
                </div>
              </div>
              );
            })}
          </div>
        </div>
        <div className={style["row"]}>
          <div className={style["btn-ctn"]}>
            <button
              onClick={() => {
                setCurrentPage((prev) => Math.max(prev - 1, 1));
              }}
              disabled={currentPage === 1}
              className={style["next-btn"]}
            >
              <FaArrowLeft></FaArrowLeft>
            </button>
            <div className={style["page-num"]}>
              <div className={style["row"]}>
                <div className={style["btn-ctn"]}>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={`page-${i + 1}`}
                      onClick={() => {
                        setCurrentPage(i + 1);
                      }}
                      className={style[currentPage === i + 1 && "active-btn"]}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setCurrentPage((prev) => Math.min(prev + 1, totalPages));
              }}
              disabled={currentPage === totalPages}
              className={style["next-btn"]}
            >
              <FaArrowRight></FaArrowRight>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Menu;
