package middleware

import (
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/goravel/framework/contracts/http"
	"github.com/goravel/framework/facades"
)

func Admin() http.Middleware {
	return func(ctx http.Context) {
		adminHeader := ctx.Request().Header("Authorization")
		if adminHeader == "" {
			ctx.Response().Json(http.StatusUnauthorized, http.Json{
				"message": "Missing authorization header",
			})
			ctx.Request().Abort()
			return
		}

		tokenString := strings.TrimSpace(strings.TrimPrefix(adminHeader, "Bearer"))
		if strings.HasPrefix(strings.ToLower(adminHeader), "bearer ") {
			tokenString = strings.TrimSpace(strings.TrimPrefix(adminHeader, "Bearer "))
		}
		if tokenString == "" {
			ctx.Response().Json(http.StatusUnauthorized, http.Json{
				"message": "Invalid token format",
			})
			ctx.Request().Abort()
			return
		}
		if facades.Cache().Get("blacklist:"+tokenString, nil) != nil {
			ctx.Response().Json(http.StatusUnauthorized, http.Json{
				"message": "Token has been revoked",
			})
			ctx.Request().Abort()
			return
		}

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return []byte(facades.Config().GetString("jwt.secret")), nil
		})
		if err != nil || !token.Valid {
			ctx.Response().Json(http.StatusUnauthorized, http.Json{
				"message": "Invalid or expired token",
				"error":   err.Error(),
			})
			ctx.Request().Abort()
			return
		}
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			ctx.Response().Json(http.StatusUnauthorized, http.Json{
				"message": "Invalid token claims",
			})
			ctx.Request().Abort()
			return
		}
		if claims["role"] != "admin" {
			ctx.Response().Json(http.StatusForbidden, http.Json{
				"message": "You are not an admin",
			})
			ctx.Request().Abort()
			return
		}
		ctx.Request().Next()
	}
}
