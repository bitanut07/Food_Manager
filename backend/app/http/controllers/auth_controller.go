package controllers

import (
	"strings"
	"time"

	"goravel/app/models"

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
		"sub": user.ID,
		"exp": time.Now().Add(time.Hour * 24).Unix(),
	})
	tokenString, err := token.SignedString([]byte(facades.Config().GetString("jwt.secret")))
	if err != nil {
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Internal server error",
			"error":   err.Error(),
		})
	}
	return ctx.Response().Json(200, map[string]interface{}{
		"message": "Login successful",
		"data":    user,
		"token":   tokenString,
		"role":    user.Role,
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
