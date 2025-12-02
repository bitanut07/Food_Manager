package controllers

import (
	"strconv"

	"github.com/goravel/framework/contracts/http"

	"goravel/app/models"

	"time"

	"github.com/goravel/framework/facades"
)

type ReservationController struct {
}

func (r *ReservationController) Create(ctx http.Context) http.Response {
	var err error
	validator, err := ctx.Request().Validate(map[string]string{
		"phone_number":     "required|string",
		"guest_name":       "required|string",
		"email":            "required|email",
		"date":             "required|date",
		"time":             "required|string",
		"number_of_guests": "required|integer",
		"note":             "string",
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

	reservationDateStr := ctx.Request().Input("date")
	reservationDate, err := time.Parse("2006-01-02", reservationDateStr)
	if err != nil {
		return ctx.Response().Json(422, map[string]interface{}{
			"message": "Invalid reservation date",
			"error":   err.Error(),
		})
	}
	reservationTimeStr := ctx.Request().Input("time")
	if _, err := time.Parse("15:04", reservationTimeStr); err != nil {
		return ctx.Response().Json(422, map[string]interface{}{
			"message": "Invalid reservation time",
			"error":   err.Error(),
		})
	}
	guestCountStr := ctx.Request().Input("number_of_guests")
	guestCount, err := strconv.Atoi(guestCountStr)
	if err != nil {
		return ctx.Response().Json(422, map[string]interface{}{
			"message": "Invalid guest count",
			"error":   err.Error(),
		})
	}

	Reservation := models.Reservation{
		PhoneNumber:     ctx.Request().Input("phone_number"),
		FullName:        ctx.Request().Input("guest_name"),
		Email:           ctx.Request().Input("email"),
		ReservationDate: reservationDate,
		ReservationTime: reservationTimeStr,
		GuestCount:      guestCount,
		Notes:           ctx.Request().Input("note"),
		Status:          "P",
	}
	if err := tx.Create(&Reservation); err != nil {
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
		"message": "Reservation created successfully",
		"data":    Reservation,
	})
}

func (r *ReservationController) GetByPhoneNumber(ctx http.Context) http.Response {
	phoneNumber := ctx.Request().Input("phone_number")
	var Reservation models.Reservation
	if err := facades.Orm().Query().Model(&models.Reservation{}).Where("phone_number = ?", phoneNumber).First(&Reservation); err != nil {
		return ctx.Response().Json(404, map[string]interface{}{
			"message": "Reservation not found",
		})
	}
	return ctx.Response().Json(200, map[string]interface{}{"message": "Reservation found successfully", "data": &Reservation})
}

func (r *ReservationController) GetByFilterDate(ctx http.Context) http.Response {
	dateString := ctx.Request().Route("date")
	date, err := time.Parse("2006-01-02", dateString)
	if err != nil {
		return ctx.Response().Json(422, map[string]interface{}{
			"message": "Invalid date",
			"error":   err.Error(),
		})
	}
	var Reservations []models.Reservation
	if err := facades.Orm().Query().Model(&models.Reservation{}).Where("reservation_date = ?", date).Order("status DESC").Find(&Reservations); err != nil {
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Internal server error",
			"error":   err.Error(),
		})
	}
	return ctx.Response().Json(200, map[string]interface{}{"message": "Reservations found successfully", "data": &Reservations})
}
