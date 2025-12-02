package controllers

import (
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/goravel/framework/contracts/http"

	"goravel/app/models"
	"strconv"

	"time"

	"github.com/goravel/framework/facades"
)

type VoucherController struct {
}

// Helper function to extract user_id from JWT token in request header
func getVoucherUserIDFromRequest(ctx http.Context) (int64, error) {
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

func (v *VoucherController) Create(ctx http.Context) http.Response {
	var err error
	validator, err := ctx.Request().Validate(map[string]string{
		"code":                 "required|string",
		"description":          "required|string",
		"discount_type":        "required|string",
		"discount_value":       "required|numeric",
		"min_order":            "required|numeric",
		"max_discount":         "required|numeric",
		"start_date":           "required|date",
		"end_date":             "required|date",
		"usage_limit_per_user": "required",
		"usage_limit_global":   "required",
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

	tx, err := facades.Orm().Query().Begin()
	if err != nil {
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Internal server error",
			"error":   err.Error(),
		})
	}

	DiscountValueStr := ctx.Request().Input("discount_value")
	DiscountValue, err := strconv.ParseFloat(DiscountValueStr, 64)
	if err != nil {
		return ctx.Response().Json(422, http.Json{
			"message": "Invalid discount_value",
		})
	}

	MinOrderStr := ctx.Request().Input("min_order")
	MinOrder, err := strconv.ParseFloat(MinOrderStr, 64)
	if err != nil {
		return ctx.Response().Json(422, http.Json{
			"message": "Invalid min_order",
		})
	}

	MaxDiscountStr := ctx.Request().Input("max_discount")
	MaxDiscount, err := strconv.ParseFloat(MaxDiscountStr, 64)
	if err != nil {
		return ctx.Response().Json(422, http.Json{
			"message": "Invalid max_discount",
		})
	}
	UsageLimitPerUserStr := ctx.Request().Input("usage_limit_per_user")
	UsageLimitPerUser, err := strconv.ParseInt(UsageLimitPerUserStr, 10, 64)
	if err != nil {
		return ctx.Response().Json(422, http.Json{
			"message": "Invalid usage_limit_per_user",
		})
	}
	UsageLimitGlobalStr := ctx.Request().Input("usage_limit_global")
	UsageLimitGlobal, err := strconv.ParseInt(UsageLimitGlobalStr, 10, 64)
	if err != nil {
		return ctx.Response().Json(422, http.Json{
			"message": "Invalid usage_limit_global",
		})
	}

	StartDateStr := ctx.Request().Input("start_date")
	EndDateStr := ctx.Request().Input("end_date")

	EndDate, err := time.Parse("2006-01-02", EndDateStr)
	if err != nil {
		return ctx.Response().Json(422, http.Json{
			"message": "Invalid end_date",
		})
	}
	StartDate, err := time.Parse("2006-01-02", StartDateStr)
	if err != nil {
		return ctx.Response().Json(422, http.Json{
			"message": "Invalid start_date",
		})
	}

	voucher := models.Vouchers{
		Code:              ctx.Request().Input("code"),
		Description:       ctx.Request().Input("description"),
		Image:             ctx.Request().Input("image"),
		DiscountType:      ctx.Request().Input("discount_type"),
		DiscountValue:     DiscountValue,
		MinOrder:          MinOrder,
		MaxDiscount:       MaxDiscount,
		StartDate:         StartDate,
		EndDate:           EndDate,
		UsageLimitPerUser: UsageLimitPerUser,
		UsageLimitGlobal:  UsageLimitGlobal,
	}
	if err := tx.Create(&voucher); err != nil {
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
		"message": "Voucher created successfully",
		"data":    voucher,
	})
}

