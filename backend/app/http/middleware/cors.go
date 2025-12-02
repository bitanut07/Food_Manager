package middleware

import (
	stdhttp "net/http"

	"github.com/goravel/framework/contracts/http"
)

func Cors() http.Middleware {
	return func(ctx http.Context) {
		headers := map[string]string{
			"Access-Control-Allow-Origin":  "*",
			"Access-Control-Allow-Methods": "*",
			"Access-Control-Allow-Headers": "*",
		}

		for key, value := range headers {
			ctx.Response().Header(key, value)
		}

		if ctx.Request().Method() == stdhttp.MethodOptions {
			ctx.Response().Status(stdhttp.StatusNoContent)
			ctx.Request().Abort()
			return
		}

		ctx.Request().Next()
	}
}
