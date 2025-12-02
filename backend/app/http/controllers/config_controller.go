package controllers

import "github.com/goravel/framework/contracts/http"

type ConfigController struct{}

func (c ConfigController) RestaurantInfo(ctx http.Context) http.Response {
	return ctx.Response().Json(http.StatusOK, http.Json{
		"name":       "Citrus Royale",
		"address":    "227 Đ. Nguyễn Văn Cừ, Phường 4, Quận 5, Hồ Chí Minh",
		"phone":      "0328840696",
		"google_map": "https://maps.app.goo.gl/tVjxCtjfyR5DkKXL8",
		"email":      "citrusroyale.restaurant@gmail.com",
		"social": map[string]any{
			"facebook":  "https://web.facebook.com/profile.php?id=61570865440338",
			"instagram": "Restaurant Instagram",
			"youtube":   "Restaurant Youtube",
			"chatbox":   "https://m.me/555556954303917",
		},
		"onweek_openhour":   "10:30",
		"onweek_closehour":  "22:00",
		"weekend_openhour":  "8:00",
		"weekend_closehour": "23:30",
		"QR": []string{
			"https://intro2se.s3.ap-southeast-1.amazonaws.com/media/restaurant-config/QRcode.jpg.jpg",
		},
	})
}
