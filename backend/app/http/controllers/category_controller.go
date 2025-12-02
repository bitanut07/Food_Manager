package controllers

import (
	"goravel/app/models"
	"strconv"

	"github.com/goravel/framework/contracts/http"
	"github.com/goravel/framework/facades"
)

type CategoryController struct {
}

func (category *CategoryController) Create(ctx http.Context) http.Response {
	var err error
	validator, err := ctx.Request().Validate(map[string]string{
		"name": "required|string",
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

	categoryModel := models.Category{
		Name: ctx.Request().Input("name"),
	}

	if err = tx.Create(&categoryModel); err != nil {
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
		"message": "Category created successfully",
		"data":    categoryModel,
	})
}

func (category *CategoryController) Update(ctx http.Context) http.Response {
	var err error
	validator, err := ctx.Request().Validate(map[string]string{
		"name": "required|string",
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

	categoryModel := models.Category{
		Name: ctx.Request().Input("name"),
	}

	if _, err = tx.Model(&models.Category{}).Where("id", ctx.Request().Input("id")).Update(&categoryModel); err != nil {
		tx.Rollback()
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Failed to update category",
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
		"message": "Category updated successfully",
		"data":    categoryModel,
	})
}

func (category *CategoryController) Delete(ctx http.Context) http.Response {
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

	if _, err = tx.Model(&models.Category{}).Where("id", id).Delete(); err != nil {
		tx.Rollback()
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Failed to delete category",
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
		"message": "Category deleted successfully",
	})
}

func (category *CategoryController) GetAll(ctx http.Context) http.Response {
	var err error
	categories := []models.Category{}
	if err = facades.Orm().Query().Model(&models.Category{}).Find(&categories); err != nil {
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Internal server error",
			"error":   err.Error(),
		})
	}

	return ctx.Response().Json(200, map[string]interface{}{
		"message": "Categories fetched successfully",
		"data":    categories,
	})
}

func (category *CategoryController) GetById(ctx http.Context) http.Response {
	var err error
	idStr := ctx.Request().Input("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		return ctx.Response().Json(422, http.Json{
			"message": "Invalid id",
		})
	}

	categoryModel := models.Category{}
	if err = facades.Orm().Query().Model(&models.Category{}).Where("id", id).First(&categoryModel); err != nil {
		return ctx.Response().Json(500, map[string]interface{}{
			"message": "Internal server error",
			"error":   err.Error(),
		})
	}

	return ctx.Response().Json(200, map[string]interface{}{
		"message": "Category fetched successfully",
		"data":    categoryModel,
	})
}