func (v *VoucherController) UserAddVoucher(ctx http.Context) http.Response {
	var err error
	validator, err := ctx.Request().Validate(map[string]string{
		"voucher_code": "required|string",
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
	userID, tokenErr := getVoucherUserIDFromRequest(ctx)
	if tokenErr != nil || userID == 0 {
		return ctx.Response().Json(401, map[string]interface{}{
			"message": "Unauthorized - user_id not found",
		})
	}

	voucherCode := ctx.Request().Input("voucher_code")

	// Find voucher by code
	var voucher models.Vouchers
	if err := facades.Orm().Query().Where("code = ?", voucherCode).First(&voucher); err != nil {
		return ctx.Response().Json(404, map[string]interface{}{
			"message": "Voucher not found",
		})
	}

	// Check if voucher is still valid
	now := time.Now()
	if now.Before(voucher.StartDate) || now.After(voucher.EndDate) {
		return ctx.Response().Json(400, map[string]interface{}{
			"message": "Voucher is not valid at this time",
		})
	}

	// Check usage limit per user - count how many times user has this voucher (used or unused)
	var userVoucherCount int64
	userVoucherCount, err = facades.Orm().Query().Model(&models.UserVouchers{}).Where("user_id = ? AND voucher_id = ?", userID, voucher.ID).Count()
	if err != nil {
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Internal server error",
			"error":   err.Error(),
		})
	}

	// Check if user already has this voucher and hasn't used it yet
	if userVoucherCount > 0 {
		// Check if there's an unused voucher
		var unusedCount int64
		unusedCount, _ = facades.Orm().Query().Model(&models.UserVouchers{}).Where("user_id = ? AND voucher_id = ? AND used = ?", userID, voucher.ID, false).Count()
		if unusedCount > 0 {
			return ctx.Response().Json(400, map[string]interface{}{
				"message": "Bạn đã lưu voucher này và chưa sử dụng",
			})
		}
	}

	// Check if user reached usage limit
	if userVoucherCount >= voucher.UsageLimitPerUser {
		return ctx.Response().Json(400, map[string]interface{}{
			"message": "Bạn đã sử dụng hết số lần cho phép của voucher này",
		})
	}

	// Check global usage limit
	var globalVoucherCount int64
	globalVoucherCount, err = facades.Orm().Query().Model(&models.UserVouchers{}).Where("voucher_id = ?", voucher.ID).Count()
	if err != nil {
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Internal server error",
			"error":   err.Error(),
		})
	}
	if globalVoucherCount >= voucher.UsageLimitGlobal {
		return ctx.Response().Json(400, map[string]interface{}{
			"message": "This voucher has reached its global usage limit",
		})
	}

	userVoucher := models.UserVouchers{
		UserID:    userID,
		VoucherID: voucher.ID,
		Used:      false,
	}
	tx, err := facades.Orm().Query().Begin()
	if err != nil {
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Internal server error",
			"error":   err.Error(),
		})
	}
	if err := tx.Create(&userVoucher); err != nil {
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
		"message": "Voucher added to user successfully",
		"data":    userVoucher,
	})
}

func (v *VoucherController) GetAll(ctx http.Context) http.Response {
	var err error
	var vouchers []models.Vouchers

	if err = facades.Orm().Query().Model(&models.Vouchers{}).Find(&vouchers); err != nil {
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Internal server error",
			"err":     err.Error(),
		})
	}

	return ctx.Response().Json(200, map[string]interface{}{
		"message": "Vouchers fetched successfully",
		"data":    vouchers,
	})
}

func (v *VoucherController) GetUserVouchers(ctx http.Context) http.Response {
	// Get user_id from JWT token
	userID, err := getVoucherUserIDFromRequest(ctx)
	if err != nil || userID == 0 {
		return ctx.Response().Json(401, map[string]interface{}{
			"message": "Unauthorized - user_id not found",
		})
	}

	var userVouchers []models.UserVouchers

	if err := facades.Orm().Query().Model(&models.UserVouchers{}).Where("user_id = ?", userID).With("Voucher").Find(&userVouchers); err != nil {
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Internal server error",
			"err":     err.Error(),
		})
	}

	return ctx.Response().Json(200, map[string]interface{}{
		"message": "User Vouchers fetched successfully",
		"data":    userVouchers,
	})
}

func (v *VoucherController) GetById(ctx http.Context) http.Response {
	// Get id from route parameter
	idStr := ctx.Request().Route("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		return ctx.Response().Json(422, map[string]interface{}{
			"message": "Invalid voucher ID",
		})
	}

	var voucherModel models.Vouchers
	if err = facades.Orm().Query().Model(&models.Vouchers{}).Where("id = ?", id).First(&voucherModel); err != nil {
		return ctx.Response().Json(404, map[string]interface{}{
			"message": "Voucher not found",
		})
	}

	return ctx.Response().Json(200, map[string]interface{}{
		"message": "Voucher fetched successfully",
		"data":    voucherModel,
	})
}

