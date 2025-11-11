package controllers

import (
	"github.com/goravel/framework/contracts/http"

	"goravel/app/models"

	"strconv"
	"strings"

	"github.com/goravel/framework/facades"
)

type ProductController struct {
}

func (product *ProductController) Create(ctx http.Context) http.Response {
	var err error
	validator, err := ctx.Request().Validate(map[string]string{
		"name":        "required|string",
		"description": "required|string",
		"price":       "required|numeric",
		"thumbnail":   "required|string",
		"image":       "required|array",
		"status":      "required|boolean",
		"category_id": "required|integer",
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

	priceStr := ctx.Request().Input("price")
	price, err := strconv.ParseFloat(priceStr, 64)
	if err != nil {
		return ctx.Response().Json(422, http.Json{
			"message": "Invalid price",
		})
	}

	categoryStr := ctx.Request().Input("category_id")
	categoryID, err := strconv.ParseInt(categoryStr, 10, 64)
	if err != nil {
		return ctx.Response().Json(422, http.Json{
			"message": "Invalid category_id",
		})
	}

	// status là string theo model
	status := ctx.Request().Input("status")

	// image: nếu gửi JSON array, nên bind từ body JSON; tạm đọc từ form, phân tách bởi dấu phẩy
	images := strings.Split(strings.TrimSpace(ctx.Request().Input("image")), ",")

	productModel := models.Product{
		Name:        ctx.Request().Input("name"),
		Description: ctx.Request().Input("description"),
		Price:       price, // float64
		Thumbnail:   ctx.Request().Input("thumbnail"),
		Image:       images,     // []string
		Status:      status,     // string
		CategoryID:  categoryID, // int64
	}

	if err = tx.Create(&productModel); err != nil {
		tx.Rollback()
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Internal server error",
			"error":   err.Error(),
		})
	}

	if err = tx.Commit(); err != nil {
		tx.Rollback()
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Internal server error",
			"error":   err.Error(),
		})
	}

	return ctx.Response().Json(200, map[string]interface{}{
		"message": "Product created successfully",
		"data":    productModel,
	})
}
