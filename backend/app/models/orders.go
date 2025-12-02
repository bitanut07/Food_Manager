package models

import (
	"time"
)

type Orders struct {
	ID int64 `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID int64 `gorm:"not null" json:"user_id"`
	User User `gorm:"foreignKey:UserID" json:"user"`
	FullName string `gorm:"type:varchar(255);not null" json:"full_name"`
	Phone string `gorm:"type:varchar(20);not null" json:"phone"`
	Address string `gorm:"type:varchar(500);not null" json:"address"`
	Total float64 `gorm:"not null" json:"total"`
	Note string `gorm:"type:text" json:"note"`
	Discount float64 `gorm:"not null;default:0" json:"discount"`
	PaymentMethod string `gorm:"type:varchar(50);not null" json:"payment_method"`
	Status string `gorm:"type:varchar(50);not null" json:"status"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
}

func (Orders) TableName() string {
	return "orders"
}

func (Orders) GetFields() []Field {
	return []Field{
		{Name: "id", Label: "ID", DataType: "integer", IsSystem: true},
		{Name: "user_id", Label: "User ID", DataType: "integer", IsSystem: false},
		{Name: "full_name", Label: "Full Name", DataType: "string", IsSystem: false},
		{Name: "phone", Label: "Phone", DataType: "string", IsSystem: false},
		{Name: "address", Label: "Address", DataType: "string", IsSystem: false},
		{Name: "total", Label: "Total", DataType: "decimal", IsSystem: false},
		{Name: "note", Label: "Note", DataType: "text", IsSystem: false},
		{Name: "discount", Label: "Discount", DataType: "decimal", IsSystem: false},
		{Name: "payment_method", Label: "Payment Method", DataType: "string", IsSystem: false},
		{Name: "status", Label: "Status", DataType: "string", IsSystem: false},
		{Name: "created_at", Label: "Created At", DataType: "timestamp", IsSystem: false},
	}
}