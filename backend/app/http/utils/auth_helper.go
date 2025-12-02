package utils

import (
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/goravel/framework/contracts/http"
	"github.com/goravel/framework/facades"
)

// GetUserIDFromToken extracts user ID from JWT token in the request
func GetUserIDFromToken(ctx http.Context) (int64, error) {
	authHeader := ctx.Request().Header("Authorization")
	if authHeader == "" {
		return 0, jwt.ErrInvalidKey
	}

	// Extract token from "Bearer <token>"
	tokenString := strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer"))
	if strings.HasPrefix(strings.ToLower(authHeader), "bearer ") {
		tokenString = strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer "))
	}

	// Parse token
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return []byte(facades.Config().GetString("jwt.secret")), nil
	})

	if err != nil {
		return 0, err
	}

	// Extract claims
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return 0, jwt.ErrInvalidKey
	}

	// Get user ID
	userID, ok := claims["sub"].(float64)
	if !ok {
		return 0, jwt.ErrInvalidKey
	}

	return int64(userID), nil
}
