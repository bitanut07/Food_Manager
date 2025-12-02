import React from "react";
import QRCodeGenerator from "../../Customer/QRReview";
import style from "./PrintInvoice.module.css";

const InvoicePrintable = ({ restaurantInfo, foodData, invoiceData, QR }) => {
  return (
    <div id="printable-area">
      {/* Thông tin nhà hàng */}
      <header className={style["Invoice-header"]}>
        <h2>{restaurantInfo?.name || "Nhà hàng Citrus Royale"}</h2>
        <p>{restaurantInfo?.address || "227 Đ. Nguyễn Văn Cừ, Phường 4, Quận 5, Hồ Chí Minh"}</p>
        <p>ĐT: {restaurantInfo?.phone || "0328840696"}</p>
        <h3>HÓA ĐƠN THANH TOÁN</h3>
      </header>

      {/* Thông tin hóa đơn */}
      <section className={style["Invoice-info"]}>
        <div className={style["Invoice-info-row"]}>
          <p>Ngày In: {new Date().toLocaleString()}</p>
          <p>Số HĐ: {invoiceData?.id}</p>
        </div>
        <div className={style["Invoice-info-row"]}>
          <p>Bàn: {invoiceData?.table}</p>
        </div>
      </section>

      {/* Danh sách món ăn */}
      <section className={style["Invoice-food-list"]}>
        <div className={style["Invoice-food-table-container"]}>
          <table className={style["Invoice-food-table"]}>
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Đơn giá</th>
                <th>Số lượng</th>
                <th>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {foodData.map((item, index) => (
                <tr key={index}>
                  <td>{item.menu_item_details.name}</td>
                  <td>{item.menu_item_details.price.toLocaleString()} đ</td>
                  <td>{item.quantity}</td>
                  <td>{item.total.toLocaleString()} đ</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tổng hợp */}
        <table className={style["Invoice-summary-table"]}>
          <tbody>
            <tr>
              <td className={style["Invoice-summary-label"]}>Tổng cộng:</td>
              <td className={style["Invoice-summary-value"]}>
                {invoiceData?.total_price.toLocaleString()} đ
              </td>
            </tr>
            <tr>
              <td className={style["Invoice-summary-label"]}>Ưu đãi:</td>
              <td className={style["Invoice-summary-value"]}>
                - {invoiceData?.total_discount.toLocaleString()} đ
              </td>
            </tr>
            <tr>
              <td className={style["Invoice-summary-label"]}>Tổng thanh toán:</td>
              <td className={style["Invoice-summary-value"]}>
                {invoiceData?.final_price.toLocaleString()} đ
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Footer */}
      <footer className={style["Invoice-footer"]}>
        <p className={style['Thank']}>Cảm ơn quý khách - Hẹn gặp lại</p>
        <div className={style["Invoice-qr-container"]}>
          <div className={style["Invoice-qr-item"]}>
            <QRCodeGenerator invoiceID={invoiceData?.id} />
          </div>
          <div className={style["Invoice-qr-item"]}>
            <p>Quét mã để chuyển khoản</p>
            <img
              src={QR}
              alt="QR Code chuyển khoản"
              className={style["qr-image"]}
            />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default InvoicePrintable;
