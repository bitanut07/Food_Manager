package controllers

import (
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/goravel/framework/contracts/http"

	"goravel/app/models"

	"strconv"

	"github.com/goravel/framework/facades"
)

type OrderController struct {
}

// Helper function to extract user_id from JWT token in request header
func getOrderUserIDFromRequest(ctx http.Context) (int64, error) {
	authHeader := ctx.Request().Header("Authorization")
	if authHeader == "" {
		return 0, nil
	}

	tokenString := strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer "))
	if tokenString == "" {
		return 0, nil
	}

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return []byte(facades.Config().GetString("jwt.secret")), nil
	})
	if err != nil || !token.Valid {
		return 0, err
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return 0, nil
	}

	subClaim, exists := claims["sub"]
	if !exists {
		return 0, nil
	}

	switch v := subClaim.(type) {
	case float64:
		return int64(v), nil
	case int64:
		return v, nil
	case int:
		return int64(v), nil
	}
	return 0, nil
}

// CreateOrder - Tạo đơn hàng từ giỏ hàng
func (o *OrderController) CreateOrder(ctx http.Context) http.Response {
	var err error
	validator, err := ctx.Request().Validate(map[string]string{
		"full_name":      "required|string",
		"phone":          "required|string",
		"address":        "required|string",
		"payment_method": "required|string",
		"note":           "string",
		"voucher_code":   "string",
	})
	if err != nil {
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Internal server error",
			"error":   err.Error(),
		})
	}
	if validator.Fails() {
		return ctx.Response().Json(422, map[string]interface{}{
			"message": "Validation failed",
			"errors":  validator.Errors().All(),
		})
	}

	// Get user_id from JWT token
	userID, tokenErr := getOrderUserIDFromRequest(ctx)
	if tokenErr != nil || userID == 0 {
		return ctx.Response().Json(401, map[string]interface{}{
			"message": "Unauthorized - user_id not found",
		})
	}

	// Validate payment method - only COD supported
	paymentMethod := ctx.Request().Input("payment_method")
	supportedMethods := map[string]bool{"COD": true}
	if !supportedMethods[paymentMethod] {
		return ctx.Response().Json(400, map[string]interface{}{
			"message":           "Phương thức thanh toán không được hỗ trợ",
			"supported_methods": []string{"COD"},
			"coming_soon":       []string{"MOMO", "BANK_TRANSFER"},
		})
	}

	// Find active cart for user
	var cart models.Carts
	if err := facades.Orm().Query().Where("user_id = ? AND status = ?", userID, "active").First(&cart); err != nil {
		return ctx.Response().Json(404, map[string]interface{}{
			"message": "Giỏ hàng trống",
		})
	}

	// Get cart items
	var cartItems []models.CartItem
	if err := facades.Orm().Query().Where("cart_id = ?", cart.ID).With("Product").Find(&cartItems); err != nil {
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Internal server error",
			"error":   err.Error(),
		})
	}

	if len(cartItems) == 0 {
		return ctx.Response().Json(400, map[string]interface{}{
			"message": "Giỏ hàng trống",
		})
	}

	// Calculate total
	var total float64
	for _, item := range cartItems {
		total += item.Product.Price * float64(item.Quantity)
	}

	// Apply voucher if provided
	var discount float64 = 0
	voucherCode := ctx.Request().Input("voucher_code")
	var userVoucher models.UserVouchers
	if voucherCode != "" {
		var voucher models.Vouchers
		if err := facades.Orm().Query().Where("code = ?", voucherCode).First(&voucher); err != nil {
			return ctx.Response().Json(404, map[string]interface{}{
				"message": "Mã giảm giá không tồn tại",
			})
		}

		// Check if user has this voucher and hasn't used it
		if err := facades.Orm().Query().Where("user_id = ? AND voucher_id = ? AND used = ?", userID, voucher.ID, false).First(&userVoucher); err != nil {
			return ctx.Response().Json(400, map[string]interface{}{
				"message": "Bạn không có mã giảm giá này hoặc đã sử dụng",
			})
		}

		// Check min order
		if total < voucher.MinOrder {
			return ctx.Response().Json(400, map[string]interface{}{
				"message":   "Đơn hàng chưa đạt giá trị tối thiểu để áp dụng mã giảm giá",
				"min_order": voucher.MinOrder,
			})
		}

		// Calculate discount
		if voucher.DiscountType == "percent" {
			discount = total * voucher.DiscountValue / 100
			if discount > voucher.MaxDiscount && voucher.MaxDiscount > 0 {
				discount = voucher.MaxDiscount
			}
		} else {
			discount = voucher.DiscountValue
		}
	}

	finalTotal := total - discount
	if finalTotal < 0 {
		finalTotal = 0
	}

	// Start transaction
	tx, err := facades.Orm().Query().Begin()
	if err != nil {
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Internal server error",
			"error":   err.Error(),
		})
	}

	// Create order
	order := models.Orders{
		UserID:        userID,
		FullName:      ctx.Request().Input("full_name"),
		Phone:         ctx.Request().Input("phone"),
		Address:       ctx.Request().Input("address"),
		Total:         finalTotal,
		Note:          ctx.Request().Input("note"),
		Discount:      discount,
		PaymentMethod: paymentMethod,
		Status:        "pending",
	}

	if err := tx.Create(&order); err != nil {
		tx.Rollback()
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Không thể tạo đơn hàng",
			"error":   err.Error(),
		})
	}

	// Create order items
	for _, item := range cartItems {
		orderItem := models.OrderItems{
			OrderID:   order.ID,
			ProductID: item.ProductID,
			Quantity:  item.Quantity,
			UnitPrice: item.Product.Price,
		}
		if err := tx.Create(&orderItem); err != nil {
			tx.Rollback()
			return ctx.Response().Json(500, map[string]interface{}{
				"message": "Không thể tạo chi tiết đơn hàng",
				"error":   err.Error(),
			})
		}
	}

	// Create payment record
	payment := models.Payment{
		OrderID: order.ID,
		Method:  paymentMethod,
		Amount:  finalTotal,
		Status:  "pending",
	}
	if err := tx.Create(&payment); err != nil {
		tx.Rollback()
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Không thể tạo thông tin thanh toán",
			"error":   err.Error(),
		})
	}

	// Mark voucher as used if applied
	if voucherCode != "" && userVoucher.ID > 0 {
		if _, err := tx.Model(&models.UserVouchers{}).Where("id = ?", userVoucher.ID).Update("used", true); err != nil {
			tx.Rollback()
			return ctx.Response().Json(500, map[string]interface{}{
				"message": "Không thể cập nhật trạng thái voucher",
				"error":   err.Error(),
			})
		}
	}

	// Delete cart items from old cart (order_items already saved the info)
	if _, err := tx.Model(&models.CartItem{}).Where("cart_id = ?", cart.ID).Delete(); err != nil {
		tx.Rollback()
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Không thể xóa cart items",
			"error":   err.Error(),
		})
	}

	// Delete old cart
	if _, err := tx.Model(&models.Carts{}).Where("id = ?", cart.ID).Delete(); err != nil {
		tx.Rollback()
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Không thể xóa giỏ hàng cũ",
			"error":   err.Error(),
		})
	}

	// Create new empty cart for user (each user has only 1 active cart)
	newCart := models.Carts{
		UserID: userID,
		Status: "active",
	}
	if err := tx.Create(&newCart); err != nil {
		tx.Rollback()
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Không thể tạo giỏ hàng mới",
			"error":   err.Error(),
		})
	}

	if err := tx.Commit(); err != nil {
		tx.Rollback()
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Internal server error",
			"error":   err.Error(),
		})
	}

	return ctx.Response().Json(200, map[string]interface{}{
		"message": "Đặt hàng thành công",
		"data": map[string]interface{}{
			"order_id":       order.ID,
			"total":          finalTotal,
			"discount":       discount,
			"payment_method": paymentMethod,
			"status":         order.Status,
		},
	})
}

