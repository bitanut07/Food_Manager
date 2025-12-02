package routes

import (
	"goravel/app/http/controllers"
	"goravel/app/http/middleware"

	"github.com/goravel/framework/facades"
)

func AuthRoutes() {
	authController := controllers.AuthController{}
	facades.Route().Post("/register", authController.Register)
	facades.Route().Post("/login", authController.Login)
	facades.Route().Post("/logout", authController.Logout)
	facades.Route().Middleware(middleware.Auth()).Get("/user/profile", authController.GetProfile)
	facades.Route().Middleware(middleware.Auth()).Post("/update-profile", authController.UpdateProfile)
}
