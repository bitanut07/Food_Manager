package controllers

import (
	"goravel/app/models"
	"strconv"

	"github.com/goravel/framework/contracts/http"
	"github.com/goravel/framework/facades"
)

type BookingTableController struct {
}

func (b *BookingTableController) Create(ctx http.Context) http.Response {

	validator, err := ctx.Request().Validate(map[string]string{
		"table_size": "required|string",
		"status":     "required|string",
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

	tableSizeStr := ctx.Request().Input("table_size")
	tableSize, err := strconv.Atoi(tableSizeStr)
	if err != nil {
		return ctx.Response().Json(422, map[string]interface{}{
			"message": "Invalid table size",
			"error":   err.Error(),
		})
	}
	bookingTable := models.BookingTable{
		TableSize: tableSize,
		Status:    ctx.Request().Input("status"),
	}
	if err := tx.Create(&bookingTable); err != nil {
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
		"message": "Booking table created successfully",
		"data":    bookingTable,
	})
}

func (b *BookingTableController) GetAll(ctx http.Context) http.Response {
	bookingTables := []models.BookingTable{}
	if err := facades.Orm().Query().Find(&bookingTables); err != nil {
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Internal server error",
			"error":   err.Error(),
		})
	}
	return ctx.Response().Json(200, map[string]interface{}{
		"message": "Booking tables fetched successfully",
		"data":    bookingTables,
	})
}
