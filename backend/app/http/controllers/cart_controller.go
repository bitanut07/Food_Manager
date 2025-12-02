package controllers

import (
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/goravel/framework/contracts/http"

	"goravel/app/models"

	"strconv"

	"github.com/goravel/framework/facades"
)

type CartController struct {
}

// Helper function to extract user_id from JWT token in request header
func getUserIDFromRequest(ctx http.Context) (int64, error) {
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

// InitCart - Khởi tạo hoặc lấy cart active của user (gọi khi login)
func (c *CartController) InitCart(ctx http.Context) http.Response {
	// Get user_id from JWT token
	userID, err := getUserIDFromRequest(ctx)
	if err != nil || userID == 0 {
		return ctx.Response().Json(401, map[string]interface{}{
			"message": "Unauthorized - user_id not found",
		})
	}

	// Check if user already has an active cart
	var cart models.Carts
	queryErr := facades.Orm().Query().Where("user_id = ? AND status = ?", userID, "active").First(&cart)

	if queryErr == nil {
		// Cart exists, get cart items
		var cartItems []models.CartItem
		if err := facades.Orm().Query().Where("cart_id = ?", cart.ID).With("Product").Find(&cartItems); err != nil {
			return ctx.Response().Json(500, map[string]interface{}{
				"message": "Internal server error",
				"error":   err.Error(),
			})
		}

		// Calculate total
		var total float64
		for _, item := range cartItems {
			total += item.Product.Price * float64(item.Quantity)
		}

		return ctx.Response().Json(200, map[string]interface{}{
			"message": "Cart retrieved successfully",
			"data": map[string]interface{}{
				"cart":   cart,
				"items":  cartItems,
				"length": len(cartItems),
				"total":  total,
			},
		})
	}

	// No active cart found, create new one
	newCart := models.Carts{
		UserID: userID,
		Status: "active",
	}
	if err := facades.Orm().Query().Create(&newCart); err != nil {
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Internal server error",
			"error":   err.Error(),
		})
	}

	return ctx.Response().Json(200, map[string]interface{}{
		"message": "Cart created successfully",
		"data": map[string]interface{}{
			"cart":   newCart,
			"items":  []models.CartItem{},
			"length": 0,
			"total":  0,
		},
	})
}

func (c *CartController) AddItemToCart(ctx http.Context) http.Response {
	// Bind JSON request body
	type AddItemRequest struct {
		ProductID int64 `json:"product_id"`
		Quantity  int   `json:"quantity"`
	}

	var req AddItemRequest
	if err := ctx.Request().Bind(&req); err != nil {
		return ctx.Response().Json(400, map[string]interface{}{
			"message": "Invalid request body",
			"error":   err.Error(),
		})
	}

	// Validate
	if req.ProductID <= 0 {
		return ctx.Response().Json(422, map[string]interface{}{
			"message": "product_id is required and must be greater than 0",
		})
	}
	if req.Quantity <= 0 {
		return ctx.Response().Json(422, map[string]interface{}{
			"message": "quantity is required and must be greater than 0",
		})
	}

	// Get user_id from JWT token
	userID, err := getUserIDFromRequest(ctx)
	if err != nil || userID == 0 {
		return ctx.Response().Json(401, map[string]interface{}{
			"message": "Unauthorized - user_id not found",
		})
	}

	productID := req.ProductID
	quantity := req.Quantity

	// Check if product exists
	var product models.Product
	if err := facades.Orm().Query().Where("id = ?", productID).First(&product); err != nil {
		return ctx.Response().Json(404, map[string]interface{}{
			"message": "Product not found",
		})
	}

	tx, err := facades.Orm().Query().Begin()
	if err != nil {
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Internal server error",
			"error":   err.Error(),
		})
	}

	// Find or create active cart for user
	var cart models.Carts
	if err := facades.Orm().Query().Where("user_id = ? AND status = ?", userID, "active").First(&cart); err != nil {
		cart = models.Carts{
			UserID: userID,
			Status: "active",
		}
		if err2 := facades.Orm().Query().Create(&cart); err2 != nil {
			tx.Rollback()
			return ctx.Response().Json(500, map[string]interface{}{
				"message": "Internal server error",
				"error":   err2.Error(),
			})
		}
	}

	// Check if item already exists in cart
	var existingItem models.CartItem
	facades.Orm().Query().Where("cart_id = ? AND product_id = ?", cart.ID, productID).First(&existingItem)

	// If item exists (ID > 0), update quantity
	if existingItem.ID > 0 {
		existingItem.Quantity += quantity
		if _, err := tx.Model(&models.CartItem{}).Where("id = ?", existingItem.ID).Update("quantity", existingItem.Quantity); err != nil {
			tx.Rollback()
			return ctx.Response().Json(500, map[string]interface{}{
				"message": "Internal server error",
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
			"message": "Cart item quantity updated",
			"data":    existingItem,
		})
	}

	// Create new cart item
	cartItem := models.CartItem{
		CartID:    cart.ID,
		ProductID: productID,
		Quantity:  quantity,
	}

	if err := tx.Create(&cartItem); err != nil {
		tx.Rollback()
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Internal server error",
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
		"message": "Item added to cart successfully",
		"data":    cartItem,
	})
}

