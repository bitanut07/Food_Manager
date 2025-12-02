import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import style from "../Employee/EmployeeReservation/ExportInvoice.module.css";
import CryptoJS from "crypto-js";
import {PRIVATE_KEY} from "../../Config/PrivateKey"

const QRCodeGenerator = ({ invoiceID }) => {
  const encryptData = (data, secretKey) => {
    // Mã hóa dữ liệu
  const encrypted = CryptoJS.AES.encrypt(data, secretKey).toString();

  // Chuyển đổi mã hóa sang dạng Base64 URL-safe
  const urlSafeEncrypted = encrypted
    .replace(/\+/g, '-') // Thay dấu '+' bằng '-'
    .replace(/\//g, '_') // Thay dấu '/' bằng '_'
    .replace(/=+$/, '');  // Loại bỏ dấu '=' ở cuối

  return urlSafeEncrypted;
  };
  
  const qrData = `${window.location.origin}/review/${encryptData(invoiceID.toString(), PRIVATE_KEY)}`;

  return (
    <div className={style['qr-ctn']}>
      <p>Quét mã để đánh giá nhà hàng của chúng tôi</p>
      <QRCodeSVG value={qrData} size={180} />
    </div>
  );
};

export default QRCodeGenerator;