// GetUserOrders - Lấy danh sách đơn hàng của user
func (o *OrderController) GetUserOrders(ctx http.Context) http.Response {
	userID, err := getOrderUserIDFromRequest(ctx)
	if err != nil || userID == 0 {
		return ctx.Response().Json(401, map[string]interface{}{
			"message": "Unauthorized - user_id not found",
		})
	}

	var orders []models.Orders
	if err := facades.Orm().Query().Where("user_id = ?", userID).Order("created_at desc").Find(&orders); err != nil {
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Internal server error",
			"error":   err.Error(),
		})
	}

	return ctx.Response().Json(200, map[string]interface{}{
		"message": "Lấy danh sách đơn hàng thành công",
		"data":    orders,
	})
}

// GetOrderById - Lấy chi tiết đơn hàng
func (o *OrderController) GetOrderById(ctx http.Context) http.Response {
	userID, err := getOrderUserIDFromRequest(ctx)
	if err != nil || userID == 0 {
		return ctx.Response().Json(401, map[string]interface{}{
			"message": "Unauthorized - user_id not found",
		})
	}
	orderIDStr := ctx.Request().Route("id")
	orderID, err := strconv.ParseInt(orderIDStr, 10, 64)
	if err != nil {
		return ctx.Response().Json(422, map[string]interface{}{
			"message": "Invalid order_id",
		})
	}

	var order models.Orders
	if err := facades.Orm().Query().Where("id = ? AND user_id = ?", orderID, userID).First(&order); err != nil {
		return ctx.Response().Json(404, map[string]interface{}{
			"message": "Đơn hàng không tồn tại",
		})
	}

	var orderItems []models.OrderItems
	if err := facades.Orm().Query().Where("order_id = ?", orderID).With("Product").Find(&orderItems); err != nil {
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Internal server error",
			"error":   err.Error(),
		})
	}

	var payment models.Payment
	facades.Orm().Query().Where("order_id = ?", orderID).First(&payment)

	return ctx.Response().Json(200, map[string]interface{}{
		"message": "Lấy chi tiết đơn hàng thành công",
		"data": map[string]interface{}{
			"order":   order,
			"items":   orderItems,
			"payment": payment,
		},
	})
}

