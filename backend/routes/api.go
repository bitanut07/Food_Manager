package routes

import (
	"github.com/goravel/framework/facades"

	"goravel/app/http/controllers"
)

func Api() {
	categoryController := controllers.CategoryController{}
	facades.Route().Post("/categories", categoryController.Create)
	facades.Route().Put("/categories/{id}", categoryController.Update)
	facades.Route().Delete("/categories/{id}", categoryController.Delete)
	facades.Route().Get("/categories", categoryController.GetAll)
	facades.Route().Get("/categories/{id}", categoryController.GetById)
	productController := controllers.ProductController{}
	facades.Route().Post("/products", productController.Create)
}