// Lấy list item trong giỏ hàng theo user_id từ JWT token
func (c *CartController) GetCartByUserID(ctx http.Context) http.Response {
	// Get user_id from JWT token
	userID, err := getUserIDFromRequest(ctx)
	if err != nil || userID == 0 {
		return ctx.Response().Json(401, map[string]interface{}{
			"message": "Unauthorized - user_id not found",
		})
	}

	var cart models.Carts
	if err := facades.Orm().Query().Where("user_id = ? AND status = ?", userID, "active").First(&cart); err != nil {
		// Return empty cart if not found
		return ctx.Response().Json(200, map[string]interface{}{
			"message": "Cart is empty",
			"data": map[string]interface{}{
				"cart":   nil,
				"items":  []models.CartItem{},
				"length": 0,
				"total":  0,
			},
		})
	}

	var cartItems []models.CartItem
	if err := facades.Orm().Query().Where("cart_id = ?", cart.ID).With("Product").Find(&cartItems); err != nil {
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Internal server error",
			"error":   err.Error(),
		})
	}

	// Calculate total
	var total float64
	for _, item := range cartItems {
		total += item.Product.Price * float64(item.Quantity)
	}

	return ctx.Response().Json(200, map[string]interface{}{
		"message": "Cart fetched successfully",
		"data": map[string]interface{}{
			"cart":   cart,
			"items":  cartItems,
			"length": len(cartItems),
			"total":  total,
		},
	})
}

func (c *CartController) UpdateCartItem(ctx http.Context) http.Response {
	// Bind JSON request body
	type UpdateItemRequest struct {
		CartItemID int64 `json:"cart_item_id"`
		Quantity   int   `json:"quantity"`
	}

	var req UpdateItemRequest
	if err := ctx.Request().Bind(&req); err != nil {
		return ctx.Response().Json(400, map[string]interface{}{
			"message": "Invalid request body",
			"error":   err.Error(),
		})
	}

	// Validate
	if req.CartItemID <= 0 {
		return ctx.Response().Json(422, map[string]interface{}{
			"message": "cart_item_id is required and must be greater than 0",
		})
	}
	if req.Quantity <= 0 {
		return ctx.Response().Json(422, map[string]interface{}{
			"message": "quantity is required and must be greater than 0",
		})
	}

	cartItemID := req.CartItemID
	quantity := req.Quantity

	tx, err := facades.Orm().Query().Begin()
	if err != nil {
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Internal server error",
			"error":   err.Error(),
		})
	}

	cartItemUpdate := models.CartItem{
		Quantity: quantity,
	}

	if _, err := tx.Model(&models.CartItem{}).Where("id = ?", cartItemID).Update(cartItemUpdate); err != nil {
		tx.Rollback()
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Internal server error",
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
		"message": "Cart item updated successfully",
		"data":    cartItemUpdate,
	})
}

func (c *CartController) RemoveItemFromCart(ctx http.Context) http.Response {
	cartItemIDStr := ctx.Request().Route("item_id")
	cartItemID, err := strconv.ParseInt(cartItemIDStr, 10, 64)
	if err != nil {
		return ctx.Response().Json(422, map[string]interface{}{
			"message": "Invalid item_id",
		})
	}

	tx, err := facades.Orm().Query().Begin()
	if err != nil {
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Internal server error",
			"error":   err.Error(),
		})
	}

	if _, err := tx.Model(&models.CartItem{}).Where("id = ?", cartItemID).Delete(); err != nil {
		tx.Rollback()
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Internal server error",
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
		"message": "Cart item removed successfully",
	})
}