// GetAllOrders - Admin lấy tất cả đơn hàng
func (o *OrderController) GetAllOrders(ctx http.Context) http.Response {
	var orders []models.Orders
	if err := facades.Orm().Query().Order("created_at desc").Find(&orders); err != nil {
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Internal server error",
			"error":   err.Error(),
		})
	}

	return ctx.Response().Json(200, map[string]interface{}{
		"message": "Lấy danh sách đơn hàng thành công",
		"data":    orders,
	})
}

// UpdateOrderStatus - Admin cập nhật trạng thái đơn hàng
func (o *OrderController) UpdateOrderStatus(ctx http.Context) http.Response {
	validator, err := ctx.Request().Validate(map[string]string{
		"status": "required|string",
	})
	if err != nil {
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Internal server error",
			"error":   err.Error(),
		})
	}
	if validator.Fails() {
		return ctx.Response().Json(422, map[string]interface{}{
			"message": "Validation failed",
			"errors":  validator.Errors().All(),
		})
	}

	orderIDStr := ctx.Request().Route("id")
	orderID, err := strconv.ParseInt(orderIDStr, 10, 64)
	if err != nil {
		return ctx.Response().Json(422, map[string]interface{}{
			"message": "Invalid order_id",
		})
	}

	status := ctx.Request().Input("status")
	validStatuses := map[string]bool{
		"pending":    true,
		"confirmed":  true,
		"preparing":  true,
		"delivering": true,
		"completed":  true,
		"cancelled":  true,
	}
	if !validStatuses[status] {
		return ctx.Response().Json(400, map[string]interface{}{
			"message":        "Trạng thái không hợp lệ",
			"valid_statuses": []string{"pending", "confirmed", "preparing", "delivering", "completed", "cancelled"},
		})
	}

	var order models.Orders
	if err := facades.Orm().Query().Where("id = ?", orderID).First(&order); err != nil {
		return ctx.Response().Json(404, map[string]interface{}{
			"message": "Đơn hàng không tồn tại",
		})
	}

	tx, err := facades.Orm().Query().Begin()
	if err != nil {
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Internal server error",
			"error":   err.Error(),
		})
	}

	if _, err := tx.Model(&models.Orders{}).Where("id = ?", orderID).Update("status", status); err != nil {
		tx.Rollback()
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Không thể cập nhật trạng thái đơn hàng",
			"error":   err.Error(),
		})
	}

	// Update payment status if order completed
	if status == "completed" {
		if _, err := tx.Model(&models.Payment{}).Where("order_id = ?", orderID).Update("status", "paid"); err != nil {
			tx.Rollback()
			return ctx.Response().Json(500, map[string]interface{}{
				"message": "Không thể cập nhật trạng thái thanh toán",
				"error":   err.Error(),
			})
		}
	}

	if err := tx.Commit(); err != nil {
		tx.Rollback()
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Internal server error",
			"error":   err.Error(),
		})
	}

	return ctx.Response().Json(200, map[string]interface{}{
		"message": "Cập nhật trạng thái đơn hàng thành công",
		"data": map[string]interface{}{
			"order_id": orderID,
			"status":   status,
		},
	})
}

