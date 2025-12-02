package controllers

import (
	"github.com/goravel/framework/contracts/http"

	"goravel/app/models"

	"strconv"

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
		"status":      "required|boolean",
		"category_id": "required",
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
	status := ctx.Request().Input("status") == "true" // bool

	productModel := models.Product{
		Name:        ctx.Request().Input("name"),
		Description: ctx.Request().Input("description"),
		Price:       price, // float64
		Thumbnail:   ctx.Request().Input("thumbnail"),
		Status:      status,     // bool
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

func (product *ProductController) GetAll(ctx http.Context) http.Response {
	products := []models.Product{}
	if err := facades.Orm().Query().Model(&models.Product{}).Find(&products); err != nil {
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Internal server error",
			"error":   err.Error(),
		})
	}
	return ctx.Response().Json(200, map[string]interface{}{
		"message": "Products fetched successfully",
		"data":    products,
	})
}

func (product *ProductController) GetById(ctx http.Context) http.Response {
	var err error

	productModel := models.Product{}
	if err = facades.Orm().Query().Model(&models.Product{}).Where("id", ctx.Request().Input("id")).First(&productModel); err != nil {
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Internal server error",
			"err":     err.Error(),
		})
	}

	return ctx.Response().Json(200, map[string]interface{}{
		"message": "Product fetched successfully",
		"data":    productModel,
	})
}

func (product *ProductController) Remove(ctx http.Context) http.Response {
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

	idStr := ctx.Request().Input("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
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
	if _, err = tx.Model(&models.Product{}).Where("id", id).Delete(); err != nil {
		tx.Rollback()
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Failed to delete Product",
			"error":   err.Error(),
		})
	}
	if err = tx.Commit(); err != nil {
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Internal server error",
			"error":   err.Error(),
		})
	}

	return ctx.Response().Json(200, map[string]interface{}{
		"message": "Product deleted successfully",
	})
}

func (product *ProductController) Update(ctx http.Context) http.Response {
	var err error
	validator, err := ctx.Request().Validate(map[string]string{
		"id":          "required",
		"name":        "required|string",
		"description": "required|string",
		"price":       "required|numeric",
		"thumbnail":   "required|string",
		"status":      "required|boolean",
		"category_id": "required",
	})
	if err != nil {
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Internal server error",
			"err":     err.Error(),
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
			"err":     err.Error(),
		})
	}

	//Chuyển price từ string về float64
	priceStr := ctx.Request().Input("price")
	price, err := strconv.ParseFloat(priceStr, 64)
	if err != nil {
		return ctx.Response().Json(422, http.Json{
			"message": "Invalid price",
		})
	}

	idStr := ctx.Request().Input("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		return ctx.Response().Json(422, http.Json{
			"message": "Invalid id",
		})
	}
	// status là string theo model
	status := ctx.Request().Input("status") == "true" // bool

	productUpdate := models.Product{
		Name:        ctx.Request().Input("name"),
		Description: ctx.Request().Input("description"),
		Price:       price, // float64
		Thumbnail:   ctx.Request().Input("thumbnail"),
		Status:      status, // bool
	}

	if _, err := tx.Model(&models.Product{}).Where("id", id).Update(&productUpdate); err != nil {
		tx.Rollback()
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Update product failed",
			"err":     err.Error(),
		})
	}

	if err = tx.Commit(); err != nil {
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Internal server error",
			"err":     err.Error(),
		})
	}

	return ctx.Response().Json(200, map[string]interface{}{
		"message": "Updated product successfully",
		"data":    productUpdate,
	})
}
func (product *ProductController) AddProducts(ctx http.Context) http.Response {
	type ProductItem struct {
		Name        string  `json:"name" validate:"required|string"`
		Description string  `json:"description" validate:"required|string"`
		Price       float64 `json:"price" validate:"required|numeric"`
		Thumbnail   string  `json:"thumbnail" validate:"required|string"`
		Status      bool    `json:"status" validate:"required|bool"`
	}
	type ProductsRequest struct {
		Products []ProductItem `json:"products" validate:"required,dive"`
	}
	var productArr ProductsRequest
	err := ctx.Request().Bind(&productArr)
	if err != nil {
		return ctx.Response().Json(400, map[string]interface{}{
			"message": "Failed to Bind Product array",
			"error":   err.Error(),
		})
	}

	tx, err := facades.Orm().Query().Begin()
	if err != nil {
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Internal server error",
			"error":   err.Error(),
		})
	}

	categoryStr := ctx.Request().Input("category_id")
	categoryID, err := strconv.ParseInt(categoryStr, 10, 64)
	if err != nil {
		return ctx.Response().Json(422, http.Json{
			"message": "Invalid category_id",
		})
	}

	for _, item := range productArr.Products {
		productModel := models.Product{
			Name:        item.Name,
			Description: item.Description,
			Price:       item.Price, // float64
			Thumbnail:   item.Thumbnail,
			Status:      item.Status, // bool
			CategoryID:  categoryID,  // int64
		}

		if err = tx.Create(&productModel); err != nil {
			tx.Rollback()
			return ctx.Response().Json(500, map[string]interface{}{
				"message": "Internal server error",
				"error":   err.Error(),
			})
		}

	}
	if err = tx.Commit(); err != nil {
		tx.Rollback()
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Internal server error",
			"error":   err.Error(),
		})
	}

	return ctx.Response().Json(200, map[string]interface{}{
		"message": "Add products successfully",
	})

}
