import React, { useState, useEffect } from "react";
import style from "./ManageOrders.module.css";
import { getAllOrders, updateOrderStatus, getOrderById } from "../../../API/OrderAPI";
import { FaShoppingBag, FaClock, FaTruck, FaCheckCircle, FaTimesCircle, FaEye, FaTimes, FaUtensils, FaClipboardCheck } from "react-icons/fa";
import { ModalGeneral } from "../../ModalGeneral";

function ManageOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetail, setOrderDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [modal, setModal] = useState({
    isOpen: false,
    text: "",
    type: "",
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await getAllOrders();
      setOrders(response.data || []);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setModal({
        isOpen: true,
        text: "Không thể tải danh sách đơn hàng",
        type: "error",
      });
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
      setModal({
        isOpen: true,
        text: "Không thể tải chi tiết đơn hàng",
        type: "error",
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedOrder(null);
    setOrderDetail(null);
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      fetchOrders();
      // Update orderDetail if modal is open
      if (orderDetail?.order?.id === orderId) {
        setOrderDetail({
          ...orderDetail,
          order: { ...orderDetail.order, status: newStatus },
        });
      }
      setModal({
        isOpen: true,
        text: "Cập nhật trạng thái thành công!",
        type: "success",
      });
    } catch (err) {
      console.error("Error updating order status:", err);
      setModal({
        isOpen: true,
        text: err.response?.data?.message || "Không thể cập nhật trạng thái",
        type: "error",
      });
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
      confirmed: { label: "Đã xác nhận", icon: <FaClipboardCheck />, color: "#2196f3" },
      preparing: { label: "Đang chuẩn bị", icon: <FaUtensils />, color: "#9c27b0" },
      delivering: { label: "Đang giao hàng", icon: <FaTruck />, color: "#00bcd4" },
      completed: { label: "Hoàn thành", icon: <FaCheckCircle />, color: "#4caf50" },
      cancelled: { label: "Đã hủy", icon: <FaTimesCircle />, color: "#f44336" },
    };
    return statusMap[status] || { label: status, icon: <FaClock />, color: "#999" };
  };

  const statusOptions = [
    { value: "pending", label: "Chờ xác nhận" },
    { value: "confirmed", label: "Đã xác nhận" },
    { value: "preparing", label: "Đang chuẩn bị" },
    { value: "delivering", label: "Đang giao hàng" },
    { value: "completed", label: "Hoàn thành" },
    { value: "cancelled", label: "Đã hủy" },
  ];

  const filteredOrders = filterStatus === "all" 
    ? orders 
    : orders.filter(order => order.status === filterStatus);

  if (loading) {
    return (
      <div className={style["manage-orders"]}>
        <div className={style["loading"]}>
          <div className={style["spinner"]}></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={style["manage-orders"]}>
      <h2>QUẢN LÝ ĐƠN HÀNG</h2>

      {/* Filter */}
      <div className={style["filter-section"]}>
        <label>Lọc theo trạng thái:</label>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">Tất cả</option>
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className={style["order-count"]}>
          Hiển thị: {filteredOrders.length} đơn hàng
        </span>
      </div>

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <div className={style["no-orders"]}>
          <FaShoppingBag className={style["no-orders-icon"]} />
          <p>Không có đơn hàng nào</p>
        </div>
      ) : (
        <div className={style["orders-table-container"]}>
          <table className={style["orders-table"]}>
            <thead>
              <tr>
                <th>Mã ĐH</th>
                <th>Khách hàng</th>
                <th>SĐT</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th>Ngày đặt</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const statusInfo = getStatusInfo(order.status);
                return (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td>{order.full_name}</td>
                    <td>{order.phone}</td>
                    <td className={style["price-cell"]}>{formatPrice(order.total)}</td>
                    <td>
                      <span
                        className={style["status-badge"]}
                        style={{ background: statusInfo.color }}
                      >
                        {statusInfo.icon} {statusInfo.label}
                      </span>
                    </td>
                    <td>{formatDate(order.created_at)}</td>
                    <td>
                      <div className={style["action-buttons"]}>
                        <button
                          className={style["view-btn"]}
                          onClick={() => handleViewDetail(order.id)}
                          title="Xem chi tiết"
                        >
                          <FaEye />
                        </button>
                        {order.status !== "completed" && order.status !== "cancelled" && (
                          <select
                            className={style["status-select"]}
                            value={order.status}
                            onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                          >
                            {statusOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

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
                <h3 className={style["modal-title"]}>
                  Chi tiết đơn hàng #{orderDetail.order?.id}
                </h3>
                
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
                  <h4>Thông tin giao hàng</h4>
                  <p><strong>Người nhận:</strong> {orderDetail.order?.full_name}</p>
                  <p><strong>Số điện thoại:</strong> {orderDetail.order?.phone}</p>
                  <p><strong>Địa chỉ:</strong> {orderDetail.order?.address}</p>
                  {orderDetail.order?.note && (
                    <p><strong>Ghi chú:</strong> {orderDetail.order?.note}</p>
                  )}
                </div>

                <div className={style["detail-section"]}>
                  <h4>Sản phẩm đã đặt</h4>
                  <div className={style["order-items"]}>
                    {orderDetail.items?.map((item) => (
                      <div key={item.id} className={style["order-item"]}>
                        <img
                          src={item.product?.thumbnail || "/assets/images/menu.jpg"}
                          alt={item.product?.name}
                        />
                        <div className={style["item-info"]}>
                          <span className={style["item-name"]}>{item.product?.name}</span>
                          <span className={style["item-qty"]}>
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
                  <h4>Thanh toán</h4>
                  <div className={style["payment-info"]}>
                    <div className={style["payment-row"]}>
                      <span>Phương thức:</span>
                      <span>
                        {(() => {
                          const method = orderDetail.order?.payment_method || orderDetail.payment?.method || "COD";
                          if (method === "COD") return "Thanh toán khi nhận hàng";
                          if (method === "bank_transfer") return "Chuyển khoản ngân hàng";
                          if (method === "momo") return "Ví MoMo";
                          return method;
                        })()}
                      </span>
                    </div>
                    {/* Tính tạm tính từ items */}
                    {orderDetail.items && orderDetail.items.length > 0 && (
                      <div className={style["payment-row"]}>
                        <span>Tạm tính:</span>
                        <span>
                          {formatPrice(
                            orderDetail.items.reduce(
                              (sum, item) => sum + (item.unit_price * item.quantity),
                              0
                            )
                          )}
                        </span>
                      </div>
                    )}
                    {orderDetail.order?.discount > 0 && (
                      <div className={style["payment-row"]}>
                        <span>Giảm giá:</span>
                        <span className={style["discount"]}>-{formatPrice(orderDetail.order?.discount)}</span>
                      </div>
                    )}
                    <div className={style["payment-row"] + " " + style["total-row"]}>
                      <span>Tổng cộng:</span>
                      <strong>
                        {formatPrice(
                          orderDetail.order?.total || 
                          (orderDetail.items?.reduce(
                            (sum, item) => sum + (item.unit_price * item.quantity),
                            0
                          ) - (orderDetail.order?.discount || 0))
                        )}
                      </strong>
                    </div>
                  </div>
                </div>

                {orderDetail.order?.status !== "completed" && orderDetail.order?.status !== "cancelled" && (
                  <div className={style["modal-actions"]}>
                    <label>Cập nhật trạng thái:</label>
                    <select
                      value={orderDetail.order?.status}
                      onChange={(e) => handleUpdateStatus(orderDetail.order?.id, e.target.value)}
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            ) : (
              <p>Không thể tải chi tiết đơn hàng</p>
            )}
          </div>
        </div>
      )}

      {modal.isOpen && (
        <ModalGeneral
          isOpen={modal.isOpen}
          text={modal.text}
          type={modal.type}
          onClose={() => setModal({ isOpen: false })}
        />
      )}
    </div>
  );
}

export default ManageOrders;

