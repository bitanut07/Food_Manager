import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import style from "../../Style/CustomerStyle/Orders.module.css";
import { getUserOrders, cancelOrder, getOrderById } from "../../API/OrderAPI";
import { FaShoppingBag, FaClock, FaTruck, FaCheckCircle, FaTimesCircle, FaEye, FaTimes, FaUtensils } from "react-icons/fa";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetail, setOrderDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await getUserOrders();
      setOrders(response.data || []);
    } catch (err) {
      setError("Không thể tải danh sách đơn hàng");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (orderId) => {
    try {
      setDetailLoading(true);
      setSelectedOrder(orderId);
      const response = await getOrderById(orderId);
      setOrderDetail(response.data);
    } catch (err) {
      console.error("Error fetching order detail:", err);
      alert("Không thể tải chi tiết đơn hàng");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedOrder(null);
    setOrderDetail(null);
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Bạn có chắc muốn hủy đơn hàng này?")) return;
    
    try {
      await cancelOrder(orderId);
      fetchOrders();
      // Close modal if currently viewing this order
      if (selectedOrder === orderId) {
        closeModal();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Không thể hủy đơn hàng");
    }
  };

  const formatPrice = (price) => {
    if (price === undefined || price === null) return "0 VND";
    return `${Number(price).toLocaleString("vi-VN")} VND`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      pending: { label: "Chờ xác nhận", icon: <FaClock />, color: "#ff9800" },
      confirmed: { label: "Đã xác nhận", icon: <FaCheckCircle />, color: "#2196f3" },
      preparing: { label: "Đang chuẩn bị", icon: <FaUtensils />, color: "#9c27b0" },
      delivering: { label: "Đang giao hàng", icon: <FaTruck />, color: "#00bcd4" },
      completed: { label: "Hoàn thành", icon: <FaCheckCircle />, color: "#4caf50" },
      cancelled: { label: "Đã hủy", icon: <FaTimesCircle />, color: "#f44336" },
    };
    return statusMap[status] || { label: status, icon: <FaClock />, color: "#999" };
  };

  if (loading) {
    return (
      <div className={style["orders-container"]}>
        <div className={style["loading"]}>
          <div className={style["spinner"]}></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={style["orders-container"]}>
        <div className={style["error"]}>{error}</div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className={style["orders-container"]}>
        <div className={style["empty"]}>
          <FaShoppingBag className={style["empty-icon"]} />
          <h2>Chưa có đơn hàng nào</h2>
          <p>Hãy đặt món ngay để trải nghiệm dịch vụ của chúng tôi</p>
          <button onClick={() => navigate("/menu")} className={style["shop-btn"]}>
            Xem thực đơn
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={style["orders-container"]}>
      <h1 className={style["page-title"]}>Đơn hàng của tôi</h1>

      <div className={style["orders-list"]}>
        {orders.map((order) => {
          const statusInfo = getStatusInfo(order.status);
          return (
            <div key={order.id} className={style["order-card"]}>
              <div className={style["order-header"]}>
                <div className={style["order-id"]}>
                  <span>Đơn hàng</span>
                  <strong>#{order.id}</strong>
                </div>
                <div
                  className={style["order-status"]}
                  style={{ background: statusInfo.color }}
                >
                  {statusInfo.icon}
                  <span>{statusInfo.label}</span>
                </div>
              </div>

              <div className={style["order-info"]}>
                <div className={style["info-row"]}>
                  <span>Ngày đặt:</span>
                  <span>{formatDate(order.created_at)}</span>
                </div>
                <div className={style["info-row"]}>
                  <span>Người nhận:</span>
                  <span>{order.full_name}</span>
                </div>
                <div className={style["info-row"]}>
                  <span>Địa chỉ:</span>
                  <span>{order.address}</span>
                </div>
                <div className={style["info-row"]}>
                  <span>Thanh toán:</span>
                  <span>{order.payment_method === "COD" ? "Thanh toán khi nhận hàng" : order.payment_method}</span>
                </div>
              </div>

              <div className={style["order-footer"]}>
                <div className={style["order-total"]}>
                  <span>Tổng tiền:</span>
                  <strong>{formatPrice(order.total)}</strong>
                </div>
                <div className={style["order-actions"]}>
                  <button
                    className={style["view-btn"]}
                    onClick={() => handleViewDetail(order.id)}
                  >
                    <FaEye /> Xem chi tiết
                  </button>
                  {order.status === "pending" && (
                    <button
                      className={style["cancel-btn"]}
                      onClick={() => handleCancelOrder(order.id)}
                    >
                      Hủy đơn
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className={style["modal-overlay"]} onClick={closeModal}>
          <div className={style["modal-content"]} onClick={(e) => e.stopPropagation()}>
            <button className={style["modal-close"]} onClick={closeModal}>
              <FaTimes />
            </button>
            
            {detailLoading ? (
              <div className={style["modal-loading"]}>
                <div className={style["spinner"]}></div>
                <p>Đang tải chi tiết...</p>
              </div>
            ) : orderDetail ? (
              <>
                <h2 className={style["modal-title"]}>
                  Chi tiết đơn hàng #{orderDetail.order?.id}
                </h2>
                
                <div className={style["detail-status"]}>
                  {(() => {
                    const statusInfo = getStatusInfo(orderDetail.order?.status);
                    return (
                      <span style={{ background: statusInfo.color }}>
                        {statusInfo.icon} {statusInfo.label}
                      </span>
                    );
                  })()}
                </div>

                <div className={style["detail-section"]}>
                  <h3>Thông tin giao hàng</h3>
                  <p><strong>Người nhận:</strong> {orderDetail.order?.full_name}</p>
                  <p><strong>Số điện thoại:</strong> {orderDetail.order?.phone}</p>
                  <p><strong>Địa chỉ:</strong> {orderDetail.order?.address}</p>
                  {orderDetail.order?.note && (
                    <p><strong>Ghi chú:</strong> {orderDetail.order?.note}</p>
                  )}
                </div>

                <div className={style["detail-section"]}>
                  <h3>Sản phẩm đã đặt</h3>
                  <div className={style["order-items"]}>
                    {orderDetail.items?.map((item) => (
                      <div key={item.id} className={style["order-item"]}>
                        <img
                          src={item.product?.thumbnail || "/assets/images/menu.jpg"}
                          alt={item.product?.name}
                        />
                        <div className={style["item-info"]}>
                          <span className={style["item-name"]}>{item.product?.name}</span>
                          <span className={style["item-qty"]}>Số lượng: {item.quantity}</span>
                          <span className={style["item-price"]}>
                            {formatPrice(item.unit_price)} x {item.quantity}
                          </span>
                        </div>
                        <div className={style["item-total"]}>
                          {formatPrice(item.unit_price * item.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={style["detail-section"]}>
                  <h3>Thanh toán</h3>
                  <div className={style["payment-info"]}>
                    <div className={style["payment-row"]}>
                      <span>Phương thức:</span>
                      <span>
                        {orderDetail.payment?.method === "COD" 
                          ? "Thanh toán khi nhận hàng" 
                          : orderDetail.payment?.method}
                      </span>
                    </div>
                    {orderDetail.order?.discount > 0 && (
                      <div className={style["payment-row"] + " " + style["discount-row"]}>
                        <span>Giảm giá:</span>
                        <span>-{formatPrice(orderDetail.order?.discount)}</span>
                      </div>
                    )}
                    <div className={style["payment-row"] + " " + style["total-row"]}>
                      <span>Tổng cộng:</span>
                      <strong>{formatPrice(orderDetail.order?.total)}</strong>
                    </div>
                  </div>
                </div>

                {orderDetail.order?.status === "pending" && (
                  <div className={style["modal-actions"]}>
                    <button
                      className={style["cancel-btn"]}
                      onClick={() => handleCancelOrder(orderDetail.order?.id)}
                    >
                      Hủy đơn hàng
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p>Không thể tải chi tiết đơn hàng</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Orders;
