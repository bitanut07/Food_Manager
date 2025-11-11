package routes

import (
	"goravel/app/http/controllers"

	"github.com/goravel/framework/facades"
)

func AuthRoutes() {
	authController := controllers.AuthController{}
	facades.Route().Post("/register", authController.Register)
	facades.Route().Post("/login", authController.Login)
	facades.Route().Post("/logout", authController.Logout)
}
