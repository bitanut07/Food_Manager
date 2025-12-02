const express = require("express");
const axios = require("axios");
const CryptoJS = require("crypto-js");
const app = express();

app.use(express.json());

// Cấu hình
const partnerCode = "MOMO";
const accessKey = "F8BBA842ECF85";
const secretKey = "K951B6PE1waDMi640xX08PD3vg6EkVlz";
const redirectUrl = "https://yourdomain.com/payment/success";
const ipnUrl = "https://yourdomain.com/payment/notify";
const momoEndpoint = "https://test-payment.momo.vn/v2/gateway/api/create"; // Đổi thành production khi cần

// Tạo chữ ký HMAC SHA256
function generateSignature(rawSignature) {
  return CryptoJS.HmacSHA256(rawSignature, secretKey).toString(CryptoJS.enc.Hex);
}

// API Endpoint để tạo URL thanh toán MoMo
app.post("/api/momo/create", async (req, res) => {
  const { amount, orderId, orderInfo } = req.body; // Lấy dữ liệu từ React gửi lên

  // Tạo chữ ký
  const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${orderId}&requestType=captureMoMoWallet`;
  const signature = generateSignature(rawSignature);

  // Tạo request body gửi lên MoMo
  const requestBody = {
    partnerCode,
    accessKey,
    requestId: orderId,
    amount,
    orderId,
    orderInfo,
    redirectUrl,
    ipnUrl,
    extraData: "",
    requestType: "captureMoMoWallet",
    signature,
  };

  try {
    // Gửi request đến MoMo
    const response = await axios.post(momoEndpoint, requestBody, {
      headers: { "Content-Type": "application/json" },
    });
    res.json(response.data); // Trả kết quả về cho React
  } catch (error) {
    console.error("Lỗi khi gọi API MoMo:", error.message);
    res.status(500).json({ error: "Không thể tạo URL thanh toán MoMo" });
  }
});

// Chạy server
const PORT = 5000;
app.listen(PORT, () => console.log(`Server đang chạy trên cổng ${PORT}`));
