package routes

import (
	"github.com/goravel/framework/facades"

	"goravel/app/http/controllers"
	"goravel/app/http/middleware"
)

func Api() {
	configController := controllers.ConfigController{}
	facades.Route().Get("/config/restaurant-configs", configController.RestaurantInfo)

	categoryController := controllers.CategoryController{}
	// Categories routes - protected routes need auth
	facades.Route().Get("/categories", categoryController.GetAll)
	facades.Route().Middleware(middleware.Admin()).Post("/categories", categoryController.Create)
	facades.Route().Middleware(middleware.Admin()).Put("/categories/{id}", categoryController.Update)
	facades.Route().Middleware(middleware.Admin()).Delete("/categories/{id}", categoryController.Delete)

	// Products routes
	productController := controllers.ProductController{}
	facades.Route().Middleware(middleware.Admin()).Post("/products", productController.Create)
	facades.Route().Get("/products", productController.GetAll)
	facades.Route().Get("/products/{id}", productController.GetById)
	facades.Route().Middleware(middleware.Admin()).Delete("/products/{id}", productController.Remove)
	facades.Route().Middleware(middleware.Admin()).Put("/products/{id}", productController.Update)
	facades.Route().Middleware(middleware.Admin()).Post("/products/add", productController.AddProducts)

	// Cart routes
	cartController := controllers.CartController{}
	facades.Route().Middleware(middleware.Auth()).Post("/cart/init", cartController.InitCart)
	facades.Route().Middleware(middleware.Auth()).Get("/cart", cartController.GetCartByUserID)
	facades.Route().Middleware(middleware.Auth()).Post("/cart/add-item", cartController.AddItemToCart)
	facades.Route().Middleware(middleware.Auth()).Put("/cart/update-item", cartController.UpdateCartItem)
	facades.Route().Middleware(middleware.Auth()).Delete("/cart/remove-item/:item_id", cartController.RemoveItemFromCart)

	// Voucher routes
	voucherController := controllers.VoucherController{}
	facades.Route().Middleware(middleware.Admin()).Post("/vouchers", voucherController.Create)
	facades.Route().Get("/vouchers", voucherController.GetAll)
	facades.Route().Get("/vouchers/{id}", voucherController.GetById)
	facades.Route().Middleware(middleware.Admin()).Put("/vouchers/{id}", voucherController.Update)
	facades.Route().Middleware(middleware.Admin()).Delete("/vouchers/{id}", voucherController.Delete)
	facades.Route().Middleware(middleware.Auth()).Post("/vouchers/assign", voucherController.UserAddVoucher)

	// Reservation routes
	reservationController := controllers.ReservationController{}
	facades.Route().Post("/reservations", reservationController.Create)
	facades.Route().Get("/reservations/phone/{phone_number}", reservationController.GetByPhoneNumber)
	facades.Route().Get("/reservations/date/{date}", reservationController.GetByFilterDate)

	// Booking table routes
	bookingTableController := controllers.BookingTableController{}
	facades.Route().Middleware(middleware.Admin()).Post("/tables", bookingTableController.Create)
	facades.Route().Get("/tables", bookingTableController.GetAll)

	// Order routes
	orderController := controllers.OrderController{}
	facades.Route().Middleware(middleware.Auth()).Post("/orders", orderController.CreateOrder)
	facades.Route().Middleware(middleware.Auth()).Get("/orders", orderController.GetUserOrders)
	facades.Route().Middleware(middleware.Auth()).Get("/orders/:id", orderController.GetOrderById)
	facades.Route().Middleware(middleware.Auth()).Put("/orders/:id/cancel", orderController.CancelOrder)
	facades.Route().Middleware(middleware.Admin()).Get("/admin/orders", orderController.GetAllOrders)
	facades.Route().Middleware(middleware.Admin()).Put("/admin/orders/:id/status", orderController.UpdateOrderStatus)
	facades.Route().Get("/payment-methods", orderController.GetPaymentMethods)

	// Sales reports routes
	facades.Route().Middleware(middleware.Admin()).Get("/reservations-orders", orderController.GetSalesReport)
	facades.Route().Middleware(middleware.Admin()).Get("/admin/revenue-stats", orderController.GetRevenueStats)

	// User vouchers routes
	facades.Route().Middleware(middleware.Auth()).Get("/user/vouchers", voucherController.GetUserVouchers)
}
