package controllers

import (
	"strings"
	"time"

	"goravel/app/models"
	"strconv"

	"github.com/golang-jwt/jwt/v5"
	"github.com/goravel/framework/contracts/http"
	"github.com/goravel/framework/facades"
)

type AuthController struct {
}

func (auth *AuthController) Register(ctx http.Context) http.Response {
	var err error
	validator, err := ctx.Request().Validate(map[string]string{
		"email":            "required|email",
		"name":             "required|string",
		"phone":            "required|string",
		"address":          "required|string",
		"gender":           "required|string",
		"date_of_birth":    "required|date",
		"password":         "required|min_len:8",
		"confirm_password": "required|min_len:8",
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

	if ctx.Request().Input("password") != ctx.Request().Input("confirm_password") {
		return ctx.Response().Json(422, map[string]interface{}{
			"message": "Password and confirm password do not match",
		})
	}

	tx, err := facades.Orm().Query().Begin()
	if err != nil {
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Internal server error",
			"error":   err.Error(),
		})
	}

	hashedPassword, _ := facades.Hash().Make(ctx.Request().Input("password"))

	// Parse date of birth
	dateOfBirthStr := ctx.Request().Input("date_of_birth")
	dateOfBirth, err := time.Parse("2006-01-02", dateOfBirthStr)
	if err != nil {
		return ctx.Response().Json(422, map[string]interface{}{
			"message": "Invalid date format. Please use YYYY-MM-DD",
			"error":   err.Error(),
		})
	}

	user := models.Auth{
		Email:       ctx.Request().Input("email"),
		Password:    hashedPassword,
		FullName:    ctx.Request().Input("name"),
		Phone:       ctx.Request().Input("phone"),
		Address:     ctx.Request().Input("address"),
		Gender:      ctx.Request().Input("gender"),
		DateOfBirth: &dateOfBirth,
	}

	if err = tx.Create(&user); err != nil {
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
		"message": "User registered successfully",
	})
}

func (auth *AuthController) Login(ctx http.Context) http.Response {
	var err error
	validator, err := ctx.Request().Validate(map[string]string{
		"email":    "required|email",
		"password": "required|min_len:8",
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

	user := models.Auth{
		Email: ctx.Request().Input("email"),
	}

	if err := facades.Orm().Query().Where("email", user.Email).First(&user); err != nil {
		return ctx.Response().Json(404, map[string]interface{}{
			"message": "User not found",
			"error":   err.Error(),
		})
	}

	if !facades.Hash().Check(ctx.Request().Input("password"), user.Password) {
		return ctx.Response().Json(401, map[string]interface{}{
			"message": "Invalid password",
			"error":   "Invalid password",
		})
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":  user.ID,
		"role": user.Role,
		"exp":  time.Now().Add(time.Hour * 24).Unix(),
	})
	tokenString, err := token.SignedString([]byte(facades.Config().GetString("jwt.secret")))
	if err != nil {
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Internal server error",
			"error":   err.Error(),
		})
	}

	// Create the refresh token
	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": user.ID,
		"exp": time.Now().Add(time.Hour * 24 * 30).Unix(), // expiration time for refresh token (e.g., 30 days)
	})

	refreshTokenString, err := refreshToken.SignedString([]byte(facades.Config().GetString("jwt.secret")))
	if err != nil {
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Internal server error",
			"error":   err.Error(),
		})
	}

	return ctx.Response().Json(200, map[string]interface{}{
		"message":      "Login successful",
		"token":        tokenString,
		"refreshToken": refreshTokenString,
		"role":         user.Role,
		"user":         user,
	})
}

// POST /logout
func (c *AuthController) Logout(ctx http.Context) http.Response {
	authHeader := ctx.Request().Header("Authorization")
	if authHeader == "" {
		return ctx.Response().Json(http.StatusUnauthorized, http.Json{
			"message": "Missing token",
		})
	}

	token := strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer"))
	if strings.HasPrefix(strings.ToLower(authHeader), "bearer ") {
		token = strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer "))
	}
	if token == "" {
		return ctx.Response().Json(http.StatusUnauthorized, http.Json{
			"message": "Invalid token",
		})
	}

	facades.Cache().Put("blacklist:"+token, "true", time.Hour*24)

	return ctx.Response().Json(http.StatusOK, http.Json{
		"message": "Logged out successfully",
	})
}

// Helper function to extract user_id from JWT token
func getUserIDFromToken(ctx http.Context) (int64, error) {
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

// GET /user/profile - Lấy thông tin user hiện tại
func (c *AuthController) GetProfile(ctx http.Context) http.Response {
	userID, err := getUserIDFromToken(ctx)
	if err != nil || userID == 0 {
		return ctx.Response().Json(401, http.Json{
			"message": "Unauthorized - user not found",
		})
	}

	var user models.Auth
	if err := facades.Orm().Query().Where("id", userID).First(&user); err != nil {
		return ctx.Response().Json(404, http.Json{
			"message": "User not found",
		})
	}

	// Don't return password
	return ctx.Response().Json(200, map[string]interface{}{
		"message": "Profile fetched successfully",
		"data": map[string]interface{}{
			"id":            user.ID,
			"email":         user.Email,
			"full_name":     user.FullName,
			"phone":         user.Phone,
			"gender":        user.Gender,
			"date_of_birth": user.DateOfBirth,
			"address":       user.Address,
			"role":          user.Role,
			"is_active":     user.IsActive,
			"created_at":    user.CreatedAt,
		},
	})
}

func (c *AuthController) UpdateProfile(ctx http.Context) http.Response {
	var err error

	// Try to get user_id from token first, fallback to request body
	userID, _ := getUserIDFromToken(ctx)
	if userID == 0 {
		userIDStr := ctx.Request().Input("user_id")
		userID, err = strconv.ParseInt(userIDStr, 10, 64)
		if err != nil {
			return ctx.Response().Json(422, http.Json{
				"message": "Invalid user_id",
			})
		}
	}

	validator, err := ctx.Request().Validate(map[string]string{
		"name":          "required|string",
		"phone":         "required|string",
		"address":       "string",
		"gender":        "required|string",
		"date_of_birth": "date",
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

	updateData := map[string]interface{}{
		"full_name": ctx.Request().Input("name"),
		"phone":     ctx.Request().Input("phone"),
		"gender":    ctx.Request().Input("gender"),
	}

	// Only update address if provided
	if address := ctx.Request().Input("address"); address != "" {
		updateData["address"] = address
	}

	// Parse date of birth if provided
	dateOfBirthStr := ctx.Request().Input("date_of_birth")
	if dateOfBirthStr != "" {
		dateOfBirth, err := time.Parse("2006-01-02", dateOfBirthStr)
		if err != nil {
			return ctx.Response().Json(422, map[string]interface{}{
				"message": "Invalid date format. Please use YYYY-MM-DD",
				"error":   err.Error(),
			})
		}
		updateData["date_of_birth"] = &dateOfBirth
	}

	if _, err := facades.Orm().Query().Model(&models.Auth{}).Where("id", userID).Update(updateData); err != nil {
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Internal server error",
			"error":   err.Error(),
		})
	}
	return ctx.Response().Json(200, map[string]interface{}{
		"message": "Profile updated successfully",
	})
}
