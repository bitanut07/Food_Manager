package middleware

import (
	"strconv"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/goravel/framework/contracts/http"
	"github.com/goravel/framework/facades"
)

// AuthUserID stores the user ID extracted from JWT token
// This is a workaround for passing data between middleware and controller
var AuthUserID int64
var AuthRole string

func Auth() http.Middleware {
	return func(ctx http.Context) {
		authHeader := ctx.Request().Header("Authorization")
		if authHeader == "" {
			ctx.Response().Json(http.StatusUnauthorized, http.Json{
				"message": "Missing authorization header",
			})
			ctx.Request().Abort()
			return
		}

		// Extract token from "Bearer <token>"
		tokenString := strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer"))
		if strings.HasPrefix(strings.ToLower(authHeader), "bearer ") {
			tokenString = strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer "))
		}
		if tokenString == "" {
			ctx.Response().Json(http.StatusUnauthorized, http.Json{
				"message": "Invalid token format",
			})
			ctx.Request().Abort()
			return
		}

		// Check if token is blacklisted
		if facades.Cache().Get("blacklist:"+tokenString, nil) != nil {
			ctx.Response().Json(http.StatusUnauthorized, http.Json{
				"message": "Token has been revoked",
			})
			ctx.Request().Abort()
			return
		}

		// Parse and validate JWT token
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

		// Extract claims
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			ctx.Response().Json(http.StatusUnauthorized, http.Json{
				"message": "Invalid token claims",
			})
			ctx.Request().Abort()
			return
		}

		// Verify user ID exists in token
		subClaim, exists := claims["sub"]
		if !exists {
			ctx.Response().Json(http.StatusUnauthorized, http.Json{
				"message": "Invalid user ID in token",
			})
			ctx.Request().Abort()
			return
		}

		// Convert sub to int64 and store in context
		var userID int64
		switch v := subClaim.(type) {
		case float64:
			userID = int64(v)
		case int64:
			userID = v
		case int:
			userID = int64(v)
		default:
			ctx.Response().Json(http.StatusUnauthorized, http.Json{
				"message": "Invalid user ID type",
			})
			ctx.Request().Abort()
			return
		}

		// Store in package-level variables (thread-safe for single request handling)
		AuthUserID = userID
		if role, ok := claims["role"].(string); ok {
			AuthRole = role
		} else {
			AuthRole = "user"
		}

		// Also store in context using WithValue
		ctx.WithValue("user_id", userID)
		ctx.WithValue("role", AuthRole)

		// Store user_id as a custom header for controller access
		ctx.Response().Header("X-User-ID", strconv.FormatInt(userID, 10))

		ctx.Request().Next()
	}
}