// CancelOrder - User hủy đơn hàng
func (o *OrderController) CancelOrder(ctx http.Context) http.Response {
	userID, err := getOrderUserIDFromRequest(ctx)
	if err != nil || userID == 0 {
		return ctx.Response().Json(401, map[string]interface{}{
			"message": "Unauthorized - user_id not found",
		})
	}
	orderIDStr := ctx.Request().Route("id")
	orderID, err := strconv.ParseInt(orderIDStr, 10, 64)
	if err != nil {
		return ctx.Response().Json(422, map[string]interface{}{
			"message": "Invalid order_id",
		})
	}

	var order models.Orders
	if err := facades.Orm().Query().Where("id = ? AND user_id = ?", orderID, userID).First(&order); err != nil {
		return ctx.Response().Json(404, map[string]interface{}{
			"message": "Đơn hàng không tồn tại",
		})
	}

	// Only allow cancelling pending orders
	if order.Status != "pending" {
		return ctx.Response().Json(400, map[string]interface{}{
			"message": "Chỉ có thể hủy đơn hàng đang chờ xử lý",
		})
	}

	tx, err := facades.Orm().Query().Begin()
	if err != nil {
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Internal server error",
			"error":   err.Error(),
		})
	}

	if _, err := tx.Model(&models.Orders{}).Where("id = ?", orderID).Update("status", "cancelled"); err != nil {
		tx.Rollback()
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Không thể hủy đơn hàng",
			"error":   err.Error(),
		})
	}

	if _, err := tx.Model(&models.Payment{}).Where("order_id = ?", orderID).Update("status", "cancelled"); err != nil {
		tx.Rollback()
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Không thể cập nhật trạng thái thanh toán",
			"error":   err.Error(),
		})
	}

	if err := tx.Commit(); err != nil {
		tx.Rollback()
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Internal server error",
			"error":   err.Error(),
		})
	}

	return ctx.Response().Json(200, map[string]interface{}{
		"message": "Hủy đơn hàng thành công",
	})
}

// GetPaymentMethods - Lấy danh sách phương thức thanh toán
func (o *OrderController) GetPaymentMethods(ctx http.Context) http.Response {
	return ctx.Response().Json(200, map[string]interface{}{
		"message": "Danh sách phương thức thanh toán",
		"data": []map[string]interface{}{
			{
				"code":        "COD",
				"name":        "Thanh toán khi nhận hàng",
				"description": "Thanh toán bằng tiền mặt khi nhận hàng",
				"available":   true,
			},
			{
				"code":        "MOMO",
				"name":        "Ví MoMo",
				"description": "Thanh toán qua ví điện tử MoMo",
				"available":   false,
				"coming_soon": true,
			},
			{
				"code":        "BANK_TRANSFER",
				"name":        "Chuyển khoản ngân hàng",
				"description": "Thanh toán qua chuyển khoản ngân hàng",
				"available":   false,
				"coming_soon": true,
			},
		},
	})
}

// GetSalesReport - Lấy báo cáo doanh thu
func (o *OrderController) GetSalesReport(ctx http.Context) http.Response {
	// Lấy tất cả đơn hàng đã hoàn thành
	var orders []models.Orders
	if err := facades.Orm().Query().Where("status = ?", "completed").Find(&orders); err != nil {
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Internal server error",
			"error":   err.Error(),
		})
	}

	// Transform to invoice-like format for frontend compatibility
	var invoices []map[string]interface{}
	for _, order := range orders {
		invoices = append(invoices, map[string]interface{}{
			"id":          order.ID,
			"datetime":    order.CreatedAt,
			"final_price": order.Total,
			"status":      "P", // P = Paid (đã thanh toán)
			"user_id":     order.UserID,
			"full_name":   order.FullName,
			"phone":       order.Phone,
			"address":     order.Address,
			"discount":    order.Discount,
		})
	}

	return ctx.Response().Json(200, invoices)
}

// GetRevenueStats - Lấy thống kê doanh thu tổng hợp
func (o *OrderController) GetRevenueStats(ctx http.Context) http.Response {
	var orders []models.Orders
	if err := facades.Orm().Query().Where("status = ?", "completed").Find(&orders); err != nil {
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Internal server error",
			"error":   err.Error(),
		})
	}

	// Tính tổng doanh thu
	var totalRevenue float64
	var totalOrders int64
	var totalDiscount float64

	now := time.Now()

	for _, order := range orders {
		totalRevenue += order.Total
		totalDiscount += order.Discount
		totalOrders++
	}

	// Tính doanh thu theo tháng hiện tại
	var monthlyRevenue float64
	var monthlyOrders int64

	for _, order := range orders {
		if order.CreatedAt.Year() == now.Year() && order.CreatedAt.Month() == now.Month() {
			monthlyRevenue += order.Total
			monthlyOrders++
		}
	}

	// Tính doanh thu hôm nay
	var todayRevenue float64
	var todayOrders int64

	for _, order := range orders {
		if order.CreatedAt.Year() == now.Year() && order.CreatedAt.Month() == now.Month() && order.CreatedAt.Day() == now.Day() {
			todayRevenue += order.Total
			todayOrders++
		}
	}

	return ctx.Response().Json(200, map[string]interface{}{
		"message": "Thống kê doanh thu",
		"data": map[string]interface{}{
			"total_revenue":   totalRevenue,
			"total_orders":    totalOrders,
			"total_discount":  totalDiscount,
			"monthly_revenue": monthlyRevenue,
			"monthly_orders":  monthlyOrders,
			"today_revenue":   todayRevenue,
			"today_orders":    todayOrders,
		},
	})
}