func (v *VoucherController) Update(ctx http.Context) http.Response {
	var err error
	validator, err := ctx.Request().Validate(map[string]string{
		"id":                   "required",
		"code":                 "required|string",
		"description":          "required|string",
		"discount_type":        "required|string",
		"discount_value":       "required|numeric",
		"min_order":            "required|numeric",
		"max_discount":         "required|numeric",
		"start_date":           "required|date",
		"end_date":             "required|date",
		"usage_limit_per_user": "required",
		"usage_limit_global":   "required",
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

	voucherIDStr := ctx.Request().Input("id")
	voucherID, err := strconv.ParseInt(voucherIDStr, 10, 64)
	if err != nil {
		return ctx.Response().Json(422, http.Json{
			"message": "Invalid id",
		})
	}

	DiscountValueStr := ctx.Request().Input("discount_value")
	DiscountValue, err := strconv.ParseFloat(DiscountValueStr, 64)
	if err != nil {
		return ctx.Response().Json(422, http.Json{
			"message": "Invalid discount_value",
		})
	}

	MinOrderStr := ctx.Request().Input("min_order")
	MinOrder, err := strconv.ParseFloat(MinOrderStr, 64)
	if err != nil {
		return ctx.Response().Json(422, http.Json{
			"message": "Invalid min_order",
		})
	}

	MaxDiscountStr := ctx.Request().Input("max_discount")
	MaxDiscount, err := strconv.ParseFloat(MaxDiscountStr, 64)
	if err != nil {
		return ctx.Response().Json(422, http.Json{
			"message": "Invalid max_discount",
		})
	}
	UsageLimitPerUserStr := ctx.Request().Input("usage_limit_per_user")
	UsageLimitPerUser, err := strconv.ParseInt(UsageLimitPerUserStr, 10, 64)
	if err != nil {
		return ctx.Response().Json(422, http.Json{
			"message": "Invalid usage_limit_per_user",
		})
	}
	UsageLimitGlobalStr := ctx.Request().Input("usage_limit_global")
	UsageLimitGlobal, err := strconv.ParseInt(UsageLimitGlobalStr, 10, 64)
	if err != nil {
		return ctx.Response().Json(422, http.Json{
			"message": "Invalid usage_limit_global",
		})
	}

	StartDateStr := ctx.Request().Input("start_date")
	EndDateStr := ctx.Request().Input("end_date")
	EndDate, err := time.Parse("2006-01-02", EndDateStr)
	if err != nil {
		return ctx.Response().Json(422, http.Json{
			"message": "Invalid end_date",
		})
	}
	StartDate, err := time.Parse("2006-01-02", StartDateStr)
	if err != nil {
		return ctx.Response().Json(422, http.Json{
			"message": "Invalid start_date",
		})
	}

	voucher := models.Vouchers{
		ID:                voucherID,
		Code:              ctx.Request().Input("code"),
		Description:       ctx.Request().Input("description"),
		Image:             ctx.Request().Input("image"),
		DiscountType:      ctx.Request().Input("discount_type"),
		DiscountValue:     DiscountValue,
		MinOrder:          MinOrder,
		MaxDiscount:       MaxDiscount,
		StartDate:         StartDate,
		EndDate:           EndDate,
		UsageLimitPerUser: UsageLimitPerUser,
		UsageLimitGlobal:  UsageLimitGlobal,
	}

	tx, err := facades.Orm().Query().Begin()
	if err != nil {
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Internal server error",
			"error":   err.Error(),
		})
	}

	if _, err := tx.Model(&models.Vouchers{}).Where("id = ?", voucherID).Update(&voucher); err != nil {
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
		"message": "Voucher updated successfully",
		"data":    voucher,
	})
}
func (v *VoucherController) Delete(ctx http.Context) http.Response {
	var err error
	validator, err := ctx.Request().Validate(map[string]string{
		"id": "required",
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

	voucherIDStr := ctx.Request().Input("id")
	voucherID, err := strconv.ParseInt(voucherIDStr, 10, 64)
	if err != nil {
		return ctx.Response().Json(422, http.Json{
			"message": "Invalid id",
		})
	}
	tx, err := facades.Orm().Query().Begin()
	if err != nil {
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Internal server error",
			"error":   err.Error(),
		})
	}

	if _, err := tx.Model(&models.Vouchers{}).Where("id = ?", voucherID).Delete(); err != nil {
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
		"message": "Voucher deleted successfully",
	})
}
